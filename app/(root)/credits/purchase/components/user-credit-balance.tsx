import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface UserCreditBalanceProps {
  balance: number;
}

export function UserCreditBalance({ balance }: UserCreditBalanceProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-primary" />
            <span className="text-sm font-medium">Current Balance</span>
          </div>
          <span className="text-lg font-bold">{formatCurrency(balance)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
