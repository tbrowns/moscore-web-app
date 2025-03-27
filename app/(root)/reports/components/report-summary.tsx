import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format } from "date-fns"

interface ReportSummaryProps {
  report: any
}

export function ReportSummary({ report }: ReportSummaryProps) {
  // Validate report data
  if (!report || !report.summary) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No report data available</p>
      </div>
    )
  }

  // Add console log to debug
  console.log("Rendering credit summary with data:", report.summary)

  // Prepare chart data
  const creditDistributionData = [
    { name: "Current Balance", value: report.user.credit_balance || 0 },
    { name: "Credits Used", value: report.summary.totalCredits - (report.user.credit_balance || 0) },
  ]

  // Transaction type distribution chart data
  const transactionTypeData = [
    { name: "Purchases", value: report.summary.totalPurchases || 0 },
    { name: "Consumption", value: report.summary.totalConsumption || 0 },
  ]

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  }

  // Colors for the pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  return (
    <div className="space-y-6">
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
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-muted-foreground">Current Balance:</dt>
                <dd className="text-sm font-bold">{formatCurrency(report.user.credit_balance || 0)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-muted-foreground">From:</dt>
                <dd className="text-sm">
                  {report.dateRange.from ? format(new Date(report.dateRange.from), "PPP") : "Not specified"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-muted-foreground">To:</dt>
                <dd className="text-sm">
                  {report.dateRange.to ? format(new Date(report.dateRange.to), "PPP") : "Not specified"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-muted-foreground">Generated:</dt>
                <dd className="text-sm">{format(new Date(report.generated), "PPP p")}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Balance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <h3 className="text-sm font-medium text-center mb-2">Credit Distribution</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={creditDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {creditDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[300px]">
              <h3 className="text-sm font-medium text-center mb-2">Transaction Types</h3>
              <ChartContainer
                config={{
                  value: {
                    label: "Count",
                    color: "hsl(var(--chart-1))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transactionTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{formatCurrency(report.summary.totalCredits)}</p>
                <p className="text-xs text-muted-foreground">Total Credits Purchased</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{report.summary.totalPurchases}</p>
                <p className="text-xs text-muted-foreground">Purchase Transactions</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{report.summary.totalConsumption}</p>
                <p className="text-xs text-muted-foreground">Consumption Transactions</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{report.details.transactions.length}</p>
                <p className="text-xs text-muted-foreground">Total Transactions</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{formatCurrency(report.summary.averageTransaction)}</p>
                <p className="text-xs text-muted-foreground">Average Transaction</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{formatCurrency(report.user.credit_balance)}</p>
                <p className="text-xs text-muted-foreground">Current Balance</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

