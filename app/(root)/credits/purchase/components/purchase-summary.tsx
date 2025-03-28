import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface PurchaseSummaryProps {
  packageDetails: {
    id: string;
    name: string;
    credits: number;
    price: number;
    originalCredits?: number;
  };
  userId: string;
  newBalance: number;
  phoneNumber: string;
}

export function PurchaseSummary({
  packageDetails,
  userId,
  newBalance,
  phoneNumber,
}: PurchaseSummaryProps) {
  const { name, credits, price, originalCredits } = packageDetails;
  const purchaseDate = new Date();

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="font-medium text-lg">Purchase Details</h3>
          <p className="text-sm text-muted-foreground">
            Transaction completed on {format(purchaseDate, "PPP 'at' p")}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Package</span>
            <span className="text-sm">{name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Credits Purchased</span>
            <span className="text-sm">{credits.toLocaleString()}</span>
          </div>
          {originalCredits && (
            <div className="flex justify-between text-green-600">
              <span className="text-sm font-medium">Bonus Credits</span>
              <span className="text-sm">
                +{(credits - originalCredits).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm font-medium">Amount Paid</span>
            <span className="text-sm">{formatCurrency(price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Payment Method</span>
            <span className="text-sm">M-Pesa ({phoneNumber})</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">User ID</span>
            <span className="text-sm">{userId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Transaction ID</span>
            <span className="text-sm">
              TXN-{Date.now().toString().slice(-8)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">New Balance</span>
            <span className="text-sm font-bold">
              {formatCurrency(newBalance)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
