"use server";
import { openai } from "@ai-sdk/openai";
import { embed, embedMany, cosineSimilarity } from "ai";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { supabase } from "../supabase";

const embeddingModel = openai.embedding("text-embedding-3-small");

const textSplitter = async (text: string): Promise<string[]> => {
  const splitter = new RecursiveCharacterTextSplitter({
    separators: ["\n\n", ",", "\n", " "],
    chunkSize: 200,
    chunkOverlap: 40,
  });

  const chunks: string[] = await splitter.splitText(text);
  return chunks;
};

export const generateEmbeddings = async (
  value: string
): Promise<Array<{ embedding: number[]; text_chunks: string }>> => {
  const chunks = await textSplitter(value);
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

export const findRelevantContent = async (
  userQuery: string,
  clusterId: string
) => {
  // Generate the embedding for the user query
  const userQueryEmbedded = await generateEmbedding(userQuery);
  if (clusterId === "none") return [];

  // Fetch embeddings and associated content from the Supabase database
  const { data, error } = await supabase
    .from("embeddings")
    .select("text_chunk, embedding")
    .eq("cluster_id", clusterId);

  if (error || !data || data.length === 0) return [];

  // Compute cosine similarity and rank results
  const rankedResults = data
    .map((item) => {
      console.log(`${userQueryEmbedded.length} ${item.embedding.length}`);
      const similarity = cosineSimilarity(userQueryEmbedded, item.embedding);
      return { name: item.text_chunk, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity); // Sort by similarity descending

  const N = rankedResults.length > 4 ? 4 : rankedResults.length;

  const topN = rankedResults.slice(0, N);

  const RAGContent: string = topN.map((item) => item.name).join("\n\n");

  return RAGContent;
};
