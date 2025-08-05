"use server";
import { db } from "@/lib/db";
import { Record } from "@/types/Record";
import { auth } from "@clerk/nextjs/server";

async function getRecords(): Promise<{
  records?: Record[];
  error?: string;
}> {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Usuario no encontrado" };
  }

  try {
    const records = await db.record.findMany({
      where: { userId },
      orderBy: {
        date: "desc",
      },
      take: 10,
    });

    return { records };
  } catch (error) {
    console.error("Error al obtener los registros:", error);
    return { error: "Error de base de datos" };
  }
}

export default getRecords;
