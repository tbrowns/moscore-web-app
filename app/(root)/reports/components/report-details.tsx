"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CreditCard, TrendingDown, TrendingUp, ClockIcon, BarChart } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useState } from "react"

interface ReportDetailsProps {
  report: any
}

export function ReportDetails({ report }: ReportDetailsProps) {
  const [timeframe, setTimeframe] = useState<"daily" | "monthly">("daily")

  // Validate report data
  if (!report || !report.details) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No detailed report data available</p>
      </div>
    )
  }

  // Add console log to debug
  console.log("Rendering credit details with data:", {
    transactions: report.details.transactions.length,
    purchases: report.details.purchases.length,
    consumption: report.details.consumption.length,
  })

  // Helper function to safely format dates
  const formatDateSafe = (dateString: string | undefined | null, formatStr = "PPP") => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), formatStr)
    } catch (e) {
      return "Invalid date"
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  }

  // Prepare time series data for the transactions chart
  const prepareTimeSeriesData = () => {
    if (!report.details.transactions.length) return []

    const sorted = [...report.details.transactions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )

    const timeFormat = timeframe === "daily" ? "yyyy-MM-dd" : "yyyy-MM"

    // Group by time period
    const groupedData = sorted.reduce((acc, transaction) => {
      const date = formatDateSafe(transaction.created_at, timeFormat)
      if (!acc[date]) {
        acc[date] = {
          date,
          purchases: 0,
          consumption: 0,
          balance: 0,
        }
      }

      if (transaction.type === "purchase") {
        acc[date].purchases += transaction.amount
      } else if (transaction.type === "consumption") {
        acc[date].consumption += transaction.amount
      }

      return acc
    }, {})

    // Convert to array and calculate running balance
    let runningBalance = 0
    return Object.values(groupedData).map((day: any) => {
      runningBalance += day.purchases - day.consumption
      return {
        ...day,
        balance: runningBalance,
      }
    })
  }

  const timeSeriesData = prepareTimeSeriesData()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <BarChart className="mr-2 h-5 w-5" />
              Credit Transaction Trends
            </span>
            <div className="flex space-x-2">
              <Badge
                variant={timeframe === "daily" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setTimeframe("daily")}
              >
                Daily
              </Badge>
              <Badge
                variant={timeframe === "monthly" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setTimeframe("monthly")}
              >
                Monthly
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="balance" stroke="#8884d8" name="Balance" />
                  <Line type="monotone" dataKey="purchases" stroke="#82ca9d" name="Purchases" />
                  <Line type="monotone" dataKey="consumption" stroke="#ff7300" name="Consumption" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <p className="text-muted-foreground">No transaction data available for chart</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                All Transactions ({report.details.transactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(report.details.transactions) && report.details.transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.details.transactions.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Badge variant={transaction.type === "purchase" ? "success" : "destructive"}>
                            {transaction.type === "purchase" ? (
                              <>
                                <TrendingUp className="h-3 w-3 mr-1" /> Purchase
                              </>
                            ) : (
                              <>
                                <TrendingDown className="h-3 w-3 mr-1" /> Consumption
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>{transaction.description || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                            {formatDateSafe(transaction.created_at)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No transactions found in the selected date range.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Credit Purchases ({report.details.purchases.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(report.details.purchases) && report.details.purchases.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.details.purchases.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>{transaction.description || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                            {formatDateSafe(transaction.created_at)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No purchase transactions found in the selected date range.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consumption">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingDown className="mr-2 h-5 w-5" />
                Credit Consumption ({report.details.consumption.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(report.details.consumption) && report.details.consumption.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.details.consumption.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>{transaction.description || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                            {formatDateSafe(transaction.created_at)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No consumption transactions found in the selected date range.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

