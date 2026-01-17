import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  let userHandle: string | null;
  // console.log("Fetched user Id:", userId);
  try {
    const res = await prisma.user.findUnique({
      where: { id: userId },
      select: { userHandle: true },
    });

    userHandle = res?.userHandle || null;
    // console.log(JSON.stringify(res, null, 2));

    if (!userHandle) {
      throw new Error("User handle not found");
    }
  } catch (err) {
    console.error("Error fetching user handle:", err);
    return new Response(
      JSON.stringify({ error: `Error fetching user handle: ${err}` }),
      { status: 500 }
    );
  }
  return new Response(JSON.stringify({ userHandle }), { status: 200 });
}
