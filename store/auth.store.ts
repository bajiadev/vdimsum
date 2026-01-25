import { create } from "zustand";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "@/lib/firebase";
import { User } from "@/type";

interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  fetchAuthenticatedUser: () => Promise<void>;
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
    set({ user: null });
  },
  fetchAuthenticatedUser: async () => {
    set({ isLoading: true });

    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch Firestore user document
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        set({
          user: userDoc.exists() ? ({id: firebaseUser.uid, ...userDoc.data()} as User) : null,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ user: null, isLoading: false });
      }
    });
  },
}));

export default useAuthStore;
