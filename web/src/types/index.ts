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
  label?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface ClothType {
  _id: string;
  name: string;
  isCustom: boolean;
  icon?: string;
  prices: Record<string, number>;
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
  isInStoreDelivery: boolean;
  notes?: string;
  status: PickupStatus;
  collectedItems: CollectedItem[];
  images: string[];
  pickupRemarks?: string;
  damagedItemNotes?: string;
  cancelledReason?: string;
  createdAt: string;
  updatedAt: string;
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
  isInStorePickup: boolean;
  isInStoreDelivery: boolean;
  collectedItems: CollectedItem[];
  bill?: Bill | string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface Discount {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  reason: string;
  givenBy: PublicUser | string;
  timestamp: string;
}

export interface BillLineItem {
  clothType?: ClothType | string;
  service: Service | string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Bill {
  _id: string;
  order: Order | string;
  invoiceNumber: string;
  lineItems: BillLineItem[];
  pickupCharge: number;
  deliveryCharge: number;
  extraCharges: number;
  taxes: number;
  discount?: Discount;
  discountHistory: Discount[];
  subtotal: number;
  finalAmount: number;
  amountPaid: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  bill: Bill | string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  collectedBy: PublicUser | string;
  batchId?: string;
  settledToAdmin: boolean;
  settledAt?: string;
  settledBy?: PublicUser | string;
  createdAt: string;
}

export interface PaymentLeg {
  amount: number;
  method: PaymentMethod;
}

export interface PaymentReportRow {
  _id: string;
  bill: Bill | string;
  collectedBy: PublicUser | string;
  amount: number;
  legs: PaymentLeg[];
  settledToAdmin: boolean;
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  todaysPickups: number;
  pendingPickups: number;
  laundryInProgress: number;
  readyForDelivery: number;
  expressOrders: number;
  deliveredOrdersToday: number;
  pendingPayments: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  customerCount: number;
  driverCount: number;
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
