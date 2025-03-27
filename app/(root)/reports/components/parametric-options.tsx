"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ParametricOptionsProps {
  parameters: Record<string, string>
  onParameterChange: (key: string, value: string) => void
  onRemoveParameter: (key: string) => void
}

export function ParametricOptions({ parameters, onParameterChange, onRemoveParameter }: ParametricOptionsProps) {
  const [newParamKey, setNewParamKey] = useState("")
  const [newParamValue, setNewParamValue] = useState("")
  const [paramType, setParamType] = useState<"custom" | "predefined">("predefined")

  const handleAddParameter = () => {
    if (newParamKey.trim()) {
      onParameterChange(newParamKey.trim(), newParamValue.trim())
      setNewParamKey("")
      setNewParamValue("")
    }
  }

  const handleAddPredefinedParameter = (key: string) => {
    // Don't add if already exists
    if (parameters[key]) return

    // Default values for predefined parameters
    const defaultValues: Record<string, string> = {
      "Transaction Type": "purchase",
      "Minimum Amount": "10",
      "Maximum Amount": "1000",
      "Sort By": "date",
      "Group By": "month",
    }

    onParameterChange(key, defaultValues[key] || "")
  }

  return (
    <div className="space-y-4">
      <Label>Credit Report Parameters</Label>

      {Object.keys(parameters).length > 0 && (
        <Card className="bg-muted/40">
          <CardContent className="p-4 space-y-2">
            {Object.entries(parameters).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm font-medium">{key}:</span>
                  {key === "Transaction Type" ? (
                    <Select defaultValue={value} onValueChange={(newValue) => onParameterChange(key, newValue)}>
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purchase">Purchase</SelectItem>
                        <SelectItem value="consumption">Consumption</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : key === "Sort By" ? (
                    <Select defaultValue={value} onValueChange={(newValue) => onParameterChange(key, newValue)}>
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : key === "Group By" ? (
                    <Select defaultValue={value} onValueChange={(newValue) => onParameterChange(key, newValue)}>
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue placeholder="Group by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      className="h-8 text-sm"
                      value={value}
                      onChange={(e) => onParameterChange(key, e.target.value)}
                    />
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveParameter(key)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex space-x-2">
          <Button
            variant={paramType === "predefined" ? "default" : "outline"}
            size="sm"
            onClick={() => setParamType("predefined")}
            className="text-xs"
          >
            Predefined Parameters
          </Button>
          <Button
            variant={paramType === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setParamType("custom")}
            className="text-xs"
          >
            Custom Parameter
          </Button>
        </div>

        {paramType === "predefined" ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddPredefinedParameter("Transaction Type")}
              disabled={parameters["Transaction Type"] !== undefined}
            >
              + Transaction Type
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddPredefinedParameter("Minimum Amount")}
              disabled={parameters["Minimum Amount"] !== undefined}
            >
              + Minimum Amount
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddPredefinedParameter("Maximum Amount")}
              disabled={parameters["Maximum Amount"] !== undefined}
            >
              + Maximum Amount
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddPredefinedParameter("Sort By")}
              disabled={parameters["Sort By"] !== undefined}
            >
              + Sort By
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddPredefinedParameter("Group By")}
              disabled={parameters["Group By"] !== undefined}
            >
              + Group By
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr,1fr,auto] gap-2">
            <Input placeholder="Parameter name" value={newParamKey} onChange={(e) => setNewParamKey(e.target.value)} />
            <Input
              placeholder="Parameter value"
              value={newParamValue}
              onChange={(e) => setNewParamValue(e.target.value)}
            />
            <Button onClick={handleAddParameter} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

