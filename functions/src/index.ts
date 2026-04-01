import admin from "firebase-admin";
import * as functions from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { onCall } from "firebase-functions/v2/https";
import Stripe from "stripe";
admin.initializeApp();
const db = admin.firestore();

// Create Stripe instance using secret injected by Firebase
const STRIPE_SECRET = defineSecret("STRIPE_SECRET");

// Helper: calculate total from order items in Firestore
async function calculateTotal(
  orderItems: { id: string; quantity: number; unitPrice?: number }[],
) {
  let total = 0;

  for (const item of orderItems) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Invalid quantity for item ${item.id}`,
      );
    }

    let price = item.unitPrice;

    if (typeof price !== "number") {
      const doc = await db.collection("menu").doc(item.id).get();
      if (!doc.exists)
        throw new functions.https.HttpsError(
          "not-found",
          `Item ${item.id} not found`,
        );

      price = doc.data()?.price; // price in pence (e.g., 1250 = £12.50)
    }

    if (typeof price !== "number" || !Number.isFinite(price) || price < 0)
      throw new functions.https.HttpsError(
        "internal",
        `Invalid price for item ${item.id}`,
      );

    total += price * item.quantity;
  }

  return total;
}

async function calculatePercentageThresholdDiscount(subtotal: number) {
  const now = admin.firestore.Timestamp.now();
  const offersSnap = await db
    .collection("offers")
    .where("is_active", "==", true)
    .get();

  let bestDiscountAmount = 0;
  const nowMs = now.toDate().getTime();

  const normalizeString = (value: unknown) =>
    typeof value === "string" ? value.trim().toLowerCase() : "";
  const toFiniteNumber = (value: unknown): number => {
    if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
    if (typeof value === "bigint") return Number(value);
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : NaN;
    }

    const maybeObj = value as
      | { toNumber?: () => number; toString?: () => string }
      | undefined;
    if (maybeObj && typeof maybeObj.toNumber === "function") {
      const fromToNumber = maybeObj.toNumber();
      return Number.isFinite(fromToNumber) ? fromToNumber : NaN;
    }

    if (maybeObj && typeof maybeObj.toString === "function") {
      const fromToString = Number(maybeObj.toString());
      return Number.isFinite(fromToString) ? fromToString : NaN;
    }

    return NaN;
  };

  for (const offerDoc of offersSnap.docs) {
    const offer = offerDoc.data() as any;
    const appliesTo = normalizeString(offer.applies_to);
    const discountType = normalizeString(offer.discount_type);

    if (appliesTo !== "order" || discountType !== "percentage_threshold") {
      continue;
    }

    const startAtRaw = offer.startAt ?? offer.start_at ?? null;
    const endAtRaw = offer.endAt ?? offer.end_at ?? null;

    const startAtMs =
      typeof startAtRaw?.toDate === "function"
        ? startAtRaw.toDate().getTime()
        : startAtRaw instanceof Date
          ? startAtRaw.getTime()
          : null;
    const endAtMs =
      typeof endAtRaw?.toDate === "function"
        ? endAtRaw.toDate().getTime()
        : endAtRaw instanceof Date
          ? endAtRaw.getTime()
          : null;

    if (startAtMs !== null && startAtMs > nowMs) {
      continue;
    }

    if (endAtMs !== null && endAtMs < nowMs) {
      continue;
    }

    const rawThreshold =
      offer.threshold_amount_pence ?? offer.threshold_amount ?? NaN;
    const thresholdAmountRaw = toFiniteNumber(rawThreshold);
    const thresholdAmount =
      Number.isFinite(thresholdAmountRaw) && thresholdAmountRaw > 0
        ? thresholdAmountRaw <= 100
          ? Math.round(thresholdAmountRaw * 100)
          : Math.round(thresholdAmountRaw)
        : NaN;
    const percentOff = toFiniteNumber(
      offer.percentage_off ?? offer.percent_off ?? offer.off_percent ?? NaN,
    );

    if (!Number.isFinite(thresholdAmount) || !Number.isFinite(percentOff)) {
      continue;
    }

    if (percentOff <= 0 || thresholdAmount <= 0) {
      continue;
    }

    if (subtotal < thresholdAmount) {
      continue;
    }

    const discountAmount = Math.floor(subtotal * (percentOff / 100));
    if (discountAmount > bestDiscountAmount) {
      bestDiscountAmount = discountAmount;
    }
  }

  return bestDiscountAmount;
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
      const { orderItems, orderId } = request.data;

      // Validate orderItems
      if (!orderItems || !Array.isArray(orderItems)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          `orderItems must be an array. Received: ${typeof orderItems}`,
        );
      }

      if (orderItems.length === 0) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "orderItems cannot be empty",
        );
      }

      if (!orderId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "orderId is required",
        );
      }

      console.log("Received orderItems:", orderItems, "orderId:", orderId);
      const subtotal = await calculateTotal(orderItems);
      const orderLevelDiscount =
        await calculatePercentageThresholdDiscount(subtotal);
      const amount = Math.max(subtotal - orderLevelDiscount, 0);

      console.log("Calculated subtotal:", subtotal);
      console.log("Calculated order discount:", orderLevelDiscount);
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
        error.message || "Unknown error in payment intent creation",
      );
    }
  },
);
