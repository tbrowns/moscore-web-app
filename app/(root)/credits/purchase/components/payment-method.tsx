"use client"

import type React from "react"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

interface PaymentMethod {
  id: string
  name: string
  icon: React.ReactNode
  description: string
}

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[]
  selectedMethod: string
  onSelect: (methodId: string) => void
}

export function PaymentMethodSelector({ methods, selectedMethod, onSelect }: PaymentMethodSelectorProps) {
  return (
    <RadioGroup value={selectedMethod} onValueChange={onSelect} className="space-y-3">
      {methods.map((method) => (
        <div key={method.id}>
          <Label htmlFor={method.id} className="flex flex-col space-y-1 cursor-pointer">
            <Card className={`p-4 ${selectedMethod === method.id ? "border-primary" : ""}`}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={method.id} id={method.id} />
                <div className="flex items-center space-x-2">
                  {method.icon}
                  <span className="font-medium">{method.name}</span>
                </div>
              </div>
              <div className="ml-6 mt-1 text-sm text-muted-foreground">{method.description}</div>
            </Card>
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}

