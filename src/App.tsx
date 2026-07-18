import React, { useState, useEffect } from 'react';
import { Product, Sale, StoreSettings, StockLog, AppState, CreditRecord } from './types';
import { DEFAULT_SETTINGS, SAMPLE_PRODUCTS } from './initialData';
import SetupWizard from './components/SetupWizard';
import CheckoutTerminal from './components/CheckoutTerminal';
import InventoryManager from './components/InventoryManager';
import AnalyticsPanel from './components/AnalyticsPanel';
import BackupManager from './components/BackupManager';
import CreditsManager from './components/CreditsManager';
import BrandLogo from './components/BrandLogo';
import AppTutorial from './components/AppTutorial';
import { 
  Store, ShoppingBag, Package, TrendingUp, Database, AlertCircle, Sparkles, HelpCircle,
  Lock, Unlock, Shield, ShieldCheck, UserCheck, Terminal, Save, ArrowLeft, ArrowRight, Check, CheckSquare, Square, LogOut, Printer, FileSpreadsheet, RefreshCw, Smartphone, Laptop, BookOpen
} from 'lucide-react';

export default function App() {
  // Core App States
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [credits, setCredits] = useState<CreditRecord[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({ ...DEFAULT_SETTINGS });
  const [isLoaded, setIsLoaded] = useState(false);

  // Active UI navigation tab
  const [activeTab, setActiveTab] = useState<'checkout' | 'inventory' | 'analytics' | 'backups' | 'credits' | 'tutorial'>('checkout');

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

      if (storedProducts) setProducts(JSON.parse(storedProducts));
      if (storedSales) setSales(JSON.parse(storedSales));
      if (storedLogs) setStockLogs(JSON.parse(storedLogs));
      if (storedCredits) setCredits(JSON.parse(storedCredits));
      
      let loadedSettings = { ...DEFAULT_SETTINGS };
      if (storedSettings) {
        loadedSettings = JSON.parse(storedSettings);
        // Automatically migrate old $ default currency to GH₵ for the user
        if (loadedSettings.currency === '$') {
          loadedSettings.currency = 'GH₵';
        }
        // Ensure categories list exists
        if (!loadedSettings.categories || loadedSettings.categories.length === 0) {
          loadedSettings.categories = [...(DEFAULT_SETTINGS.categories || [])];
        }
        setSettings(loadedSettings);
      } else {
        // First-time load: keep default settings (with isSetupCompleted: false)
        setSettings({ ...DEFAULT_SETTINGS });
      }

      // Restore active operator session if available
      const storedProfile = localStorage.getItem('myshop_active_profile');
      const storedChecked = localStorage.getItem('myshop_has_checked_printer');
      if (storedProfile) {
        try {
          const parsedProf = JSON.parse(storedProfile);
          const profilesList = loadedSettings.profiles || [
            { id: 'u_admin', name: 'System Administrator', role: 'admin', passwordHash: 'admin123' },
            { id: 'u_manager', name: 'Store Manager', role: 'manager', passwordHash: 'manager123' },
            { id: 'u_cashier', name: 'Retail Cashier', role: 'cashier', passwordHash: 'cashier123' }
          ];
          const matchedProf = profilesList.find(p => p.id === parsedProf.id);
          if (matchedProf) {
            setActiveProfile(matchedProf);
          }
        } catch (e) {
          console.error("Error parsing stored active profile session:", e);
        }
      }

      if (storedChecked === 'true') {
        setHasCheckedPrinter(true);
        setPrinterChecked(true);
        setRollChecked(true);
        setScannerChecked(true);
      }
    } catch (e) {
      console.error("Failed to load state from LocalStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save states to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('myshop_products', JSON.stringify(products));
      localStorage.setItem('myshop_sales', JSON.stringify(sales));
      localStorage.setItem('myshop_settings', JSON.stringify(settings));
      localStorage.setItem('myshop_stock_logs', JSON.stringify(stockLogs));
      localStorage.setItem('myshop_credits', JSON.stringify(credits));
    } catch (e) {
      console.error("Failed to save state to LocalStorage:", e);
    }
  }, [products, sales, settings, stockLogs, credits, isLoaded]);

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

  // SALES CHECKOUT (RETAIL STOCK DEDUCTION)
  const handleCheckout = (saleData: Omit<Sale, 'id' | 'timestamp'>): Sale => {
    const saleId = `RCP-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = Date.now();

    const finalizedSale: Sale = {
      ...saleData,
      id: saleId,
      timestamp
    };

    // Deduct stock levels for sold items
    setProducts(prev => prev.map(p => {
      const soldItem = saleData.items.find(item => item.productId === p.id);
      if (soldItem) {
        return {
          ...p,
          retailStock: Math.max(0, p.retailStock - soldItem.quantity)
        };
      }
      return p;
    }));

    // Add sales record
    setSales(prev => [...prev, finalizedSale]);

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
    const newLogs: StockLog[] = saleData.items.map(item => ({
      id: `log_sale_${saleId}_${item.productId}`,
      productId: item.productId,
      productName: item.productName,
      timestamp,
      type: 'sales_deduction',
      quantity: item.quantity,
      notes: `Deducted shelf stock for customer sale receipt: ${saleId}`
    }));

    setStockLogs(prev => [...prev, ...newLogs]);

    return finalizedSale;
  };

  // RESTORE FULL DATABASE FROM JSON
  const handleRestoreState = (newState: AppState) => {
    setProducts(newState.products || []);
    setSales(newState.sales || []);
    setSettings(newState.settings || { ...DEFAULT_SETTINGS });
    setStockLogs(newState.stockLogs || []);
    setCredits(newState.credits || []);
  };

  // ERASE/RESET DATABASE
  const handleResetState = (seedDemo: boolean) => {
    if (seedDemo) {
      setSettings({ ...DEFAULT_SETTINGS, isSetupCompleted: true });
      setProducts([...SAMPLE_PRODUCTS]);
      setSales([]);
      setCredits([]);
      
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

    setSales(prev => prev.filter(s => s.id !== saleId));

    if (stockLogsToAdd.length > 0) {
      setStockLogs(prev => [...prev, ...stockLogsToAdd]);
    }
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
  const activeUnpaidCreditsCount = credits.filter(r => r.status !== 'paid').length;

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
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans" id="myshop-main-layout">
      
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
          <nav className="flex-1 p-4 space-y-2 text-sm font-medium">
            {[
              { id: 'checkout', label: 'Cash Checkout', icon: ShoppingBag, allowed: ['admin', 'manager', 'cashier'] },
              { id: 'credits', label: 'Credit Ledger', icon: BookOpen, badge: activeUnpaidCreditsCount > 0 ? activeUnpaidCreditsCount : undefined, allowed: ['admin', 'manager', 'cashier'] },
              { id: 'inventory', label: 'Stock Room', icon: Package, badge: activeAlertsCount > 0 ? activeAlertsCount : undefined, allowed: ['admin', 'manager'] },
              { id: 'analytics', label: 'Business Analytics', icon: TrendingUp, allowed: ['admin', 'manager'] },
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
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer text-left ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10 font-bold' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  id={`nav-tab-${tab.id}`}
                  type="button"
                >
                  <IconComp className="w-5 h-5 shrink-0" />
                  <span className="flex-1 truncate">{tab.label}</span>
                  {tab.badge && (
                    <span className="bg-red-500 text-white font-bold font-mono text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Panel */}
          <div className="p-4 border-t border-slate-800 space-y-4">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-blue-400 font-semibold">Registry Health</span>
                <span className="text-[10px] text-slate-300 font-semibold font-mono">{products.length} SKUs</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(10, (products.length / 20) * 100))}%` }}
                ></div>
              </div>
              <p className="text-[10px] mt-2 text-slate-400 opacity-85">
                Operator Role Level: <span className="font-bold text-white uppercase">{activeProfile.role}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-slate-400">
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
          <header className="h-16 bg-white border-b border-slate-200 px-8 items-center justify-between hidden md:flex shrink-0 print:hidden" id="myshop-desktop-header">
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="text-slate-500 font-semibold">{settings.storeName || 'MyShop'} Management Suite</span>
              <span className="text-slate-300">/</span>
              <span className="text-blue-600 font-extrabold text-xs uppercase tracking-wider">
                {activeTab === 'checkout' ? 'Cash Checkout' :
                 activeTab === 'credits' ? 'Store Credit Ledger' :
                 activeTab === 'inventory' ? 'Stock Room' :
                 activeTab === 'analytics' ? 'Business Analytics' :
                 activeTab === 'backups' ? 'Database Backups' : 'Interactive Training Manual'}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-600">Hardware Thermal Printer Active</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono leading-none">Register Session</span>
                <span className="text-xs text-blue-600 font-mono font-bold leading-none mt-1 block">
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200 shadow-sm uppercase font-mono">
                {activeProfile.name[0]}
              </div>
            </div>
          </header>

          {/* MAIN WORKSPACE SCROLL CONTAINER */}
          <main className="flex-1 p-4 md:p-8 overflow-y-auto print:p-0">
            <div className="max-w-7xl mx-auto">
              
              {activeTab === 'checkout' && (
                <CheckoutTerminal
                  products={products}
                  settings={settings}
                  onCheckout={handleCheckout}
                  activeProfile={activeProfile}
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

              {activeTab === 'analytics' && (activeProfile.role === 'admin' || activeProfile.role === 'manager') && (
                <AnalyticsPanel
                  sales={sales}
                  products={products}
                  currency={settings.currency}
                  onUpdateSale={handleUpdateSale}
                  onDeleteSale={handleDeleteSale}
                  activeProfile={activeProfile}
                />
              )}

              {activeTab === 'backups' && (
                <BackupManager
                  appState={{ products, sales, settings, stockLogs, credits }}
                  onRestoreState={handleRestoreState}
                  onResetState={handleResetState}
                  onUpdateSettings={handleUpdateSettings}
                  activeProfile={activeProfile}
                />
              )}

              {activeTab === 'tutorial' && (
                <AppTutorial
                  currency={settings.currency}
                />
              )}
            </div>
          </main>

          {/* MOBILE BOTTOM NAVIGATION - Mobile Only (Print Hidden) */}
          <nav className="md:hidden bg-slate-900 border-t border-slate-800 px-2 py-1.5 flex justify-around sticky bottom-0 z-40 print:hidden" id="myshop-mobile-bottom-nav">
            {[
              { id: 'checkout', label: 'Checkout', icon: ShoppingBag, allowed: ['admin', 'manager', 'cashier'] },
              { id: 'credits', label: 'Credits', icon: BookOpen, badge: activeUnpaidCreditsCount > 0 ? activeUnpaidCreditsCount : undefined, allowed: ['admin', 'manager', 'cashier'] },
              { id: 'inventory', label: 'Stocks', icon: Package, badge: activeAlertsCount > 0 ? activeAlertsCount : undefined, allowed: ['admin', 'manager'] },
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
                  className={`relative text-[10px] font-bold p-1.5 flex flex-col items-center space-y-1 transition-all rounded-lg cursor-pointer ${
                    isActive ? 'text-blue-500 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id={`mobile-nav-tab-${tab.id}`}
                  type="button"
                >
                  <IconComp className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="absolute top-1 right-2 bg-red-500 text-white font-bold font-mono text-[8px] px-1 rounded-full animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* FOOTER - Hidden on Print */}
          <footer className="bg-white border-t border-slate-200/60 py-3 text-center text-xs text-slate-400 shrink-0 hidden md:block print:hidden" id="myshop-main-footer">
            <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-1">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>&copy; 2026 <strong>{settings.storeName || 'MyShop'} Desk</strong>. Full Local Offline Desktop Session.</span>
              </div>
              <div className="flex items-center space-x-3.5 text-[11px] font-mono text-slate-400">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-blue-500 animate-pulse" />
                  <span>Receipt Hardware Wedge Connected</span>
                </span>
                <span className="text-slate-200">|</span>
                <span className="flex items-center space-x-1">
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                  <span>Dual Sandbox Local Registry Mode</span>
                </span>
              </div>
            </div>
          </footer>

        </div>
      </div>

      {/* 4. MODAL: STANDALONE DESKTOP PWA INSTALLATION GUIDE */}
      {showPWAHelp && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-100 animate-fadeIn" id="pwa-help-modal">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-6 relative animate-scaleUp">
            <button 
              onClick={() => setShowPWAHelp(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-100 rounded-lg transition-all"
              type="button"
            >
              ✕
            </button>
            <div className="flex items-center space-x-3 mb-4 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Execute like Microsoft Office</h3>
                <p className="text-[10px] text-slate-500">Run MyShop POS as a native desktop program</p>
              </div>
            </div>
            
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed font-medium">
              <p>
                To launch this POS app directly from your computer dock or start menu without opening a browser:
              </p>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 font-sans space-y-2.5">
                <div className="flex items-start space-x-2">
                  <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0 mt-0.5">Step 1</span>
                  <span>Look at your browser's top search bar (URL input block).</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0 mt-0.5">Step 2</span>
                  <span>Click the <strong>"Install MyShop POS"</strong> icon (displays as a screen with an arrow, or click Chrome settings <strong className="text-slate-800">⋮ &rarr; Save and share &rarr; Install page</strong>).</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0 mt-0.5">Step 3</span>
                  <span>Pin the app to your desktop or Dock. It opens as an independent, standalone executable window without browser navigation clutter!</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                * This runs fully offline-first. Your inventory catalogs, checkout histories, and user settings are kept completely secure in your hard drive's browser sandbox cache.
              </p>
            </div>
            <button 
              onClick={() => setShowPWAHelp(false)}
              className="mt-5 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              type="button"
            >
              Excellent, I understand
            </button>
          </div>
        </div>
      )}

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

    </div>
  );
}
