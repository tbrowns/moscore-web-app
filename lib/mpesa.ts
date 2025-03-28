import axios from "axios";

// M-Pesa API endpoints
const MPESA_AUTH_URL =
  "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
const MPESA_STK_PUSH_URL =
  "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

// M-Pesa credentials from environment variables
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || "";
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || "";
const SHORTCODE = "174379";
const PASSKEY = process.env.MPESA_PASSKEY || "";
const CALLBACK_URL = "https://mydomain.com/pat";

// Get OAuth token
export async function getMpesaToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString(
      "base64"
    );
    const response = await axios.get(MPESA_AUTH_URL, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting M-Pesa token:", error);
    throw new Error("Failed to get M-Pesa authentication token");
  }
}

// Initiate STK Push
// export async function initiateSTKPush(
//   phoneNumber: string,
//   amount: number,
//   accountReference: string,
//   transactionDesc: string
// ): Promise<any> {
//   try {
//     // Format phone number (remove leading 0 or +254 and add 254)
//     const formattedPhone = phoneNumber.replace(/^(0|\+254)/, "254");

//     // Get timestamp in the format YYYYMMDDHHmmss
//     const timestamp = new Date()
//       .toISOString()
//       .replace(/[-T:.Z]/g, "")
//       .slice(0, 14);

//     // Generate password (base64 of shortcode + passkey + timestamp)
//     const password =
//       "MTc0Mzc5YmZiMjc5ZjlhYTliZGJjZjE1OGU5N2RkNzFhNDY3Y2QyZTBjODkzMDU5YjEwZjc4ZTZiNzJhZGExZWQyYzkxOTIwMTYwMjE2MTY1NjI3";

//     // Get access token
//     const token = await getMpesaToken();

//     // Prepare request body
//     const requestBody = {
//       BusinessShortCode: SHORTCODE,
//       Password: password,
//       Timestamp: timestamp,
//       TransactionType: "CustomerPayBillOnline",
//       Amount: Math.round(amount), // M-Pesa requires whole numbers
//       PartyA: formattedPhone,
//       PartyB: SHORTCODE,
//       PhoneNumber: formattedPhone,
//       CallBackURL: CALLBACK_URL,
//       AccountReference: accountReference,
//       TransactionDesc: transactionDesc,
//     };

//     // Make API request
//     const response = await axios.post(MPESA_STK_PUSH_URL, requestBody, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     return response.data;
//   } catch (error) {
//     console.error("Error initiating STK push:", error);
//     throw new Error("Failed to initiate M-Pesa payment");
//   }
// }

export async function getAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error(
      "MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET is not defined"
    );
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
  );

  const response = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${data.errorMessage}`);
  }

  return data.access_token;
}

export async function initiateSTKPush(
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
) {
  try {
    const accessToken = await getAccessToken();
    const formattedPhone = phoneNumber.replace(/^(0|\+254)/, "254");

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, -3);

    const response = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: "174379",
          Password:
            "MTc0Mzc5YmZiMjc5ZjlhYTliZGJjZjE1OGU5N2RkNzFhNDY3Y2QyZTBjODkzMDU5YjEwZjc4ZTZiNzJhZGExZWQyYzkxOTIwMTYwMjE2MTY1NjI3",
          Timestamp: "20160216165627",
          TransactionType: "CustomerPayBillOnline",
          Amount: "1",
          PartyA: formattedPhone,
          PartyB: "174379",
          PhoneNumber: formattedPhone,
          CallBackURL: "https://mydomain.com/pat",
          AccountReference: accountReference,
          TransactionDesc: transactionDesc,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("STK Push API Error:", data);
      throw new Error(`Failed to initiate STK push: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    console.error("STK Push Error:", error);
    throw error;
  }
}

// Check transaction status
export async function checkTransactionStatus(
  checkoutRequestID: string
): Promise<any> {
  try {
    const token = await getMpesaToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString(
      "base64"
    );

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
      {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error checking transaction status:", error);
    throw new Error("Failed to check M-Pesa transaction status");
  }
}
