"use server";
import { embed, embedMany, cosineSimilarity } from "ai";
import { openai } from "@ai-sdk/openai";

import { supabase } from "../supabase";

const embeddingModel = openai.embedding("text-embedding-3-small");

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
};

export const generateEmbeddings = async (
  value: string
): Promise<Array<{ embedding: number[]; text_chunks: string }>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddings.map((e, i) => ({ text_chunks: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  // Generate the embedding for the user query
  const userQueryEmbedded = await generateEmbedding(userQuery);

  const clusterId = localStorage.getItem("selectedClusterId");

  // Fetch embeddings and associated content from the Supabase database
  const { data, error } = await supabase
    .from("embeddings")
    .select("text_chunk, embedding")
    .eq("cluster_id", clusterId);

  if (error) {
    console.error("Supabase Error:", error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Compute cosine similarity and rank results
  const rankedResults = data
    .map((item) => {
      const similarity = cosineSimilarity(userQueryEmbedded, item.embedding);
      return { name: item.text_chunk, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity); // Sort by similarity descending

  const N = rankedResults.length > 4 ? 4 : rankedResults.length;

  const topN = rankedResults.slice(0, N);

  const RAGContent = topN.map((item) => item.name).join("\n\n");

  return RAGContent;
};
