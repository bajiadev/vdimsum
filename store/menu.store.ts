// store/menu.store.ts
import { create } from "zustand";
import { MenuItem } from "@/type";
import { db } from "@/lib/firebase"; // your firebase.ts
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";

type Menu = {
  items: Record<string, MenuItem>;
  setMenu: (items: MenuItem[]) => void;
  setMenuItem: (item: MenuItem) => void;
  getMenuItemById: (id: string) => MenuItem | undefined;
  fetchMenuItemById: (id: string) => Promise<MenuItem>;
  fetchAllMenu: () => Promise<void>;
};

const mapMenuItem = (docSnap: any): MenuItem => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    price: data.price,
    image_url: data.image_url,
    description: data.description,
    calories: data.calories,
    rating: data.rating,
    type: data.type,
  };
};

export const useMenu = create<Menu>((set, get) => ({
  items: {},

  // Bulk hydrate (menu page)
  setMenu: (items) =>
    set({
      items: Object.fromEntries(items.map((i) => [i.id, i])),
    }),

  // Single item hydrate (product page)
  setMenuItem: (item) =>
    set((state) => ({
      items: {
        ...state.items,
        [item.id]: item,
      },
    })),

  getMenuItemById: (id) => get().items[id],

  // Fetch only if missing
  fetchMenuItemById: async (id) => {
    const existing = get().items[id];
    if (existing) return existing;

    const docRef = doc(db, "menu", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error("Menu item not found");

    const product = mapMenuItem(docSnap);
    set((state) => ({
      items: {
        ...state.items,
        [product.id]: product,
      },
    }));

    return product;
  },

  // Fetch all menu items (optional helper)
  fetchAllMenu: async () => {
    const q = query(collection(db, "menu"));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(mapMenuItem);

    set((state) => ({
      items: Object.fromEntries(items.map((i) => [i.id, i])),
    }));
  },
}));
