// app/api/generate-pdf-report/route.js
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

interface Report {
  user: {
    id: string;
    username: string;
    email: string;
  };
  summary: {
    totalUnits: number;
    totalClusters: number;
    totalFiles: number;
    totalNotebooks: number;
  };
  details: {
    units: { id: string; name: string }[];
    clusters: { file_type: string; name: string; unit_id: string }[];
    files: { type: string }[];
    notebooks: { name: string; updated_At: string; unit_id: string }[];
  };
  generated: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Parse the JSON body
    const report: Report = await request.json();

    // Create a PDF document
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    // Collect PDF data chunks
    doc.on("data", (buffer: Buffer) => buffers.push(buffer));

    // Handle PDF completion
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
    });

    // Add content to the PDF
    generatePdfContent(doc, report);

    // Finalize the PDF
    doc.end();

    // Wait for PDF generation to complete
    const pdfData = await pdfPromise;

    // Return the PDF as a response
    return new NextResponse(pdfData, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="user-report-${report.user.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF report" },
      { status: 500 }
    );
  }
}

// Helper function to generate PDF content
function generatePdfContent(doc: PDFKit.PDFDocument, report: Report): void {
  // Add title
  doc.fontSize(25).text("User Report", { align: "center" }).moveDown();

  // User information section
  doc.fontSize(16).text("User Information", { underline: true }).moveDown(0.5);

  doc
    .fontSize(12)
    .text(`Username: ${report.user.username}`)
    .text(`Email: ${report.user.email}`)
    .text(`User ID: ${report.user.id}`)
    .moveDown();

  // Summary section
  doc.fontSize(16).text("Summary", { underline: true }).moveDown(0.5);

  doc
    .fontSize(12)
    .text(`Total Units: ${report.summary.totalUnits}`)
    .text(`Total Clusters: ${report.summary.totalClusters}`)
    .text(`Total Files: ${report.summary.totalFiles}`)
    .text(`Total Notebooks: ${report.summary.totalNotebooks}`)
    .moveDown();

  // Units section
  if (report.details.units.length > 0) {
    doc.fontSize(16).text("Units", { underline: true }).moveDown(0.5);

    report.details.units.forEach((unit, index) => {
      doc
        .fontSize(12)
        .text(`${index + 1}. ${unit.name} (ID: ${unit.id})`)
        .moveDown(0.25);
    });
    doc.moveDown();
  }

  // Clusters section
  if (report.details.clusters.length > 0) {
    doc.fontSize(16).text("Clusters", { underline: true }).moveDown(0.5);

    report.details.clusters.forEach((cluster, index) => {
      doc
        .fontSize(12)
        .text(`${index + 1}. ${cluster.name} (Type: ${cluster.file_type})`)
        .text(`   Unit ID: ${cluster.unit_id}`)
        .moveDown(0.25);
    });
    doc.moveDown();
  }

  // Files summary by type
  if (report.details.files.length > 0) {
    doc.fontSize(16).text("Files by Type", { underline: true }).moveDown(0.5);

    // Group files by type
    const filesByType = report.details.files.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(filesByType).forEach(([type, count]) => {
      doc.fontSize(12).text(`${type}: ${count} files`).moveDown(0.25);
    });
    doc.moveDown();
  }

  // Notebooks section
  if (report.details.notebooks.length > 0) {
    doc.fontSize(16).text("Notebooks", { underline: true }).moveDown(0.5);

    report.details.notebooks.forEach((notebook, index) => {
      const updatedDate = new Date(notebook.updated_At).toLocaleDateString();
      doc
        .fontSize(12)
        .text(`${index + 1}. ${notebook.name}`)
        .text(`   Last Updated: ${updatedDate}`)
        .text(`   Unit ID: ${notebook.unit_id}`)
        .moveDown(0.25);
    });
    doc.moveDown();
  }

  // Footer with generation date
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    const bottom = doc.page.height - 50;
    doc
      .fontSize(10)
      .text(
        `Report generated on ${new Date(report.generated).toLocaleString()}`,
        50,
        bottom,
        { align: "center" }
      );

    doc.text(`Page ${i + 1} of ${pageCount}`, 50, bottom + 15, {
      align: "center",
    });
  }
}
