"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, CreditCard, BarChart3, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function CreditsPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6 text-primary">Credit Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wallet className="h-4 w-4 mr-2" />
              Purchase Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground">
              Buy credit packages to use our services. Choose from various options to suit your needs.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild size="sm" className="w-full">
              <Link href="/credits/purchase">
                Purchase Now <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground">
              View your complete transaction history, including purchases and credit usage.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/reports">
                View History <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Usage Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground">
              Generate detailed reports on your credit usage and spending patterns.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/reports">
                Generate Reports <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Management</CardTitle>
          <CardDescription>Manage your credits and view usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="purchase">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="purchase">Purchase</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="purchase" className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium">Ready to purchase credits?</h3>
                <p className="text-muted-foreground">Choose from our range of credit packages to suit your needs.</p>
                <Button asChild size="lg" className="mt-4">
                  <Link href="/credits/purchase">Go to Purchase Page</Link>
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="history" className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium">View your transaction history</h3>
                <p className="text-muted-foreground">Track all your credit purchases and usage in one place.</p>
                <Button asChild variant="outline" size="lg" className="mt-4">
                  <Link href="/reports">View Transaction History</Link>
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="reports" className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium">Generate usage reports</h3>
                <p className="text-muted-foreground">Get detailed insights into your credit usage patterns.</p>
                <Button asChild variant="outline" size="lg" className="mt-4">
                  <Link href="/reports">Generate Reports</Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

