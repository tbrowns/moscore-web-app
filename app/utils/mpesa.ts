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

export async function initiateSTKPush(phoneNumber: string, amount: number) {
  try {
    const accessToken = await getAccessToken();
    const password = process.env.MPESA_PASSWORD;

    if (!password) {
      throw new Error("MPESA_PASSKEY");
    }

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
          PartyA: "254794687383",
          PartyB: "174379",
          PhoneNumber: "254794687383",
          CallBackURL: "https://mydomain.com/pat",
          AccountReference: "Test",
          TransactionDesc: "Test",
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
