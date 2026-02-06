// import { CartCustomization, CartStore, CartItemType } from "@/type";
// import { create } from "zustand";
// import { persist } from "zustand/middleware";

// function areCustomizationsEqual(
//   a: CartCustomization[] = [],
//   b: CartCustomization[] = [],
// ): boolean {
//   if (a.length !== b.length) return false;

//   const aSorted = [...a].sort((x, y) => x.id.localeCompare(y.id));
//   const bSorted = [...b].sort((x, y) => x.id.localeCompare(y.id));

//   return aSorted.every((item, idx) => item.id === bSorted[idx].id);
// }

// export const useCartStore = create<CartStore>()(
//   persist(
//     (set, get) => ({
//       items: [],

//       addItem: (item, quantity = 1) => {
//         const customizations = item.customizations ?? [];

//         const existing = get().items.find(
//           (i) =>
//             i.id === item.id &&
//             areCustomizationsEqual(i.customizations ?? [], customizations),
//         );

//         if (existing) {
//           set({
//             items: get().items.map((i) =>
//               i.id === item.id &&
//               areCustomizationsEqual(i.customizations ?? [], customizations)
//                 ? { ...i, quantity: i.quantity + quantity }
//                 : i,
//             ),
//           });
//         } else {
//           const cartItem: CartItemType = {
//             id: item.id,
//             name: item.name,
//             price: item.price,
//             image_url: item.image_url,
//             quantity,
//             customizations,
//           };

//           set({
//             items: [...get().items, cartItem],
//           });
//         }
//       },

//       removeItem: (id, customizations = []) => {
//         set({
//           items: get().items.filter(
//             (i) =>
//               !(
//                 i.id === id &&
//                 areCustomizationsEqual(i.customizations ?? [], customizations)
//               ),
//           ),
//         });
//       },

//       increaseQty: (id, customizations = []) => {
//         set({
//           items: get().items.map((i) =>
//             i.id === id &&
//             areCustomizationsEqual(i.customizations ?? [], customizations)
//               ? { ...i, quantity: i.quantity + 1 }
//               : i,
//           ),
//         });
//       },

//       decreaseQty: (id, customizations = []) => {
//         set({
//           items: get()
//             .items.map((i) =>
//               i.id === id &&
//               areCustomizationsEqual(i.customizations ?? [], customizations)
//                 ? { ...i, quantity: i.quantity - 1 }
//                 : i,
//             )
//             .filter((i) => i.quantity > 0),
//         });
//       },

//       clearCart: () => set({ items: [] }),

//       getTotalItems: () =>
//         get().items.reduce((total, item) => total + item.quantity, 0),

//       getTotalPrice: () =>
//         get().items.reduce((total, item) => {
//           const base = item.price;
//           const customPrice =
//             item.customizations?.reduce(
//               (s: number, c: CartCustomization) => s + c.price,
//               0,
//             ) ?? 0;
//           return total + item.quantity * (base + customPrice);
//         }, 0),
//     }),
//     {
//       name: "cart-storage", // localStorage key
//     },
//   ),
// );

import { app } from "@/lib/firebase"; // your firebase config
import {
  CartItemType,
  CartStore,
  MenuItem,
  toCartCustomizations,
} from "@/type";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import { create } from "zustand";

const db = getFirestore(app);

function areCustomizationsEqual(
  // a: CartCustomization[] = [],
  // b: CartCustomization[] = []
  a: MenuItem["customizations"] = [],
  b: MenuItem["customizations"] = [],
): boolean {
  if (a.length !== b.length) return false;

  const aSorted = [...a].sort((x, y) => x.id.localeCompare(y.id));
  const bSorted = [...b].sort((x, y) => x.id.localeCompare(y.id));

  return aSorted.every((item, idx) => item.id === bSorted[idx].id);
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  orderType: null as "delivery" | "pickup" | null, // Track delivery/pickup preference
  setOrderType: (type: "delivery" | "pickup") => set({ orderType: type }),
  addItem: (item, quantity = 1) => {
    const customizations = item.customizations ?? [];

    const existing = get().items.find(
      (i) =>
        i.id === item.id &&
        areCustomizationsEqual(i.customizations ?? [], customizations),
    );

    if (existing) {
      set({
        items: get().items.map((i) =>
          i.id === item.id &&
          areCustomizationsEqual(i.customizations ?? [], customizations)
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        ),
      });
    } else {
      const cartItem: CartItemType = {
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        quantity,
        customizations: toCartCustomizations(item.customizations),
      };

      set({
        items: [...get().items, cartItem],
      });
    }
  },
  clearCart: () => set({ items: [] }),

  getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  getTotalPrice: () =>
    get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  removeItem: (id, customizations = []) => {
    set({
      items: get().items.filter(
        (i) =>
          !(
            i.id === id &&
            areCustomizationsEqual(i.customizations ?? [], customizations)
          ),
      ),
    });
  },

  increaseQty: (id, customizations = []) => {
    set({
      items: get().items.map((i) =>
        i.id === id &&
        areCustomizationsEqual(i.customizations ?? [], customizations)
          ? { ...i, quantity: i.quantity + 1 }
          : i,
      ),
    });
  },

  decreaseQty: (id, customizations = []) => {
    set({
      items: get()
        .items.map((i) =>
          i.id === id &&
          areCustomizationsEqual(i.customizations ?? [], customizations)
            ? { ...i, quantity: i.quantity - 1 }
            : i,
        )
        .filter((i) => i.quantity > 0),
    });
  },
  createOrder: async (uid: string) => {
    const items = get().items;
    if (items.length === 0) throw new Error("Cart is empty");

    const totalPrice = get().getTotalPrice();

    const orderRef = await addDoc(collection(db, "orders"), {
      uid,
      cartItems: items.map((i) => ({ id: i.id, quantity: i.quantity })),
      amount: totalPrice,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    return orderRef.id; // return order id
  },

  reorder: (items: CartItemType[]) => {
    set({
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  },
}));
