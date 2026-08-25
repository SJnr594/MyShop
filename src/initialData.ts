import { 
  Product, StoreSettings, CashierShift, PurchaseOrder, StockTransfer,
  StoreBranch, Supplier, Promotion, LoyaltyAccount, LoyaltySettings
} from './types';

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    barcode: '4008400200122', // Ferrero Rocher
    name: 'Ferrero Rocher Chocolates 200g',
    category: 'Wholesale 1',
    wholesaleCost: 4.50,
    retailPrice: 7.99,
    wholesaleStock: 24, // 24 boxes in bulk
    retailStock: 15,     // 15 boxes on shelf
    minStockAlert: 8,
    unit: 'pcs',
    unitsPerCarton: 12,
    cartonPrice: 90.00
  },
  {
    id: 'prod_2',
    barcode: '012000042431', // Pepsi Co Soda
    name: 'Pepsi Soda Cans (Single / Carton)',
    category: 'Wholesale 2',
    wholesaleCost: 1.20,
    retailPrice: 2.50,
    wholesaleStock: 15,
    retailStock: 30,
    minStockAlert: 10,
    unit: 'cans',
    unitsPerCarton: 24,
    cartonPrice: 55.00
  },
  {
    id: 'prod_3',
    barcode: '028400040112', // Lay's Classic Chips
    name: 'Lays Potato Chips Classic Family Size',
    category: 'Wholesale 1',
    wholesaleCost: 1.80,
    retailPrice: 3.29,
    wholesaleStock: 30,
    retailStock: 12,
    minStockAlert: 10,
    unit: 'bags',
    unitsPerCarton: 20,
    cartonPrice: 60.00
  },
  {
    id: 'prod_4',
    barcode: '049000028904', // Coca Cola
    name: 'Coca-Cola Zero Sugar 2L Bottle',
    category: 'Wholesale 3',
    wholesaleCost: 1.10,
    retailPrice: 2.19,
    wholesaleStock: 40,
    retailStock: 18,
    minStockAlert: 12,
    unit: 'bottles',
    unitsPerCarton: 12,
    cartonPrice: 24.00
  },
  {
    id: 'prod_5',
    barcode: '070734053150', // Heinz Ketchup
    name: 'Heinz Tomato Ketchup 32oz',
    category: 'Wholesale 2',
    wholesaleCost: 2.10,
    retailPrice: 3.89,
    wholesaleStock: 18,
    retailStock: 8,
    minStockAlert: 6,
    unit: 'bottles',
    unitsPerCarton: 12,
    cartonPrice: 42.00
  },
  {
    id: 'prod_6',
    barcode: '011110038319', // Milk
    name: 'Kroger Whole Milk 1 Gallon',
    category: 'Wholesale 3',
    wholesaleCost: 1.95,
    retailPrice: 3.19,
    wholesaleStock: 10,
    retailStock: 12,
    minStockAlert: 5,
    unit: 'jugs',
    unitsPerCarton: 6,
    cartonPrice: 18.00
  },
  {
    id: 'prod_7',
    barcode: '021000612239', // Kraft Mac & Cheese
    name: 'Kraft Macaroni & Cheese Original 7.25oz',
    category: 'Wholesale 1',
    wholesaleCost: 0.65,
    retailPrice: 1.25,
    wholesaleStock: 100,
    retailStock: 25,
    minStockAlert: 15,
    unit: 'boxes',
    unitsPerCarton: 24,
    cartonPrice: 28.00
  }
];

export const DEFAULT_LOYALTY_SETTINGS = {
  enabled: true,
  pointsPerCurrencyUnit: 0.1, // 1 point per $10 spent
  currencyPerPointRedeemed: 0.05, // 100 points = $5 discount
  minPointsToRedeem: 20
};

export const SAMPLE_BRANCHES = [
  {
    id: 'branch_main',
    name: 'Main Retail Store (HQ)',
    code: 'MAIN-STORE',
    address: '100 Retail Boulevard, Commerce Suite 1',
    phone: '+1 (555) 123-4567',
    isMain: true
  },
  {
    id: 'branch_wh1',
    name: 'Central Bulk Warehouse Depot',
    code: 'WH-CENTRAL',
    address: '45 Logistics Way, Industrial Park',
    phone: '+1 (555) 987-6543',
    isMain: false
  },
  {
    id: 'branch_north',
    name: 'North City Distribution Annex',
    code: 'ANNEX-NORTH',
    address: '12 North Highway Plaza',
    phone: '+1 (555) 456-7890',
    isMain: false
  }
];

export const SAMPLE_SUPPLIERS = [
  {
    id: 'supp_1',
    name: 'Global Confectionery & Beverage Importers',
    contactPerson: 'Marcus Vance',
    phone: '+1 (555) 234-5678',
    email: 'orders@globalconfectionery.com',
    address: '88 Harbour Shipping Hub, Dock 4',
    taxId: 'TAX-US-99281',
    paymentTerms: 'Net 30 Days',
    notes: 'Primary supplier for Ferrero, Chocolates, and imported confectionery lines.',
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000
  },
  {
    id: 'supp_2',
    name: 'Atlantic FMCG & Beverage Wholesalers',
    contactPerson: 'Elena Rostova',
    phone: '+1 (555) 345-6789',
    email: 'sales@atlanticfmcg.com',
    address: '14 Industrial Bypass, Zone B',
    taxId: 'TAX-US-88412',
    paymentTerms: 'Cash on Delivery (2% Early Pay Discount)',
    notes: 'Bulk supplier for sodas, soft drinks, and condiments.',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
  },
  {
    id: 'supp_3',
    name: 'Valley Farms & Dairy Co-op',
    contactPerson: 'David K. Osei',
    phone: '+1 (555) 456-7891',
    email: 'distribution@valleyfarms.com',
    address: '220 Greenway Road, Dairy Sector',
    taxId: 'TAX-US-77194',
    paymentTerms: 'Net 14 Days',
    notes: 'Fresh dairy, milk gallons, and packaged food supplies.',
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000
  }
];

export const SAMPLE_PROMOTIONS = [
  {
    id: 'promo_1',
    code: 'SAVE10',
    title: '10% Storewide Welcome Discount',
    type: 'percentage' as const,
    value: 10,
    minOrderAmount: 20,
    startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
    isActive: true,
    usageCount: 14
  },
  {
    id: 'promo_2',
    code: 'BULK50',
    title: 'GH₵50 Instant Rebate on Bulk Orders',
    type: 'fixed_amount' as const,
    value: 50,
    minOrderAmount: 300,
    startDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 180 * 24 * 60 * 60 * 1000,
    isActive: true,
    usageCount: 8
  },
  {
    id: 'promo_3',
    code: 'SPECIAL5',
    title: '5% Express Quick Checkout Rebate',
    type: 'percentage' as const,
    value: 5,
    minOrderAmount: 10,
    startDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
    isActive: true,
    usageCount: 32
  }
];

export const SAMPLE_LOYALTY_ACCOUNTS = [
  {
    customerId: '0551234567',
    customerName: 'Kwame Mensah',
    customerPhone: '0551234567',
    pointsBalance: 120,
    totalPointsEarned: 180,
    totalPointsRedeemed: 60,
    tier: 'Gold' as const,
    lastUpdated: Date.now() - 2 * 24 * 60 * 60 * 1000
  },
  {
    customerId: '0249876543',
    customerName: 'Abena Serwaa',
    customerPhone: '0249876543',
    pointsBalance: 85,
    totalPointsEarned: 95,
    totalPointsRedeemed: 10,
    tier: 'Silver' as const,
    lastUpdated: Date.now() - 5 * 24 * 60 * 60 * 1000
  },
  {
    customerId: '0205557890',
    customerName: 'Joseph Coffie (Wholesale Partner)',
    customerPhone: '0205557890',
    pointsBalance: 340,
    totalPointsEarned: 450,
    totalPointsRedeemed: 110,
    tier: 'Platinum' as const,
    lastUpdated: Date.now() - 1 * 24 * 60 * 60 * 1000
  }
];

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'MyShop',
  address: '100 Retail Boulevard, Commerce Suite 1',
  phone: '+1 (555) 123-4567',
  email: 'contact@myshop.com',
  currency: 'GH₵',
  taxRate: 8.25,
  receiptHeader: 'WELCOME TO MYSHOP\nThank you for shopping with us today!',
  receiptFooter: 'ITEMS SOLD ARE RETURNABLE WITHIN 7 DAYS WITH ORIGINAL RECEIPT\nHAVE A WONDERFUL DAY!',
  retailReceiptFormat: '80mm',
  wholesaleReceiptFormat: 'A4',
  defaultReceiptCopies: 1,
  wholesaleTerms: '1. Payment due upon receipt unless credit terms agreed.\n2. Goods once sold in sound condition are not returnable without prior manager authorization.\n3. Claims regarding quantity or damaged bulk packs must be logged within 48 hours.',
  printerDriverType: 'thermal_escpos',
  autoPrintEnabled: false,
  isSetupCompleted: false,
  onlineBackupEnabled: false,
  loyaltySettings: DEFAULT_LOYALTY_SETTINGS,
  branches: SAMPLE_BRANCHES,
  profiles: [
    { id: 'u_admin', name: 'System Administrator', role: 'admin', passwordHash: 'admin123' },
    { id: 'u_manager', name: 'Store Manager', role: 'manager', passwordHash: 'manager123' },
    { id: 'u_cashier', name: 'Retail Cashier', role: 'cashier', passwordHash: 'cashier123' }
  ],
  categories: ['Wholesale 1', 'Wholesale 2', 'Wholesale 3']
};

export const SAMPLE_SHIFTS: CashierShift[] = [
  {
    id: 'shift_prev_01',
    cashierId: 'u_cashier',
    cashierName: 'Retail Cashier',
    startTime: Date.now() - 26 * 60 * 60 * 1000,
    endTime: Date.now() - 18 * 60 * 60 * 1000,
    openingFloat: 200.00,
    closingActualCash: 745.50,
    expectedCash: 745.50,
    variance: 0.00,
    totalCashSales: 545.50,
    totalCardSales: 320.00,
    totalMobileMoneySales: 180.00,
    totalCreditSales: 0.00,
    totalSalesCount: 18,
    cashInTotal: 0,
    cashOutTotal: 0,
    status: 'closed',
    notes: 'Morning shift closed smoothly with balanced till.',
    movements: [
      {
        id: 'mov_init_1',
        shiftId: 'shift_prev_01',
        timestamp: Date.now() - 26 * 60 * 60 * 1000,
        type: 'opening_float',
        amount: 200.00,
        reason: 'Shift opening base float cash in drawer',
        cashierId: 'u_cashier',
        cashierName: 'Retail Cashier'
      }
    ]
  }
];

export const SAMPLE_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-20260815-001',
    supplierId: 'supp_1',
    supplierName: 'Global Confectionery & Beverage Importers',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    expectedDeliveryDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
    status: 'ordered',
    items: [
      {
        productId: 'prod_1',
        productName: 'Ferrero Rocher Chocolates 200g',
        barcode: '4008400200122',
        quantityCartons: 10,
        quantityUnits: 120,
        unitCost: 4.50,
        totalCost: 540.00
      }
    ],
    totalAmount: 540.00,
    notes: 'Restock order for upcoming seasonal promo.',
    createdBy: 'System Administrator'
  },
  {
    id: 'PO-20260810-002',
    supplierId: 'supp_2',
    supplierName: 'Atlantic FMCG & Beverage Wholesalers',
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
    receivedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    status: 'received',
    items: [
      {
        productId: 'prod_2',
        productName: 'Pepsi Soda Cans (Single / Carton)',
        barcode: '012000042431',
        quantityCartons: 20,
        quantityUnits: 480,
        unitCost: 1.20,
        totalCost: 576.00
      }
    ],
    totalAmount: 576.00,
    notes: 'Bulk beverage restock delivery received into warehouse.',
    createdBy: 'Store Manager',
    receivedBy: 'System Administrator'
  }
];

export const SAMPLE_TRANSFERS: StockTransfer[] = [
  {
    id: 'TRF-20260816-001',
    fromBranchId: 'branch_wh1',
    fromBranchName: 'Central Bulk Warehouse Depot',
    toBranchId: 'branch_main',
    toBranchName: 'Main Retail Store (HQ)',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    completedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    status: 'completed',
    items: [
      {
        productId: 'prod_1',
        productName: 'Ferrero Rocher Chocolates 200g',
        barcode: '4008400200122',
        quantity: 12,
        unit: 'pcs'
      },
      {
        productId: 'prod_3',
        productName: 'Lays Potato Chips Classic Family Size',
        barcode: '028400040112',
        quantity: 20,
        unit: 'bags'
      }
    ],
    notes: 'Weekly store replenishment transfer from Central Warehouse.',
    dispatchedBy: 'Warehouse Keeper',
    receivedBy: 'Store Manager'
  }
];
