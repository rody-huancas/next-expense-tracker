"use server";

import { categorizeExpense } from "@/lib/ai";

export async function suggestCategory(
  description: string
): Promise<{ category: string; error?: string }> {
  try {
    if (!description || description.trim().length < 2) {
      return {
        category: "Other",
        error: "La descripción es demasiado corta para el análisis de IA",
      };
    }

    const category = await categorizeExpense(description.trim());
    return { category };
  } catch (error) {
    console.error("Error al sugerir una categoría:", error);
    return {
      category: "Other",
      error: "No se puede sugerir una categoría en este momento",
    };
  }
}
