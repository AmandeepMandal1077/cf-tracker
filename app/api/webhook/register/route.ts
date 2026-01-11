import prisma from "@/lib/prisma";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";

//TODO: Add questions related to User
export async function POST(req: Request) {
  const svixSecret = process.env.SVIX_WEBHOOK_SECRET;
  if (!svixSecret) {
    console.error("SVIX webhook secret not configured");
    return new Response(
      JSON.stringify({ error: "SVIX webhook secret not configured" }),
      { status: 502 }
    );
  }

  const headersPayload = await headers();
  const svixId = headersPayload.get("svix-id") || "";
  const svixTimestamp = headersPayload.get("svix-timestamp") || "";
  const svixSignature = headersPayload.get("svix-signature") || "";

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response(JSON.stringify({ error: "Missing SVIX headers" }), {
      status: 400,
    });
  }

  const header = {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  };

  const body = await req.json();
  const payload = JSON.stringify(body);

  //   return new Response(`${payload}`, { status: 501 });
  const wh = new Webhook(svixSecret);

  let event: WebhookEvent;
  try {
    event = wh.verify(payload, header) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
    });
  }

  const { id } = event.data;
  const eventType = event.type;

  if (eventType === "user.created") {
    try {
      // Handle user created event
      if (!id) {
        console.error("No user ID found in event data");
        return new Response(JSON.stringify({ error: "No user ID found" }), {
          status: 400,
        });
      }

      const { primary_email_address_id, email_addresses } = event.data;

      if (!email_addresses || !Array.isArray(email_addresses)) {
        console.error("No email addresses found in event data");
        return new Response(
          JSON.stringify({ error: "No email addresses found" }),
          { status: 400 }
        );
      }

      const email = email_addresses.find(
        (email) => email.id === primary_email_address_id
      );

      if (!email) {
        console.error(
          "No primary email found. Available emails:",
          email_addresses
        );
        return new Response(
          JSON.stringify({ error: "No primary email found" }),
          { status: 400 }
        );
      }

      // Store the email and emailId in your database

      const userHandle = event.data.unsafe_metadata?.userHandle as string;
      if (!userHandle) {
        console.error("No user handle found in unsafe metadata");
        return new Response(JSON.stringify({ error: "No user handle found" }), {
          status: 400,
        });
      }

      // Check if user already exists by email or id
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ id: id }, { email: email.email_address }],
        },
      });

      if (existingUser) {
        // User exists, update if needed
        if (
          existingUser.id !== id ||
          existingUser.email !== email.email_address ||
          existingUser.userHandle !== userHandle
        ) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              id: id, // Update to new ID if changed
              email: email.email_address,
              userHandle: userHandle,
            },
          });
        }
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            id: id,
            email: email.email_address,
            isSubscribed: false,
            userHandle: userHandle,
          },
        });
      }
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return new Response(
        JSON.stringify({
          error: `Error creating user: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        }),
        { status: 500 }
      );
    }
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
