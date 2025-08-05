"use server";

import { db } from "@/lib/db";
import { checkUser } from "@/lib/checkUset";
import { generateExpenseInsights, AIInsight, ExpenseRecord } from "@/lib/ai";

export async function getAIInsights(): Promise<AIInsight[]> {
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

    if (expenses.length === 0) {
      return [
        {
          id: "welcome-1",
          type: "info",
          title: "Bienvenido a ExpenseTracker AI!",
          message:
            "Comienza a agregar tus gastos para obtener conclusiones personalizadas de IA sobre tus patrones de gastos.",
          action: "Añade tu primer gasto",
          confidence: 1.0,
        },
        {
          id: "welcome-2",
          type: "tip",
          title: "Controla regularmente",
          message:
            "Para obtener los mejores resultados, intenta registrar tus gastos diariamente. Esto ayuda a nuestra IA a proporcionar conclusiones más precisas.",
          action: "Establecer recordatorios diarios",
          confidence: 1.0,
        },
      ];
    }

    const expenseData: ExpenseRecord[] = expenses.map((expense) => ({
      id: expense.id,
      amount: expense.amount,
      category: expense.category || "Other",
      description: expense.text,
      date: expense.createdAt.toISOString(),
    }));

    const insights = await generateExpenseInsights(expenseData);
    return insights;
  } catch (error) {
    console.error("Error al obtener las conclusiones de IA:", error);

    return [
      {
        id: "error-1",
        type: "warning",
        title: "Conclusiones de IA Temporariamente no disponibles",
        message:
          "Estamos teniendo problemas para analizar tus gastos en este momento. Por favor, intenta nuevamente en unos minutos.",
        action: "Reintentar análisis",
        confidence: 0.5,
      },
    ];
  }
}
