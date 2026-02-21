/* -------------------------------------------------------------------------- */
/*                                   MENU                                     */
/* -------------------------------------------------------------------------- */
export interface MenuItemCustomizationOption {
  id: string;
  name: string;
  price: number;
}

export interface MenuItemCustomization {
  id: string;
  name: string;
  type: "single" | "multiple";
  required?: boolean;
  options: MenuItemCustomizationOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  description: string;
  rating: number;
  category_ids: string[];
  category_names: string[];
  customizations?: MenuItemCustomization[];
  is_available: boolean;
  is_featured: boolean;
  is_redeemable?: boolean;
  points_cost?: number;
  reward_stock?: number;
  created_at?: any;
  updated_at?: any;
}

/* -------------------------------------------------------------------------- */
/*                                 CATEGORY                                   */
/* -------------------------------------------------------------------------- */

export interface Category {
  id: string;
  name: string;
  description: string;
  image_url?: string;
}

/* -------------------------------------------------------------------------- */
/*                                   USER                                     */
/* -------------------------------------------------------------------------- */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  address?: string;
  addressLine1?: string;
  city?: string;
  postcode?: string;
  country?: string;
  privacySettings?: {
    shareUsageData?: boolean;
    saveOrderHistory?: boolean;
    useLocation?: boolean;
    locationPermissionStatus?: "granted" | "denied" | "undetermined";
  };
}

export interface PointTransaction {
  id: string;
  userId: string;
  type: "earn" | "redeem";
  amount: number;
  description: string;
  orderId?: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

// Redeemable items are just menu items with reward fields
export type RedeemableItem = MenuItem;

/* -------------------------------------------------------------------------- */
/*                              ORDER & STORE                                 */
/* -------------------------------------------------------------------------- */
export interface OrderCustomization {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface OrderItemType {
  id: string; // menu item id
  name: string;
  price: number;
  image_url?: string;
  quantity: number;
  customizations?: OrderCustomization[];
  isRewardRedemption?: boolean;
  rewardPointsCost?: number;
  redemptionId?: string;
}

export interface OrderStore {
  items: OrderItemType[];
  orderType: "delivery" | "pickup" | null;
  setOrderType: (type: "delivery" | "pickup") => void;
  addItem: (
    product: MenuItem,
    quantity?: number,
    customizations?: OrderCustomization[],
  ) => void;
  addRedeemedItem: (
    item: RedeemableItem,
    quantity?: number,
    redemptionId?: string,
  ) => void;
  removeItem: (
    id: string,
    customizations: OrderCustomization[],
    isRewardRedemption?: boolean,
    redemptionId?: string,
  ) => void;
  increaseQty: (id: string, customizations: OrderCustomization[]) => void;
  decreaseQty: (id: string, customizations: OrderCustomization[]) => void;
  clearOrder: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  createOrder: (userId: string) => Promise<string>;
  reorder: (
    items: {
      id: string;
      name: string;
      price: number;
      quantity: number;
      image_url?: string;
      customizations?: OrderCustomization[];
    }[],
  ) => void;
}

/* -------------------------------------------------------------------------- */
/*                                  UI TYPES                                  */
/* -------------------------------------------------------------------------- */

import { Timestamp } from "firebase/firestore";
import React from "react";
import { ImageSourcePropType } from "react-native";

export interface TabBarIconProps {
  focused: boolean;
  icon: ImageSourcePropType;
  title: string;
}

export interface PaymentInfoStripeProps {
  label: string;
  value: string;
  labelStyle?: string;
  valueStyle?: string;
}

export interface CustomButtonProps {
  onPress?: () => void;
  title?: string;
  style?: string;
  leftIcon?: React.ReactNode;
  textStyle?: string;
  isLoading?: boolean;
}

export interface CustomHeaderProps {
  title?: string;
}

export interface CustomInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  label: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

export interface ProfileFieldProps {
  label: string;
  value: string;
  icon: ImageSourcePropType;
}

/* -------------------------------------------------------------------------- */
/*                               AUTH PARAMS                                  */
/* -------------------------------------------------------------------------- */

export interface CreateUserParams {
  email: string;
  password: string;
  name: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface GetMenuParams {
  categoryId?: string;
  categoryName?: string;
  query?: string;
}

export interface createPaymentIntentResponse {
  clientSecret: string;
}

export interface createPaymentIntentRequest {
  // orderItems: OrderItemType[];
  orderItems: { id: string; quantity: number }[];
  orderId: string;
}

// Firestore order document (without items array)
export type Order = {
  id: string;
  orderNumber: string; // readable order number e.g. "260212-A1B2C3"
  userId: string;
  shopName: string | null;
  shopAddress: string | null;
  orderType: string | null;
  itemCount: number; // total number of items in subcollection
  amount: number; // pence
  status: "paid" | "pending" | "cancelled";
  createdAt: Timestamp;
};

// Firestore orderItem subcollection document
export type OrderItem = {
  id: string; // document ID
  menuItemId: string;
  name: string;
  price: number; // pence
  quantity: number;
  image_url?: string;
  customizations?: OrderCustomization[];
  isRewardRedemption?: boolean;
  rewardPointsCost?: number;
  redemptionId?: string;
};

// Combined type for UI (order with items loaded)
export type OrderWithItems = Order & {
  items: OrderItem[];
};
