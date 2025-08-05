"use server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function deleteRecord(recordId: string): Promise<{
  message?: string;
  error?: string;
}> {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Usuario no encontrado" };
  }

  try {
    await db.record.delete({
      where: {
        id: recordId,
        userId,
      },
    });

    revalidatePath("/");

    return { message: "Registro eliminado" };
  } catch (error) {
    console.error("Error al eliminar el registro:", error);
    return { error: "Error de base de datos" };
  }
}

export default deleteRecord;
