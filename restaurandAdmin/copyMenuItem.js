/*
  One-off: clone a Firestore menu item 10 times.
  Usage:
    1) Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path.
       Example (Windows):
         set GOOGLE_APPLICATION_CREDENTIALS=takeaway-app-e4220-firebase-adminsdk-fbsvc-7c88fd2649.json
    2) node restaurandAdmin/copyMenuItem.js
// Check if GOOGLE_APPLICATION_CREDENTIALS is set
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("GOOGLE_APPLICATION_CREDENTIALS environment variable not set.\nPlease set it to takeaway-app-e4220-firebase-adminsdk-fbsvc-7c88fd2649.json in your project root.");
  process.exit(1);
}
*/

const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  const serviceAccount = require("../takeaway-app-e4220-firebase-adminsdk-fbsvc-7c88fd2649.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const SOURCE_DOC_ID = "VeEokOtzxatAkaceBhY9";
const COLLECTION_PATH = "menu";
const COPIES = 6;

async function run() {
  const sourceRef = db.collection(COLLECTION_PATH).doc(SOURCE_DOC_ID);
  const snap = await sourceRef.get();

  if (!snap.exists) {
    throw new Error(
      `Source doc not found: ${COLLECTION_PATH}/${SOURCE_DOC_ID}`,
    );
  }

  const data = snap.data();

  const batch = db.batch();

  for (let i = 0; i < COPIES; i += 1) {
    const newRef = db.collection(COLLECTION_PATH).doc();
    batch.set(newRef, data);
  }

  await batch.commit();
  console.log(
    `Created ${COPIES} copies of ${COLLECTION_PATH}/${SOURCE_DOC_ID}`,
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
