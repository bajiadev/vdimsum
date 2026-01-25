import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  writeBatch,
  doc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage } from "firebase/storage";
import {
  CreateUserParams,
  GetMenuParams,
  SignInParams,
  CartItemType,
  Order,
} from "@/type";
//import { getReactNativePersistence } from "firebase/auth/react-native";

/* -------------------------------------------------------------------------- */
/*                               CONFIGURATION                                */
/* -------------------------------------------------------------------------- */

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

export const app = initializeApp(firebaseConfig);

export const cloudFunctions = getFunctions(app);

// if (__DEV__) {
//   connectFunctionsEmulator(cloudFunctions, "localhost", 5001);
// }

import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
/* -------------------------------------------------------------------------- */
/*                                  SERVICES                                  */
/* -------------------------------------------------------------------------- */

//export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/* -------------------------------------------------------------------------- */
/*                                   AUTH                                     */
/* -------------------------------------------------------------------------- */

export const createUser = async ({
  email,
  password,
  name,
}: CreateUserParams) => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    const user = cred.user;

    await addDoc(collection(db, "users"), {
      uid: user.uid,
      email,
      name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
      createdAt: Timestamp.now(),
    });

    return user;
  } catch (e: any) {
    throw new Error(e.message);
  }
};

export const signIn = async ({ email, password }: SignInParams) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e: any) {
    throw new Error(e.message);
  }
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};

export const getCurrentUser = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const q = query(collection(db, "users"), where("uid", "==", user.uid));

    const snap = await getDocs(q);
    return snap.docs[0]?.data();
  } catch (e: any) {
    throw new Error(e.message);
  }
};

/* -------------------------------------------------------------------------- */
/*                                   MENU                                     */
/* -------------------------------------------------------------------------- */

export const getMenu = async ({ category, query: search }: GetMenuParams) => {
  try {
    let qRef = collection(db, "menu");
    const conditions = [];

    if (category) conditions.push(where("category", "==", category));
    if (search) conditions.push(where("keywords", "array-contains", search));

    const q = conditions.length ? query(qRef, ...conditions) : qRef;

    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e: any) {
    throw new Error(e.message);
  }
};

export const getCategories = async () => {
  try {
    const snap = await getDocs(collection(db, "categories"));
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
      };
    });
  } catch (e: any) {
    throw new Error(e.message);
  }
};

/* -------------------------------------------------------------------------- */
/*                                   OFFERS                                   */
/* -------------------------------------------------------------------------- */

export const getOffers = async () => {
  try {
    const now = Timestamp.now();

    const q = query(
      collection(db, "offers"),
      where("is_active", "==", true),
      where("startAt", "<=", now),
      where("endAt", ">=", now),
    );

    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e: any) {
    throw new Error(e.message);
  }
};

/* -------------------------------------------------------------------------- */
/*                              FEATURED MENU                                 */
/* -------------------------------------------------------------------------- */

export const getFeaturedMenuItems = async () => {
  try {
    const q = query(collection(db, "menu"), where("isFeatured", "==", true));

    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e: any) {
    throw new Error(e.message);
  }
};

/* -------------------------------------------------------------------------- */
/*                              ORDER                                         */
/* -------------------------------------------------------------------------- */

export const createOrder = async (
  cartItems: CartItemType[],
  totalAmount: number,
) => {
  if (!auth.currentUser) {
    throw new Error("User not logged in");
  }

  const userId = auth.currentUser.uid;

  const batch = writeBatch(db);

  const orderRef = doc(collection(db, "orders"));

  batch.set(orderRef, {
    userId,
    totalAmount,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  cartItems.forEach((item) => {
    const itemRef = doc(collection(orderRef, "order_items"));
    batch.set(itemRef, {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      customizations: item.customizations ?? [],
    });
  });

  await batch.commit();

  return orderRef.id;
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );

  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Order, "id">),
  }));
};

export const getOrderDetails = async (orderId: string) => {
  const itemsSnap = await getDocs(
    collection(db, "orders", orderId, "order_items"),
  );

  return itemsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
