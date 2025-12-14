import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { questionId } = await params;
  if (!questionId) {
    return new Response("Bad Request: Missing questionId", { status: 400 });
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
    return new Response("Successfully Bookmarked", { status: 200 });
  } catch (err) {
    return new Response(`Error fetching question: ${err}`, { status: 500 });
  }
}
