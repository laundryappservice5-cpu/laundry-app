export type UserRole = 'ROOT_ADMIN' | 'ADMIN' | 'DRIVER';

export interface PublicUser {
  id: string;
  name: string;
  mobileNumber: string;
  role: UserRole;
  isActive: boolean;
  vehicleNumber?: string;
}

export interface Address {
  _id?: string;
  address: string;
  landmark?: string;
  area?: string;
  geo?: { lat: number; lng: number };
  isDefault?: boolean;
}

export interface Customer {
  _id: string;
  name: string;
  mobileNumber: string;
  alternateMobile?: string;
  addresses: Address[];
  notes?: string;
}

export interface ClothType {
  _id: string;
  name: string;
  isCustom: boolean;
  icon?: string;
  prices?: Record<string, number>;
}

export interface Service {
  _id: string;
  name: string;
  isActive: boolean;
  flatPrice?: number;
}

export type PickupStatus = 'CREATED' | 'DRIVER_ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'CANCELLED';

export interface CollectedItem {
  clothType?: ClothType | string;
  service: Service | string;
  quantity: number;
}

export interface Pickup {
  _id: string;
  customer: Customer | string;
  pickupAddress: { address: string; landmark?: string; area?: string; geo?: { lat: number; lng: number } };
  pickupDate: string;
  pickupTime: string;
  servicesRequested: (Service | string)[];
  specialInstructions?: string;
  assignedDriver?: PublicUser | string;
  isExpressPickup: boolean;
  isExpressDelivery: boolean;
  notes?: string;
  status: PickupStatus;
  collectedItems: CollectedItem[];
  images: string[];
  pickupRemarks?: string;
  damagedItemNotes?: string;
  createdAt: string;
}

export const ORDER_STAGES = [
  'PICKUP_CREATED',
  'DRIVER_ASSIGNED',
  'PICKED_UP',
  'RECEIVED_AT_LAUNDRY',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

export type OrderStage = (typeof ORDER_STAGES)[number];

export interface OrderStatusHistoryEntry {
  _id: string;
  status: OrderStage;
  timestamp: string;
  updatedBy: PublicUser | string;
  remarks?: string;
  itemCount?: number;
}

export interface Order {
  _id: string;
  pickup?: Pickup | string;
  customer: Customer | string;
  driver?: PublicUser | string;
  currentStatus: OrderStage;
  statusHistory: OrderStatusHistoryEntry[];
  isExpressPickup: boolean;
  isExpressDelivery: boolean;
  bill?: Bill | string;
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface PaymentLeg {
  amount: number;
  method: PaymentMethod;
}

export interface Bill {
  _id: string;
  order: Order | string;
  invoiceNumber: string;
  subtotal: number;
  extraCharges: number;
  taxes: number;
  finalAmount: number;
  amountPaid: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiError {
  success: false;
  message: string;
  details?: unknown;
}
