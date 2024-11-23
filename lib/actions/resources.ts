"use server";

import { supabase } from "../supabase";
import { generateEmbeddings } from "../ai/embedding";

export const createResource = async (clusterId: string) => {
  try {
    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .select("*")
      .eq("cluster_id", clusterId);

    fileData?.forEach(async (file) => {
      const embeddings = await generateEmbeddings(file.content);

      const { error } = await supabase.from("embeddings").insert(
        embeddings.map((e) => ({
          cluster_id: clusterId,
          text_chunk: e.text_chunks,
          embedding: e.embedding,
        }))
      );

      if (error) {
        throw new Error("Error inserting embeddings:", error);
      }
    });

    return "Resource successfully created and embedded.";
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};
