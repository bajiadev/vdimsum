import {
  CreateUserParams,
  GetMenuParams,
  Order,
  OrderItem,
  OrderItemType,
  PointTransaction,
  RedeemableItem,
  SignInParams,
} from "@/type";
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
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

import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { useOrdersStore } from "@/store/orders.store";
import useShopStore from "@/store/shop.store";
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

    // Use UID as document ID for easy lookup
    await setDoc(doc(db, "users", user.uid), {
      email,
      name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
      createdAt: Timestamp.now(),
      points: 0,
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

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) return null;

    return { id: user.uid, ...userDoc.data() };
  } catch (e: any) {
    throw new Error(e.message);
  }
};

export const updateUserProfile = async (
  userId: string,
  data: {
    name?: string;
    phone?: string;
    addressLine1?: string;
    city?: string;
    postcode?: string;
    country?: string;
  },
) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const payload = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", userId), payload, { merge: true });
  } catch (e: any) {
    throw new Error(e.message || "Failed to update user profile");
  }
};

export const updateUserPrivacySettings = async (
  userId: string,
  data: {
    shareUsageData?: boolean;
    saveOrderHistory?: boolean;
    useLocation?: boolean;
    locationPermissionStatus?: "granted" | "denied" | "undetermined";
  },
) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    await setDoc(
      doc(db, "users", userId),
      {
        privacySettings: data,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (e: any) {
    throw new Error(e.message || "Failed to update privacy settings");
  }
};

/* -------------------------------------------------------------------------- */
/*                                   MENU                                     */
/* -------------------------------------------------------------------------- */

export const getMenu = async ({
  categoryId,
  categoryName,
  query: search,
}: GetMenuParams) => {
  try {
    let qRef = collection(db, "menu");
    const conditions = [];

    if (categoryId) {
      conditions.push(where("category_ids", "array-contains", categoryId));
    } else if (categoryName) {
      conditions.push(where("category_names", "array-contains", categoryName));
    }
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
    const q = query(collection(db, "categories"), orderBy("order", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        image_url: data.image_url ?? data.imageUrl ?? data.image,
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
  userId: string,
  orderItems: OrderItemType[],
  totalAmount: number,
) => {
  const { shopId, shopName, shopAddress, orderType } = useShopStore.getState();
  console.log(
    "createOrder shopId:",
    shopId,
    "shopName:",
    shopName,
    "shopAddress:",
    shopAddress,
    "orderType:",
    orderType,
  );
  const batch = writeBatch(db);
  const orderRef = doc(collection(db, "orders"));
  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, "");
  const shortId = orderRef.id.slice(0, 6).toUpperCase();
  const orderNumber = `${dateStr}-${shortId}`;
  batch.set(orderRef, {
    userId,
    orderNumber,
    shopId: shopId || null,
    shopName: shopName || null,
    shopAddress: shopAddress || null,
    orderType: orderType || null,
    itemCount,
    amount: totalAmount,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  orderItems.forEach((item) => {
    const itemRef = doc(collection(orderRef, "orderItems"));
    batch.set(itemRef, {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image_url,
      customizations: item.customizations || [],
      isRewardRedemption: item.isRewardRedemption || false,
      rewardPointsCost: item.rewardPointsCost || 0,
      redemptionId: item.redemptionId || null,
    });
  });
  await batch.commit();
  return orderRef.id;
};

/**
 * Mark order as paid and award points to user.
 */
export const markOrderAsPaid = async (orderId: string, userId: string) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("Order not found");
    }

    const orderData = orderSnap.data();
    const rawAmount = orderData.amount;
    const totalAmount =
      typeof rawAmount === "number" ? rawAmount : Number(rawAmount);

    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      throw new Error(`Invalid order amount: ${rawAmount}`);
    }

    const batch = writeBatch(db);
    batch.update(orderRef, {
      status: "paid",
      paidAt: serverTimestamp(),
    });

    await batch.commit();

    // Award points after order is marked as paid
    await awardPointsOnOrder(userId, orderId, totalAmount);
  } catch (e: any) {
    throw new Error(e.message);
  }
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

export const getOrderDetails = async (
  orderId: string,
): Promise<OrderItem[]> => {
  const itemsSnap = await getDocs(
    collection(db, "orders", orderId, "orderItems"),
  );

  return itemsSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<OrderItem, "id">),
  }));
};

export const getShops = async () => {
  try {
    const snap = await getDocs(collection(db, "shops"));
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e: any) {
    throw new Error(e.message);
  }
};

export const getShopInfo = async (shopId: string) => {
  try {
    const shopDoc = await getDoc(doc(db, "shops", shopId));

    if (!shopDoc.exists()) {
      throw new Error("Shop info not found");
    }

    return shopDoc.data();
  } catch (error: any) {
    throw new Error(error.message || "Failed to retrieve shop info");
  }
};

// Update shop info
export const updateShopInfo = async (data: any) => {
  try {
    const {
      name,
      description,
      phone,
      email,
      address,
      openingHours,
      location,
      imageUrl,
    } = data;

    // Validate required fields
    if (!name) {
      throw new Error("Shop name is required");
    }

    const updateData: any = {
      name,
      description: description || "",
      phone: phone || "",
      email: email || "",
      updatedAt: serverTimestamp(),
    };

    if (address) updateData.address = address;
    if (openingHours) updateData.openingHours = openingHours;
    if (location) updateData.location = location;
    if (imageUrl) updateData.imageUrl = imageUrl;

    await setDoc(doc(db, "shops", "main"), updateData, { merge: true });

    return {
      success: true,
      message: "Shop info updated successfully",
    };
  } catch (error: any) {
    throw new Error(error.message || "Failed to update shop info");
  }
};

/* -------------------------------------------------------------------------- */
/*                                POINTS                                      */
/* -------------------------------------------------------------------------- */

/**
 * Award points on order completion.
 * 1 point = £0.01 (or 1 point per pence).
 * Points expire in 1 year.
 */
export const awardPointsOnOrder = async (
  userId: string,
  orderId: string,
  totalAmountPence: number,
) => {
  try {
    const normalizedPence = Number.isInteger(totalAmountPence)
      ? totalAmountPence
      : Math.round(totalAmountPence * 100);

    const points = Math.max(0, Math.round(normalizedPence));

    if (points <= 0) return;

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const userDocRef = doc(db, "users", userId);
    const transRef = collection(userDocRef, "pointTransactions");

    const batch = writeBatch(db);
    const newTransRef = doc(transRef);
    batch.set(newTransRef, {
      userId,
      type: "earn",
      amount: points,
      description: `Earned on order ${orderId}`,
      orderId,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: Timestamp.now(),
    });
    batch.set(
      userDocRef,
      {
        points: increment(points),
        lastPointsUpdate: serverTimestamp(),
      },
      { merge: true },
    );

    await batch.commit();
  } catch (e: any) {
    throw new Error(e.message);
  }
};

/**
 * Get user's current points balance.
 */
export const getUserPoints = async (userId: string) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) return 0;

    const points = userSnap.data()?.points;
    return typeof points === "number" && Number.isFinite(points) ? points : 0;
  } catch (e: any) {
    throw new Error(e.message);
  }
};

/**
 * Redeem points for a discount.
 * Deducts from available points and records transaction.
 */
export const redeemPoints = async (
  userId: string,
  pointsToRedeem: number,
  description: string = "Redeemed for discount",
) => {
  try {
    const availablePoints = await getUserPoints(userId);

    if (availablePoints < pointsToRedeem) {
      throw new Error("Insufficient points");
    }

    const userDocRef = doc(db, "users", userId);
    const transRef = collection(userDocRef, "pointTransactions");

    const batch = writeBatch(db);
    const newTransRef = doc(transRef);
    batch.set(newTransRef, {
      userId,
      type: "redeem",
      amount: pointsToRedeem,
      description,
      expiresAt: Timestamp.fromDate(
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      ),
      createdAt: Timestamp.now(),
    });
    batch.set(
      userDocRef,
      {
        points: increment(-pointsToRedeem),
        lastPointsUpdate: serverTimestamp(),
      },
      { merge: true },
    );

    await batch.commit();
  } catch (e: any) {
    throw new Error(e.message);
  }
};

/**
 * Get point transaction history.
 */
export const getPointTransactions = async (userId: string, limit = 50) => {
  try {
    const userDocRef = doc(db, "users", userId);

    const transQuery = query(
      collection(userDocRef, "pointTransactions"),
      orderBy("createdAt", "desc"),
    );

    const snap = await getDocs(transQuery);
    return snap.docs
      .slice(0, limit)
      .map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e: any) {
    throw new Error(e.message);
  }
};

/* -------------------------------------------------------------------------- */
/*                           REDEEMABLE ITEMS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Get all available redeemable menu items.
 */
export const getRedeemableItems = async (): Promise<RedeemableItem[]> => {
  try {
    const q = query(
      collection(db, "menu"),
      where("is_available", "==", true),
      where("is_redeemable", "==", true),
      orderBy("points_cost", "asc"),
    );

    const snap = await getDocs(q);
    return snap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as RedeemableItem,
    );
  } catch (e: any) {
    throw new Error(e.message);
  }
};

/**
 * Redeem an item using points.
 * Creates a redemption order for collection.
 */
export const redeemItem = async (
  userId: string,
  itemId: string,
  quantity: number = 1,
) => {
  try {
    // Get item details
    const itemDoc = await getDoc(doc(db, "menu", itemId));

    if (!itemDoc.exists()) {
      throw new Error("Menu item not found");
    }

    const item = itemDoc.data() as RedeemableItem;

    if (!item.is_available) {
      throw new Error("Item is not available");
    }

    if (!item.is_redeemable) {
      throw new Error("Item is not redeemable");
    }

    const totalPoints = (item.points_cost || 0) * quantity;

    // Check if user has enough points
    const userPoints = await getUserPoints(userId);

    if (userPoints < totalPoints) {
      throw new Error(
        `Insufficient points. Need ${totalPoints}, have ${userPoints}`,
      );
    }

    // Check stock if applicable
    if (item.reward_stock !== undefined && item.reward_stock < quantity) {
      throw new Error("Insufficient stock");
    }

    // Create redemption order
    const batch = writeBatch(db);
    const redemptionRef = doc(collection(db, "redemptions"));

    batch.set(redemptionRef, {
      userId,
      itemId,
      itemName: item.name,
      pointsCost: item.points_cost,
      quantity,
      totalPoints,
      status: "pending_collection",
      createdAt: serverTimestamp(),
    });

    // Deduct points
    await redeemPoints(
      userId,
      totalPoints,
      `Redeemed ${quantity}x ${item.name}`,
    );

    // Update stock if tracked
    if (item.reward_stock !== undefined) {
      const itemRef = doc(db, "menu", itemId);
      batch.update(itemRef, {
        reward_stock: increment(-quantity),
      });
    }

    await batch.commit();

    return redemptionRef.id;
  } catch (e: any) {
    throw new Error(e.message);
  }
};

/**
 * Cancel a pending redemption and refund points.
 */
export const cancelRedemption = async (
  userId: string,
  redemptionId: string,
) => {
  try {
    const redemptionRef = doc(db, "redemptions", redemptionId);
    const redemptionSnap = await getDoc(redemptionRef);

    if (!redemptionSnap.exists()) {
      throw new Error("Redemption not found");
    }

    const redemption = redemptionSnap.data() as {
      userId: string;
      itemId: string;
      itemName?: string;
      quantity?: number;
      totalPoints?: number;
      status?: string;
    };

    if (redemption.userId !== userId) {
      throw new Error("Unauthorized redemption cancellation");
    }

    if (redemption.status !== "pending_collection") {
      throw new Error("Redemption cannot be cancelled");
    }

    const pointsToRefund = Number(redemption.totalPoints || 0);
    const quantity = Number(redemption.quantity || 0);

    if (!Number.isFinite(pointsToRefund) || pointsToRefund <= 0) {
      throw new Error("Invalid redemption points");
    }

    const userDocRef = doc(db, "users", userId);
    const transRef = collection(userDocRef, "pointTransactions");

    const batch = writeBatch(db);

    batch.update(redemptionRef, {
      status: "cancelled",
      cancelledAt: serverTimestamp(),
    });

    const refundTransRef = doc(transRef);
    batch.set(refundTransRef, {
      userId,
      type: "earn",
      amount: pointsToRefund,
      description: `Refund for cancelled redemption${redemption.itemName ? `: ${redemption.itemName}` : ""}`,
      expiresAt: Timestamp.fromDate(
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      ),
      createdAt: Timestamp.now(),
    });

    batch.set(
      userDocRef,
      {
        points: increment(pointsToRefund),
        lastPointsUpdate: serverTimestamp(),
      },
      { merge: true },
    );

    if (redemption.itemId && Number.isFinite(quantity) && quantity > 0) {
      batch.update(doc(db, "menu", redemption.itemId), {
        reward_stock: increment(quantity),
      });
    }

    await batch.commit();
  } catch (e: any) {
    throw new Error(e.message || "Failed to cancel redemption");
  }
};

/**
 * Get user's redemption history.
 */
export const getUserRedemptions = async (userId: string) => {
  try {
    const q = query(
      collection(db, "redemptions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );

    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e: any) {
    throw new Error(e.message);
  }
};
