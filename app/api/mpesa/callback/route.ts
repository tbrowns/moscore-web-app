import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Parse the callback data
    const callbackData = await request.json()

    console.log("M-Pesa callback received:", callbackData)

    // Extract the relevant information
    const { Body } = callbackData

    if (!Body || !Body.stkCallback) {
      return NextResponse.json({ success: false, message: "Invalid callback data" }, { status: 400 })
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = Body.stkCallback

    // Find the transaction in our database
    const { data: transaction, error: fetchError } = await supabase
      .from("mpesa_transactions")
      .select("*")
      .eq("checkout_request_id", CheckoutRequestID)
      .single()

    if (fetchError || !transaction) {
      console.error("Transaction not found:", CheckoutRequestID)
      return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 })
    }

    // Update the transaction status
    const status = ResultCode === 0 ? "completed" : "failed"

    const { error: updateError } = await supabase
      .from("mpesa_transactions")
      .update({
        status,
        result_code: ResultCode,
        result_description: ResultDesc,
        completed_at: ResultCode === 0 ? new Date().toISOString() : null,
        callback_data: callbackData,
      })
      .eq("checkout_request_id", CheckoutRequestID)

    if (updateError) {
      console.error("Error updating transaction:", updateError)
      return NextResponse.json({ success: false, message: "Error updating transaction" }, { status: 500 })
    }

    // If payment was successful, create a credit transaction and update user balance
    if (ResultCode === 0) {
      // Create credit transaction
      const { error: creditError } = await supabase.from("credit_transactions").insert({
        user_id: transaction.user_id,
        amount: transaction.amount,
        type: "purchase",
        description: `Purchase via M-Pesa (${transaction.reference})`,
        reference_id: transaction.reference,
        metadata: {
          mpesa_checkout_id: CheckoutRequestID,
          mpesa_receipt: ResultDesc,
          package_id: transaction.metadata.package_id,
          package_name: transaction.metadata.package_name,
        },
      })

      if (creditError) {
        console.error("Error creating credit transaction:", creditError)
        return NextResponse.json({ success: false, message: "Error creating credit transaction" }, { status: 500 })
      }

      // Update user balance
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("credit_balance")
        .eq("id", transaction.user_id)
        .single()

      if (userError) {
        console.error("Error fetching user data:", userError)
        return NextResponse.json({ success: false, message: "Error fetching user data" }, { status: 500 })
      }

      const newBalance = (userData.credit_balance || 0) + transaction.amount

      const { error: balanceError } = await supabase
        .from("users")
        .update({ credit_balance: newBalance })
        .eq("id", transaction.user_id)

      if (balanceError) {
        console.error("Error updating user balance:", balanceError)
        return NextResponse.json({ success: false, message: "Error updating user balance" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing M-Pesa callback:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

