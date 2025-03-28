"use client";

import type React from "react";
import { useUser } from "@clerk/nextjs";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Phone,
  RefreshCw,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CreditPackage } from "./components/credit-package";
import { MpesaInstructions } from "./components/mpesa-instructions";
import { PurchaseSummary } from "./components/purchase-summary";
import { UserCreditBalance } from "./components/user-credit-balance";
import { TransactionHistory } from "./components/transaction-history";
import {
  initiateMpesaPayment,
  checkPaymentStatus,
  getUserTransactions,
  getUserBalance,
} from "./actions";

// Credit package options
const creditPackages = [
  {
    id: "basic",
    name: "Basic",
    credits: 100,
    price: 10,
    popular: false,
    description: "Perfect for getting started with our platform",
  },
  {
    id: "standard",
    name: "Standard",
    credits: 500,
    price: 45,
    popular: true,
    description: "Our most popular package with 10% bonus credits",
    originalCredits: 450,
  },
  {
    id: "premium",
    name: "Premium",
    credits: 1200,
    price: 99,
    popular: false,
    description: "Best value with 20% bonus credits",
    originalCredits: 1000,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    credits: 5000,
    price: 399,
    popular: false,
    description: "For power users with 25% bonus credits",
    originalCredits: 4000,
  },
];

export default function PurchaseCreditsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(creditPackages[1]); // Default to Standard
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<
    "select" | "payment" | "confirmation"
  >("select");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(
    null
  );
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "completed" | "failed" | null
  >(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    const id: string = user?.id || "";
    setUserId(id);
  }, [user]);

  // Fetch user balance and transactions when user ID changes
  useEffect(() => {
    if (userId) {
      fetchUserData(userId);
    } else {
      setUserBalance(null);
      setTransactions([]);
    }
  }, [userId]);

  // Poll for payment status
  useEffect(() => {
    if (checkoutRequestId && paymentStatus === "pending") {
      const interval = setInterval(async () => {
        try {
          const result = await checkPaymentStatus(checkoutRequestId);
          if (result.status === "completed") {
            setPaymentStatus("completed");
            setSuccess(true);
            setPurchaseStep("confirmation");
            setUserBalance(result.balance);
            clearInterval(interval);
            // Refresh transactions
            fetchUserData(userId);
          } else if (result.status === "failed") {
            setPaymentStatus("failed");
            setError(result.message || "Payment failed. Please try again.");
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Error checking payment status:", err);
        }
      }, 5000); // Check every 5 seconds

      setPollingInterval(interval);

      // Clean up interval on unmount
      return () => {
        clearInterval(interval);
      };
    }
  }, [checkoutRequestId, paymentStatus, userId]);

  // Fetch user data (balance and transactions)
  const fetchUserData = async (id: string) => {
    try {
      // Fetch balance
      const balance = await getUserBalance(id);
      setUserBalance(balance);

      // Fetch transactions
      const txns = await getUserTransactions(id);
      setTransactions(txns);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Could not fetch user data. Please try again.");
    }
  };

  // Handle user ID input
  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserId(e.target.value);
  };

  // Handle phone number input
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and format as needed
    const value = e.target.value.replace(/[^\d]/g, "");
    setPhoneNumber(value);
  };

  // Handle package selection
  const handlePackageSelect = (pkg: (typeof creditPackages)[0]) => {
    setSelectedPackage(pkg);
  };

  // Process the M-Pesa payment
  const handleMpesaPayment = async () => {
    if (!userId) {
      setError("Please enter a user ID");
      return;
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Initiate STK push
      const response = await initiateMpesaPayment(
        phoneNumber,
        selectedPackage.price,
        userId,
        selectedPackage.id,
        selectedPackage.name
      );

      if (response.CheckoutRequestID) {
        setCheckoutRequestId(response.CheckoutRequestID);
        setPaymentStatus("pending");
      } else {
        throw new Error("Failed to initiate payment");
      }
    } catch (err: any) {
      console.error("Error processing payment:", err);
      setError(
        err.message || "Failed to process your payment. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Manually check payment status
  const handleCheckStatus = async () => {
    if (!checkoutRequestId) return;

    setIsLoading(true);
    try {
      const result = await checkPaymentStatus(checkoutRequestId);
      if (result.status === "completed") {
        setPaymentStatus("completed");
        setSuccess(true);
        setPurchaseStep("confirmation");
        setUserBalance(result.balance);
        // Clear polling interval if it exists
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        // Refresh transactions
        fetchUserData(userId);
      } else if (result.status === "failed") {
        setPaymentStatus("failed");
        setError(result.message || "Payment failed. Please try again.");
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
      setError("Failed to check payment status");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the form for a new purchase
  const handleNewPurchase = () => {
    setSuccess(false);
    setPurchaseStep("select");
    setSelectedPackage(creditPackages[1]);
    setCheckoutRequestId(null);
    setPaymentStatus(null);
    // Clear polling interval if it exists
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Format phone number for display
  const formatPhoneForDisplay = (phone: string) => {
    if (!phone) return "";

    // If it starts with 0, replace with +254
    if (phone.startsWith("0")) {
      phone = "+254" + phone.substring(1);
    }
    // If it starts with 254, add +
    else if (phone.startsWith("254")) {
      phone = "+" + phone;
    }
    // If it doesn't start with +254, add it
    else if (!phone.startsWith("+254")) {
      phone = "+254" + phone;
    }

    return phone;
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6 text-primary">Purchase Credits</h1>

      {success ? (
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Purchase Successful!</CardTitle>
            <CardDescription>
              Your credit purchase has been processed successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseSummary
              packageDetails={selectedPackage}
              userId={userId}
              newBalance={userBalance || 0}
              phoneNumber={formatPhoneForDisplay(phoneNumber)}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/reports")}>
              View Reports
            </Button>
            <Button onClick={handleNewPurchase}>Make Another Purchase</Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userBalance !== null && (
                <UserCreditBalance balance={userBalance} />
              )}

              {userId && transactions.length > 0 && (
                <TransactionHistory transactions={transactions} />
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Purchase Credits via M-Pesa</CardTitle>
                <CardDescription>
                  Select a credit package and pay with M-Pesa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={purchaseStep}
                  onValueChange={(value) =>
                    setPurchaseStep(
                      value as "select" | "payment" | "confirmation"
                    )
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="select">Select Package</TabsTrigger>
                    <TabsTrigger value="payment" disabled={!userId}>
                      Payment
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="select" className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {creditPackages.map((pkg) => (
                        <CreditPackage
                          key={pkg.id}
                          packageDetails={pkg}
                          isSelected={selectedPackage.id === pkg.id}
                          onSelect={() => handlePackageSelect(pkg)}
                        />
                      ))}
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button
                        onClick={() => setPurchaseStep("payment")}
                        disabled={!userId}
                      >
                        Continue to Payment
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="payment" className="space-y-6 pt-4">
                    {paymentStatus === "pending" ? (
                      <div className="space-y-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-6 text-center">
                          <Clock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-amber-800 mb-2">
                            Payment Processing
                          </h3>
                          <p className="text-amber-700 mb-4">
                            We've sent an M-Pesa payment request to your phone.
                            Please check your phone and enter your PIN to
                            complete the transaction.
                          </p>
                          <div className="flex justify-center space-x-4">
                            <Button
                              variant="outline"
                              onClick={handleCheckStatus}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                              )}
                              Check Status
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={handleNewPurchase}
                              disabled={isLoading}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>

                        <Card className="bg-muted/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                              Transaction Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <dl className="space-y-2">
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-muted-foreground">
                                  Package:
                                </dt>
                                <dd className="text-sm">
                                  {selectedPackage.name}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-muted-foreground">
                                  Amount:
                                </dt>
                                <dd className="text-sm">
                                  {formatCurrency(selectedPackage.price)}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-muted-foreground">
                                  Phone Number:
                                </dt>
                                <dd className="text-sm">
                                  {formatPhoneForDisplay(phoneNumber)}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-muted-foreground">
                                  Transaction ID:
                                </dt>
                                <dd className="font-mono text-xs">
                                  {checkoutRequestId}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-muted-foreground">
                                  Status:
                                </dt>
                                <dd className="text-sm flex items-center">
                                  <Clock className="h-3 w-3 text-amber-500 mr-1" />
                                  Pending
                                </dd>
                              </div>
                            </dl>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-medium mb-4">
                              M-Pesa Payment
                            </h3>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="phoneNumber">
                                  M-Pesa Phone Number
                                </Label>
                                <div className="flex">
                                  <div className="bg-muted flex items-center px-3 rounded-l-md border border-r-0 border-input">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <Input
                                    id="phoneNumber"
                                    placeholder="e.g. 0712345678"
                                    value={phoneNumber}
                                    onChange={handlePhoneNumberChange}
                                    className="rounded-l-none"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Enter the phone number registered with M-Pesa
                                </p>
                              </div>

                              <MpesaInstructions />
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-medium mb-4">
                              Order Summary
                            </h3>
                            <Card className="bg-muted/50">
                              <CardContent className="p-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm">
                                      {selectedPackage.name} Package
                                    </span>
                                    <span className="text-sm font-medium">
                                      {formatCurrency(selectedPackage.price)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm">Credits</span>
                                    <span className="text-sm">
                                      {selectedPackage.credits.toLocaleString()}
                                    </span>
                                  </div>
                                  {selectedPackage.originalCredits && (
                                    <div className="flex justify-between text-green-600">
                                      <span className="text-sm">
                                        Bonus Credits
                                      </span>
                                      <span className="text-sm">
                                        +
                                        {(
                                          selectedPackage.credits -
                                          selectedPackage.originalCredits
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  <Separator className="my-2" />
                                  <div className="flex justify-between font-medium">
                                    <span>Total</span>
                                    <span>
                                      {formatCurrency(selectedPackage.price)}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        <div className="flex justify-between mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setPurchaseStep("select")}
                          >
                            Back
                          </Button>
                          <Button
                            onClick={handleMpesaPayment}
                            disabled={
                              isLoading ||
                              !phoneNumber ||
                              phoneNumber.length < 9
                            }
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>Pay with M-Pesa</>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
