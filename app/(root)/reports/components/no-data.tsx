import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileX } from "lucide-react"

interface NoDataProps {
  message?: string
}

export function NoData({ message = "No data available for the selected parameters" }: NoDataProps) {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="flex justify-center">
          <FileX className="h-12 w-12 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground">{message}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your search parameters or selecting a different date range.
        </p>
        <p className="text-sm text-muted-foreground mt-4">You can generate three different types of credit reports:</p>
        <ul className="text-sm text-muted-foreground mt-1 space-y-1">
          <li>
            • <strong>Summary Report:</strong> High-level overview of credit transactions and balances
          </li>
          <li>
            • <strong>Detailed Report:</strong> Comprehensive breakdown of all credit transactions with timestamps
          </li>
          <li>
            • <strong>Parametric Report:</strong> Custom credit reports with user-defined parameters
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}

