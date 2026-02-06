import { create } from "zustand";

interface ShopSelection {
  shopId: string | null;
  shopName: string | null;
  shopAddress: string | null;
  orderType: "delivery" | "pickup" | null;
}

interface ShopStore extends ShopSelection {
  setShopSelection: (data: ShopSelection) => void;
  clearShopSelection: () => void;
}

const useShopStore = create<ShopStore>((set) => ({
  shopId: null,
  shopName: null,
  shopAddress: null,
  orderType: null,
  setShopSelection: (data) => set(data),
  clearShopSelection: () =>
    set({
      shopId: null,
      shopName: null,
      shopAddress: null,
      orderType: null,
    }),
}));

export default useShopStore;
