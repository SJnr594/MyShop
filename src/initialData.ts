import { Product, StoreSettings } from './types';

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
  wholesaleTerms: '1. Payment due upon receipt unless credit terms agreed.\n2. Goods once sold in sound condition are not returnable without prior manager authorization.\n3. Claims regarding quantity or damaged bulk packs must be logged within 48 hours.',
  printerDriverType: 'thermal_escpos',
  autoPrintEnabled: false,
  isSetupCompleted: false,
  onlineBackupEnabled: false,
  profiles: [
    { id: 'u_admin', name: 'System Administrator', role: 'admin', passwordHash: 'admin123' },
    { id: 'u_manager', name: 'Store Manager', role: 'manager', passwordHash: 'manager123' },
    { id: 'u_cashier', name: 'Retail Cashier', role: 'cashier', passwordHash: 'cashier123' }
  ],
  categories: ['Wholesale 1', 'Wholesale 2', 'Wholesale 3']
};
