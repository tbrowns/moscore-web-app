import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle } from "lucide-react"

export function MpesaInstructions() {
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4 space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1 text-amber-500" />
            How to Pay with M-Pesa
          </h4>
          <ol className="text-sm space-y-2 pl-5 list-decimal text-muted-foreground">
            <li>Enter your M-Pesa registered phone number above</li>
            <li>Click "Pay with M-Pesa" to receive a payment prompt on your phone</li>
            <li>Enter your M-Pesa PIN to authorize the payment</li>
            <li>Wait for confirmation (this may take a few moments)</li>
          </ol>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium text-sm mb-2">M-Pesa Payment Details</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paybill Number:</span>
              <span className="font-mono">{process.env.MPESA_SHORTCODE || "174379"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Number:</span>
              <span className="font-mono">Generated automatically</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p className="flex items-center">
            <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
            Your credits will be added to your account immediately after successful payment
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

