// actions.ts
"use server";
import { revalidatePath } from "next/cache";

export async function revalidateWorkspace() {
  revalidatePath("/"); // Adjust this path to match your route
}
