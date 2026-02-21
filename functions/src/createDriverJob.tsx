import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();

export const createDriverJobOnOrderPaid = functions.firestore
  .document("orders/{orderId}")
  .onWrite(async (change, context) => {
    const after = change.after.data();
    if (!after) return;

    // Only create job if order is paid and not already assigned
    if (after.status === "paid" && !after.driverJobCreated) {
      const jobData = {
        orderId: context.params.orderId,
        shopId: after.shopId,
        userId: after.userId,
        deliveryAddress: after.deliveryAddress,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "pending",
        // ...add any other info needed by the driver
      };
      await admin.firestore().collection("driverJobs").add(jobData);
      // Optionally mark order as job created to avoid duplicates
      await change.after.ref.update({ driverJobCreated: true });
    }
  });