"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

async function getUserRecord(): Promise<{
  record?: number;
  daysWithRecords?: number;
  error?: string;
}> {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Usuario no encontrado" };
  }

  try {
    const records = await db.record.findMany({
      where: { userId },
    });

    const record = records.reduce((sum, record) => sum + record.amount, 0);

    const daysWithRecords = records.filter(
      (record) => record.amount > 0
    ).length;

    return { record, daysWithRecords };
  } catch (error) {
    console.error("Error al obtener el registro del usuario:", error);
    return { error: "Error de base de datos" };
  }
}

export default getUserRecord;
