"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { jsPDF } from "jspdf";

// Types for stronger typing
interface UserReport {
  user: {
    id: string;
    name: string;
    email: string;
  };
  summary: {
    totalUnits: number;
    totalClusters: number;
    totalFiles: number;
    totalNotebooks: number;
    totalEmbeddings: number;
  };
  details: {
    units: any[];
    clusters: any[];
    files: any[];
    notebooks: any[];
    embeddingCount: number;
  };
  generated: string;
}

// Enum for report types
enum ReportType {
  DETAILED = "detailed",
  SUMMARY = "summary",
  PARAMETRIC = "parametric",
}

export default function UserReportsPage() {
  const [userId, setUserId] = useState("");
  const [reportType, setReportType] = useState<ReportType>(ReportType.DETAILED);
  const [customParams, setCustomParams] = useState({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = async (userId: string) => {
    try {
      // Fetch user data first
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          `
          id, 
          name, 
          email,
          units:units(
            id, 
            title,
            clusters:clusters(
              id, 
              title, 
              type,
              files:files(
                id, 
                name, 
                type, 
                size
              ),
              notebooks:notebooks(
                id, 
                name, 
                updated_at
              ),
              embeddings:embeddings(id)
            )
          )
        `
        )
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      // Compile report data
      const report = {
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
        },
        summary: {
          totalUnits: userData.units?.length || 0,
          totalClusters:
            userData.units?.flatMap((unit) => unit.clusters).length || 0,
          totalFiles:
            userData.units?.flatMap((unit) =>
              unit.clusters.flatMap((cluster) => cluster.files)
            ).length || 0,
          totalNotebooks:
            userData.units?.flatMap((unit) =>
              unit.clusters.flatMap((cluster) => cluster.notebooks)
            ).length || 0,
          totalEmbeddings:
            userData.units?.flatMap((unit) =>
              unit.clusters.flatMap((cluster) => cluster.embeddings)
            ).length || 0,
        },
        details: {
          units: userData.units || [],
          clusters: userData.units?.flatMap((unit) => unit.clusters) || [],
          files:
            userData.units?.flatMap((unit) =>
              unit.clusters.flatMap((cluster) => cluster.files)
            ) || [],
          notebooks:
            userData.units?.flatMap((unit) =>
              unit.clusters.flatMap((cluster) => cluster.notebooks)
            ) || [],
          embeddingCount:
            userData.units?.flatMap((unit) =>
              unit.clusters.flatMap((cluster) => cluster.embeddings)
            ).length || 0,
        },
        generated: new Date().toISOString(),
      };

      return report;
    } catch (err) {
      console.error("Error generating reportss:", err);
      throw err;
    }
  };

  const generatePdfReport = (
    report: UserReport,
    type: ReportType,
    params: Record<string, any> = {}
  ) => {
    try {
      // Create a new document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Page configuration
      const pageWidth = 210; // A4 width in mm
      const leftMargin = 20;
      let currentY = 20; // Starting Y position

      // Helper function to add text with automatic page breaking
      const addText = (
        text: string,
        fontSize: number = 12,
        style: "normal" | "bold" = "normal"
      ) => {
        // Set font style
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", style);

        // Check if we need a new page
        if (currentY > 280) {
          // Near bottom of page
          doc.addPage();
          currentY = 20; // Reset Y position
        }

        // Add text
        doc.text(text, leftMargin, currentY);

        // Increment Y position based on font size
        currentY += fontSize * 0.353; // Approximate line height
      };

      // Title
      addText("User Report", 18, "bold");
      currentY += 10; // Extra space after title

      // Content generation based on report type
      const sections: string[] = [];

      switch (type) {
        case ReportType.DETAILED:
          sections.push(
            `User: ${report.user.name}`,
            `Email: ${report.user.email}`,
            `Total Units: ${report.summary.totalUnits}`,
            `Total Clusters: ${report.summary.totalClusters}`,
            `Total Files: ${report.summary.totalFiles}`,
            `Total Notebooks: ${report.summary.totalNotebooks}`,
            `Total Embeddings: ${report.summary.totalEmbeddings}`
          );
          break;
        case ReportType.SUMMARY:
          sections.push(
            ...[
              /* summary items */
            ]
          );
          break;
        case ReportType.PARAMETRIC:
          sections.push(
            ...Object.entries(params).map(([key, value]) => `${key}: ${value}`)
          );
          break;
      }

      // Add sections
      sections.forEach((text) => {
        addText(text);
      });

      // Add timestamp
      currentY += 10; // Extra space before timestamp
      addText(`Generated: ${new Date().toISOString()}`, 10, "normal");

      // Save PDF
      doc.save(`report_${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      throw new Error("Failed to generate PDF document");
    }
  };

  const handleGenerateReport = async () => {
    if (!userId) {
      setError("User ID is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the new generateReport method
      const report = await generateReport(userId);

      // Generate PDF based on report type
      await generatePdfReport(report, reportType, customParams);
    } catch (err) {
      console.error("Error generating report:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate report"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">User Report Generator</h1>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Enter User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value as ReportType)}
          className="w-full p-2 border rounded"
        >
          {Object.values(ReportType).map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)} Report
            </option>
          ))}
        </select>

        {reportType === ReportType.PARAMETRIC && (
          <div>
            <h2>Custom Parameters</h2>
            <input
              type="text"
              placeholder="Key"
              onChange={(e) =>
                setCustomParams({
                  ...customParams,
                  [e.target.value]: "",
                })
              }
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="text"
              placeholder="Value"
              onChange={(e) => {
                const lastKey = Object.keys(customParams).pop();
                if (lastKey) {
                  setCustomParams({
                    ...customParams,
                    [lastKey]: e.target.value,
                  });
                }
              }}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        <button
          onClick={handleGenerateReport}
          disabled={isLoading}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isLoading ? "Generating Report..." : "Generate Report"}
        </button>

        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
}
