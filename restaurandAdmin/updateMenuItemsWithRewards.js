/*
  Script to update menu items with reward fields.
  This makes existing menu items redeemable with points.
  
  Usage:
    1) Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path.
    2) Edit the rewardUpdates array below with menu item IDs and their reward details.
    3) node restaurandAdmin/updateMenuItemsWithRewards.js
*/

const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// Edit these updates as needed
// Replace the menuItemId values with actual IDs from your menu collection
const rewardUpdates = [
  {
    menuItemId: "J7AXfs9bAjg4JKnUM8sC", // Replace with actual menu item ID
    is_redeemable: true,
    points_cost: 500, // 500 points = £5
    reward_stock: 50, // Optional: null or undefined for unlimited
  },
  // Add more menu items to make redeemable
  // {
  //   menuItemId: "another_menu_item_id",
  //   is_redeemable: true,
  //   points_cost: 300,
  //   reward_stock: 100,
  // },
];

async function updateMenuItemsWithRewards() {
  try {
    console.log(
      `Updating ${rewardUpdates.length} menu items with reward fields...`,
    );

    const batch = db.batch();

    for (const update of rewardUpdates) {
      const { menuItemId, ...rewardFields } = update;

      // Check if menu item exists
      const docRef = db.collection("menu").doc(menuItemId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        console.warn(`Menu item ${menuItemId} not found, skipping...`);
        continue;
      }

      // Update with reward fields
      batch.update(docRef, {
        ...rewardFields,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`  ✓ Queued update for ${docSnap.data().name || menuItemId}`);
    }

    await batch.commit();
    console.log(
      `\nSuccessfully updated ${rewardUpdates.length} menu items with reward fields!`,
    );
    console.log("\nThese menu items can now be:");
    console.log("  1. Purchased normally with money");
    console.log("  2. Redeemed with points (shown in rewards page)");
  } catch (error) {
    console.error("Error updating menu items:", error);
    process.exit(1);
  }
}

updateMenuItemsWithRewards().then(() => process.exit(0));
