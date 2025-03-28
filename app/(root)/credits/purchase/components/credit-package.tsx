"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Check } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface CreditPackageProps {
  packageDetails: {
    id: string
    name: string
    credits: number
    price: number
    popular?: boolean
    description: string
    originalCredits?: number
  }
  isSelected: boolean
  onSelect: () => void
}

export function CreditPackage({ packageDetails, isSelected, onSelect }: CreditPackageProps) {
  const { name, credits, price, popular, description, originalCredits } = packageDetails

  return (
    <Card
      className={`relative overflow-hidden transition-all ${
        isSelected ? "border-primary shadow-md" : "hover:border-primary/50 hover:shadow-sm"
      }`}
    >
      {popular && (
        <Badge className="absolute top-0 right-0 rounded-tl-none rounded-br-none px-3 py-1" variant="default">
          Most Popular
        </Badge>
      )}

      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="h-5 w-5 mr-2 text-primary" />
          {name}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold">{formatCurrency(price)}</div>

          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-medium">{credits.toLocaleString()}</span>
            <span className="text-muted-foreground">credits</span>
          </div>

          {originalCredits && (
            <div className="text-sm text-green-600">Includes {credits - originalCredits} bonus credits!</div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button variant={isSelected ? "default" : "outline"} className="w-full" onClick={onSelect}>
          {isSelected ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Selected
            </>
          ) : (
            "Select Package"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

