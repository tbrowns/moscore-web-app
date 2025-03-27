"use server"

import { initiateSTKPush } from "../utils/mpesa"

export async function handleSTKPush(phoneNumber: string, amount: string) {
  try {
    const result = await initiateSTKPush(phoneNumber, Number.parseInt(amount, 10))
    return { success: true, data: result }
  } catch (error) {
    console.error("STK Push error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

