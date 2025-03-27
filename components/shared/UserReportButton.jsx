"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function UserReportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const { userId } = useAuth();

  const generateReport = async () => {
    if (!userId) {
      setError("User ID is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      // Fetch units created by user
      const { data: units, error: unitsError } = await supabase
        .from("units")
        .select("id, title")
        .eq("user_id", userId);

      if (unitsError) throw unitsError;

      // Get unit IDs to use in subsequent queries
      const unitIds = units?.map((unit) => unit.id) || [];

      // Fetch clusters related to user's units
      const { data: clusters, error: clustersError } =
        unitIds.length > 0
          ? await supabase
              .from("clusters")
              .select("id, title, type, unit_id")
              .in("unit_id", unitIds)
          : { data: [], error: null };

      if (clustersError) throw clustersError;

      // Get cluster IDs
      const clusterIds = clusters?.map((cluster) => cluster.id) || [];

      // Fetch files in user's clusters
      const { data: files, error: filesError } =
        clusterIds.length > 0
          ? await supabase
              .from("files")
              .select("id, name, type, size, cluster_id")
              .in("cluster_id", clusterIds)
          : { data: [], error: null };

      if (filesError) throw filesError;

      // Fetch notebooks in user's units
      const { data: notebooks, error: notebooksError } =
        unitIds.length > 0
          ? await supabase
              .from("notebooks")
              .select("id, name, updated_at, unit_id")
              .in("unit_id", unitIds)
          : { data: [], error: null };

      if (notebooksError) throw notebooksError;

      // Fetch embeddings for user's clusters
      const { data: embeddings, error: embeddingsError } =
        clusterIds.length > 0
          ? await supabase
              .from("embeddings")
              .select("id, cluster_id")
              .in("cluster_id", clusterIds)
          : { data: [], error: null };

      if (embeddingsError) throw embeddingsError;

      // Compile report data
      const report = {
        user: userData,
        summary: {
          totalUnits: units?.length || 0,
          totalClusters: clusters?.length || 0,
          totalFiles: files?.length || 0,
          totalNotebooks: notebooks?.length || 0,
          totalEmbeddings: embeddings?.length || 0,
        },
        details: {
          units,
          clusters,
          files,
          notebooks,
          embeddingCount: embeddings?.length || 0,
        },
        generated: new Date().toISOString(),
      };

      // Store report in localStorage for retrieval on the report page
      localStorage.setItem("userReport", JSON.stringify(report));

      // Navigate to the report page
      router.push("/user-report");
    } catch (err) {
      console.error("Error generating report:", err);
      setError(err.message || "Failed to generate report");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={generateReport}
        disabled={isLoading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
      >
        {isLoading ? "Generating..." : "User Report"}
      </button>

      {error && <div className="mt-2 text-red-500">Error: {error}</div>}
    </>
  );
}
