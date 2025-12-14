import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { questionId } = await params;

  try {
    const question = await prisma.userQuestions.findUnique({
      where: { userId_questionId: { userId, questionId } },
      include: {
        question: true,
      },
    });

    return new Response(JSON.stringify({ question }), { status: 200 });
  } catch (err) {
    return new Response(`Error fetching question: ${err}`, { status: 500 });
  }
}
