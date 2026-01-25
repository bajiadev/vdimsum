import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

const stripe = new Stripe(process.env.STRIPE_SECRET!, {
  apiVersion: "2025-12-15.clover",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const stripeWebhook = onRequest(
  {
    secrets: ["STRIPE_SECRET", "STRIPE_WEBHOOK_SECRET"],
    memory: "256MiB",
    timeoutSeconds: 30,
  },
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string | undefined;
    if (!sig) {
      res.status(400).send("Missing Stripe signature");
      return;
    }

    let event: Stripe.Event;
    try {
      const rawBody = Buffer.from(req.body as any); // raw body for signature
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          const orderRef = db.collection("orders").doc(orderId);
          await orderRef.update({
            status: "paid",
            stripePaymentIntentId: paymentIntent.id,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      res.status(200).send("Received");
    } catch (err: any) {
      console.error("Error processing webhook:", err.message);
      res.status(500).send();
    }
  }
);
