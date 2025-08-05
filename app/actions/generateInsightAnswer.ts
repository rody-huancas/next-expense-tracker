"use server";

import { db } from "@/lib/db";
import { checkUser } from "@/lib/checkUser";
import { generateAIAnswer, ExpenseRecord } from "@/lib/ai";

export async function generateInsightAnswer(question: string): Promise<string> {
  try {
    const user = await checkUser();
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expenses = await db.record.findMany({
      where: {
        userId: user.clerkUserId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const expenseData: ExpenseRecord[] = expenses.map((expense) => ({
      id: expense.id,
      amount: expense.amount,
      category: expense.category || "Other",
      description: expense.text,
      date: expense.createdAt.toISOString(),
    }));

    const answer = await generateAIAnswer(question, expenseData);
    return answer;
  } catch (error) {
    console.error("Error al generar la respuesta de la conclusión:", error);
    return "No puedo proporcionar una respuesta detallada en este momento. Por favor, intenta actualizar las conclusiones o verifica tu conexión.";
  }
}
