"use server";

import { initiateSTKPush, checkTransactionStatus } from "@/lib/mpesa";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// Initiate M-Pesa payment
export async function initiateMpesaPayment(
  phoneNumber: string,
  amount: number,
  userId: string,
  packageId: string,
  packageName: string
) {
  try {
    // Generate a unique reference number
    const reference = `CR${Date.now().toString().slice(-8)}`;

    // Initiate STK push
    const response = await initiateSTKPush(
      phoneNumber,
      amount,
      reference,
      `Purchase of ${packageName} credit package`
    );

    // Store the checkout request in the database for tracking
    if (response.CheckoutRequestID) {

      const { error } = await supabase.from("mpesa_transactions").insert({
        checkout_request_id: response.CheckoutRequestID,
        merchant_request_id: response.MerchantRequestID,
        user_id: userId,
        amount: amount,
        phone_number: phoneNumber,
        reference: reference,
        status: "pending",
        metadata: {
          package_id: packageId,
          package_name: packageName,
        },
      });

      if (error) {
        console.error("Error storing M-Pesa transaction:", error);
        throw new Error("Failed to store transaction details");
      }
    }

    return response;
  } catch (error) {
    console.error("Error initiating M-Pesa payment:", error);
    throw error;
  }
}

// Check payment status
export async function checkPaymentStatus(checkoutRequestId: string) {
  try {
    // Check status from M-Pesa API
    const response = await checkTransactionStatus(checkoutRequestId);

    // If successful, update the transaction and user credits
    if (response.ResultCode === 0) {
      // Get transaction details
      const { data: transaction, error: fetchError } = await supabase
        .from("mpesa_transactions")
        .select("*")
        .eq("checkout_request_id", checkoutRequestId)
        .single();

      if (fetchError || !transaction) {
        throw new Error("Transaction not found");
      }

      // Update transaction status
      const { error: updateError } = await supabase
        .from("mpesa_transactions")
        .update({
          status: "completed",
          mpesa_receipt_number: response.ResultDesc || "",
          completed_at: new Date().toISOString(),
        })
        .eq("checkout_request_id", checkoutRequestId);

      if (updateError) {
        throw new Error("Failed to update transaction status");
      }

      // Create credit transaction
      const { error: creditError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: transaction.user_id,
          amount: transaction.amount,
          type: "purchase",
          description: `Purchase via M-Pesa (${transaction.reference})`,
          reference_id: transaction.reference,
          metadata: {
            mpesa_checkout_id: checkoutRequestId,
            mpesa_receipt: response.ResultDesc || "",
            package_id: transaction.metadata.package_id,
            package_name: transaction.metadata.package_name,
          },
        });

      if (creditError) {
        throw new Error("Failed to create credit transaction");
      }

      // Update user balance
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("credit_balance")
        .eq("id", transaction.user_id)
        .single();

      if (userError) {
        throw new Error("Failed to fetch user data");
      }

      const newBalance = (userData.credit_balance || 0) + transaction.amount;

      const { error: balanceError } = await supabase
        .from("users")
        .update({ credit_balance: newBalance })
        .eq("id", transaction.user_id);

      if (balanceError) {
        throw new Error("Failed to update user balance");
      }

      // Revalidate the page to show updated data
      revalidatePath("/credits/purchase");

      return {
        success: true,
        status: "completed",
        balance: newBalance,
        receipt: response.ResultDesc || "",
      };
    }

    // If payment is still pending or failed
    return {
      success: response.ResultCode === 0,
      status: response.ResultCode === 0 ? "completed" : "failed",
      message: response.ResultDesc,
    };
  } catch (error) {
    console.error("Error checking payment status:", error);
    return {
      success: false,
      status: "error",
      message: "Failed to check payment status",
    };
  }
}

// Get user transactions
export async function getUserTransactions(userId: string) {
  try {
    const { data, error } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    throw new Error("Failed to fetch transaction history");
  }
}

// Get user balance
export async function getUserBalance(userId: string) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("credit_balance")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return data?.credit_balance || 0;
  } catch (error) {
    console.error("Error fetching user balance:", error);
    throw new Error("Failed to fetch user balance");
  }
}
