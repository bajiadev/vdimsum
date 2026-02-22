import { create } from "zustand";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "@/lib/firebase";
import { useOrderStore } from "@/store/order.store";
import { useOrdersStore } from "@/store/orders.store";
import useShopStore from "@/store/shop.store";
import { User } from "@/type";

let authUnsubscribe: (() => void) | null = null;
let authInitialized = false;

const clearSessionState = () => {
  useOrderStore.getState().clearOrder();
  useShopStore.getState().clearShopSelection();
  useOrdersStore.getState().setOrders([]);
};

interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  fetchAuthenticatedUser: () => (() => void) | void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),

  logout: async () => {
    await signOut(); // firebase auth signOut
    clearSessionState();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  fetchAuthenticatedUser: () => {
    if (authUnsubscribe) {
      return () => {
        if (authUnsubscribe) {
          authUnsubscribe();
          authUnsubscribe = null;
        }
      };
    }

    if (!authInitialized) {
      set({ isLoading: true });
    }

    authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      authInitialized = true;

      if (firebaseUser) {
        // Fetch Firestore user document
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        set({
          user: userDoc.exists()
            ? ({ id: firebaseUser.uid, ...userDoc.data() } as User)
            : null,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        const state = get();
        if (state.user || state.isAuthenticated) clearSessionState();
        if (state.user !== null || state.isAuthenticated || state.isLoading) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    });

    return () => {
      if (authUnsubscribe) {
        authUnsubscribe();
        authUnsubscribe = null;
      }
    };
  },
}));

export default useAuthStore;
