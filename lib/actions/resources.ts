"use server";

import { supabase } from "../supabase";
import { generateEmbeddings } from "../ai/embedding";

export const createResource = async ({ clusterId }: { clusterId: string }) => {
  try {
    const { data } = await supabase
      .from("files")
      .select("*")
      .eq("cluster_id", clusterId);

    data?.forEach(async (file) => {
      const embeddings = await generateEmbeddings(file.content);
      console.log("embedding successfully generated!!");

      const { error } = await supabase.from("embedding").insert(
        embeddings.map((embedding) => ({
          cluster_id: clusterId,
          text_chunk: embedding.text_chunks,
          embedding: embedding.embedding,
        }))
      );

      if (error) {
        console.error("Error inserting embeddings:", error.message);
      }
    });

    return "Resource successfully created and embedded.";
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};
