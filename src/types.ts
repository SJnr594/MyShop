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
}

export interface AppState {
  products: Product[];
  sales: Sale[];
  settings: StoreSettings;
  stockLogs: StockLog[];
  credits?: CreditRecord[];
  voidedSales?: VoidedSaleRecord[];
}
