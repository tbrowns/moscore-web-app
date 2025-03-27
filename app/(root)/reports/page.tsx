"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { jsPDF } from "jspdf"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, FileText, Loader2, FileDown } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ReportSummary } from "./components/report-summary"
import { ReportDetails } from "./components/report-details"
import { ReportSkeleton } from "./components/report-skeleton"
import { NoData } from "./components/no-data"
import { ParametricOptions } from "./components/parametric-options"

// Update the UserReport interface to focus on credit data instead of units/clusters
interface UserReport {
  user: {
    id: string
    name: string
    email: string
    credit_balance: number
  }
  summary: {
    totalCredits: number
    totalPurchases: number
    totalConsumption: number
    averageTransaction: number
    currentBalance: number
  }
  details: {
    transactions: any[]
    purchases: any[]
    consumption: any[]
  }
  dateRange: {
    from: string
    to: string
  }
  parameters?: Record<string, string>
  generated: string
}

// Enum for report types
enum ReportType {
  SUMMARY = "summary",
  DETAILED = "detailed",
  PARAMETRIC = "parametric",
}

export default function UserReportsPage() {
  const [userId, setUserId] = useState("")
  const [reportType, setReportType] = useState<ReportType>(ReportType.SUMMARY)
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [parameters, setParameters] = useState<Record<string, string>>({})
  const [report, setReport] = useState<UserReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Replace the generateReport function with this credit-focused version
  const generateReport = async (userId: string, dateFrom?: Date, dateTo?: Date) => {
    try {
      // Format date parameters for query
      const fromDate = dateFrom ? dateFrom.toISOString() : undefined
      const toDate = dateTo ? dateTo.toISOString() : undefined

      // Modified query to fetch credit-related data
      const query = supabase
        .from("users")
        .select(
          `
        id, 
        name, 
        email,
        credit_balance,
        credit_transactions:credit_transactions(
          id,
          amount,
          type,
          description,
          created_at
        )
      `,
        )
        .eq("id", userId)

      // Execute the query
      const { data: userData, error: userError } = await query.single()

      // Add more detailed error handling
      if (userError) {
        console.error("Supabase query error:", userError)
        if (userError.code === "PGRST116") {
          throw new Error(`No user found with ID: ${userId}`)
        }
        throw userError
      }

      // Validate user data
      if (!userData) {
        throw new Error(`No data returned for user ID: ${userId}`)
      }

      console.log("Raw user data from Supabase:", userData)

      // Filter transactions based on date range if provided
      let filteredTransactions = userData.credit_transactions || []

      if (fromDate || toDate) {
        filteredTransactions = filteredTransactions.filter((transaction) => {
          if (!transaction.created_at) return true // Keep if no date to filter on
          const transactionDate = new Date(transaction.created_at)
          return (
            (!fromDate || transactionDate >= new Date(fromDate)) && (!toDate || transactionDate <= new Date(toDate))
          )
        })
      }

      // Separate transactions by type
      const purchases = filteredTransactions.filter((t) => t.type === "purchase")
      const consumption = filteredTransactions.filter((t) => t.type === "consumption")

      // Calculate summary metrics
      const totalPurchases = purchases.reduce((sum, t) => sum + t.amount, 0)
      const totalConsumption = consumption.reduce((sum, t) => sum + t.amount, 0)
      const totalTransactions = filteredTransactions.length
      const averageTransaction =
        totalTransactions > 0
          ? filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / totalTransactions
          : 0

      // Compile report data
      const report = {
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          credit_balance: userData.credit_balance || 0,
        },
        summary: {
          totalCredits: totalPurchases,
          totalPurchases: purchases.length,
          totalConsumption: consumption.length,
          averageTransaction: averageTransaction,
          currentBalance: userData.credit_balance || 0,
        },
        details: {
          transactions: filteredTransactions,
          purchases: purchases,
          consumption: consumption,
        },
        dateRange: {
          from: fromDate || "",
          to: toDate || "",
        },
        parameters: parameters,
        generated: new Date().toISOString(),
      }

      console.log("Generated credit report data:", {
        user: userData.id,
        transactions: filteredTransactions.length,
        dateRange: { fromDate, toDate },
      })

      return report
    } catch (err) {
      console.error("Error generating credit reports:", err)
      throw err
    }
  }

  // Update the PDF generation function for credit focus
  const generatePdfReport = (report: UserReport, type: ReportType) => {
    try {
      // Create a new document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Page configuration
      const pageWidth = 210 // A4 width in mm
      const leftMargin = 20
      let currentY = 20 // Starting Y position

      // Helper function to add text with automatic page breaking
      const addText = (text: string, fontSize = 12, style: "normal" | "bold" = "normal") => {
        // Set font style
        doc.setFontSize(fontSize)
        doc.setFont("helvetica", style)

        // Check if we need a new page
        if (currentY > 280) {
          // Near bottom of page
          doc.addPage()
          currentY = 20 // Reset Y position
        }

        // Add text
        doc.text(text, leftMargin, currentY)

        // Increment Y position based on font size
        currentY += fontSize * 0.353 // Approximate line height
      }

      // Helper function to add a section header
      const addSectionHeader = (text: string) => {
        currentY += 5
        addText(text, 14, "bold")
        currentY += 5
      }

      // Helper function to safely format dates
      const formatDateSafe = (dateString: string | undefined | null) => {
        if (!dateString) return "N/A"
        try {
          return format(new Date(dateString), "PPP")
        } catch (e) {
          return "Invalid date"
        }
      }

      // Format currency
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
      }

      // Title - Different for each report type
      switch (type) {
        case ReportType.SUMMARY:
          addText("User Credit Summary Report", 18, "bold")
          break
        case ReportType.DETAILED:
          addText("User Credit Detailed Report", 18, "bold")
          break
        case ReportType.PARAMETRIC:
          addText("User Credit Parametric Report", 18, "bold")
          break
      }
      currentY += 10 // Extra space after title

      // User info - Common for all report types
      addText(`User: ${report.user.name}`, 12, "bold")
      addText(`Email: ${report.user.email}`)
      addText(`User ID: ${report.user.id}`)
      addText(`Current Credit Balance: ${formatCurrency(report.user.credit_balance)}`, 12, "bold")
      currentY += 5

      // Date range - Common for all report types
      if (report.dateRange.from || report.dateRange.to) {
        addText("Date Range:", 12, "bold")
        if (report.dateRange.from) {
          addText(`From: ${formatDateSafe(report.dateRange.from)}`)
        }
        if (report.dateRange.to) {
          addText(`To: ${formatDateSafe(report.dateRange.to)}`)
        }
        currentY += 5
      }

      // Report-specific content
      switch (type) {
        case ReportType.SUMMARY:
          // Summary report - Credit overview
          addSectionHeader("Credit Summary")
          addText(`Total Credits Purchased: ${formatCurrency(report.summary.totalCredits)}`)
          addText(`Number of Purchases: ${report.summary.totalPurchases}`)
          addText(`Number of Consumption Transactions: ${report.summary.totalConsumption}`)
          addText(`Average Transaction Amount: ${formatCurrency(report.summary.averageTransaction)}`)
          addText(`Current Balance: ${formatCurrency(report.summary.currentBalance)}`)
          break

        case ReportType.DETAILED:
          // Detailed report - All transactions with details
          addSectionHeader("Credit Summary")
          addText(`Total Credits Purchased: ${formatCurrency(report.summary.totalCredits)}`)
          addText(`Number of Purchases: ${report.summary.totalPurchases}`)
          addText(`Number of Consumption Transactions: ${report.summary.totalConsumption}`)
          addText(`Current Balance: ${formatCurrency(report.summary.currentBalance)}`)
          currentY += 10

          // Credit Purchase Transactions
          if (report.details.purchases.length > 0) {
            addSectionHeader("Credit Purchases")
            report.details.purchases.forEach((transaction, index) => {
              addText(`${index + 1}. Amount: ${formatCurrency(transaction.amount)}`, 11, "bold")
              addText(`   Date: ${formatDateSafe(transaction.created_at)}`, 10)
              if (transaction.description) {
                addText(`   Description: ${transaction.description}`, 10)
              }
              currentY += 2
            })
          }

          // Credit Consumption Transactions
          if (report.details.consumption.length > 0) {
            addSectionHeader("Credit Consumption")
            report.details.consumption.forEach((transaction, index) => {
              addText(`${index + 1}. Amount: ${formatCurrency(transaction.amount)}`, 11, "bold")
              addText(`   Date: ${formatDateSafe(transaction.created_at)}`, 10)
              if (transaction.description) {
                addText(`   Description: ${transaction.description}`, 10)
              }
              currentY += 2
            })
          }
          break

        case ReportType.PARAMETRIC:
          // Parametric report - Credit summary plus custom parameters
          addSectionHeader("Credit Summary")
          addText(`Total Credits Purchased: ${formatCurrency(report.summary.totalCredits)}`)
          addText(`Number of Purchases: ${report.summary.totalPurchases}`)
          addText(`Number of Consumption Transactions: ${report.summary.totalConsumption}`)
          addText(`Current Balance: ${formatCurrency(report.summary.currentBalance)}`)
          currentY += 10

          // Custom parameters
          if (report.parameters && Object.keys(report.parameters).length > 0) {
            addSectionHeader("Filter Parameters")
            Object.entries(report.parameters).forEach(([key, value]) => {
              addText(`${key}: ${value}`)
            })
          }

          // Add filtered transaction summary if there are parameters
          if (Object.keys(report.parameters || {}).length > 0) {
            currentY += 5
            addText(`Filtered Transactions Count: ${report.details.transactions.length}`, 11, "bold")

            // Add transaction type distribution if available
            if (report.details.purchases.length > 0 || report.details.consumption.length > 0) {
              addText(`Purchase Transactions: ${report.details.purchases.length}`)
              addText(`Consumption Transactions: ${report.details.consumption.length}`)
            }
          }
          break
      }

      // Add timestamp - Common for all report types
      currentY += 10 // Extra space before timestamp
      addText(`Generated: ${format(new Date(report.generated), "PPP p")}`, 10, "normal")

      // Generate filename based on report type
      const timestamp = Date.now()
      const filename = `user_${report.user.id}_credit_${type}_report_${timestamp}.pdf`

      // Save PDF
      doc.save(filename)

      return filename
    } catch (err) {
      console.error("PDF Generation Error:", err)
      throw new Error("Failed to generate PDF document")
    }
  }

  const handleGenerateReport = async () => {
    if (!userId) {
      setError("User ID is required")
      return
    }

    setIsLoading(true)
    setError(null)
    setReport(null) // Reset report state

    try {
      // Generate report with date range
      const generatedReport = await generateReport(userId, dateRange.from, dateRange.to)

      console.log("Setting report state:", generatedReport)

      // Ensure we have a valid report before setting state
      if (generatedReport && generatedReport.user) {
        setReport(generatedReport)
      } else {
        setError("No data found for the specified user and date range")
      }
    } catch (err) {
      console.error("Error generating report:", err)
      setError(err instanceof Error ? err.message : "Failed to generate report")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPdf = (type: ReportType) => {
    if (report) {
      try {
        const filename = generatePdfReport(report, type)
        return filename
      } catch (error) {
        console.error("Error generating PDF:", error)
        setError("Failed to generate PDF report")
      }
    }
  }

  const handleParameterChange = (key: string, value: string) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleRemoveParameter = (key: string) => {
    setParameters((prev) => {
      const newParams = { ...prev }
      delete newParams[key]
      return newParams
    })
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6 text-primary">User Report Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Report Parameters</CardTitle>
            <CardDescription>Configure your report settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="Enter User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ReportType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)} Report
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {reportType === ReportType.PARAMETRIC && (
              <ParametricOptions
                parameters={parameters}
                onParameterChange={handleParameterChange}
                onRemoveParameter={handleRemoveParameter}
              />
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="lg:col-span-2">
          {error && <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">{error}</div>}

          {isLoading ? (
            <ReportSkeleton />
          ) : error ? (
            <NoData message={error} />
          ) : report ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Report Results</CardTitle>
                  <CardDescription>Generated on {format(new Date(report.generated), "PPP p")}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleDownloadPdf(ReportType.SUMMARY)}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Summary PDF
                  </Button>
                  <Button variant="outline" onClick={() => handleDownloadPdf(ReportType.DETAILED)}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Detailed PDF
                  </Button>
                  <Button variant="outline" onClick={() => handleDownloadPdf(ReportType.PARAMETRIC)}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Parametric PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="parametric">Parametric</TabsTrigger>
                  </TabsList>
                  <TabsContent value="summary">
                    <ReportSummary report={report} />
                  </TabsContent>
                  <TabsContent value="details">
                    <ReportDetails report={report} />
                  </TabsContent>
                  <TabsContent value="parametric">
                    <Card>
                      <CardHeader>
                        <CardTitle>Parametric Report</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">User Information</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <dl className="space-y-2">
                                  <div className="flex justify-between">
                                    <dt className="text-sm font-medium text-muted-foreground">Name:</dt>
                                    <dd className="text-sm">{report.user.name}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-sm font-medium text-muted-foreground">Email:</dt>
                                    <dd className="text-sm">{report.user.email}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-sm font-medium text-muted-foreground">User ID:</dt>
                                    <dd className="text-sm">{report.user.id}</dd>
                                  </div>
                                </dl>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Custom Parameters</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {Object.keys(parameters).length > 0 ? (
                                  <dl className="space-y-2">
                                    {Object.entries(parameters).map(([key, value]) => (
                                      <div key={key} className="flex justify-between">
                                        <dt className="text-sm font-medium text-muted-foreground">{key}:</dt>
                                        <dd className="text-sm">{value}</dd>
                                      </div>
                                    ))}
                                  </dl>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No custom parameters defined.</p>
                                )}
                              </CardContent>
                            </Card>
                          </div>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">Resource Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <dl className="space-y-2">
                                <div className="flex justify-between">
                                  <dt className="text-sm font-medium text-muted-foreground">Total Units:</dt>
                                  <dd className="text-sm">{report.summary.totalUnits}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-sm font-medium text-muted-foreground">Total Clusters:</dt>
                                  <dd className="text-sm">{report.summary.totalClusters}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-sm font-medium text-muted-foreground">Total Files:</dt>
                                  <dd className="text-sm">{report.summary.totalFiles}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-sm font-medium text-muted-foreground">Total Notebooks:</dt>
                                  <dd className="text-sm">{report.summary.totalNotebooks}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-sm font-medium text-muted-foreground">Total Embeddings:</dt>
                                  <dd className="text-sm">{report.summary.totalEmbeddings}</dd>
                                </div>
                              </dl>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <NoData message="Enter a user ID and generate a report to see results" />
          )}
        </div>
      </div>
    </div>
  )
}

