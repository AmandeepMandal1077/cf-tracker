import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
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
      await prisma.userQuestions.delete({
        where: { userId_questionId: { userId, questionId: questionId } },
      });

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Unable to remove question" }),
        { status: 500 }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Unable to remove question" }),
      { status: 500 }
    );
  }
}
