export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  wholesaleCost: number; // Cost to buy from supplier
  retailPrice: number;   // Selling price to retail customer
  wholesaleStock: number; // Unopened bulk boxes/warehouse stock
  retailStock: number;    // Stock placed on retail shelves
  minStockAlert: number;  // Threshold for low stock warning
  unit?: string;          // Customizable unit label (e.g., pcs, kg, box, bottle)
  unitsPerCarton?: number; // Number of single units in 1 full carton/box (e.g. 24)
  cartonPrice?: number;   // Special discounted price for 1 full carton
}

export interface SaleItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;       // Total single units deducted from stock
  price: number;          // Effective price per single unit
  wholesaleCost: number;  // Wholesale cost at purchase
  packType?: 'unit' | 'half_carton' | 'full_carton' | 'custom';
  packLabel?: string;     // Display label for receipt e.g. "Full Carton (24 pcs)"
}

export interface Sale {
  id: string;
  timestamp: number;
  customerName: string;
  customerPhone: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mobile_money' | 'credit';
  notes?: string;
  cashierName?: string;
  dueDate?: number;
  isFinalized?: boolean;
  checkedBy?: string;
  checkedTimestamp?: number;
  crossCheckNotes?: string;
}

export interface VoidedSaleRecord {
  id: string;
  voidTimestamp: number;
  voidedBy?: string;
  restocked: boolean;
  sale: Sale;
  reason?: string;
}

export interface CreditPayment {
  id: string;
  amount: number;
  timestamp: number;
  paymentMethod: 'cash' | 'card' | 'mobile_money';
  notes?: string;
}

export interface CreditRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  saleId: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  purchaseDate: number;
  dueDate: number;
  status: 'unpaid' | 'partial' | 'paid';
  notes?: string;
  payments: CreditPayment[];
  checkInAcknowledged?: boolean;
}

export interface Customer {
  id: string; // usually phone or a random ID
  name: string;
  phone: string;
  email?: string;
  totalSpent: number;
  totalOrders: number;
  lastPurchaseDate: number;
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  timestamp: number;
  type: 'wholesale_to_retail' | 'purchase_stock' | 'sales_deduction' | 'adjustment';
  quantity: number; // amount of items moved
  notes: string;
}

export type UserRole = 'admin' | 'manager' | 'cashier';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  passwordHash: string; // Plaintext or simple hash for local sandbox
}

// 1. SHIFT MANAGEMENT & CASH DRAWER RECONCILIATION
export interface CashDrawerMovement {
  id: string;
  shiftId: string;
  timestamp: number;
  type: 'cash_in' | 'cash_out' | 'sale' | 'credit_payment' | 'opening_float';
  amount: number;
  reason: string;
  cashierId: string;
  cashierName: string;
}

export interface CashierShift {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: number;
  endTime?: number;
  openingFloat: number;
  closingActualCash?: number;
  expectedCash?: number;
  variance?: number; // actual - expected
  totalCashSales: number;
  totalCardSales: number;
  totalMobileMoneySales: number;
  totalCreditSales: number;
  totalSalesCount: number;
  cashInTotal: number;
  cashOutTotal: number;
  status: 'open' | 'closed';
  notes?: string;
  movements: CashDrawerMovement[];
}

// 2. SUPPLIER & PURCHASE ORDER (PO) TRACKING
export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  createdAt: number;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  barcode?: string;
  quantityCartons?: number;
  quantityUnits: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string; // e.g. PO-20260818-001
  supplierId: string;
  supplierName: string;
  createdAt: number;
  expectedDeliveryDate?: number;
  receivedAt?: number;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
  createdBy: string;
  receivedBy?: string;
}

// 3. CUSTOMER LOYALTY & PROMOTIONAL DISCOUNTS
export interface LoyaltyAccount {
  customerId: string; // phone or customer ID
  customerName: string;
  customerPhone: string;
  pointsBalance: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  tier: 'Standard' | 'Silver' | 'Gold' | 'Platinum';
  lastUpdated: number;
}

export interface Promotion {
  id: string;
  code: string; // e.g. SAVE10
  title: string;
  type: 'percentage' | 'fixed_amount';
  value: number; // e.g. 10 for 10% or 20 for $20
  minOrderAmount?: number;
  startDate: number;
  endDate?: number;
  isActive: boolean;
  usageCount: number;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerCurrencyUnit: number; // e.g. 0.1 (1 pt per $10 spent)
  currencyPerPointRedeemed: number; // e.g. 0.05 (100 pts = $5)
  minPointsToRedeem: number; // e.g. 20
}

// 4. MULTI-BRANCH & WAREHOUSE TRANSFERS
export interface StoreBranch {
  id: string;
  name: string;
  code: string; // e.g. MAIN, WH-01, NORTH
  address: string;
  phone: string;
  isMain: boolean;
}

export interface StockTransferItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unit?: string;
}

export interface StockTransfer {
  id: string; // e.g. TRF-20260818-001
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  createdAt: number;
  completedAt?: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  items: StockTransferItem[];
  notes?: string;
  dispatchedBy: string;
  receivedBy?: string;
}

export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  taxRate: number; // e.g. 16 for 16%
  receiptHeader: string;
  receiptFooter: string;
  retailReceiptFormat?: '80mm' | '58mm' | 'A4';
  wholesaleReceiptFormat?: 'A4' | '80mm' | 'Letter';
  defaultReceiptCopies?: number; // 1 by default, allows specifying 2 or 3 copies
  wholesaleTerms?: string;
  printerDriverType?: 'thermal_escpos' | 'dot_matrix' | 'laser_inkjet' | 'bluetooth_mobile';
  autoPrintEnabled?: boolean;
  isSetupCompleted: boolean;
  onlineBackupEnabled: boolean;
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  profiles?: UserProfile[]; // Customized user profiles
  categories?: string[]; // Customizable product categories/warehouse locations
  loyaltySettings?: LoyaltySettings;
  branches?: StoreBranch[];
}

export interface AppState {
  products: Product[];
  sales: Sale[];
  settings: StoreSettings;
  stockLogs: StockLog[];
  credits?: CreditRecord[];
  voidedSales?: VoidedSaleRecord[];
  shifts?: CashierShift[];
  activeShift?: CashierShift | null;
  suppliers?: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  promotions?: Promotion[];
  loyaltyAccounts?: LoyaltyAccount[];
  branches?: StoreBranch[];
  stockTransfers?: StockTransfer[];
}
