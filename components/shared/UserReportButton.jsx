// components/UserReportButton.jsx
"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@clerk/nextjs";

export default function UserReportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { userId } = useAuth();

  console.log("userId:", userId);

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

      // Send data to API endpoint for PDF generation
      const response = await fetch("/api/generate-pdf-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF report");
      }

      // Get the PDF blob from the response
      const pdfBlob = await response.blob();

      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-report-${userId}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("PDF report generated successfully");
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
