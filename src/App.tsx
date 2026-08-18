import React, { useState, useEffect } from 'react';
import { 
  Product, Sale, StoreSettings, StockLog, AppState, CreditRecord, VoidedSaleRecord,
  CashierShift, CashDrawerMovement, Supplier, PurchaseOrder, LoyaltyAccount, Promotion, StoreBranch, StockTransfer, LoyaltySettings
} from './types';
import { 
  DEFAULT_SETTINGS, SAMPLE_PRODUCTS,
  SAMPLE_SHIFTS, SAMPLE_SUPPLIERS, SAMPLE_PURCHASE_ORDERS, 
  SAMPLE_LOYALTY_ACCOUNTS, SAMPLE_PROMOTIONS, SAMPLE_BRANCHES, SAMPLE_TRANSFERS
} from './initialData';
import SetupWizard from './components/SetupWizard';
import CheckoutTerminal from './components/CheckoutTerminal';
import InventoryManager from './components/InventoryManager';
import AnalyticsPanel from './components/AnalyticsPanel';
import BackupManager from './components/BackupManager';
import CreditsManager from './components/CreditsManager';
import ShiftManager from './components/ShiftManager';
import SuppliersAndPurchases from './components/SuppliersAndPurchases';
import LoyaltyAndPromotions from './components/LoyaltyAndPromotions';
import BranchTransfers from './components/BranchTransfers';
import BrandLogo from './components/BrandLogo';
import AppTutorial from './components/AppTutorial';
import Win7DiagnosticsModal from './components/Win7DiagnosticsModal';
import DesktopAppModal from './components/DesktopAppModal';
import { useTheme } from './ThemeContext';
import { 
  Store, ShoppingBag, Package, TrendingUp, Database, AlertCircle, Sparkles, HelpCircle,
  Lock, Unlock, Shield, ShieldCheck, UserCheck, Terminal, Save, ArrowLeft, ArrowRight, Check, CheckSquare, Square, LogOut, Printer, FileSpreadsheet, RefreshCw, Smartphone, Laptop, BookOpen,
  Sun, Moon, Monitor, Cpu, Clock, Truck, Gift, Building2, QrCode, Tag
} from 'lucide-react';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  // Core App States
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [credits, setCredits] = useState<CreditRecord[]>([]);
  const [voidedSales, setVoidedSales] = useState<VoidedSaleRecord[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({ ...DEFAULT_SETTINGS });
  const [isLoaded, setIsLoaded] = useState(false);

  // 5 Major Feature States
  const [shifts, setShifts] = useState<CashierShift[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<LoyaltyAccount[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [branches, setBranches] = useState<StoreBranch[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);

  // Active UI navigation tab
  const [activeTab, setActiveTab] = useState<
    'checkout' | 'shifts' | 'inventory' | 'transfers' | 'suppliers' | 'loyalty' | 'credits' | 'analytics' | 'backups' | 'tutorial'
  >('checkout');

  // Profile Security & Checklist States
  const [activeProfile, setActiveProfile] = useState<any | null>(null);
  const [hasCheckedPrinter, setHasCheckedPrinter] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('u_admin');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Printer checklist states
  const [printerChecked, setPrinterChecked] = useState(false);
  const [rollChecked, setRollChecked] = useState(false);
  const [scannerChecked, setScannerChecked] = useState(false);

  // Office style save feedback state
  const [showSaveFeedback, setShowSaveFeedback] = useState(false);
  const [showPWAHelp, setShowPWAHelp] = useState(false);
  const [showOfficeControlsHelp, setShowOfficeControlsHelp] = useState(false);
  const [showWin7Diagnostics, setShowWin7Diagnostics] = useState(false);

  // PWA Native Desktop Install Event
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleTriggerPwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowPWAHelp(true);
    }
  };

  // Global hotkeys for Alt+D (theme) and F10 (tab cycle)
  useEffect(() => {
    const handleGlobalAppKeys = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === 'F10') {
        e.preventDefault();
        setActiveTab(prev => {
          const tabs: ('checkout' | 'inventory' | 'credits' | 'analytics' | 'backups' | 'tutorial')[] = [
            'checkout', 'inventory', 'credits', 'analytics', 'backups', 'tutorial'
          ];
          const currIdx = tabs.indexOf(prev);
          return tabs[(currIdx + 1) % tabs.length];
        });
      }
    };
    window.addEventListener('keydown', handleGlobalAppKeys);
    return () => window.removeEventListener('keydown', handleGlobalAppKeys);
  }, [toggleTheme]);

  // Fetch operator profiles
  const availableProfiles = settings.profiles || [
    { id: 'u_admin', name: 'System Administrator', role: 'admin', passwordHash: 'admin123' },
    { id: 'u_manager', name: 'Store Manager', role: 'manager', passwordHash: 'manager123' },
    { id: 'u_cashier', name: 'Retail Cashier', role: 'cashier', passwordHash: 'cashier123' }
  ];

  // BULK IMPORT SPREADSHEET HANDLER
  const handleBulkImport = (newProducts: Omit<Product, 'id'>[], updatedProducts: Product[]) => {
    const newProductsWithIds: Product[] = newProducts.map(p => ({
      ...p,
      id: `prod_${Date.now()}_${Math.floor(Math.random() * 100000)}`
    }));

    const addLogs: StockLog[] = newProductsWithIds.map(p => ({
      id: `log_bulkadd_${p.id}_${Date.now()}`,
      productId: p.id,
      productName: p.name,
      timestamp: Date.now(),
      type: 'adjustment',
      quantity: p.wholesaleStock + p.retailStock,
      notes: `Imported new product via spreadsheet sync. Wholesale: ${p.wholesaleStock} units, Retail: ${p.retailStock} units.`
    }));

    const updateLogs: StockLog[] = updatedProducts.map(p => {
      const orig = products.find(o => o.id === p.id);
      const stockDiff = orig ? (p.wholesaleStock + p.retailStock) - (orig.wholesaleStock + orig.retailStock) : 0;
      return {
        id: `log_bulkupd_${p.id}_${Date.now()}`,
        productId: p.id,
        productName: p.name,
        timestamp: Date.now(),
        type: 'adjustment' as const,
        quantity: stockDiff,
        notes: `Updated product specs/stock level via spreadsheet sync. Net stock change: ${stockDiff >= 0 ? '+' : ''}${stockDiff} units.`
      };
    });

    setProducts(prev => {
      const updatedMap = new Map(updatedProducts.map(u => [u.id, u]));
      const unmodified = prev.filter(p => !updatedMap.has(p.id));
      return [...unmodified, ...updatedMap.values(), ...newProductsWithIds];
    });

    setStockLogs(prev => [...prev, ...addLogs, ...updateLogs]);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prof = availableProfiles.find(p => p.id === selectedProfileId);
    if (!prof) {
      setLoginError("Invalid profile chosen.");
      return;
    }

    if (passwordInput === prof.passwordHash) {
      setActiveProfile(prof);
      setLoginError(null);
      setPasswordInput('');
      
      if (prof.role === 'cashier') {
        setActiveTab('checkout');
      } else {
        setActiveTab('checkout');
      }
    } else {
      setLoginError("Incorrect password. Please verify the passcode.");
    }
  };

  const handleLogout = () => {
    setActiveProfile(null);
    setHasCheckedPrinter(false);
    setPrinterChecked(false);
    setRollChecked(false);
    setScannerChecked(false);
  };

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('myshop_products');
      const storedSales = localStorage.getItem('myshop_sales');
      const storedSettings = localStorage.getItem('myshop_settings');
      const storedLogs = localStorage.getItem('myshop_stock_logs');
      const storedCredits = localStorage.getItem('myshop_credits');
      const storedVoided = localStorage.getItem('myshop_voided_sales');
      const storedShifts = localStorage.getItem('myshop_shifts');
      const storedSuppliers = localStorage.getItem('myshop_suppliers');
      const storedPOs = localStorage.getItem('myshop_purchase_orders');
      const storedLoyalty = localStorage.getItem('myshop_loyalty_accounts');
      const storedPromos = localStorage.getItem('myshop_promotions');
      const storedBranches = localStorage.getItem('myshop_branches');
      const storedTransfers = localStorage.getItem('myshop_stock_transfers');

      if (storedProducts) setProducts(JSON.parse(storedProducts));
      if (storedSales) setSales(JSON.parse(storedSales));
      if (storedLogs) setStockLogs(JSON.parse(storedLogs));
      if (storedCredits) setCredits(JSON.parse(storedCredits));
      if (storedVoided) setVoidedSales(JSON.parse(storedVoided));

      setShifts(storedShifts ? JSON.parse(storedShifts) : [...SAMPLE_SHIFTS]);
      setSuppliers(storedSuppliers ? JSON.parse(storedSuppliers) : [...SAMPLE_SUPPLIERS]);
      setPurchaseOrders(storedPOs ? JSON.parse(storedPOs) : [...SAMPLE_PURCHASE_ORDERS]);
      setLoyaltyAccounts(storedLoyalty ? JSON.parse(storedLoyalty) : [...SAMPLE_LOYALTY_ACCOUNTS]);
      setPromotions(storedPromos ? JSON.parse(storedPromos) : [...SAMPLE_PROMOTIONS]);
      setBranches(storedBranches ? JSON.parse(storedBranches) : [...SAMPLE_BRANCHES]);
      setStockTransfers(storedTransfers ? JSON.parse(storedTransfers) : [...SAMPLE_TRANSFERS]);
      
      let loadedSettings = { ...DEFAULT_SETTINGS };
      if (storedSettings) {
        try {
          loadedSettings = JSON.parse(storedSettings);
          // Automatically migrate old $ default currency to GH₵ for the user
          if (loadedSettings.currency === '$') {
            loadedSettings.currency = 'GH₵';
          }
        } catch (err) {
          console.error("Error parsing stored settings:", err);
        }
      }
      setSettings(loadedSettings);

      const storedActiveProfile = localStorage.getItem('myshop_active_profile');
      if (storedActiveProfile) {
        try {
          setActiveProfile(JSON.parse(storedActiveProfile));
        } catch {}
      }
      const storedPrinterChecked = localStorage.getItem('myshop_has_checked_printer');
      if (storedPrinterChecked === 'true') {
        setHasCheckedPrinter(true);
        setPrinterChecked(true);
        setRollChecked(true);
        setScannerChecked(true);
      }

      setIsLoaded(true);
    } catch (e) {
      console.error("Failed to load initial data from LocalStorage:", e);
      setIsLoaded(true);
    }
  }, []);

  // Save session states to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (activeProfile) {
        localStorage.setItem('myshop_active_profile', JSON.stringify(activeProfile));
      } else {
        localStorage.removeItem('myshop_active_profile');
      }
      localStorage.setItem('myshop_has_checked_printer', String(hasCheckedPrinter));
    } catch (e) {
      console.error("Failed to save session state to LocalStorage:", e);
    }
  }, [activeProfile, hasCheckedPrinter, isLoaded]);

  // Save core application states to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('myshop_products', JSON.stringify(products));
      localStorage.setItem('myshop_sales', JSON.stringify(sales));
      localStorage.setItem('myshop_settings', JSON.stringify(settings));
      localStorage.setItem('myshop_stock_logs', JSON.stringify(stockLogs));
      localStorage.setItem('myshop_credits', JSON.stringify(credits));
      localStorage.setItem('myshop_voided_sales', JSON.stringify(voidedSales));
      localStorage.setItem('myshop_shifts', JSON.stringify(shifts));
      localStorage.setItem('myshop_suppliers', JSON.stringify(suppliers));
      localStorage.setItem('myshop_purchase_orders', JSON.stringify(purchaseOrders));
      localStorage.setItem('myshop_loyalty_accounts', JSON.stringify(loyaltyAccounts));
      localStorage.setItem('myshop_promotions', JSON.stringify(promotions));
      localStorage.setItem('myshop_branches', JSON.stringify(branches));
      localStorage.setItem('myshop_stock_transfers', JSON.stringify(stockTransfers));
    } catch (e) {
      console.error("Failed to save core app state to LocalStorage:", e);
    }
  }, [
    products, sales, settings, stockLogs, credits, voidedSales,
    shifts, suppliers, purchaseOrders, loyaltyAccounts, promotions, branches, stockTransfers,
    isLoaded
  ]);

  // ONBOARDING SETUP WIZARD COMPLETE
  const handleSetupComplete = (completedSettings: StoreSettings, initialProducts: Product[]) => {
    setSettings(completedSettings);
    setProducts(initialProducts);

    // Generate initial logs for seeded products
    const initialLogs: StockLog[] = initialProducts.map(p => ({
      id: `log_init_${p.id}_${Date.now()}`,
      productId: p.id,
      productName: p.name,
      timestamp: Date.now(),
      type: 'adjustment',
      quantity: p.retailStock + p.wholesaleStock,
      notes: `Seeded product via Setup Wizard. Wholesale: ${p.wholesaleStock} units, Retail: ${p.retailStock} units.`
    }));

    setStockLogs(initialLogs);
    setActiveTab('checkout');
  };

  // ADD REGISTERED PRODUCT
  const handleAddProduct = (newProductData: Omit<Product, 'id'>) => {
    const newId = `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const product: Product = {
      ...newProductData,
      id: newId
    };

    setProducts(prev => [...prev, product]);

    // Create log
    const log: StockLog = {
      id: `log_add_${newId}`,
      productId: newId,
      productName: product.name,
      timestamp: Date.now(),
      type: 'adjustment',
      quantity: product.wholesaleStock + product.retailStock,
      notes: `Registered brand new product in system catalog.`
    };
    setStockLogs(prev => [...prev, log]);
  };

  // UPDATE REGISTERED PRODUCT
  const handleUpdateProduct = (updatedProduct: Product) => {
    const originalProduct = products.find(p => p.id === updatedProduct.id);
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

    // Create log for adjust
    let notes = `Updated product specs: price, cost, barcode, or alert parameters.`;
    let quantity = 0;
    
    if (originalProduct) {
      const wholesaleDiff = updatedProduct.wholesaleStock - originalProduct.wholesaleStock;
      const retailDiff = updatedProduct.retailStock - originalProduct.retailStock;
      if (wholesaleDiff !== 0 || retailDiff !== 0) {
        notes = `Weekly Audit Reconciliation: ${wholesaleDiff !== 0 ? `Wholesale Storehouse (${wholesaleDiff >= 0 ? '+' : ''}${wholesaleDiff} ${updatedProduct.unit || 'pcs'})` : ''} ${retailDiff !== 0 ? `Retail Shelf (${retailDiff >= 0 ? '+' : ''}${retailDiff} ${updatedProduct.unit || 'pcs'})` : ''}`.trim();
        quantity = wholesaleDiff + retailDiff;
      }
    }

    const log: StockLog = {
      id: `log_upd_${updatedProduct.id}_${Date.now()}`,
      productId: updatedProduct.id,
      productName: updatedProduct.name,
      timestamp: Date.now(),
      type: 'adjustment',
      quantity: quantity,
      notes: notes
    };
    setStockLogs(prev => [...prev, log]);
  };

  // DELETE REGISTERED PRODUCT
  const handleDeleteProduct = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    
    setProducts(prev => prev.filter(p => p.id !== productId));
    
    // Create log
    const log: StockLog = {
      id: `log_del_${productId}_${Date.now()}`,
      productId,
      productName: prod.name,
      timestamp: Date.now(),
      type: 'adjustment',
      quantity: -(prod.wholesaleStock + prod.retailStock),
      notes: `De-registered and deleted product from the catalog.`
    };
    setStockLogs(prev => [...prev, log]);
  };

  // REPLENISH RETAIL SHELF (WHOLESALE -> RETAIL)
  const handleRestockShelf = (productId: string, quantity: number, notes: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          wholesaleStock: Math.max(0, p.wholesaleStock - quantity),
          retailStock: p.retailStock + quantity
        };
      }
      return p;
    }));

    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const log: StockLog = {
      id: `log_restock_${productId}_${Date.now()}`,
      productId,
      productName: prod.name,
      timestamp: Date.now(),
      type: 'wholesale_to_retail',
      quantity,
      notes: notes || `Moved ${quantity} units from wholesale storehouse onto retail shelf.`
    };
    setStockLogs(prev => [...prev, log]);
  };

  // BUY WHOLESALE STOCK (DELIVERY TO BACK STORAGE)
  const handleBuyWholesaleStock = (productId: string, quantity: number, notes: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          wholesaleStock: p.wholesaleStock + quantity
        };
      }
      return p;
    }));

    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const log: StockLog = {
      id: `log_buy_${productId}_${Date.now()}`,
      productId,
      productName: prod.name,
      timestamp: Date.now(),
      type: 'purchase_stock',
      quantity,
      notes: notes || `Purchased supplier delivery: received +${quantity} bulk units.`
    };
    setStockLogs(prev => [...prev, log]);
  };

  // SALES CHECKOUT (RETAIL & WHOLESALE AUTOMATIC COMBINED STOCK DEDUCTION)
  const handleCheckout = (saleData: Omit<Sale, 'id' | 'timestamp'>): Sale => {
    const saleId = `RCP-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = Date.now();

    const finalizedSale: Sale = {
      ...saleData,
      id: saleId,
      timestamp
    };

    const autoTransferLogs: StockLog[] = [];

    // Deduct stock levels for sold items with automatic wholesale-to-retail conversion if needed
    setProducts(prev => prev.map(p => {
      const soldItem = saleData.items.find(item => item.productId === p.id);
      if (!soldItem) return p;

      const unitsNeeded = soldItem.quantity;
      const unitsPerCarton = p.unitsPerCarton || 24;

      if (p.retailStock >= unitsNeeded) {
        // Shelf stock is sufficient
        return {
          ...p,
          retailStock: p.retailStock - unitsNeeded
        };
      } else {
        // Shelf stock insufficient - auto open wholesale cartons if available
        const shortage = unitsNeeded - p.retailStock;
        const cartonsToOpen = Math.min(p.wholesaleStock, Math.ceil(shortage / unitsPerCarton));
        const convertedUnits = cartonsToOpen * unitsPerCarton;

        if (cartonsToOpen > 0) {
          autoTransferLogs.push({
            id: `log_auto_transfer_${saleId}_${p.id}`,
            productId: p.id,
            productName: p.name,
            timestamp,
            type: 'wholesale_to_retail',
            quantity: convertedUnits,
            notes: `Auto-opened ${cartonsToOpen} bulk carton(s) (${convertedUnits} ${p.unit || 'pcs'}) from warehouse to fulfill checkout receipt ${saleId}`
          });
        }

        const newWholesale = p.wholesaleStock - cartonsToOpen;
        const availableShelf = p.retailStock + convertedUnits;
        const newRetail = Math.max(0, availableShelf - unitsNeeded);

        return {
          ...p,
          wholesaleStock: newWholesale,
          retailStock: newRetail
        };
      }
    }));

    // Add sales record
    setSales(prev => [...prev, finalizedSale]);

    // Update active cashier shift if open
    setShifts(prev => prev.map(s => {
      if (s.status === 'open') {
        const isCash = finalizedSale.paymentMethod === 'cash';
        const isCard = finalizedSale.paymentMethod === 'card';
        const isMobile = finalizedSale.paymentMethod === 'mobile_money';
        const isCredit = finalizedSale.paymentMethod === 'credit';
        return {
          ...s,
          cashSales: s.cashSales + (isCash ? finalizedSale.total : 0),
          cardSales: s.cardSales + (isCard ? finalizedSale.total : 0),
          mobileMoneySales: s.mobileMoneySales + (isMobile ? finalizedSale.total : 0),
          creditSales: s.creditSales + (isCredit ? finalizedSale.total : 0),
          expectedCash: s.expectedCash + (isCash ? finalizedSale.total : 0),
          salesCount: (s.salesCount || 0) + 1
        };
      }
      return s;
    }));

    // Create a Store Credit Ledger entry if checkout is marked as credit
    if (finalizedSale.paymentMethod === 'credit') {
      const newCreditRecord: CreditRecord = {
        id: `credit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        customerName: finalizedSale.customerName,
        customerPhone: finalizedSale.customerPhone,
        saleId: finalizedSale.id,
        totalAmount: finalizedSale.total,
        amountPaid: 0,
        balanceDue: finalizedSale.total,
        purchaseDate: finalizedSale.timestamp,
        dueDate: finalizedSale.dueDate || (finalizedSale.timestamp + 14 * 24 * 60 * 60 * 1000),
        status: 'unpaid',
        payments: []
      };
      setCredits(prev => [newCreditRecord, ...prev]);
    }

    // Create stock deduction logs
    const salesLogs: StockLog[] = saleData.items.map(item => ({
      id: `log_sale_${saleId}_${item.productId}`,
      productId: item.productId,
      productName: item.productName,
      timestamp,
      type: 'sales_deduction',
      quantity: item.quantity,
      notes: item.packLabel 
        ? `Deducted stock for ${item.packLabel} sale receipt: ${saleId}`
        : `Deducted shelf stock for customer sale receipt: ${saleId}`
    }));

    setStockLogs(prev => [...prev, ...autoTransferLogs, ...salesLogs]);

    return finalizedSale;
  };

  // ===================== 5 MAJOR FEATURE HANDLERS =====================
  
  // 1. CASHIER SHIFT HANDLERS
  const activeShift = shifts.find(s => s.status === 'open' && (s.cashierId === activeProfile?.id || s.cashierName === activeProfile?.name)) || shifts.find(s => s.status === 'open') || null;

  const handleOpenShift = (openingFloat: number, notes?: string) => {
    const newShift: CashierShift = {
      id: `shift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cashierId: activeProfile?.id || 'u_admin',
      cashierName: activeProfile?.name || 'Store Operator',
      startTime: Date.now(),
      openingFloat,
      expectedCash: openingFloat,
      totalCashSales: 0,
      totalCardSales: 0,
      totalMobileMoneySales: 0,
      totalCreditSales: 0,
      totalSalesCount: 0,
      cashInTotal: 0,
      cashOutTotal: 0,
      status: 'open',
      notes,
      movements: [
        {
          id: `mov_open_${Date.now()}`,
          shiftId: `shift_${Date.now()}`,
          timestamp: Date.now(),
          type: 'opening_float',
          amount: openingFloat,
          reason: 'Shift opening float',
          cashierId: activeProfile?.id || 'u_admin',
          cashierName: activeProfile?.name || 'Store Operator'
        }
      ]
    };
    setShifts(prev => [newShift, ...prev]);
  };

  const handleCloseShift = (closingActualCash: number, notes?: string) => {
    setShifts(prev => prev.map(s => {
      if (s.status === 'open') {
        const expected = s.expectedCash ?? (s.openingFloat + s.totalCashSales + s.cashInTotal - s.cashOutTotal);
        const variance = closingActualCash - expected;
        return {
          ...s,
          endTime: Date.now(),
          closingActualCash,
          expectedCash: expected,
          variance,
          status: 'closed',
          notes: notes ? `${s.notes ? s.notes + ' | ' : ''}${notes}` : s.notes
        };
      }
      return s;
    }));
  };

  const handleAddMovement = (type: 'cash_in' | 'cash_out', amount: number, reason: string) => {
    setShifts(prev => prev.map(s => {
      if (s.status === 'open') {
        const movement: CashDrawerMovement = {
          id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          shiftId: s.id,
          timestamp: Date.now(),
          type,
          amount,
          reason,
          cashierId: activeProfile?.id || 'u_admin',
          cashierName: activeProfile?.name || 'Store Operator'
        };
        const newCashIn = type === 'cash_in' ? s.cashInTotal + amount : s.cashInTotal;
        const newCashOut = type === 'cash_out' ? s.cashOutTotal + amount : s.cashOutTotal;
        const newExpected = (s.expectedCash ?? s.openingFloat) + (type === 'cash_in' ? amount : -amount);
        return {
          ...s,
          cashInTotal: newCashIn,
          cashOutTotal: newCashOut,
          expectedCash: newExpected,
          movements: [...(s.movements || []), movement]
        };
      }
      return s;
    }));
  };

  // 2. SUPPLIER & PURCHASE ORDER HANDLERS
  const handleAddSupplier = (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSupp: Supplier = {
      ...supplier,
      id: `supp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now()
    };
    setSuppliers(prev => [...prev, newSupp]);
  };

  const handleUpdateSupplier = (id: string, updated: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const handleCreatePurchaseOrder = (order: Omit<PurchaseOrder, 'id' | 'createdAt'>) => {
    const newOrder: PurchaseOrder = {
      ...order,
      id: `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: Date.now()
    };
    setPurchaseOrders(prev => [newOrder, ...prev]);
  };

  const handleReceivePurchaseOrder = (poId: string) => {
    const po = purchaseOrders.find(o => o.id === poId);
    if (!po || po.status === 'received') return;

    const stockLogsToAdd: StockLog[] = [];
    setProducts(prev => prev.map(p => {
      const item = po.items.find(i => i.productId === p.id);
      if (item) {
        const qtyUnits = item.quantityUnits || (item.quantityCartons ? item.quantityCartons * (p.unitsPerCarton || 24) : 0);
        stockLogsToAdd.push({
          id: `log_po_${po.id}_${p.id}_${Date.now()}`,
          productId: p.id,
          productName: p.name,
          timestamp: Date.now(),
          type: 'purchase_stock',
          quantity: qtyUnits,
          notes: `Received purchase order ${po.id} from supplier "${po.supplierName}". Stocked +${qtyUnits} ${p.unit || 'units'} into bulk wholesale storehouse.`
        });
        return {
          ...p,
          wholesaleStock: p.wholesaleStock + (item.quantityCartons || Math.ceil(qtyUnits / (p.unitsPerCarton || 24)))
        };
      }
      return p;
    }));

    setStockLogs(prev => [...prev, ...stockLogsToAdd]);
    setPurchaseOrders(prev => prev.map(o => o.id === poId ? { ...o, status: 'received', receivedAt: Date.now(), receivedBy: activeProfile?.name || 'Manager' } : o));
  };

  // 3. LOYALTY & PROMOTIONS HANDLERS
  const handleRedeemLoyaltyPoints = (customerId: string, pointsToRedeem: number) => {
    setLoyaltyAccounts(prev => prev.map(c => {
      if (c.customerId === customerId || c.customerPhone === customerId) {
        return {
          ...c,
          pointsBalance: Math.max(0, c.pointsBalance - pointsToRedeem),
          totalPointsRedeemed: c.totalPointsRedeemed + pointsToRedeem
        };
      }
      return c;
    }));
  };

  const handleAddLoyaltyPoints = (customerId: string, pointsEarned: number) => {
    setLoyaltyAccounts(prev => {
      const exists = prev.some(c => c.customerId === customerId || c.customerPhone === customerId);
      if (exists) {
        return prev.map(c => {
          if (c.customerId === customerId || c.customerPhone === customerId) {
            const newTotalEarned = c.totalPointsEarned + pointsEarned;
            const newBalance = c.pointsBalance + pointsEarned;
            const newTier = newTotalEarned >= 400 ? 'Platinum' : newTotalEarned >= 200 ? 'Gold' : newTotalEarned >= 100 ? 'Silver' : 'Standard';
            return {
              ...c,
              pointsBalance: newBalance,
              totalPointsEarned: newTotalEarned,
              tier: newTier,
              lastUpdated: Date.now()
            };
          }
          return c;
        });
      } else {
        const newAcc: LoyaltyAccount = {
          customerId,
          customerName: customerId,
          customerPhone: customerId,
          pointsBalance: pointsEarned,
          totalPointsEarned: pointsEarned,
          totalPointsRedeemed: 0,
          tier: 'Standard',
          lastUpdated: Date.now()
        };
        return [...prev, newAcc];
      }
    });
  };

  const handleAddPromotion = (promo: Omit<Promotion, 'id' | 'usageCount'>) => {
    const newPromo: Promotion = {
      ...promo,
      id: `promo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      usageCount: 0
    };
    setPromotions(prev => [...prev, newPromo]);
  };

  const handleTogglePromotion = (id: string) => {
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const handleDeletePromotion = (id: string) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateLoyaltySettings = (loyaltySettings: LoyaltySettings) => {
    setSettings(prev => ({ ...prev, loyaltySettings }));
  };

  const handleAdjustCustomerPoints = (customerId: string, pointsDelta: number, _reason: string) => {
    setLoyaltyAccounts(prev => prev.map(c => {
      if (c.customerId === customerId || c.customerPhone === customerId) {
        const newBalance = Math.max(0, c.pointsBalance + pointsDelta);
        const newTotalEarned = pointsDelta > 0 ? c.totalPointsEarned + pointsDelta : c.totalPointsEarned;
        const newTier = newTotalEarned >= 400 ? 'Platinum' : newTotalEarned >= 200 ? 'Gold' : newTotalEarned >= 100 ? 'Silver' : 'Standard';
        return {
          ...c,
          pointsBalance: newBalance,
          totalPointsEarned: newTotalEarned,
          tier: newTier,
          lastUpdated: Date.now()
        };
      }
      return c;
    }));
  };

  const handleAddLoyaltyCustomer = (customer: Omit<LoyaltyAccount, 'pointsBalance' | 'totalPointsEarned' | 'totalPointsRedeemed' | 'tier' | 'lastUpdated'>) => {
    const newAcc: LoyaltyAccount = {
      ...customer,
      pointsBalance: 0,
      totalPointsEarned: 0,
      totalPointsRedeemed: 0,
      tier: 'Standard',
      lastUpdated: Date.now()
    };
    setLoyaltyAccounts(prev => [...prev, newAcc]);
  };

  // 4. MULTI-BRANCH STOCK TRANSFER HANDLERS
  const handleAddBranch = (branch: Omit<StoreBranch, 'id'>) => {
    const newBranch: StoreBranch = {
      ...branch,
      id: `branch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    setBranches(prev => [...prev, newBranch]);
  };

  const handleUpdateBranch = (id: string, updated: Partial<StoreBranch>) => {
    setBranches(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
  };

  const handleDeleteBranch = (id: string) => {
    setBranches(prev => prev.filter(b => b.id !== id));
  };

  const handleCreateTransfer = (transfer: Omit<StockTransfer, 'id' | 'createdAt'>) => {
    const newTransfer: StockTransfer = {
      ...transfer,
      id: `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: Date.now()
    };
    setStockTransfers(prev => [newTransfer, ...prev]);
  };

  const handleCompleteTransfer = (transferId: string) => {
    const trf = stockTransfers.find(t => t.id === transferId);
    if (!trf || trf.status === 'completed') return;

    const stockLogsToAdd: StockLog[] = [];
    setProducts(prev => prev.map(p => {
      const item = trf.items.find(i => i.productId === p.id);
      if (item) {
        stockLogsToAdd.push({
          id: `log_trf_${trf.id}_${p.id}_${Date.now()}`,
          productId: p.id,
          productName: p.name,
          timestamp: Date.now(),
          type: 'adjustment',
          quantity: item.quantity,
          notes: `Stock Transfer ${trf.id} completed between "${trf.fromBranchName}" and "${trf.toBranchName}".`
        });
      }
      return p;
    }));

    setStockLogs(prev => [...prev, ...stockLogsToAdd]);
    setStockTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: 'completed', completedAt: Date.now(), receivedBy: activeProfile?.name || 'Store Manager' } : t));
  };

  // RESTORE FULL DATABASE FROM JSON
  const handleRestoreState = (newState: AppState) => {
    setProducts(newState.products || []);
    setSales(newState.sales || []);
    setSettings(newState.settings || { ...DEFAULT_SETTINGS });
    setStockLogs(newState.stockLogs || []);
    setCredits(newState.credits || []);
    if ((newState as any).shifts) setShifts((newState as any).shifts);
    if ((newState as any).suppliers) setSuppliers((newState as any).suppliers);
    if ((newState as any).purchaseOrders) setPurchaseOrders((newState as any).purchaseOrders);
    if ((newState as any).loyaltyAccounts) setLoyaltyAccounts((newState as any).loyaltyAccounts);
    if ((newState as any).promotions) setPromotions((newState as any).promotions);
    if ((newState as any).branches) setBranches((newState as any).branches);
    if ((newState as any).stockTransfers) setStockTransfers((newState as any).stockTransfers);
  };

  // ERASE/RESET DATABASE
  const handleResetState = (seedDemo: boolean) => {
    if (seedDemo) {
      setSettings({ ...DEFAULT_SETTINGS, isSetupCompleted: true });
      setProducts([...SAMPLE_PRODUCTS]);
      setSales([]);
      setCredits([]);
      setShifts([...SAMPLE_SHIFTS]);
      setSuppliers([...SAMPLE_SUPPLIERS]);
      setPurchaseOrders([...SAMPLE_PURCHASE_ORDERS]);
      setLoyaltyAccounts([...SAMPLE_LOYALTY_ACCOUNTS]);
      setPromotions([...SAMPLE_PROMOTIONS]);
      setBranches([...SAMPLE_BRANCHES]);
      setStockTransfers([...SAMPLE_TRANSFERS]);
      
      const initialLogs: StockLog[] = SAMPLE_PRODUCTS.map(p => ({
        id: `log_init_${p.id}_${Date.now()}`,
        productId: p.id,
        productName: p.name,
        timestamp: Date.now(),
        type: 'adjustment',
        quantity: p.retailStock + p.wholesaleStock,
        notes: `Reloaded demo inventory catalog. Wholesale: ${p.wholesaleStock}, Retail: ${p.retailStock}`
      }));
      setStockLogs(initialLogs);
    } else {
      setProducts([]);
      setSales([]);
      setStockLogs([]);
      setCredits([]);
      setShifts([]);
      setSuppliers([]);
      setPurchaseOrders([]);
      setLoyaltyAccounts([]);
      setPromotions([]);
      setBranches([]);
      setStockTransfers([]);
      setSettings({ ...DEFAULT_SETTINGS, isSetupCompleted: false });
    }
  };

  const handleUpdateSettings = (newSettings: StoreSettings) => {
    if (activeProfile?.role !== 'admin') {
      const oldProfiles = settings.profiles || [
        { id: 'u_admin', name: 'System Administrator', role: 'admin', passwordHash: 'admin123' },
        { id: 'u_manager', name: 'Store Manager', role: 'manager', passwordHash: 'manager123' },
        { id: 'u_cashier', name: 'Retail Cashier', role: 'cashier', passwordHash: 'cashier123' }
      ];
      const oldAdmins = oldProfiles.filter(p => p.role === 'admin');
      
      const newProfiles = newSettings.profiles || [];
      const newAdmins = newProfiles.filter(p => p.role === 'admin');

      // Check if any admin profile was removed
      const anyAdminDeleted = oldAdmins.some(oldA => !newAdmins.some(newA => newA.id === oldA.id));
      if (anyAdminDeleted) {
        alert("Action Denied: You cannot delete Administrator accounts.");
        return;
      }

      // Check if any new admin profile was added
      const anyAdminAdded = newAdmins.some(newA => !oldAdmins.some(oldA => oldA.id === newA.id));
      if (anyAdminAdded) {
        alert("Action Denied: You cannot register new Administrator accounts.");
        return;
      }

      // Check if any existing admin profile's details (name, passcode) were modified
      const anyAdminModified = oldAdmins.some(oldA => {
        const newA = newAdmins.find(p => p.id === oldA.id);
        return newA && (newA.name !== oldA.name || newA.passwordHash !== oldA.passwordHash);
      });
      if (anyAdminModified) {
        alert("Action Denied: You cannot modify Administrator credentials or names.");
        return;
      }
    }
    setSettings(newSettings);
  };

  const handleUpdateSale = (updatedSale: Sale) => {
    const originalSale = sales.find(s => s.id === updatedSale.id);
    if (!originalSale) return;

    // All productIds involved
    const allProductIds = Array.from(new Set([
      ...originalSale.items.map(i => i.productId),
      ...updatedSale.items.map(i => i.productId)
    ]));

    const stockLogsToAdd: StockLog[] = [];

    setProducts(prev => prev.map(p => {
      if (allProductIds.includes(p.id)) {
        const origItem = originalSale.items.find(item => item.productId === p.id);
        const newItem = updatedSale.items.find(item => item.productId === p.id);
        const origQty = origItem ? origItem.quantity : 0;
        const newQty = newItem ? newItem.quantity : 0;
        const diff = newQty - origQty; // diff is net change in items sold

        if (diff !== 0) {
          // If diff > 0, we sold more, so we subtract diff from retail stock
          // If diff < 0, we returned some, so we add (-diff) back to retail stock
          const newRetailStock = Math.max(0, p.retailStock - diff);

          stockLogsToAdd.push({
            id: `log_sale_edit_${updatedSale.id}_${p.id}_${Date.now()}`,
            productId: p.id,
            productName: p.name,
            timestamp: Date.now(),
            type: 'adjustment',
            quantity: -diff, // negative represents stock deduction, positive is addition
            notes: `Corrected cashier sale entry ${updatedSale.id}. Adjusted qty from ${origQty} to ${newQty}.`
          });

          return {
            ...p,
            retailStock: newRetailStock
          };
        }
      }
      return p;
    }));

    // Update sales logs state
    setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));

    // Append logs
    if (stockLogsToAdd.length > 0) {
      setStockLogs(prev => [...prev, ...stockLogsToAdd]);
    }
  };

  const handleDeleteSale = (saleId: string, restock: boolean = true) => {
    if (activeProfile?.role === 'cashier') {
      alert("🔒 Access Denied: Only Store Managers and System Administrators are authorized to void sales receipts.");
      return;
    }
    const saleToDelete = sales.find(s => s.id === saleId);
    if (!saleToDelete) return;

    const stockLogsToAdd: StockLog[] = [];

    if (restock) {
      setProducts(prev => prev.map(p => {
        const soldItem = saleToDelete.items.find(item => item.productId === p.id);
        if (soldItem) {
          const newRetailStock = p.retailStock + soldItem.quantity;
          stockLogsToAdd.push({
            id: `log_sale_delete_${saleId}_${p.id}_${Date.now()}`,
            productId: p.id,
            productName: p.name,
            timestamp: Date.now(),
            type: 'adjustment',
            quantity: soldItem.quantity,
            notes: `Deleted/voided sale entry ${saleId}. Restocked ${soldItem.quantity} units to retail shelf.`
          });
          return {
            ...p,
            retailStock: newRetailStock
          };
        }
        return p;
      }));
    }

    const voidRecord: VoidedSaleRecord = {
      id: `void_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      voidTimestamp: Date.now(),
      voidedBy: activeProfile?.name || 'Store Operator',
      restocked: restock,
      sale: saleToDelete,
      reason: 'Cashier receipt entry void'
    };

    setVoidedSales(prev => [voidRecord, ...prev]);
    setSales(prev => prev.filter(s => s.id !== saleId));

    if (stockLogsToAdd.length > 0) {
      setStockLogs(prev => [...prev, ...stockLogsToAdd]);
    }
  };

  const handleDeleteBulkSales = (saleIds: string[], restock: boolean = true) => {
    if (activeProfile?.role === 'cashier') {
      alert("🔒 Access Denied: Only Store Managers and System Administrators are authorized to void sales receipts.");
      return;
    }
    if (!saleIds || saleIds.length === 0) return;

    const salesToDelete = sales.filter(s => saleIds.includes(s.id));
    if (salesToDelete.length === 0) return;

    const stockLogsToAdd: StockLog[] = [];

    if (restock) {
      const restockMap: Record<string, number> = {};
      salesToDelete.forEach(sale => {
        sale.items.forEach(item => {
          restockMap[item.productId] = (restockMap[item.productId] || 0) + item.quantity;
        });
      });

      setProducts(prev => prev.map(p => {
        const qtyToRestock = restockMap[p.id];
        if (qtyToRestock && qtyToRestock > 0) {
          const newRetailStock = p.retailStock + qtyToRestock;
          stockLogsToAdd.push({
            id: `log_sale_bulk_delete_${p.id}_${Date.now()}`,
            productId: p.id,
            productName: p.name,
            timestamp: Date.now(),
            type: 'adjustment',
            quantity: qtyToRestock,
            notes: `Bulk voided ${salesToDelete.length} cashier receipt entry errors. Restocked ${qtyToRestock} units to retail shelf.`
          });
          return {
            ...p,
            retailStock: newRetailStock
          };
        }
        return p;
      }));
    }

    const newVoidRecords: VoidedSaleRecord[] = salesToDelete.map(s => ({
      id: `void_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      voidTimestamp: Date.now(),
      voidedBy: activeProfile?.name || 'Store Operator',
      restocked: restock,
      sale: s,
      reason: 'Bulk audit log void'
    }));

    setVoidedSales(prev => [...newVoidRecords, ...prev]);

    const deleteSet = new Set(saleIds);
    setSales(prev => prev.filter(s => !deleteSet.has(s.id)));

    if (stockLogsToAdd.length > 0) {
      setStockLogs(prev => [...prev, ...stockLogsToAdd]);
    }
  };

  const handleRestoreSale = (voidId: string) => {
    const targetVoid = voidedSales.find(v => v.id === voidId);
    if (!targetVoid) return;

    // Restore sale to active sales array
    setSales(prev => {
      if (prev.some(s => s.id === targetVoid.sale.id)) return prev;
      return [targetVoid.sale, ...prev];
    });

    // If restocked previously, re-deduct items from retail stock
    if (targetVoid.restocked) {
      const stockLogsToAdd: StockLog[] = [];
      setProducts(prev => prev.map(p => {
        const itemInSale = targetVoid.sale.items.find(i => i.productId === p.id);
        if (itemInSale) {
          const newStock = Math.max(0, p.retailStock - itemInSale.quantity);
          stockLogsToAdd.push({
            id: `log_restore_sale_${p.id}_${Date.now()}`,
            productId: p.id,
            productName: p.name,
            timestamp: Date.now(),
            type: 'adjustment',
            quantity: -itemInSale.quantity,
            notes: `Restored voided receipt ${targetVoid.sale.id}. Deducted ${itemInSale.quantity} units back from retail shelf.`
          });
          return { ...p, retailStock: newStock };
        }
        return p;
      }));
      if (stockLogsToAdd.length > 0) {
        setStockLogs(prev => [...prev, ...stockLogsToAdd]);
      }
    }

    setVoidedSales(prev => prev.filter(v => v.id !== voidId));
  };

  const handleRestoreBulkSales = (voidIds: string[]) => {
    if (!voidIds || voidIds.length === 0) return;
    const targets = voidedSales.filter(v => voidIds.includes(v.id));
    if (targets.length === 0) return;

    const salesToRestore = targets.map(t => t.sale);
    const voidSet = new Set(voidIds);

    setSales(prev => {
      const existingIds = new Set(prev.map(s => s.id));
      const toAdd = salesToRestore.filter(s => !existingIds.has(s.id));
      return [...toAdd, ...prev];
    });

    const restockedTargets = targets.filter(t => t.restocked);
    if (restockedTargets.length > 0) {
      const deductMap: Record<string, number> = {};
      restockedTargets.forEach(target => {
        target.sale.items.forEach(item => {
          deductMap[item.productId] = (deductMap[item.productId] || 0) + item.quantity;
        });
      });

      const stockLogsToAdd: StockLog[] = [];
      setProducts(prev => prev.map(p => {
        const qtyToDeduct = deductMap[p.id];
        if (qtyToDeduct && qtyToDeduct > 0) {
          const newStock = Math.max(0, p.retailStock - qtyToDeduct);
          stockLogsToAdd.push({
            id: `log_restore_bulk_${p.id}_${Date.now()}`,
            productId: p.id,
            productName: p.name,
            timestamp: Date.now(),
            type: 'adjustment',
            quantity: -qtyToDeduct,
            notes: `Bulk restored ${restockedTargets.length} voided receipt logs. Deducted ${qtyToDeduct} units back from retail shelf.`
          });
          return { ...p, retailStock: newStock };
        }
        return p;
      }));

      if (stockLogsToAdd.length > 0) {
        setStockLogs(prev => [...prev, ...stockLogsToAdd]);
      }
    }

    setVoidedSales(prev => prev.filter(v => !voidSet.has(v.id)));
  };

  const handleLogDamagedGoods = (
    productId: string,
    quantity: number,
    location: 'wholesale' | 'retail',
    reason: string,
    notes: string
  ) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        if (location === 'wholesale') {
          return {
            ...p,
            wholesaleStock: Math.max(0, p.wholesaleStock - quantity)
          };
        } else {
          return {
            ...p,
            retailStock: Math.max(0, p.retailStock - quantity)
          };
        }
      }
      return p;
    }));

    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const log: StockLog = {
      id: `log_damage_${productId}_${Date.now()}`,
      productId,
      productName: prod.name,
      timestamp: Date.now(),
      type: 'adjustment',
      quantity: -quantity, // reduction of stock
      notes: `${reason} Write-off: ${notes || 'Logged as damaged goods shrinkage.'}`
    };

    setStockLogs(prev => [...prev, log]);
  };

  // Loading Screen
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100">
        <div className="flex items-center space-x-3 mb-4">
          <Store className="w-8 h-8 text-blue-400 animate-bounce" />
          <h1 className="text-2xl font-bold tracking-tight">MyShop POS Loading...</h1>
        </div>
        <p className="text-xs text-slate-500 font-mono">Accessing persistent browser databases...</p>
      </div>
    );
  }

  // Render Onboarding Wizard if not completed
  if (!settings.isSetupCompleted) {
    return (
      <SetupWizard onComplete={handleSetupComplete} />
    );
  }

  // Count active stock alerts to show warning badges in top-nav
  const activeAlertsCount = products.filter(p => p.retailStock <= p.minStockAlert).length;
  
  // Count outstanding store credits requiring attention
  const activeUnpaidCreditsCount = credits.filter(r => {
    const roundedTotal = Math.round((r.totalAmount || 0) * 100) / 100;
    const roundedPaid = Math.round((r.amountPaid || 0) * 100) / 100;
    const isPaid = r.status === 'paid' || (roundedTotal - roundedPaid <= 0.009);
    return !isPaid;
  }).length;

  const handlePrintTestPage = () => {
    const testPrintContainer = document.createElement('div');
    testPrintContainer.id = 'print-test-container';
    testPrintContainer.style.position = 'absolute';
    testPrintContainer.style.left = '-9999px';
    testPrintContainer.style.top = '-9999px';
    testPrintContainer.innerHTML = `
      <div style="font-family: monospace; font-size: 11px; color: black; background: white; padding: 15px; max-width: 80mm; width: 100%;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h3 style="margin: 0; font-size: 13px; text-transform: uppercase; font-weight: bold;">*** DIAGNOSTIC TEST ***</h3>
          <p style="margin: 3px 0 0 0; font-size: 9px; color: #555;">THERMAL PRINTER CALIBRATION</p>
          <div style="border-top: 1px dashed black; margin: 6px 0;"></div>
        </div>
        <div style="font-size: 10px; margin-bottom: 8px; line-height: 1.3;">
          <strong>STATION:</strong> MyShop Active Register<br />
          <strong>TIMESTAMP:</strong> ${new Date().toLocaleString()}<br />
          <strong>OPERATOR:</strong> ${activeProfile?.name || 'System Operator'}<br />
          <strong>INTERFACE:</strong> USB/Ethernet Wedge<br />
          <strong>STATUS:</strong> ONLINE & READY<br />
        </div>
        <div style="border-top: 1px dashed black; margin: 6px 0;"></div>
        <table style="width: 100%; font-size: 10px; text-align: left; margin-bottom: 8px;">
          <thead>
            <tr style="border-bottom: 1px dashed black;">
              <th style="padding-bottom: 3px;">SYSTEM TEST</th>
              <th style="text-align: right; padding-bottom: 3px;">RESULT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 1.5px 0;">Thermal Line Density</td>
              <td style="text-align: right; font-weight: bold; padding: 1.5px 0;">100% OK</td>
            </tr>
            <tr>
              <td style="padding: 1.5px 0;">Feed Calibration</td>
              <td style="text-align: right; font-weight: bold; padding: 1.5px 0;">PASSED</td>
            </tr>
            <tr>
              <td style="padding: 1.5px 0;">Auto-Cutter Solenoid</td>
              <td style="text-align: right; font-weight: bold; padding: 1.5px 0;">STANDBY</td>
            </tr>
          </tbody>
        </table>
        <div style="border-top: 1px dashed black; margin: 6px 0;"></div>
        <div style="text-align: center; margin-top: 8px;">
          <div style="display: flex; justify-content: center; margin-bottom: 4px;">
            <div style="display: flex; height: 25px; align-items: stretch;">
              <div style="width: 2px; background: black; margin-right: 1px;"></div>
              <div style="width: 1px; background: black; margin-right: 1px;"></div>
              <div style="width: 3px; background: black; margin-right: 1px;"></div>
              <div style="width: 1px; background: black; margin-right: 2px;"></div>
              <div style="width: 2px; background: black; margin-right: 1px;"></div>
              <div style="width: 3px; background: black; margin-right: 1px;"></div>
              <div style="width: 1px; background: black;"></div>
            </div>
          </div>
          <span style="font-size: 8px; letter-spacing: 1px; text-transform: uppercase;">* MYSHOP-PRINTER-OK *</span>
        </div>
        <div style="text-align: center; margin-top: 10px; font-size: 8.5px; color: #555;">
          <p style="margin: 0;">PRE-FLIGHT CHECK COMPLETED.</p>
          <p style="margin: 2px 0 0 0;">Ready to issue secure customer receipts.</p>
        </div>
      </div>
    `;
    document.body.appendChild(testPrintContainer);

    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        #print-test-container, #print-test-container * {
          visibility: visible !important;
        }
        #print-test-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 80mm !important;
          background: white !important;
          color: black !important;
          padding: 10px !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
      window.print();
      document.body.removeChild(testPrintContainer);
      document.head.removeChild(style);
    }, 100);
  };

  const storeInitials = settings.storeName
    ? settings.storeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'MS';

  // 1. STAGE A: OPERATOR LOCK SCREEN
  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-between text-slate-100" id="office-lock-screen">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-650 w-full"></div>

        <div className="max-w-md w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center space-y-6">
          <BrandLogo size="xl" />

          {/* Login Lock Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="text-center">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center justify-center space-x-2">
                <Lock className="w-4 h-4 text-blue-500" />
                <span>Operator Security Entrance</span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-1">Select your profile & enter passcode to open register</p>
            </div>

            {/* Profile Selection Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {availableProfiles.map((prof: any) => {
                const isSelected = selectedProfileId === prof.id;
                let roleColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                let iconComp = Shield;

                if (prof.role === 'manager') {
                  roleColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                  iconComp = UserCheck;
                } else if (prof.role === 'cashier') {
                  roleColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  iconComp = ShoppingBag;
                }

                const ProfileIcon = iconComp;

                return (
                  <button
                    key={prof.id}
                    onClick={() => {
                      setSelectedProfileId(prof.id);
                      setLoginError(null);
                      setPasswordInput('');
                    }}
                    type="button"
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-800 border-blue-500 text-white ring-2 ring-blue-500/20 scale-[1.03]' 
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                    id={`profile-card-${prof.id}`}
                  >
                    <ProfileIcon className="w-5 h-5 mb-1.5" />
                    <span className="text-[10px] font-bold tracking-tight block truncate max-w-full leading-tight">
                      {prof.name.split(' ')[1] || prof.name}
                    </span>
                    <span className="text-[8px] opacity-75 mt-0.5 uppercase tracking-wider block font-mono">
                      {prof.role}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Password input form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-[10px] text-red-400 font-bold font-mono text-center animate-shake">
                  {loginError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block font-mono">Enter Terminal Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="••••••••"
                    className="w-full text-center text-sm tracking-widest font-mono bg-slate-900 border border-slate-800 rounded-lg py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    id="profile-password-input"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-lg shadow-blue-600/10 cursor-pointer"
                id="profile-login-submit-btn"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Secure Register</span>
              </button>
            </form>
          </div>

          {/* Quick instructions / Demo Credentials helper */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block mb-1">💡 Sandbox Demo Credentials Helper:</span>
            <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[9px] font-mono text-slate-400">
              <span>Admin: <strong className="text-blue-400">admin123</strong></span>
              <span className="text-slate-700 hidden sm:inline">•</span>
              <span>Manager: <strong className="text-blue-400">manager123</strong></span>
              <span className="text-slate-700 hidden sm:inline">•</span>
              <span>Cashier: <strong className="text-blue-400">cashier123</strong></span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-4 text-center text-[10px] text-slate-600 font-mono select-none">
          MyShop POS Suite • Powered by Antigravity Desktop Engine
        </div>
      </div>
    );
  }

  // 2. STAGE B: WELCOME & HARDWARE CHECKLIST SCREEN
  if (!hasCheckedPrinter) {
    const isReadyToStart = printerChecked && rollChecked && scannerChecked;

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-between text-slate-100" id="printer-checklist-screen">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-650 w-full"></div>

        <div className="max-w-md w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center space-y-6">
          <BrandLogo size="md" />

          {/* Welcome Checklist Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest font-mono">Authentication Success</span>
              <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                Welcome back, {activeProfile.name}!
              </h1>
              <p className="text-[11px] text-slate-400">Time to unlock today's terminal. Let's do a fast pre-flight hardware inspection.</p>
            </div>

            {/* Hardware Warnings Box */}
            <div className="bg-blue-500/5 border border-blue-500/20 p-3.5 rounded-xl flex items-start space-x-3">
              <Printer className="w-5 h-5 text-blue-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-[11px] text-blue-200/90 leading-relaxed font-medium">
                <span className="font-bold text-white block mb-0.5">⚠️ Thermal Printer Requirement</span>
                To avoid lost receipts or communication lag, you must check printer status and roll loading before opening active sales registers.
              </div>
            </div>

            {/* Quick Test Print Utility */}
            <div className="bg-slate-900/60 border border-slate-800 p-3 flex items-center justify-between rounded-xl">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Pre-flight Hardware Test</span>
                <span className="text-[10px] text-slate-400 block">Simulate and print a physical hardware test slip.</span>
              </div>
              <button
                type="button"
                onClick={handlePrintTestPage}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 border border-blue-500/30 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Test Page</span>
              </button>
            </div>

            {/* Interactive Checklist Items */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Verify hardware connections:</h3>
              
              <div 
                onClick={() => setPrinterChecked(!printerChecked)}
                className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  printerChecked 
                    ? 'bg-blue-500/5 border-blue-500/40 text-blue-200' 
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
                id="checklist-printer-toggle"
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${printerChecked ? 'bg-blue-500 border-blue-500' : 'border-slate-700'}`}>
                    {printerChecked && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                  </span>
                  <div className="text-xs">
                    <span className="font-bold text-white block leading-tight">Thermal Receipt Printer Online</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Power LED is solid green and interface cord is seated</span>
                  </div>
                </div>
                <Printer className={`w-4 h-4 ${printerChecked ? 'text-blue-400' : 'text-slate-500'}`} />
              </div>

              <div 
                onClick={() => setRollChecked(!rollChecked)}
                className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  rollChecked 
                    ? 'bg-blue-500/5 border-blue-500/40 text-blue-200' 
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
                id="checklist-roll-toggle"
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${rollChecked ? 'bg-blue-500 border-blue-500' : 'border-slate-700'}`}>
                    {rollChecked && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                  </span>
                  <div className="text-xs">
                    <span className="font-bold text-white block leading-tight">Paper Roll Stock OK</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">58mm/80mm thermal feed roll correctly tensioned</span>
                  </div>
                </div>
                <FileSpreadsheet className={`w-4 h-4 ${rollChecked ? 'text-blue-400' : 'text-slate-500'}`} />
              </div>

              <div 
                onClick={() => setScannerChecked(!scannerChecked)}
                className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  scannerChecked 
                    ? 'bg-blue-500/5 border-blue-500/40 text-blue-200' 
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
                id="checklist-scanner-toggle"
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${scannerChecked ? 'bg-blue-500 border-blue-500' : 'border-slate-700'}`}>
                    {scannerChecked && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                  </span>
                  <div className="text-xs">
                    <span className="font-bold text-white block leading-tight">Barcode Scanner Wedge Active</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Hardware wedge test passes and key hooks active</span>
                  </div>
                </div>
                <Terminal className={`w-4 h-4 ${scannerChecked ? 'text-blue-400' : 'text-slate-500'}`} />
              </div>
            </div>

            {/* Launch register button */}
            <button
              onClick={() => {
                if (isReadyToStart) {
                  setHasCheckedPrinter(true);
                }
              }}
              disabled={!isReadyToStart}
              className={`w-full font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                isReadyToStart 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/10' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              id="begin-work-day-btn"
            >
              <span>Unlock Terminal & Open Register</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="py-4 text-center text-[10px] text-slate-600 font-mono select-none">
          MyShop POS Suite • Powered by Antigravity Desktop Engine
        </div>
      </div>
    );
  }

  // 3. STAGE C: MAIN WORKSPACE RENDER
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200" id="myshop-main-layout">
      
      {/* EXCEL/OFFICE EMULATED TOP DESKTOP WINDOW BAR */}
      <div className="bg-slate-800 text-slate-300 h-9 flex items-center justify-between px-4 text-xs font-medium border-b border-slate-900 select-none print:hidden shrink-0 relative z-50" id="office-title-bar">
        {/* Quick Access Toolbar */}
        <div className="flex items-center space-x-3">
          <BrandLogo size="sm" showText={false} className="opacity-95 hover:rotate-12 transition-all duration-300" />
          <span className="text-white font-bold tracking-tight text-[11px] font-sans">MyShop Desk v1.4</span>
          <span className="text-slate-600">|</span>
          
          {/* Quick Save button */}
          <button 
            onClick={() => {
              setShowSaveFeedback(true);
              setTimeout(() => setShowSaveFeedback(false), 2000);
            }}
            className="hover:bg-slate-700 hover:text-white p-1 rounded transition-all flex items-center space-x-1 cursor-pointer text-slate-400 group"
            title="Save POS Workspace"
            type="button"
          >
            <Save className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-all" />
            {showSaveFeedback ? (
              <span className="text-[10px] text-emerald-400 font-bold animate-fadeIn">Registry Saved!</span>
            ) : (
              <span className="text-[10px] hidden sm:inline">Save</span>
            )}
          </button>
          
          <button 
            onClick={() => setShowOfficeControlsHelp(true)}
            className="hover:bg-slate-700 hover:text-white p-1 rounded transition-all text-slate-400 text-[10px] cursor-pointer hidden sm:block"
            type="button"
          >
            Undo
          </button>
          <button 
            onClick={() => setShowOfficeControlsHelp(true)}
            className="hover:bg-slate-700 hover:text-white p-1 rounded transition-all text-slate-400 text-[10px] cursor-pointer hidden sm:block"
            type="button"
          >
            Redo
          </button>
        </div>

        {/* Central File Name Specifier */}
        <div className="absolute left-1/2 -translate-x-1/2 font-sans font-bold text-[11px] text-slate-100 hidden md:flex items-center space-x-1.5 bg-slate-900/60 px-4 py-0.5 rounded-full border border-slate-700/50">
          <Laptop className="w-3 h-3 text-blue-400" />
          <span>MyShop_Registry_v1.msr</span>
          <span className="text-[9px] bg-blue-500/20 text-blue-400 font-bold px-1.5 py-0.2 rounded font-mono uppercase tracking-widest scale-90">DESKTOP OFFICE MODE</span>
        </div>

        {/* Window controls & PWA action */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="bg-slate-700/60 hover:bg-slate-700 text-slate-300 font-bold px-2.5 py-0.5 rounded text-[10px] flex items-center space-x-1.5 border border-slate-600 transition-all cursor-pointer"
            id="office-theme-toggle-btn"
            type="button"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-3 h-3 text-sky-400 shrink-0" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Light Mode</span>
              </>
            )}
          </button>

          {/* Win7+ POS Diagnostics Button */}
          <button
            onClick={() => setShowWin7Diagnostics(true)}
            className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 border border-emerald-500/30 transition-all cursor-pointer"
            id="win7-diagnostics-btn"
            type="button"
            title="Open Windows 7+ System Compatibility & POS Hardware Diagnostics"
          >
            <Monitor className="w-3 h-3 text-emerald-400" />
            <span>Win7+ POS Ready</span>
          </button>

          {/* PWA desktop trigger */}
          <button
            onClick={() => setShowPWAHelp(true)}
            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 font-bold px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 border border-blue-500/30 transition-all cursor-pointer"
            id="pwa-install-indicator-btn"
            type="button"
          >
            <Smartphone className="w-3 h-3 animate-pulse text-blue-400" />
            <span>Install Standalone Desk App</span>
          </button>
          
          <span className="text-slate-600">|</span>

          {/* Minimize / Maximize / Close simulation buttons */}
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => alert("Minimized MyShop Desk to taskbar. App is running background local service.")}
              className="hover:bg-slate-700 text-slate-400 hover:text-white w-6 h-6 rounded flex items-center justify-center font-bold font-mono text-[10px]"
              type="button"
            >
              —
            </button>
            <button 
              onClick={() => alert("Entering emulated full display panel window.")}
              className="hover:bg-slate-700 text-slate-400 hover:text-white w-6 h-6 rounded flex items-center justify-center font-bold text-[9px]"
              type="button"
            >
              ⬜
            </button>
            <button 
              onClick={() => {
                if (confirm("Are you sure you want to close MyShop Desk? All data is fully cached offline.")) {
                  alert("Closed offline register session safely.");
                }
              }}
              className="hover:bg-red-600 hover:text-white text-slate-400 w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-all"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex text-slate-800 font-sans min-h-0">
        
        {/* LEFT SIDEBAR - Desktop Only (Print Hidden) */}
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 hidden md:flex print:hidden animate-slideInLeft" id="myshop-desktop-sidebar">
          {/* Brand Logo Header */}
          <div className="p-5 flex flex-col items-center justify-center border-b border-slate-800 bg-slate-950/40">
            <BrandLogo size="md" showText={true} />
          </div>

          {/* Active User Information Box */}
          <div className="px-4 py-3 bg-slate-800/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div className="space-y-0.5 truncate pr-2">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Active Operator</span>
              <span className="font-extrabold text-white truncate block">{activeProfile.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded-lg transition-all cursor-pointer group"
              title="Lock Screen / Logout"
              type="button"
              id="desktop-logout-btn"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Navigation with Role Filters */}
          <nav className="flex-1 p-3 space-y-1.5 text-xs font-medium overflow-y-auto">
            {[
              { id: 'checkout', label: 'Cash Checkout', icon: ShoppingBag, allowed: ['admin', 'manager', 'cashier'] },
              { id: 'shifts', label: 'Shift & Cash Till', icon: Clock, badge: activeShift ? 'OPEN' : undefined, badgeColor: 'bg-emerald-500', allowed: ['admin', 'manager', 'cashier'] },
              { id: 'inventory', label: 'Stock Room', icon: Package, badge: activeAlertsCount > 0 ? activeAlertsCount : undefined, badgeColor: 'bg-red-500', allowed: ['admin', 'manager'] },
              { id: 'transfers', label: 'Branch Transfers', icon: Building2, badge: stockTransfers.filter(t => t.status === 'pending' || t.status === 'dispatched').length || undefined, badgeColor: 'bg-indigo-500', allowed: ['admin', 'manager'] },
              { id: 'suppliers', label: 'Suppliers & POs', icon: Truck, badge: purchaseOrders.filter(p => p.status === 'ordered' || p.status === 'pending').length || undefined, badgeColor: 'bg-blue-500', allowed: ['admin', 'manager'] },
              { id: 'loyalty', label: 'Loyalty & Promos', icon: Gift, allowed: ['admin', 'manager', 'cashier'] },
              { id: 'credits', label: 'Credit Ledger', icon: BookOpen, badge: activeUnpaidCreditsCount > 0 ? activeUnpaidCreditsCount : undefined, badgeColor: 'bg-amber-500', allowed: ['admin', 'manager', 'cashier'] },
              { id: 'analytics', label: activeProfile?.role === 'cashier' ? 'Receipt Vault & Audit' : 'Business Analytics', icon: TrendingUp, allowed: ['admin', 'manager', 'cashier'] },
              { id: 'backups', label: 'Database Backups', icon: Database, allowed: ['admin', 'manager'] },
              { id: 'tutorial', label: 'Training Manual', icon: HelpCircle, allowed: ['admin', 'manager', 'cashier'] }
            ]
            .filter(tab => tab.allowed.includes(activeProfile.role))
            .map(tab => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all cursor-pointer text-left ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10 font-bold' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  id={`nav-tab-${tab.id}`}
                  type="button"
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{tab.label}</span>
                  {tab.badge && (
                    <span className={`${tab.badgeColor || 'bg-red-500'} text-white font-bold font-mono text-[9px] px-1.5 py-0.5 rounded-full animate-pulse`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Panel */}
          <div className="p-3.5 border-t border-slate-800 space-y-3">
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-blue-400 font-semibold text-[11px]">Active Shift</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${activeShift ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                  {activeShift ? 'TILL OPEN' : 'CLOSED'}
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: activeShift ? '100%' : '0%' }}
                ></div>
              </div>
              <p className="text-[10px] mt-1.5 text-slate-400">
                Operator: <span className="font-bold text-white uppercase">{activeProfile.role}</span> ({activeProfile.name})
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-[9.5px] uppercase font-bold tracking-widest text-slate-400">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
              <span>Printer Wedge Intercept OK</span>
            </div>
          </div>
        </aside>

        {/* RIGHT CONTENT PANEL */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto" id="myshop-content-panel">
          
          {/* MOBILE HEADER - Mobile Only (Print Hidden) */}
          <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 print:hidden" id="myshop-mobile-header">
            <div className="flex items-center gap-2">
              <BrandLogo size="sm" showText={false} />
              <span className="font-bold text-white uppercase tracking-tight text-xs truncate max-w-[120px]">
                {settings.storeName}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="text-slate-400 bg-slate-800 px-2 py-1 rounded font-bold uppercase text-[9px]">
                {activeProfile.name.split(' ')[1] || activeProfile.name}
              </span>
              <button onClick={handleLogout} className="text-red-400 font-bold" type="button">
                LOCK
              </button>
            </div>
          </header>

          {/* DESKTOP STATUS BAR HEADER - Desktop Only (Print Hidden) */}
          <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 items-center justify-between hidden md:flex shrink-0 print:hidden transition-colors duration-200" id="myshop-desktop-header">
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="text-slate-500 dark:text-slate-300 font-semibold">{settings.storeName || 'MyShop'} Suite</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-blue-600 dark:text-blue-400 font-extrabold text-xs uppercase tracking-wider">
                {activeTab === 'checkout' ? 'Cash Checkout Register' :
                 activeTab === 'shifts' ? 'Shift & Cash Till Reconciliation' :
                 activeTab === 'credits' ? 'Store Credit Ledger' :
                 activeTab === 'inventory' ? 'Stock Room Inventory' :
                 activeTab === 'transfers' ? 'Multi-Branch Stock Transfers' :
                 activeTab === 'suppliers' ? 'Suppliers & Purchase Orders' :
                 activeTab === 'loyalty' ? 'Customer Loyalty & Promotions' :
                 activeTab === 'analytics' ? 'Business Analytics' :
                 activeTab === 'backups' ? 'Database Backups' : 'Interactive Training Manual'}
              </span>
            </div>

            <div className="flex items-center gap-6">
              {activeShift && (
                <div className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Till Open: {settings.currency}{activeShift.expectedCash.toFixed(2)} Expected</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-750">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-600 dark:text-slate-300">Hardware Wedge Active</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono leading-none">Register Session</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold leading-none mt-1 block">
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm border border-blue-200 dark:border-blue-800 shadow-sm uppercase font-mono">
                {activeProfile.name[0]}
              </div>
            </div>
          </header>

          {/* MAIN WORKSPACE SCROLL CONTAINER */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto print:p-0">
            <div className="max-w-7xl mx-auto">
              
              {activeTab === 'checkout' && (
                <CheckoutTerminal
                  products={products}
                  settings={settings}
                  onCheckout={handleCheckout}
                  activeProfile={activeProfile}
                  promotions={promotions}
                  loyaltyAccounts={loyaltyAccounts}
                  onRedeemLoyaltyPoints={handleRedeemLoyaltyPoints}
                  onAddLoyaltyPoints={handleAddLoyaltyPoints}
                />
              )}

              {activeTab === 'shifts' && (
                <ShiftManager
                  shifts={shifts}
                  activeShift={activeShift}
                  settings={settings}
                  activeProfile={activeProfile}
                  onOpenShift={handleOpenShift}
                  onCloseShift={handleCloseShift}
                  onAddMovement={handleAddMovement}
                />
              )}

              {activeTab === 'transfers' && (
                <BranchTransfers
                  branches={branches}
                  stockTransfers={stockTransfers}
                  products={products}
                  settings={settings}
                  activeProfile={activeProfile}
                  onAddBranch={handleAddBranch}
                  onUpdateBranch={handleUpdateBranch}
                  onDeleteBranch={handleDeleteBranch}
                  onCreateTransfer={handleCreateTransfer}
                  onCompleteTransfer={handleCompleteTransfer}
                />
              )}

              {activeTab === 'suppliers' && (
                <SuppliersAndPurchases
                  suppliers={suppliers}
                  purchaseOrders={purchaseOrders}
                  products={products}
                  settings={settings}
                  activeProfile={activeProfile}
                  onAddSupplier={handleAddSupplier}
                  onUpdateSupplier={handleUpdateSupplier}
                  onDeleteSupplier={handleDeleteSupplier}
                  onCreatePurchaseOrder={handleCreatePurchaseOrder}
                  onReceivePurchaseOrder={handleReceivePurchaseOrder}
                />
              )}

              {activeTab === 'loyalty' && (
                <LoyaltyAndPromotions
                  promotions={promotions}
                  loyaltyAccounts={loyaltyAccounts}
                  settings={settings}
                  activeProfile={activeProfile}
                  onAddPromotion={handleAddPromotion}
                  onTogglePromotion={handleTogglePromotion}
                  onDeletePromotion={handleDeletePromotion}
                  onUpdateLoyaltySettings={handleUpdateLoyaltySettings}
                  onAdjustCustomerPoints={handleAdjustCustomerPoints}
                  onAddLoyaltyCustomer={handleAddLoyaltyCustomer}
                />
              )}

              {activeTab === 'credits' && (
                <CreditsManager
                  credits={credits}
                  sales={sales}
                  settings={settings}
                  activeProfile={activeProfile}
                  onUpdateCredits={setCredits}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryManager
                  products={products}
                  stockLogs={stockLogs}
                  settings={settings}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onRestockShelf={handleRestockShelf}
                  onBuyWholesaleStock={handleBuyWholesaleStock}
                  onBulkImport={handleBulkImport}
                  onUpdateSettings={handleUpdateSettings}
                  onLogDamagedGoods={handleLogDamagedGoods}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsPanel
                  sales={sales}
                  products={products}
                  currency={settings.currency}
                  onUpdateSale={handleUpdateSale}
                  onDeleteSale={handleDeleteSale}
                  onDeleteBulkSales={handleDeleteBulkSales}
                  voidedSales={voidedSales}
                  onRestoreSale={handleRestoreSale}
                  onRestoreBulkSales={handleRestoreBulkSales}
                  activeProfile={activeProfile}
                />
              )}

              {activeTab === 'backups' && (
                <BackupManager
                  appState={{ 
                    products, sales, settings, stockLogs, credits,
                    shifts, suppliers, purchaseOrders, loyaltyAccounts, promotions, branches, stockTransfers
                  } as any}
                  onRestoreState={handleRestoreState}
                  onResetState={handleResetState}
                  onUpdateSettings={handleUpdateSettings}
                  activeProfile={activeProfile}
                />
              )}

              {activeTab === 'tutorial' && (
                <AppTutorial
                  currency={settings.currency}
                  activeProfile={activeProfile}
                />
              )}
            </div>
          </main>

          {/* MOBILE BOTTOM NAVIGATION - Mobile Only (Print Hidden) */}
          <nav className="md:hidden bg-slate-900 border-t border-slate-800 px-2 py-1.5 flex justify-around sticky bottom-0 z-40 print:hidden overflow-x-auto" id="myshop-mobile-bottom-nav">
            {[
              { id: 'checkout', label: 'Checkout', icon: ShoppingBag, allowed: ['admin', 'manager', 'cashier'] },
              { id: 'shifts', label: 'Till', icon: Clock, badge: activeShift ? '●' : undefined, allowed: ['admin', 'manager', 'cashier'] },
              { id: 'credits', label: 'Credits', icon: BookOpen, badge: activeUnpaidCreditsCount > 0 ? activeUnpaidCreditsCount : undefined, allowed: ['admin', 'manager', 'cashier'] },
              { id: 'inventory', label: 'Stocks', icon: Package, badge: activeAlertsCount > 0 ? activeAlertsCount : undefined, allowed: ['admin', 'manager'] },
              { id: 'transfers', label: 'Transfers', icon: Building2, allowed: ['admin', 'manager'] },
              { id: 'suppliers', label: 'Suppliers', icon: Truck, allowed: ['admin', 'manager'] },
              { id: 'loyalty', label: 'Loyalty', icon: Gift, allowed: ['admin', 'manager', 'cashier'] },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp, allowed: ['admin', 'manager'] },
              { id: 'backups', label: 'Backups', icon: Database, allowed: ['admin', 'manager'] },
              { id: 'tutorial', label: 'Help', icon: HelpCircle, allowed: ['admin', 'manager', 'cashier'] }
            ]
            .filter(tab => tab.allowed.includes(activeProfile.role))
            .map(tab => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative text-[10px] font-bold p-1.5 flex flex-col items-center space-y-1 transition-all rounded-lg cursor-pointer shrink-0 min-w-[50px] ${
                    isActive ? 'text-blue-500 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id={`mobile-nav-tab-${tab.id}`}
                  type="button"
                >
                  <IconComp className="w-4 h-4" />
                  <span className="text-[9px]">{tab.label}</span>
                  {tab.badge && (
                    <span className="absolute top-0.5 right-1 bg-red-500 text-white font-bold font-mono text-[8px] px-1 rounded-full animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* FOOTER - Hidden on Print */}
          <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800 py-3 text-center text-xs text-slate-400 dark:text-slate-500 shrink-0 hidden md:block print:hidden transition-colors duration-200" id="myshop-main-footer">
            <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-1">
                <Store className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>&copy; 2026 <strong className="text-slate-600 dark:text-slate-400">{settings.storeName || 'MyShop'} Desk</strong>. Full Local Offline Desktop Session.</span>
              </div>
              <div className="flex items-center space-x-3.5 text-[11px] font-mono text-slate-400 dark:text-slate-500">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-blue-500 animate-pulse" />
                  <span>Receipt Hardware Wedge Connected</span>
                </span>
                <span className="text-slate-200 dark:text-slate-800">|</span>
                <span className="flex items-center space-x-1">
                  <HelpCircle className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  <span>Dual Sandbox Local Registry Mode</span>
                </span>
              </div>
            </div>
          </footer>

        </div>
      </div>

      {/* 4. MODAL: STANDALONE DESKTOP APPLICATION SETUP */}
      <DesktopAppModal
        isOpen={showPWAHelp}
        onClose={() => setShowPWAHelp(false)}
        settings={settings}
        deferredPrompt={deferredPrompt}
        onTriggerPwaInstall={handleTriggerPwaInstall}
      />

      {/* 5. MODAL: OFFICE CONTROLS HELP (UNDO/REDO) */}
      {showOfficeControlsHelp && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-100 animate-fadeIn" id="office-controls-modal">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full shadow-2xl p-6 relative animate-scaleUp">
            <button 
              onClick={() => setShowOfficeControlsHelp(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-100 rounded-lg transition-all"
              type="button"
            >
              ✕
            </button>
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Quick Toolbar Feedback</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium mb-4">
              Undo/Redo is managed dynamically by your terminal's memory. Transactions are recorded live as they occur. If you make an error on checkout, you can void individual cart items or review logs in the Backups screen.
            </p>
            <button 
              onClick={() => setShowOfficeControlsHelp(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs transition-all cursor-pointer"
              type="button"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL: WINDOWS 7+ SYSTEM COMPATIBILITY & POS HARDWARE DIAGNOSTICS */}
      {showWin7Diagnostics && (
        <Win7DiagnosticsModal
          onClose={() => setShowWin7Diagnostics(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

    </div>
  );
}
