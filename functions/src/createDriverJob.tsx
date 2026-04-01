import admin from "firebase-admin";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export const createDriverJobOnOrderPaid = onDocumentWritten(
  "orders/{orderId}",
  async (event) => {
    const after = event.data?.after?.data() as
      | admin.firestore.DocumentData
      | undefined;

    if (!after) return;

    if (after.status === "paid" && !after.driverJobCreated) {
      const jobData = {
        orderId: event.params.orderId,
        shopId: after.shopId,
        userId: after.userId,
        deliveryAddress: after.deliveryAddress,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "pending",
      };

      await db.collection("driverJobs").add(jobData);
      await event.data?.after?.ref.update({ driverJobCreated: true });
    }
  },
);
