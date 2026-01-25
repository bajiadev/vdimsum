import * as functions from "firebase-functions";
import admin from "firebase-admin";
import Stripe from "stripe";
import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
admin.initializeApp();
const db = admin.firestore();

// Create Stripe instance using secret injected by Firebase
const STRIPE_SECRET = defineSecret("STRIPE_SECRET");

// Helper: calculate total from cart items in Firestore
async function calculateTotal(cartItems: { id: string; quantity: number }[]) {
  let total = 0;

  for (const item of cartItems) {
    const doc = await db.collection("menu").doc(item.id).get();
    if (!doc.exists)
      throw new functions.https.HttpsError(
        "not-found",
        `Item ${item.id} not found`,
      );

    const price = doc.data()?.price; // price in pence (e.g., 1250 = £12.50)
    if (typeof price !== "number")
      throw new functions.https.HttpsError(
        "internal",
        `Invalid price for item ${item.id}`,
      );

    total += price * item.quantity;
  }

  return total;
}

// Main function: create Stripe PaymentIntent
export const createPaymentIntent = onCall(
  { secrets: [STRIPE_SECRET], memory: "256MiB", timeoutSeconds: 30 },
  async (request) => {
    try {
      console.log("createPaymentIntent called with data:", request.data);
      const stripe = new Stripe(STRIPE_SECRET.value(), {
        apiVersion: "2025-12-15.clover",
      });
      const { cartItems, orderId } = request.data;
      console.log("Received cartItems:", cartItems, "orderId:", orderId);
      const amount = await calculateTotal(cartItems);
      console.log("Calculated total amount:", amount);
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "gbp",
        automatic_payment_methods: { enabled: true },
        metadata: { orderId },
      });

      return { clientSecret: paymentIntent.client_secret };
    } catch (error: any) {
      console.error("Error in createPaymentIntent:", error);
      throw new functions.https.HttpsError(
        "internal",
        error.message || "Unknown error in payment intent creation");
    }
  },
);
