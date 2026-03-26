import { app, createOrder } from "@/lib/firebase";
import { OrderCustomization, OrderItemType, OrderStore } from "@/type";
import { getFirestore } from "firebase/firestore";
import { create } from "zustand";

const db = getFirestore(app);

function areCustomizationsEqual(
  a: OrderCustomization[] = [],
  b: OrderCustomization[] = [],
): boolean {
  if (a.length !== b.length) return false;

  const aSorted = [...a].sort((x, y) => x.optionId.localeCompare(y.optionId));
  const bSorted = [...b].sort((x, y) => x.optionId.localeCompare(y.optionId));

  return aSorted.every((item, idx) => item.optionId === bSorted[idx].optionId);
}

function isSameLineItem(a: OrderItemType, b: OrderItemType): boolean {
  return (
    a.id === b.id &&
    (a.isRewardRedemption ?? false) === (b.isRewardRedemption ?? false) &&
    (a.isPromoFree ?? false) === (b.isPromoFree ?? false) &&
    (a.promoOfferId ?? "") === (b.promoOfferId ?? "") &&
    (a.redemptionId ?? "") === (b.redemptionId ?? "") &&
    areCustomizationsEqual(a.customizations ?? [], b.customizations ?? [])
  );
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  items: [],
  orderType: null as "delivery" | "pickup" | null,
  setOrderType: (type: "delivery" | "pickup") => set({ orderType: type }),
  addItem: (item, quantity = 1, customizations = []) => {
    const customizationsPrice = customizations.reduce(
      (sum, c) => sum + (c.price || 0),
      0,
    );
    const candidate: OrderItemType = {
      id: item.id,
      name: item.name,
      price: item.price + customizationsPrice,
      image_url: item.image_url,
      quantity,
      offer_tags: item.offer_tags || [],
      customizations,
      isRewardRedemption: false,
    };

    const existing = get().items.find((i) => isSameLineItem(i, candidate));

    if (existing) {
      set({
        items: get().items.map((i) =>
          isSameLineItem(i, candidate)
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        ),
      });
    } else {
      set({
        items: [...get().items, candidate],
      });
    }
  },
  addRedeemedItem: (item, quantity = 1, redemptionId) => {
    const rewardItem: OrderItemType = {
      id: item.id,
      name: item.name,
      price: 0,
      image_url: item.image_url,
      quantity,
      offer_tags: item.offer_tags || [],
      customizations: [],
      isRewardRedemption: true,
      rewardPointsCost: item.points_cost || 0,
      redemptionId,
    };

    const existing = get().items.find((i) => isSameLineItem(i, rewardItem));

    if (existing) {
      set({
        items: get().items.map((i) =>
          isSameLineItem(i, rewardItem)
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        ),
      });
      return;
    }

    set({
      items: [...get().items, rewardItem],
    });
  },
  addPromoFreeItem: (item, promoOfferId, quantity = 1) => {
    const promoItem: OrderItemType = {
      id: item.id,
      name: item.name,
      price: 0,
      image_url: item.image_url,
      quantity,
      offer_tags: item.offer_tags || [],
      customizations: [],
      isRewardRedemption: false,
      isPromoFree: true,
      promoOfferId,
    };

    const existing = get().items.find((i) => isSameLineItem(i, promoItem));

    if (existing) {
      set({
        items: get().items.map((i) =>
          isSameLineItem(i, promoItem) ? { ...i, quantity } : i,
        ),
      });
      return;
    }

    set({
      items: [...get().items, promoItem],
    });
  },
  removePromoFreeItem: (promoOfferId) => {
    set({
      items: get().items.filter(
        (i) => !(i.isPromoFree && i.promoOfferId === promoOfferId),
      ),
    });
  },
  clearPromoFreeItems: () => {
    set({
      items: get().items.filter((i) => !i.isPromoFree),
    });
  },
  clearOrder: () => set({ items: [] }),

  getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  getTotalPrice: () =>
    get().items.reduce((sum, i) => {
      return sum + i.price * i.quantity;
    }, 0),
  removeItem: (
    id,
    customizations = [],
    isRewardRedemption = false,
    redemptionId,
    promoOfferId,
  ) => {
    set({
      items: get().items.filter(
        (i) =>
          !(
            i.id === id &&
            (i.isRewardRedemption ?? false) === isRewardRedemption &&
            (redemptionId === undefined || i.redemptionId === redemptionId) &&
            (promoOfferId === undefined || i.promoOfferId === promoOfferId) &&
            areCustomizationsEqual(i.customizations ?? [], customizations)
          ),
      ),
    });
  },

  increaseQty: (id, customizations = []) => {
    set({
      items: get().items.map((i) =>
        i.id === id &&
        !i.isRewardRedemption &&
        !i.isPromoFree &&
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
          !i.isRewardRedemption &&
          !i.isPromoFree &&
          areCustomizationsEqual(i.customizations ?? [], customizations)
            ? { ...i, quantity: i.quantity - 1 }
            : i,
        )
        .filter((i) => i.quantity > 0),
    });
  },
  createOrder: async (uid: string, totalAmountOverride?: number) => {
    const items = get().items;
    if (items.length === 0) throw new Error("Order is empty");
    const totalPrice = totalAmountOverride ?? get().getTotalPrice();
    // Call the new firebase.ts createOrder
    return await createOrder(uid, items, totalPrice);
  },

  reorder: (items) => {
    set({
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        image_url: i.image_url,
        quantity: i.quantity,
        offer_tags: i.offer_tags || [],
        customizations: i.customizations || [],
        isRewardRedemption: false,
        isPromoFree: i.isPromoFree || false,
        promoOfferId: i.promoOfferId,
      })),
    });
  },
}));
