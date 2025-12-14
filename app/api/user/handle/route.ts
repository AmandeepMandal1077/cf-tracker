import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  let userHandle: string | null;
  try {
    const res = await prisma.user.findUnique({
      where: { id: userId },
      select: { userHandle: true },
    });

    userHandle = res?.userHandle || null;

    if (!userHandle) {
      throw new Error("User handle not found");
    }
  } catch (err) {
    return new Response(`Error fetching user handle: ${err}`, { status: 500 });
  }
  return new Response(JSON.stringify({ userHandle }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
