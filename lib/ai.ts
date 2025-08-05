import OpenAI from "openai";

interface RawInsight {
  type?: string;
  title?: string;
  message?: string;
  action?: string;
  confidence?: number;
}

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "ExpenseTracker AI",
  },
});

export interface ExpenseRecord {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface AIInsight {
  id: string;
  type: "warning" | "info" | "success" | "tip";
  title: string;
  message: string;
  action?: string;
  confidence: number;
}

export async function generateExpenseInsights(
  expenses: ExpenseRecord[]
): Promise<AIInsight[]> {
  try {
    const expensesSummary = expenses.map((expense) => ({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date,
    }));

    const prompt = `Analiza los siguientes datos de gastos y proporciona 3-4 conclusiones financieras accionables. 
    Retorna un array JSON de conclusiones con esta estructura:
    {
      "type": "warning|info|success|tip",
      "title": "Título breve",
      "message": "Mensaje de conclusión detallado con números específicos cuando sea posible",
      "action": "Sugerencia accionable",
      "confidence": 0.8
    }

    Expense Data:
    ${JSON.stringify(expensesSummary, null, 2)}

    Focus on:
    1. Patrones de gastos (día de la semana, categorías)
    2. Alertas de presupuesto (áreas de alto gasto)
    3. Oportunidades de ahorro
    4. Refuerzo positivo para buenos hábitos

    Retorna solo un array JSON válido, sin texto adicional.`;

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente financiero de IA que analiza patrones de gastos y proporciona conclusiones accionables. Siempre responde con JSON válido solo.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("No response from AI");
    }

    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "");
    }

    const insights = JSON.parse(cleanedResponse);

    const formattedInsights = insights.map(
      (insight: RawInsight, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        type: insight.type || "info",
        title: insight.title || "AI Insight",
        message: insight.message || "Análisis completo",
        action: insight.action,
        confidence: insight.confidence || 0.8,
      })
    );

    return formattedInsights;
  } catch (error) {
    console.error("Error al generar las conclusiones de IA:", error);

    return [
      {
        id: "fallback-1",
        type: "info",
        title: "Análisis de IA no disponible",
        message:
          "No se puede generar conclusiones personalizadas en este momento. Por favor, intenta nuevamente más tarde.",
        action: "Actualizar conclusiones",
        confidence: 0.5,
      },
    ];
  }
}

export async function categorizeExpense(description: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente de categorización de gastos de IA. Categoriza los gastos en una de estas categorías: Comida, Transporte, Entretenimiento, Compra, Facturas, Salud, Otra. Responde con solo el nombre de la categoría.",
        },
        {
          role: "user",
          content: `Categoriza este gasto: "${description}"`,
        },
      ],
      temperature: 0.1,
      max_tokens: 20,
    });

    const category = completion.choices[0].message.content?.trim();

    const validCategories = [
      "Food",
      "Transportation",
      "Entertainment",
      "Shopping",
      "Bills",
      "Healthcare",
      "Other",
    ];

    const finalCategory = validCategories.includes(category || "")
      ? category!
      : "Other";
    return finalCategory;
  } catch (error) {
    console.error("Error al categorizar el gasto:", error);
    return "Other";
  }
}

export async function generateAIAnswer(
  question: string,
  context: ExpenseRecord[]
): Promise<string> {
  try {
    const expensesSummary = context.map((expense) => ({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date,
    }));

    const prompt = `Basado en los siguientes datos de gastos, proporciona una respuesta detallada y accionable a esta pregunta: "${question}"

    Datos de gastos:
    ${JSON.stringify(expensesSummary, null, 2)}

    Proporciona una respuesta exhaustiva que:
    1. Responde directamente a la pregunta específica
    2. Utiliza datos concretos de los gastos cuando sea posible
    3. Ofrece consejos accionables
    4. Mantiene la respuesta concisa pero informativa (2-3 oraciones)
    
    Retorna solo el texto de la respuesta, sin formato adicional.`;

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente financiero de IA que proporciona respuestas específicas y accionables basadas en los datos de los gastos. Sé conciso pero completo.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("No response from AI");
    }

    return response.trim();
  } catch (error) {
    console.error("Error al generar la respuesta de IA:", error);
    return "No puedo proporcionar una respuesta detallada en este momento. Por favor, intenta actualizar las conclusiones o verifica tu conexión.";
  }
}
