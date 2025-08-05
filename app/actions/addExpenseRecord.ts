"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface RecordData {
  text: string;
  amount: number;
  category: string;
  date: string;
}

interface RecordResult {
  data?: RecordData;
  error?: string;
}

async function addExpenseRecord(formData: FormData): Promise<RecordResult> {
  const textValue = formData.get("text");
  const amountValue = formData.get("amount");
  const categoryValue = formData.get("category");
  const dateValue = formData.get("date");

  if (
    !textValue ||
    textValue === "" ||
    !amountValue ||
    !categoryValue ||
    categoryValue === "" ||
    !dateValue ||
    dateValue === ""
  ) {
    return { error: "Falta el texto, el importe, la categoría o la fecha" };
  }

  const text: string = textValue.toString();
  const amount: number = parseFloat(amountValue.toString());
  const category: string = categoryValue.toString();

  let date: string;
  try {
    const inputDate = dateValue.toString();
    const [year, month, day] = inputDate.split("-");
    const dateObj = new Date(
      Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0)
    );
    date = dateObj.toISOString();
  } catch (error) {
    console.error("Invalid date format:", error);
    return { error: "Formato de fecha inválido" };
  }

  const { userId } = await auth();

  if (!userId) {
    return { error: "Usuario no encontrado" };
  }

  try {
    const createdRecord = await db.record.create({
      data: {
        text,
        amount,
        category,
        date,
        userId,
      },
    });

    const recordData: RecordData = {
      text: createdRecord.text,
      amount: createdRecord.amount,
      category: createdRecord.category,
      date: createdRecord.date?.toISOString() || date,
    };

    revalidatePath("/");

    return { data: recordData };
  } catch (error) {
    console.error("Error al agregar el registro de gastos:", error);
    return {
      error: "Ocurrió un error inesperado al agregar el registro de gastos.",
    };
  }
}

export default addExpenseRecord;
