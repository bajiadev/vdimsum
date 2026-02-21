/*
  Script to add redeemable items to Firestore.
  Usage:
    1) Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path.
    2) Edit the items array below with your redeemable items.
    3) node restaurandAdmin/addRedeemableItems.js
*/

const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// Edit these items as needed
const redeemableItems = [
  {
    name: "Free Coffee",
    pointsCost: 500,
    description: "Redeem for one free regular coffee (collection only)",
    image_url: "https://via.placeholder.com/150",
    is_available: true,
    collection_only: true,
    stock: 50,
  },
  {
    name: "Free Pastry",
    pointsCost: 300,
    description: "Choose any pastry from our selection (collection only)",
    image_url: "https://via.placeholder.com/150",
    is_available: true,
    collection_only: true,
    stock: 100,
  },
  {
    name: "£5 Off Voucher",
    pointsCost: 500,
    description: "£5 discount on your next order (collection only)",
    image_url: "https://via.placeholder.com/150",
    is_available: true,
    collection_only: true,
    stock: null, // unlimited
  },
  {
    name: "Free Meal Deal",
    pointsCost: 1000,
    description: "Main dish + drink + side (collection only)",
    image_url: "https://via.placeholder.com/150",
    is_available: true,
    collection_only: true,
    stock: 20,
  },
];

async function addRedeemableItems() {
  try {
    console.log(`Adding ${redeemableItems.length} redeemable items...`);

    const batch = db.batch();

    for (const item of redeemableItems) {
      const docRef = db.collection("redeemableItems").doc();
      batch.set(docRef, {
        ...item,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(
      `Successfully added ${redeemableItems.length} redeemable items!`,
    );
  } catch (error) {
    console.error("Error adding items:", error);
    process.exit(1);
  }
}

addRedeemableItems().then(() => process.exit(0));
