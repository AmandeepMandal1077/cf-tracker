import prisma from "@/lib/prisma";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";

export async function POST(req: Request) {
  console.log("=== Webhook POST request received ===");

  const svixSecret = process.env.SVIX_WEBHOOK_SECRET;
  if (!svixSecret) {
    console.error("SVIX webhook secret not configured");
    return new Response("SVIX webhook secret not configured", { status: 502 });
    // throw new Error("SVIX webhook secret not configured");
  }

  const headersPayload = await headers();
  const svixId = headersPayload.get("svix-id") || "";
  const svixTimestamp = headersPayload.get("svix-timestamp") || "";
  const svixSignature = headersPayload.get("svix-signature") || "";

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing SVIX headers", { status: 400 });
  }

  const header = {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  };

  const body = await req.json();
  const payload = JSON.stringify(body);

  console.log("Webhook payload:", payload);

  //   return new Response(`${payload}`, { status: 501 });
  const wh = new Webhook(svixSecret);

  let event: WebhookEvent;
  try {
    event = wh.verify(payload, header) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const { id } = event.data;
  const eventType = event.type;

  console.log("Webhook event received:", eventType, "User ID:", id);

  if (eventType === "user.created") {
    try {
      // Handle user created event
      if (!id) {
        console.error("No user ID found in event data");
        return new Response("No user ID found", { status: 400 });
      }

      const { primary_email_address_id, email_addresses } = event.data;

      if (!email_addresses || !Array.isArray(email_addresses)) {
        console.error("No email addresses found in event data");
        return new Response("No email addresses found", { status: 400 });
      }

      const email = email_addresses.find(
        (email) => email.id === primary_email_address_id
      );

      if (!email) {
        console.error(
          "No primary email found. Available emails:",
          email_addresses
        );
        return new Response("No Primary Email found", { status: 400 });
      }

      // Store the email and emailId in your database
      console.log("Creating user with email:", email.email_address, "ID:", id);

      const newUser = await prisma.user.create({
        data: {
          id: id,
          email: email.email_address,
          isSubscribed: false,
        },
      });

      console.log("New user created successfully:", newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return new Response(
        `Error creating user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { status: 500 }
      );
    }
  }

  return new Response("Webhook received", { status: 200 });
}
