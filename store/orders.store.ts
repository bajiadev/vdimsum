import { create } from "zustand";
import { Order } from "@/type";

// type Order = {
//   id: string;
//   items: any[];
//   createdAt: number;
//   total: number;
// };

type OrdersState = {
  orders: Order[];
  isLoading: boolean;
  setOrders: (orders: Order[]) => void;
};

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  isLoading: false,
  setOrders: (orders) => set({ orders }),
}));
