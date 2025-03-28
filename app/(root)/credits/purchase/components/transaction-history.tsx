import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TrendingUp, TrendingDown, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format, parseISO } from "date-fns"

interface TransactionHistoryProps {
  transactions: any[]
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (!transactions || transactions.length === 0) {
    return null
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy")
    } catch (e) {
      return dateString
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[200px] px-4">
          <div className="space-y-2 py-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {transaction.type === "purchase" ? (
                      <Badge variant="default" className="h-6 w-6 p-1 flex items-center justify-center rounded-full">
                        <TrendingUp className="h-3 w-3" />
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="h-6 w-6 p-1 flex items-center justify-center rounded-full"
                      >
                        <TrendingDown className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {transaction.type === "purchase" ? "Credit Purchase" : "Credit Usage"}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {transaction.description || "No description"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${transaction.type === "purchase" ? "text-green-600" : "text-red-600"}`}
                  >
                    {transaction.type === "purchase" ? "+" : "-"}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center justify-end">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

