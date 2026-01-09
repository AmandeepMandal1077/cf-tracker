import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  const { questionId } = await params;
  if (!questionId) {
    return new Response(JSON.stringify({ error: "Missing questionId" }), {
      status: 400,
    });
  }
  try {
    const record = await prisma.userQuestions.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });

    if (!record) {
      throw new Error("Question not found");
    }

    await prisma.userQuestions.update({
      where: { userId_questionId: { userId, questionId } },
      data: { bookmarked: !record.bookmarked },
    });
    return new Response(
      JSON.stringify({ success: true, bookmarked: !record.bookmarked }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Error updating bookmark: ${err}` }),
      { status: 500 }
    );
  }
}
