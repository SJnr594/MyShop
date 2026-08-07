import React, { useState, useEffect, useRef } from 'react';
import { Product, Sale, SaleItem, StoreSettings, UserProfile } from '../types';
import { ShoppingCart, Search, User, Trash2, CreditCard, DollarSign, Tag, Printer, CheckCircle, Barcode, Camera, Sparkles, AlertCircle, HelpCircle, Keyboard, Monitor, Volume2 } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

interface CheckoutTerminalProps {
  products: Product[];
  settings: StoreSettings;
  onCheckout: (sale: Omit<Sale, 'id' | 'timestamp'>) => Sale;
  activeProfile?: UserProfile | null;
}

export default function CheckoutTerminal({ products, settings, onCheckout, activeProfile }: CheckoutTerminalProps) {
  // Cart state
  const [cart, setCart] = useState<SaleItem[]>([]);
  
  // Customer state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  // Checkout overrides
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('cash');
  const [creditDueDate, setCreditDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  
  // Search state for manual click-add
  const [searchQuery, setSearchQuery] = useState('');

  // Category selection for the quick shelf
  const [selectedCategory, setSelectedCategory] = useState('All');

  // States for dynamic open-price custom items
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemCategory, setCustomItemCategory] = useState('General');
  
  // Barcode Scanner Modal toggle
  const [showScanner, setShowScanner] = useState(false);
  
  // Completed checkout receipt state
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Print Preview state
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [checkedItems, setCheckedItems] = useState(false);
  const [checkedCustomer, setCheckedCustomer] = useState(false);
  const [checkedPayment, setCheckedPayment] = useState(false);

  // Printer width configuration format
  const [printFormat, setPrintFormat] = useState<'80mm' | '58mm' | 'A4'>('80mm');

  // Help tutorial modal toggle
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Search input element reference for F3 keyboard focusing
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Web Audio synth for instant scanner feedback (Windows 7/8/10/11 native compatible)
  const playBeep = (isSuccess = true) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      
      if (isSuccess) {
        oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pitch retail chirp
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.08); // 80ms duration
      } else {
        oscillator.frequency.setValueAtTime(250, audioCtx.currentTime); // Low warning buzz
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.25); // 250ms duration
      }
    } catch (e) {
      console.warn("Could not synth scan beep:", e);
    }
  };

  // Global key listener for physical hardware scanners & Windows 7+ POS Keyboard Shortcuts
  useEffect(() => {
    let rawKeysBuffer: string[] = [];
    let keyTimes: number[] = [];

    const handleGlobalKeys = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      
      const isInputFocused = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      );

      // Windows Global Shortcut: Ctrl + P (Intercept browser print with thermal receipt spooler print)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        if (completedSale || showPrintPreview) {
          window.print();
        } else if (cart.length > 0) {
          setCheckedItems(true);
          setCheckedCustomer(true);
          setCheckedPayment(true);
          setShowPrintPreview(true);
        } else {
          playBeep(false);
        }
        return;
      }

      // 1. Windows POS Functional Keys Mapping (F1 - F9, Esc)
      if (e.key === 'F1') {
        e.preventDefault();
        setShowHelpModal(prev => !prev);
        return;
      }
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.length > 0) {
          if (window.confirm("Are you sure you want to clear the active shopping basket? This will reset the checkout terminal.")) {
            clearCart();
          }
        }
        return;
      }
      if (e.key === 'F3') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setShowScanner(prev => !prev);
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        setShowCustomItemForm(prev => !prev);
        return;
      }
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          if (showPrintPreview) {
            handleCheckoutSubmit();
          } else {
            setCheckedItems(true);
            setCheckedCustomer(true);
            setCheckedPayment(true);
            setShowPrintPreview(true);
          }
        } else {
          playBeep(false);
        }
        return;
      }
      if (e.key === 'Escape') {
        if (showScanner) {
          e.preventDefault();
          setShowScanner(false);
        } else if (showPrintPreview) {
          e.preventDefault();
          setShowPrintPreview(false);
        } else if (completedSale) {
          e.preventDefault();
          clearCart();
        } else if (showHelpModal) {
          e.preventDefault();
          setShowHelpModal(false);
        }
        return;
      }

      // 2. Hardware Wedge Scanner Capture Engine (2000-2026 Wedge Compatibility Windows 7+)
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
        return;
      }

      const currentTime = Date.now();
      const lastKeyTime = keyTimes.length > 0 ? keyTimes[keyTimes.length - 1] : currentTime;
      const diff = currentTime - lastKeyTime;

      // Reset keyboard scanner buffer if typing speed is human-like (> 65ms between keys)
      if (keyTimes.length > 0 && diff > 65) {
        rawKeysBuffer = [];
        keyTimes = [];
      }

      const isEnterOrTab = e.key === 'Enter' || e.key === 'Tab' || e.key === 'Accept' || e.keyCode === 13 || e.keyCode === 9;

      if (isEnterOrTab) {
        if (rawKeysBuffer.length >= 3) {
          // Calculate average typing speed of keystrokes
          let totalDiff = 0;
          for (let i = 1; i < keyTimes.length; i++) {
            totalDiff += (keyTimes[i] - keyTimes[i - 1]);
          }
          const avgDelay = keyTimes.length > 1 ? totalDiff / (keyTimes.length - 1) : 0;

          // If typed under 50ms average or block size indicates scanner
          if (avgDelay < 50 || keyTimes.length > 4) {
            const scannedCode = rawKeysBuffer.join('').trim();
            
            // Intercept standard form submission or search triggered by Enter
            e.preventDefault();
            e.stopPropagation();

            // Strip the scanned sequence from active focused inputs to prevent polluting values
            if (isInputFocused) {
              const inputEl = activeEl as HTMLInputElement | HTMLTextAreaElement;
              const val = inputEl.value;
              if (val.endsWith(scannedCode)) {
                inputEl.value = val.substring(0, val.length - scannedCode.length);
              } else if (val.includes(scannedCode)) {
                inputEl.value = val.replace(scannedCode, '');
              }
              // Force React state update
              const changeEvent = new Event('input', { bubbles: true });
              inputEl.dispatchEvent(changeEvent);
            }

            handleBarcodeScanned(scannedCode);
            rawKeysBuffer = [];
            keyTimes = [];
            return;
          }
        }
        rawKeysBuffer = [];
        keyTimes = [];
      } else if (e.key.length === 1 && /[0-9a-zA-Z\-_]/.test(e.key)) {
        rawKeysBuffer.push(e.key);
        keyTimes.push(currentTime);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys, true); // Intercept in capture phase
    return () => {
      window.removeEventListener('keydown', handleGlobalKeys, true);
    };
  }, [products, cart, showScanner, showPrintPreview, completedSale, showHelpModal, paymentMethod, customerName, customerPhone, notes, discountPercent, creditDueDate]);

  const handleBarcodeScanned = (scannedCode: string) => {
    const matchingProduct = products.find(p => p.barcode === scannedCode);
    if (matchingProduct) {
      addProductToCart(matchingProduct);
    } else {
      playBeep(false);
      alert(`Scanned Barcode "${scannedCode}" is not registered in the product catalog yet.`);
    }
  };

  const addProductToCart = (
    product: Product, 
    packType: 'unit' | 'half_carton' | 'full_carton' | 'custom' = 'unit',
    customCartonQty: number = 1
  ) => {
    const unitsPerCarton = product.unitsPerCarton || 24;
    const totalAvailable = product.retailStock + (product.wholesaleStock * unitsPerCarton);

    let unitQtyToAdd = 1;
    let packLabel = `Single ${product.unit || 'unit'}`;
    let effectiveUnitPrice = product.retailPrice;

    if (packType === 'full_carton') {
      unitQtyToAdd = unitsPerCarton * customCartonQty;
      const cartonTotal = product.cartonPrice || (product.retailPrice * unitsPerCarton);
      effectiveUnitPrice = cartonTotal / unitsPerCarton;
      packLabel = customCartonQty === 1 
        ? `1 Full Carton (${unitsPerCarton} ${product.unit || 'pcs'})`
        : `${customCartonQty} Full Cartons (${unitQtyToAdd} ${product.unit || 'pcs'})`;
    } else if (packType === 'half_carton') {
      const halfUnits = Math.max(1, Math.round(unitsPerCarton / 2));
      unitQtyToAdd = halfUnits * customCartonQty;
      const cartonTotal = product.cartonPrice || (product.retailPrice * unitsPerCarton);
      effectiveUnitPrice = (cartonTotal / 2) / halfUnits;
      packLabel = customCartonQty === 1 
        ? `1 Half Carton (${halfUnits} ${product.unit || 'pcs'})`
        : `${customCartonQty} Half Cartons (${unitQtyToAdd} ${product.unit || 'pcs'})`;
    } else if (packType === 'custom') {
      unitQtyToAdd = customCartonQty;
      effectiveUnitPrice = product.retailPrice;
      packLabel = `${customCartonQty} ${product.unit || 'pcs'}`;
    }

    const existingIndex = cart.findIndex(item => item.productId === product.id);
    const alreadyInCartUnits = existingIndex !== -1 ? cart[existingIndex].quantity : 0;
    const newTotalUnits = alreadyInCartUnits + unitQtyToAdd;

    // Check total store stock across retail shelf and wholesale storehouse
    if (totalAvailable < newTotalUnits) {
      playBeep(false);
      alert(`Insufficient Inventory! Total store stock for "${product.name}" is ${totalAvailable} ${product.unit || 'units'} (${product.retailStock} shelf, ${product.wholesaleStock} unopened bulk cartons).`);
      return;
    }

    playBeep(true); // Play successful cash register chime

    if (existingIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity = newTotalUnits;
      updatedCart[existingIndex].price = effectiveUnitPrice;
      updatedCart[existingIndex].packType = packType;
      updatedCart[existingIndex].packLabel = packLabel;
      setCart(updatedCart);
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        quantity: unitQtyToAdd,
        price: effectiveUnitPrice,
        wholesaleCost: product.wholesaleCost,
        packType,
        packLabel
      };
      setCart([...cart, newItem]);
    }
  };

  const changeCartItemPack = (index: number, newPackType: 'unit' | 'half_carton' | 'full_carton') => {
    const item = cart[index];
    const product = products.find(p => p.id === item.productId);
    if (!product) return;

    const unitsPerCarton = product.unitsPerCarton || 24;
    const totalAvailable = product.retailStock + (product.wholesaleStock * unitsPerCarton);
    const cartonTotal = product.cartonPrice || (product.retailPrice * unitsPerCarton);

    let newQty = 1;
    let packLabel = `Single ${product.unit || 'pcs'}`;
    let effectiveUnitPrice = product.retailPrice;

    if (newPackType === 'full_carton') {
      newQty = unitsPerCarton;
      effectiveUnitPrice = cartonTotal / unitsPerCarton;
      packLabel = `1 Full Carton (${unitsPerCarton} ${product.unit || 'pcs'})`;
    } else if (newPackType === 'half_carton') {
      const halfUnits = Math.max(1, Math.round(unitsPerCarton / 2));
      newQty = halfUnits;
      effectiveUnitPrice = (cartonTotal / 2) / halfUnits;
      packLabel = `1 Half Carton (${halfUnits} ${product.unit || 'pcs'})`;
    } else {
      newQty = 1;
      effectiveUnitPrice = product.retailPrice;
      packLabel = `Single ${product.unit || 'pcs'}`;
    }

    if (totalAvailable < newQty) {
      alert(`Cannot set to ${packLabel}: Only ${totalAvailable} total ${product.unit || 'units'} available in store.`);
      return;
    }

    const updatedCart = [...cart];
    updatedCart[index].quantity = newQty;
    updatedCart[index].price = effectiveUnitPrice;
    updatedCart[index].packType = newPackType;
    updatedCart[index].packLabel = packLabel;
    setCart(updatedCart);
  };

  const addCustomItemToCart = (name: string, price: number, category: string) => {
    const customId = `prod_custom_${Date.now()}`;
    const newItem: SaleItem = {
      productId: customId,
      productName: name,
      barcode: 'CUSTOM_OPEN',
      quantity: 1,
      price: price,
      wholesaleCost: price * 0.6 // assume standard 40% retail markup margin for custom items
    };
    setCart([...cart, newItem]);
  };

  const updateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeCartItem(index);
      return;
    }

    const item = cart[index];
    const product = products.find(p => p.id === item.productId);
    if (product) {
      const unitsPerCarton = product.unitsPerCarton || 24;
      const totalAvailable = product.retailStock + (product.wholesaleStock * unitsPerCarton);
      if (totalAvailable < newQty) {
        alert(`Cannot exceed total store inventory (${totalAvailable} total ${product.unit || 'units'} across shelf & warehouse) for "${product.name}".`);
        return;
      }
    }

    const updatedCart = [...cart];
    updatedCart[index].quantity = newQty;
    setCart(updatedCart);
  };

  const removeCartItem = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setDiscountPercent(0);
    setCompletedSale(null);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * (settings.taxRate / 100);
  const finalTotal = taxableAmount + taxAmount;

  const autoSetReceiptFormat = (items: SaleItem[], pMethod: string) => {
    const isWholesale = pMethod === 'credit' || items.some(i => i.packType === 'full_carton' || i.packType === 'half_carton' || (i.packLabel && i.packLabel.toLowerCase().includes('carton')));
    const defaultFmt = isWholesale 
      ? (settings.wholesaleReceiptFormat === 'Letter' ? 'A4' : (settings.wholesaleReceiptFormat || 'A4'))
      : (settings.retailReceiptFormat || '80mm');
    setPrintFormat(defaultFmt);
  };

  const handleCheckoutSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cart.length === 0) return;

    if (paymentMethod === 'credit') {
      if (!customerName.trim() || !customerPhone.trim()) {
        alert("To log a Store Credit purchase, you must provide the Customer Name and Phone Number so we can track their balance and send payment reminders.");
        return;
      }
    }

    // Auto-select receipt template format based on transaction type and settings
    autoSetReceiptFormat(cart, paymentMethod);

    // Perform checkout logic (deduct shelf stock, add sale)
    const saleData = {
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || 'N/A',
      items: cart,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total: finalTotal,
      paymentMethod,
      notes: notes.trim() || undefined,
      cashierName: activeProfile?.name || 'System Operator',
      dueDate: paymentMethod === 'credit' ? new Date(creditDueDate).getTime() : undefined
    };

    const finalizedSale = onCheckout(saleData);
    setCompletedSale(finalizedSale);

    if (settings.autoPrintEnabled) {
      setTimeout(() => {
        window.print();
      }, 350);
    }
  };

  const triggerPrintReceipt = () => {
    window.print();
  };

  // Filter products for click-to-add grid
  const searchableProducts = products.filter(p => {
    if (!searchQuery) return false; // only show when searching to keep UI clean
    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           p.barcode.includes(searchQuery) ||
           p.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col space-y-4 w-full" id="checkout-terminal-wrapper">
      {/* WINDOWS 10+ DESKTOP POS STATUS & QUICK SHORTCUTS STRIP */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900 text-white rounded-xl px-5 py-3 border border-slate-950 shadow-sm print:hidden" id="pos-os-status-bar">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-emerald-950/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>🔌 HARDWARE WEDGE ACTIVE</span>
          </div>
          <span className="text-slate-700 hidden md:inline">|</span>
          <span className="text-slate-300 font-medium font-sans">Compatible with standard barcode scanners (2000-2026)</span>
        </div>
        
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <button
            onClick={() => setShowHelpModal(true)}
            className="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded border border-slate-700/50 flex items-center space-x-1 cursor-pointer transition-all"
            title="Open hardware setup & troubleshooting help"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>[F1] Help Guide</span>
          </button>
          
          <div className="bg-slate-950 px-3 py-1 rounded border border-slate-850 text-slate-400 flex items-center space-x-1.5 select-none">
            <Monitor className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-blue-300 font-bold text-[9px] uppercase tracking-wider">Windows 10+ x64 Desktop Mode</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="checkout-terminal-container">
      {/* Left Column: Cart & Checkout Form (cols 7) */}
      <div className="lg:col-span-7 flex flex-col space-y-5" id="cart-workspace">
        
        {/* Cart Header */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-slate-800" />
            <span className="font-semibold text-slate-800 text-sm">Active Shopping Basket</span>
            <span className="bg-slate-100 text-slate-800 font-mono text-xs font-bold px-2.5 py-0.5 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowScanner(true)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-3.5 py-2 rounded-lg font-medium flex items-center space-x-1.5 transition-all border border-blue-100/50"
              id="open-scanner-modal-btn"
            >
              <Camera className="w-4 h-4" />
              <span>Camera Barcode Scanner</span>
            </button>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-slate-50"
                title="Empty basket"
                id="clear-cart-btn"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Item Finder / Barcode typing */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (showCustomItemForm) setShowCustomItemForm(false);
                }}
                placeholder="Search by name, barcode, or category for quick checkout (Press F3)..."
                className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50/50"
                id="checkout-search-input"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCustomItemForm(!showCustomItemForm);
                if (searchQuery) setSearchQuery('');
              }}
              className={`text-[11px] px-3 py-2 rounded-lg font-bold border transition-all flex items-center space-x-1 ${
                showCustomItemForm
                  ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              id="toggle-custom-item-btn"
            >
              <span>{showCustomItemForm ? 'Cancel Custom' : '➕ Custom Item'}</span>
            </button>
          </div>

          {/* Custom Item Form */}
          {showCustomItemForm && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3.5 space-y-2.5 animate-fadeIn">
              <span className="text-[10px] text-blue-700 uppercase tracking-wider font-extrabold block">Sell Custom / Open-Price Item</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unlabeled Gift"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Price ({settings.currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:border-blue-500 font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Category</label>
                  <select
                    value={customItemCategory}
                    onChange={(e) => setCustomItemCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="General">General</option>
                    <option value="Services">Services</option>
                    <option value="Unlabeled Stock">Unlabeled Stock</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-1 border-t border-blue-100/40">
                <button
                  type="button"
                  onClick={() => {
                    const priceVal = parseFloat(customItemPrice);
                    if (!customItemName || isNaN(priceVal) || priceVal <= 0) {
                      alert("Please provide a valid custom product name and price greater than 0!");
                      return;
                    }
                    addCustomItemToCart(customItemName.trim(), priceVal, customItemCategory);
                    setCustomItemName('');
                    setCustomItemPrice('');
                    setShowCustomItemForm(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded transition-colors"
                >
                  Add to Basket
                </button>
              </div>
            </div>
          )}

          {/* Quick-add results display */}
          {searchQuery && (
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60 max-h-56 overflow-y-auto space-y-2 animate-fadeIn">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Matching items found ({searchableProducts.length}):</span>
              {searchableProducts.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-2">No matching items. Type a barcode or scan to add.</div>
              ) : (
                searchableProducts.map(p => {
                  const unitsPerCarton = p.unitsPerCarton || 24;
                  const cartonPriceVal = p.cartonPrice || (p.retailPrice * unitsPerCarton);
                  const totalStoreStock = p.retailStock + (p.wholesaleStock * unitsPerCarton);

                  return (
                    <div
                      key={p.id}
                      className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 text-xs">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>UPC: {p.barcode}</span>
                          <span>|</span>
                          <span className="text-blue-600 font-medium">Shelf: {p.retailStock} {p.unit || 'pcs'}</span>
                          <span>|</span>
                          <span className="text-amber-700 font-medium">Warehouse: {p.wholesaleStock} cartons ({p.wholesaleStock * unitsPerCarton} {p.unit || 'pcs'})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            addProductToCart(p, 'unit');
                            setSearchQuery('');
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer"
                        >
                          +1 {p.unit || 'Pc'} ({settings.currency}{p.retailPrice.toFixed(2)})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            addProductToCart(p, 'half_carton');
                            setSearchQuery('');
                          }}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer"
                          title={`Half carton (${Math.round(unitsPerCarton/2)} ${p.unit || 'pcs'})`}
                        >
                          +½ Carton ({settings.currency}{(cartonPriceVal / 2).toFixed(2)})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            addProductToCart(p, 'full_carton');
                            setSearchQuery('');
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-extrabold px-2 py-1 rounded shadow-2xs transition-all cursor-pointer"
                          title={`Full carton (${unitsPerCarton} ${p.unit || 'pcs'})`}
                        >
                          +1 Carton ({settings.currency}{cartonPriceVal.toFixed(2)})
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Quick-Add Shelf Catalog */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3" id="quick-add-shelf-catalog">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
              <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Quick-Add Shelf Catalog</span>
            </div>
            {/* Category tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto py-0.5 scrollbar-thin max-w-full">
              {['All', ...Array.from(new Set(products.map(p => p.category)))].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[9px] font-bold px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {products
              .filter(p => {
                const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
                const matchesQuery = !searchQuery || (
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.category.toLowerCase().includes(searchQuery.toLowerCase())
                );
                return matchesCategory && matchesQuery;
              })
              .map(p => {
                const cartItem = cart.find(item => item.productId === p.id);
                const qtyInCart = cartItem ? cartItem.quantity : 0;
                const unitsPerCarton = p.unitsPerCarton || 24;
                const totalStoreStock = p.retailStock + (p.wholesaleStock * unitsPerCarton);
                const isOutOfStock = totalStoreStock <= 0;
                const cartonPriceVal = p.cartonPrice || (p.retailPrice * unitsPerCarton);

                return (
                  <div 
                    key={p.id} 
                    className={`p-2.5 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                      qtyInCart > 0 
                        ? 'bg-blue-50/40 border-blue-200 shadow-2xs' 
                        : isOutOfStock 
                          ? 'bg-slate-50 border-slate-100 opacity-60' 
                          : 'bg-slate-50/50 border-slate-200/60 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-bold">
                        <span className="truncate max-w-[80px] text-slate-400">{p.category}</span>
                        {isOutOfStock ? (
                          <span className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded">OUT OF STOCK</span>
                        ) : (
                          <span className="text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                            Shelf: <strong className={p.retailStock <= 5 ? 'text-amber-600 font-extrabold' : 'text-slate-800'}>{p.retailStock}</strong> | Whse: <strong className="text-blue-700">{p.wholesaleStock} ctn</strong>
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-800 text-[11px] block truncate leading-tight" title={p.name}>
                        {p.name}
                      </span>
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-slate-900">
                          Unit: {settings.currency}{p.retailPrice.toFixed(2)}
                        </span>
                        <span className="text-amber-800 font-semibold bg-amber-50 px-1 rounded border border-amber-200/50">
                          Ctn ({unitsPerCarton}): {settings.currency}{cartonPriceVal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Quick Bulk Pack Add Controls */}
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addProductToCart(p, 'unit')}
                        className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[9px] font-bold py-1 px-1 rounded transition-all cursor-pointer text-center"
                      >
                        +1 {p.unit || 'pc'}
                      </button>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addProductToCart(p, 'half_carton')}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[9px] font-bold py-1 px-1 rounded transition-all cursor-pointer text-center"
                      >
                        +½ Carton
                      </button>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addProductToCart(p, 'full_carton')}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black py-1 px-1 rounded transition-all cursor-pointer text-center shadow-2xs"
                      >
                        +1 Carton
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Cart Item Rows */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex-1 min-h-[300px] flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <th className="p-4">Item Details</th>
                  <th className="p-4 text-right">Unit Price</th>
                  <th className="p-4 text-center">Quantity</th>
                  <th className="p-4 text-right">Total Price</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Barcode className="w-12 h-12 text-slate-300 stroke-1" />
                        <p className="font-medium">No items in active checkout basket</p>
                        <p className="text-[11px] max-w-xs text-slate-400">
                          Scan barcodes with your webcam or physical hardware scanner, or type the name in the bar above.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cart.map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    const unitsPerCarton = prod?.unitsPerCarton || 24;
                    const isExceedingShelf = prod ? item.quantity > prod.retailStock : false;
                    const autoCartonsNeeded = prod && isExceedingShelf 
                      ? Math.ceil((item.quantity - prod.retailStock) / unitsPerCarton) 
                      : 0;

                    return (
                      <tr key={item.productId} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                            <span>{item.productName}</span>
                            {item.packLabel && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300/60 font-bold text-[9.5px] px-2 py-0.5 rounded-full font-mono">
                                📦 {item.packLabel}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            Barcode: {item.barcode}
                          </div>

                          {/* Pack Type Quick Selector */}
                          {prod && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <span className="text-[9px] text-slate-400 font-bold uppercase">Pack:</span>
                              <button
                                type="button"
                                onClick={() => changeCartItemPack(idx, 'unit')}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                                  item.packType === 'unit' || !item.packType
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Single
                              </button>
                              <button
                                type="button"
                                onClick={() => changeCartItemPack(idx, 'half_carton')}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                                  item.packType === 'half_carton'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
                                }`}
                              >
                                ½ Carton
                              </button>
                              <button
                                type="button"
                                onClick={() => changeCartItemPack(idx, 'full_carton')}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                                  item.packType === 'full_carton'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                                }`}
                              >
                                1 Carton
                              </button>
                            </div>
                          )}

                          {/* Auto wholesale stock conversion indicator */}
                          {autoCartonsNeeded > 0 && (
                            <div className="text-[9.5px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 mt-1.5 flex items-center gap-1">
                              <span>⚡ Auto-opens {autoCartonsNeeded} bulk carton(s) from warehouse stock at checkout</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-mono text-right text-slate-600">
                          <div>{settings.currency}{item.price.toFixed(2)}</div>
                          <div className="text-[9px] text-slate-400">/ single unit</div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => updateCartQty(idx, item.quantity - 1)}
                                className="w-6 h-6 border border-slate-200 hover:border-slate-400 rounded-lg flex items-center justify-center text-slate-600 active:bg-slate-100 font-bold transition-all cursor-pointer"
                                id={`qty-minus-${item.productId}`}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateCartQty(idx, parseInt(e.target.value, 10) || 1)}
                                className="w-12 text-center font-mono border border-slate-200 rounded p-1 text-xs font-bold"
                                id={`qty-input-${item.productId}`}
                              />
                              <button
                                onClick={() => updateCartQty(idx, item.quantity + 1)}
                                className="w-6 h-6 border border-slate-200 hover:border-slate-400 rounded-lg flex items-center justify-center text-slate-600 active:bg-slate-100 font-bold transition-all cursor-pointer"
                                id={`qty-plus-${item.productId}`}
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[9.5px] font-mono text-slate-400">
                              {item.quantity} total {prod?.unit || 'pcs'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-right font-bold text-slate-900">
                          {settings.currency}{(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => removeCartItem(idx)}
                            className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                            id={`remove-item-${item.productId}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Customer Details & Checkout Payments Totals (cols 5) */}
      <div className="lg:col-span-5 space-y-5" id="checkout-sidebar">
        {/* Customer Info Form */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center space-x-1.5">
            <User className="w-4 h-4 text-slate-500" />
            <span>Customer Loyalty Identifier</span>
          </h3>

          <div className="grid grid-cols-1 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Customer Name (Optional)</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer / Business Owner"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                id="customer-name-input"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Customer Phone Number (For sales analytics)</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. +1 (555) 019-9283"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none font-mono"
                id="customer-phone-input"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Cashier Checkout Note</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes to receipt..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none text-[11px]"
                id="checkout-notes-input"
              />
            </div>
          </div>
        </div>

        {/* Payments Summary Calculator */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Payment Details</h3>
          
          <div className="space-y-3.5 text-xs">
            {/* Payment method selector */}
            <div>
              <span className="block text-slate-500 mb-1.5">Payment Method</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'cash',
                    label: 'Cash Tendered',
                    icon: DollarSign,
                    activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-md font-bold ring-2 ring-emerald-500/30 dark:bg-emerald-600 dark:border-emerald-500',
                    unactiveClass: 'bg-emerald-50/90 border-emerald-300 text-emerald-950 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-100 dark:hover:bg-emerald-900/60',
                    iconActive: 'text-white',
                    iconUnactive: 'text-emerald-700 dark:text-emerald-400'
                  },
                  {
                    id: 'card',
                    label: 'Credit/Debit Card',
                    icon: CreditCard,
                    activeClass: 'bg-blue-600 border-blue-600 text-white shadow-md font-bold ring-2 ring-blue-500/30 dark:bg-blue-600 dark:border-blue-500',
                    unactiveClass: 'bg-blue-50/90 border-blue-300 text-blue-950 hover:bg-blue-100 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-100 dark:hover:bg-blue-900/60',
                    iconActive: 'text-white',
                    iconUnactive: 'text-blue-700 dark:text-blue-400'
                  },
                  {
                    id: 'mobile_money',
                    label: 'Mobile Transfer',
                    icon: Sparkles,
                    activeClass: 'bg-purple-600 border-purple-600 text-white shadow-md font-bold ring-2 ring-purple-500/30 dark:bg-purple-600 dark:border-purple-500',
                    unactiveClass: 'bg-purple-50/90 border-purple-300 text-purple-950 hover:bg-purple-100 dark:bg-purple-950/60 dark:border-purple-700 dark:text-purple-100 dark:hover:bg-purple-900/60',
                    iconActive: 'text-white',
                    iconUnactive: 'text-purple-700 dark:text-purple-400'
                  },
                  {
                    id: 'credit',
                    label: 'Store Credit',
                    icon: User,
                    activeClass: 'bg-amber-600 border-amber-600 text-white shadow-md font-bold ring-2 ring-amber-500/30 dark:bg-amber-600 dark:border-amber-500',
                    unactiveClass: 'bg-amber-50/90 border-amber-300 text-amber-950 hover:bg-amber-100 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-100 dark:hover:bg-amber-900/60',
                    iconActive: 'text-white',
                    iconUnactive: 'text-amber-700 dark:text-amber-400'
                  }
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id as Sale['paymentMethod'])}
                      className={`p-2.5 rounded-lg border text-left font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                        isSelected ? item.activeClass : item.unactiveClass
                      }`}
                      id={`pay-method-${item.id}`}
                    >
                      <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? item.iconActive : item.iconUnactive}`} />
                      <span className="text-[11px] truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === 'credit' && (
              <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 space-y-3 mt-3 animate-fadeIn">
                <div className="flex items-center space-x-1.5 text-blue-800">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Store Credit Agreement</span>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-600 mb-1 font-bold">Payment Due Date</label>
                  <input
                    type="date"
                    value={creditDueDate}
                    onChange={(e) => setCreditDueDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none font-mono text-xs cursor-pointer"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="text-[10px] text-slate-600 leading-relaxed bg-white border border-blue-100/50 p-2.5 rounded-lg space-y-1">
                  <p className="font-bold text-blue-700 flex items-center gap-1">⏱️ Scheduled Credit Reminders:</p>
                  <div className="space-y-1 text-slate-500">
                    <div className="flex justify-between border-b border-slate-50 pb-1">
                      <span>1-Week Check-in Follow-up:</span>
                      <strong className="font-mono text-slate-800 bg-slate-100 px-1 py-0.2 rounded font-bold">{(() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 7);
                        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      })()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>2-Day Due Date Heads-up:</span>
                      <strong className="font-mono text-slate-800 bg-slate-100 px-1 py-0.2 rounded font-bold">{(() => {
                        const d = new Date(creditDueDate);
                        d.setDate(d.getDate() - 2);
                        return isNaN(d.getTime()) ? 'Invalid due date' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      })()}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'credit' && (!customerName.trim() || !customerPhone.trim()) && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start space-x-2 text-[10px] text-rose-700 font-bold leading-tight">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>Customer Name and Phone Number are required in the form above to complete a Store Credit transaction.</span>
              </div>
            )}

            {/* Discount selector */}
            <div className="border-t border-slate-100 pt-3">
              <label className="block text-slate-500 mb-1">Discount Amount (%)</label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-1/2 text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-mono"
                  id="discount-input"
                />
              </div>
            </div>

            {/* Subtotals Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 font-mono space-y-2 mt-4">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Basket Subtotal</span>
                <span>{settings.currency}{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 text-[11px] font-semibold">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-{settings.currency}{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Tax VAT ({settings.taxRate}%)</span>
                <span>{settings.currency}{taxAmount.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-200 my-2"></div>
              <div className="flex justify-between text-slate-900 text-sm font-extrabold font-sans">
                <span>Grand Total</span>
                <span className="text-base text-slate-950 font-mono font-bold">{settings.currency}{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit checkout actions */}
            <div className="space-y-2" id="checkout-actions-block">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (cart.length > 0) {
                      setCheckedItems(false);
                      setCheckedCustomer(false);
                      setCheckedPayment(false);
                      autoSetReceiptFormat(cart, paymentMethod);
                      setShowPrintPreview(true);
                    }
                  }}
                  disabled={cart.length === 0}
                  className={`py-3 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all border ${
                    cart.length === 0 
                      ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed shadow-none' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs cursor-pointer'
                  }`}
                  id="checkout-preview-btn"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Draft Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCheckoutSubmit()}
                  disabled={cart.length === 0}
                  className={`py-3 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all shadow-md ${
                    cart.length === 0 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                  }`}
                  id="checkout-submit-btn"
                >
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  <span>Complete & Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Camera Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <BarcodeScanner
            onScan={handleBarcodeScanned}
            products={products}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}

      {/* THERMAL PRINTER & OFFICE INVOICE - LIVE DRAFT PRINT PREVIEW MODAL */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn font-sans" id="print-preview-overlay">
          <div className={`bg-slate-900 rounded-2xl shadow-2xl w-full border border-slate-800 overflow-hidden flex flex-col my-8 transition-all ${
            printFormat === 'A4' ? 'max-w-2xl' : 'max-w-md'
          }`}>
            
            {/* Simulated Hardware Terminal Header */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center text-slate-400 select-none">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-wider text-blue-400 font-bold">POS Terminal Roll Simulator</span>
                <span className="text-white text-xs font-bold font-sans">Multi-Format Draft Print Preview</span>
              </div>
              <button 
                onClick={() => setShowPrintPreview(false)} 
                className="text-slate-500 hover:text-white font-semibold text-xs cursor-pointer p-1"
                id="close-preview-modal-x"
              >
                ✕ Close
              </button>
            </div>

            {/* PRINTER WIDTH FORMAT SELECTOR */}
            <div className="bg-slate-950/95 px-4 py-2 border-b border-slate-900 flex items-center justify-between text-xs print:hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono flex items-center gap-1">
                <Printer className="w-3.5 h-3.5 text-blue-500" />
                <span>Selected Printer:</span>
              </span>
              <div className="flex space-x-1 bg-slate-900 p-0.5 rounded border border-slate-800">
                {(['80mm', '58mm', 'A4'] as const).map((format) => (
                  <button
                    type="button"
                    key={format}
                    onClick={() => setPrintFormat(format)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                      printFormat === format
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Hardware LEDs Bar */}
            <div className="bg-slate-900/90 border-b border-slate-950 px-5 py-2.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  <span className="text-slate-300 font-semibold">POWER</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  <span className="text-slate-300 font-semibold">ONLINE</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                  <span>ERROR</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                  <span>PAPER</span>
                </div>
              </div>
              <span className="bg-slate-950 px-2 py-0.5 rounded text-[9px] text-blue-300 font-bold uppercase">
                {printFormat === '58mm' ? '58mm Mobile Roll' : printFormat === 'A4' ? 'A4 Office Spooler' : '80mm Coated Roll'}
              </span>
            </div>

            {/* Simulated Hardware Paper Feed Outlet Slot */}
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 h-4 border-b border-slate-950 flex justify-between items-center px-6 text-[8px] text-slate-600 font-mono select-none">
              <span>▼ THERMAL HEAD</span>
              <span>FEED SLOT</span>
              <span>TEAR BAR ▼</span>
            </div>

            {/* PHYSICAL SCROLLABLE PAPER ROLL / SHEET CANVAS */}
            <div className="p-4 bg-slate-900 overflow-y-auto max-h-[50vh] flex flex-col items-center">
              {printFormat === 'A4' ? (
                /* =================== A4 INVOICE SHEET DESIGN =================== */
                <div className="bg-white text-slate-800 shadow-2xl p-8 w-full font-sans border border-slate-200 text-xs rounded-lg text-left" id="receipt-preview-paper">
                  {/* Watermark Draft Warning */}
                  <div className="bg-amber-500 text-white text-center font-bold px-3 py-1.5 mb-6 text-[10px] uppercase tracking-widest rounded-md">
                    ⚠️ PRO-FORMA DRAFT - TRANSACTION NOT BOOKED YET
                  </div>

                  {/* Corporate Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">{settings.storeName}</h1>
                      <p className="text-[10px] text-slate-500 whitespace-pre-line leading-tight mt-1">{settings.address}</p>
                      {settings.phone && <p className="text-[10px] text-slate-500 mt-0.5">Tel: {settings.phone}</p>}
                    </div>
                    <div className="text-right">
                      <h2 className="text-lg font-black text-slate-900 tracking-wider uppercase">Pro-Forma Invoice</h2>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">NO: PRE-CHECK-DRAFT</p>
                      <p className="text-[10px] text-slate-500 font-mono">Date: {new Date().toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200 my-4"></div>

                  {/* Billed To / Client Box */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Billed To / Customer:</h3>
                      <p className="font-bold text-slate-900">{customerName.trim() || 'Walk-in Customer'}</p>
                      {customerPhone.trim() && <p className="text-slate-500 font-mono">Phone: {customerPhone.trim()}</p>}
                    </div>
                    <div className="text-right">
                      <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Transaction Details:</h3>
                      <p className="text-slate-700">Operator: <strong className="font-medium text-slate-900">{activeProfile?.name || 'System Cashier'}</strong></p>
                      <p className="text-slate-700">Payment Type: <strong className="font-bold text-blue-800 uppercase">{paymentMethod.replace(/_/g, ' ')}</strong></p>
                      {paymentMethod === 'credit' && (
                        <p className="text-rose-700 font-bold">Due Date: {new Date(creditDueDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>

                  {/* Table */}
                  <table className="w-full text-left text-xs mt-6 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[9px] font-bold uppercase">
                        <th className="py-2">No.</th>
                        <th className="py-2">Item Description</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-right">Unit Price</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cart.map((item, index) => (
                        <tr key={item.productId} className="text-slate-800">
                          <td className="py-2 font-mono text-slate-400 text-[10px]">{index + 1}</td>
                          <td className="py-2">
                            <div className="font-bold">{item.productName}</div>
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">BC: {item.barcode}</div>
                          </td>
                          <td className="py-2 text-center font-mono">{item.quantity}</td>
                          <td className="py-2 text-right font-mono">{settings.currency}{item.price.toFixed(2)}</td>
                          <td className="py-2 text-right font-bold font-mono">{settings.currency}{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary Breakdown */}
                  <div className="flex justify-end mt-6">
                    <div className="w-1/2 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                      <div className="flex justify-between">
                        <span>Draft Subtotal:</span>
                        <span className="font-mono">{settings.currency}{subtotal.toFixed(2)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-rose-600 font-semibold">
                          <span>Discount Applied ({discountPercent}%):</span>
                          <span className="font-mono">-{settings.currency}{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Tax / VAT ({settings.taxRate}%):</span>
                        <span className="font-mono">{settings.currency}{taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-slate-200 my-1.5"></div>
                      <div className="flex justify-between text-sm font-bold text-slate-900">
                        <span>Total Estimate:</span>
                        <span className="font-mono text-blue-900">{settings.currency}{finalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer signature */}
                  <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-end">
                    <div className="text-[9px] text-slate-400 space-y-1 w-2/3 leading-normal">
                      <p>{settings.receiptHeader}</p>
                      <p>{settings.receiptFooter}</p>
                    </div>
                    <div className="text-center w-1/3">
                      <div className="border-b border-dashed border-slate-300 h-6"></div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-1">Authorized Cashier</p>
                    </div>
                  </div>
                </div>
              ) : printFormat === '58mm' ? (
                /* =================== 58MM NARROW RECEIPT DESIGN =================== */
                <div 
                  className="bg-[#FCFBF8] text-slate-800 shadow-xl px-3.5 py-4 w-full max-w-[220px] text-[10px] font-mono relative text-left"
                  id="receipt-preview-paper"
                >
                  <div className="bg-black text-white text-center font-bold px-1.5 py-0.5 mb-2.5 text-[8px] uppercase tracking-wider">
                    ⚠️ PRO-FORMA DRAFT
                  </div>

                  <div className="text-center space-y-0.5 mb-3">
                    <h1 className="text-[11px] font-black text-black uppercase tracking-tight leading-none">{settings.storeName}</h1>
                    <p className="text-[8px] text-slate-600 whitespace-pre-line leading-none mt-1">{settings.address}</p>
                    <div className="h-px border-t border-dotted border-slate-400 my-2"></div>
                    
                    <div className="text-[8px] text-left text-slate-700 space-y-0.5">
                      <div><strong>DATE:</strong> {new Date().toLocaleDateString()}</div>
                      <div><strong>OP:</strong> {activeProfile?.name || 'Cashier'}</div>
                      <div><strong>CUST:</strong> {customerName.trim() || 'Walk-in'}</div>
                    </div>
                    <div className="h-px border-t border-dotted border-slate-400 my-2"></div>
                  </div>

                  <table className="w-full text-left text-[9px] mb-2">
                    <thead>
                      <tr className="border-b border-dotted border-slate-400 text-slate-600">
                        <th className="pb-0.5 font-bold">Item</th>
                        <th className="pb-0.5 text-center font-bold">Qty</th>
                        <th className="pb-0.5 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.productId} className="text-black">
                          <td className="py-0.5 truncate max-w-[90px]">{item.productName}</td>
                          <td className="py-0.5 text-center">{item.quantity}</td>
                          <td className="py-0.5 text-right">{settings.currency}{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="text-[9px] space-y-1 border-t border-dotted border-slate-400 pt-1.5 mb-2 text-black">
                    <div className="flex justify-between">
                      <span>SUBTOTAL</span>
                      <span>{settings.currency}{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-rose-700 font-bold">
                        <span>DISCOUNT</span>
                        <span>-{settings.currency}{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>TAX VAT ({settings.taxRate}%)</span>
                      <span>{settings.currency}{taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="h-px border-t border-dotted border-slate-400 my-0.5"></div>
                    <div className="flex justify-between text-[11px] font-black">
                      <span>GRAND TOTAL</span>
                      <span>{settings.currency}{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-center text-[8px] text-slate-500 space-y-0.5 border-t border-dotted border-slate-300 pt-2 leading-normal">
                    <p>{settings.receiptHeader}</p>
                    <p>{settings.receiptFooter}</p>
                  </div>
                </div>
              ) : (
                /* =================== 80MM STANDARD RECEIPT DESIGN =================== */
                <div 
                  className="bg-[#FCFBF8] text-slate-800 shadow-xl px-5 py-6 w-full max-w-[310px] text-xs font-mono relative text-left"
                  id="receipt-preview-paper"
                >
                  {/* Draft Verification Notice */}
                  <div className="bg-black text-white text-center font-bold px-2 py-1 mb-4 text-[9px] uppercase tracking-widest rounded-xs">
                    ⚠️ Draft Receipt - Print Preview
                  </div>

                  {/* Receipt Header details */}
                  <div className="text-center space-y-1 mb-4">
                    <h1 className="text-base font-extrabold text-black tracking-wide uppercase font-mono">{settings.storeName}</h1>
                    <p className="text-[10px] text-slate-600 whitespace-pre-line leading-tight font-mono">{settings.address}</p>
                    {settings.phone && <p className="text-[10px] text-slate-600 font-mono">Tel: {settings.phone}</p>}
                    
                    <div className="h-px border-t border-dashed border-slate-400 my-3"></div>
                    
                    <div className="text-[10px] text-left text-slate-700 space-y-0.5 font-mono">
                      <div><strong>RECEIPT TYPE:</strong> PRE-CHECK PREVIEW</div>
                      <div><strong>DRAFT DATE:</strong> {new Date().toLocaleString()}</div>
                      <div><strong>CASHIER:</strong> {activeProfile?.name || 'System Operator'}</div>
                      <div><strong>CUSTOMER:</strong> {customerName.trim() || 'Walk-in Customer'}</div>
                      {customerPhone.trim() && (
                        <div><strong>CUSTOMER TEL:</strong> {customerPhone.trim()}</div>
                      )}
                    </div>
                    
                    <div className="h-px border-t border-dashed border-slate-400 my-3"></div>
                  </div>

                  {/* Items detailed lists */}
                  <table className="w-full text-left font-mono text-[11px] mb-4">
                    <thead>
                      <tr className="border-b border-dashed border-slate-400 text-slate-600">
                        <th className="pb-1 font-bold">Item</th>
                        <th className="pb-1 text-center font-bold">Qty</th>
                        <th className="pb-1 text-right font-bold">Price</th>
                        <th className="pb-1 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.productId} className="text-black hover:bg-slate-50">
                          <td className="py-1.5 max-w-[120px] truncate">{item.productName}</td>
                          <td className="py-1.5 text-center">{item.quantity}</td>
                          <td className="py-1.5 text-right">{settings.currency}{item.price.toFixed(2)}</td>
                          <td className="py-1.5 text-right">{settings.currency}{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals Breakdown section */}
                  <div className="font-mono text-[11px] space-y-1.5 border-t border-dashed border-slate-400 pt-3 mb-4 text-black">
                    <div className="flex justify-between">
                      <span>SUBTOTAL</span>
                      <span>{settings.currency}{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-rose-700 font-semibold">
                        <span>DISCOUNT ({discountPercent}%)</span>
                        <span>-{settings.currency}{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>TAX VAT ({settings.taxRate}%)</span>
                      <span>{settings.currency}{taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="h-px border-t border-dashed border-slate-400 my-1"></div>
                    <div className="flex justify-between text-xs font-bold">
                      <span>GRAND TOTAL</span>
                      <span>{settings.currency}{finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="h-px border-t border-dashed border-slate-400 my-1"></div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-semibold uppercase">
                      <span>PROPOSED PAY METHOD</span>
                      <span>{paymentMethod.replace(/_/g, ' ')}</span>
                    </div>
                    {paymentMethod === 'credit' && (
                      <div className="flex justify-between text-[10px] text-blue-800 font-bold">
                        <span>DUE DATE</span>
                        <span>{new Date(creditDueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {notes.trim() && (
                      <div className="text-[10px] text-slate-500 border border-slate-200 p-1.5 rounded bg-slate-50/50 mt-2 font-sans italic">
                        <strong>Notes:</strong> "{notes.trim()}"
                      </div>
                    )}
                  </div>

                  {/* Barcode in CSS */}
                  <div className="py-3 border-t border-dashed border-slate-300">
                    <div className="flex justify-center" title="Pre-Check ID Code">
                      <div className="flex h-10 items-end space-x-[1px]">
                        {[2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,3,1,2,1,4,1,2,1,3,2,1].map((w, i) => (
                          <div key={i} className="bg-black" style={{ width: `${w}px`, height: '100%' }}></div>
                        ))}
                      </div>
                    </div>
                    <div className="text-center text-[9px] text-slate-500 font-mono mt-1 tracking-widest">
                      *PRE-VERIFY-DRAFT*
                    </div>
                  </div>

                  {/* Footnotes */}
                  <div className="text-center font-mono text-[9px] text-slate-500 space-y-1 mt-2 leading-relaxed">
                    <p className="whitespace-pre-line">{settings.receiptHeader}</p>
                    <p className="whitespace-pre-line font-bold">--- NOT A LEGAL FISCAL RECEIPT ---</p>
                  </div>
                </div>
              )}
            </div>

            {/* INTEGRATED OPERATOR PRE-FLIGHT CHECKLIST */}
            <div className="bg-slate-950/50 p-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center space-x-1.5 text-blue-400">
                <span className="text-xs">🛡️</span>
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Cashier Pre-Flight Verification</span>
              </div>
              
              <div className="space-y-2 text-slate-300 text-xs">
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={checkedItems} 
                    onChange={(e) => setCheckedItems(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-0 mt-0.5 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span className="leading-tight text-[11px] font-medium text-slate-300">
                    Verify basket items and quantities match ground orders
                  </span>
                </label>
                
                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={checkedCustomer} 
                    onChange={(e) => setCheckedCustomer(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-0 mt-0.5 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span className="leading-tight text-[11px] font-medium text-slate-300">
                    Confirm customer identity matches: <strong className="text-white font-semibold">{customerName.trim() || 'Walk-in Customer'}</strong>
                  </span>
                </label>

                <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={checkedPayment} 
                    onChange={(e) => setCheckedPayment(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-0 mt-0.5 w-4.5 h-4.5 cursor-pointer"
                  />
                  <span className="leading-tight text-[11px] font-medium text-slate-300">
                    Confirm payment method matches: <strong className="text-white font-semibold uppercase">{paymentMethod.replace(/_/g, ' ')}</strong>
                  </span>
                </label>
              </div>
              
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                * Checking all three locks enables the confirmation button, preventing accidental ledger bookings.
              </p>
            </div>

            {/* PREVIEW DIALOG ACTIONS */}
            <div className="bg-slate-950 p-4 border-t border-slate-850 flex space-x-2.5">
              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 rounded-lg font-medium cursor-pointer transition-colors border border-slate-700/50"
              >
                ✕ Cancel / Adjust
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (checkedItems && checkedCustomer && checkedPayment) {
                    handleCheckoutSubmit();
                  }
                }}
                disabled={!(checkedItems && checkedCustomer && checkedPayment)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md ${
                  (checkedItems && checkedCustomer && checkedPayment)
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/15 cursor-pointer hover:shadow-lg'
                    : 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed shadow-none'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Save (F9)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED CHECKOUT RECEIPT PREVIEW MODAL */}
      {completedSale && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn font-sans" id="receipt-modal-overlay">
          <div className={`bg-slate-900 rounded-2xl shadow-2xl w-full border border-slate-800 overflow-hidden flex flex-col my-8 transition-all ${
            printFormat === 'A4' ? 'max-w-2xl' : 'max-w-md'
          }`}>
            
            {/* Completed Header */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center text-slate-400 print:hidden select-none">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold">✓ Transaction Saved Offline</span>
                <span className="text-white text-xs font-bold">Physical Thermal Receipt Issued</span>
              </div>
              <button 
                type="button"
                onClick={clearCart} 
                className="text-slate-500 hover:text-white font-semibold text-xs cursor-pointer p-1"
                id="close-receipt-modal-x"
              >
                ✕ Reset Cart
              </button>
            </div>

            {/* PRINTER WIDTH FORMAT SELECTOR */}
            <div className="bg-slate-950/95 px-4 py-2 border-b border-slate-900 flex items-center justify-between text-xs print:hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono flex items-center gap-1">
                <Printer className="w-3.5 h-3.5 text-blue-500" />
                <span>Selected Printer:</span>
              </span>
              <div className="flex space-x-1 bg-slate-900 p-0.5 rounded border border-slate-800">
                {(['80mm', '58mm', 'A4'] as const).map((format) => (
                  <button
                    type="button"
                    key={format}
                    onClick={() => setPrintFormat(format)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                      printFormat === format
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* LEDs Status */}
            <div className="bg-slate-900 border-b border-slate-950 px-5 py-2 flex items-center justify-between text-[10px] text-slate-400 font-mono print:hidden">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-emerald-400"></div>
                  <span className="text-slate-300">POWER</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-400"></div>
                  <span className="text-slate-300">ONLINE</span>
                </div>
              </div>
              <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-blue-300 font-bold uppercase">
                {printFormat === '58mm' ? '58mm Mobile Roll' : printFormat === 'A4' ? 'A4 Office Spooler' : '80mm Coated Roll'}
              </span>
            </div>

            {/* Simulated Paper Outlet */}
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 h-3 border-b border-slate-950 flex justify-between items-center px-6 text-[8px] text-slate-600 font-mono select-none print:hidden">
              <span>▼ THERMAL TEAR</span>
              <span>READY</span>
              <span>SLOT ▼</span>
            </div>

            {/* PHYSICAL SCROLLABLE PAPER ROLL / SHEET CANVAS */}
            <div className="p-4 bg-slate-900 overflow-y-auto max-h-[50vh] flex flex-col items-center">
              {printFormat === 'A4' ? (
                /* =================== A4 COMPLETED INVOICE DESIGN =================== */
                <div className="bg-white text-slate-800 shadow-2xl p-8 w-full font-sans border border-slate-200 text-xs rounded-lg text-left animate-fadeIn" id="receipt-print-area">
                  {/* Watermark Paid Warning */}
                  <div className="bg-emerald-600 text-white text-center font-bold px-3 py-1.5 mb-6 text-[10px] uppercase tracking-widest rounded-md print:hidden">
                    ✓ SECURE TRANSACTION BOOKED & PAID
                  </div>

                  {/* Corporate Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">{settings.storeName}</h1>
                      <p className="text-[10px] text-slate-500 whitespace-pre-line leading-tight mt-1">{settings.address}</p>
                      {settings.phone && <p className="text-[10px] text-slate-500 mt-0.5">Tel: {settings.phone}</p>}
                    </div>
                    <div className="text-right">
                      <h2 className="text-lg font-black text-slate-900 tracking-wider uppercase">Official Tax Invoice</h2>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">NO: #{completedSale.id.substring(0, 14).toUpperCase()}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Date: {new Date(completedSale.timestamp).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200 my-4"></div>

                  {/* Billed To / Client Box */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Billed To / Customer:</h3>
                      <p className="font-bold text-slate-900">{completedSale.customerName.trim() || 'Walk-in Customer'}</p>
                      {completedSale.customerPhone && completedSale.customerPhone !== 'N/A' && (
                        <p className="text-slate-500 font-mono">Phone: {completedSale.customerPhone}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Transaction Details:</h3>
                      <p className="text-slate-700">Operator: <strong className="font-medium text-slate-900">{completedSale.cashierName || 'System Cashier'}</strong></p>
                      <p className="text-slate-700">Payment Type: <strong className="font-bold text-emerald-800 uppercase">{completedSale.paymentMethod.replace(/_/g, ' ')}</strong></p>
                      {completedSale.paymentMethod === 'credit' && completedSale.dueDate && (
                        <p className="text-rose-700 font-bold">Due Date: {new Date(completedSale.dueDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>

                  {/* Table */}
                  <table className="w-full text-left text-xs mt-6 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[9px] font-bold uppercase">
                        <th className="py-2">No.</th>
                        <th className="py-2">Item Description</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-right">Unit Price</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {completedSale.items.map((item, index) => (
                        <tr key={item.productId} className="text-slate-800">
                          <td className="py-2 font-mono text-slate-400 text-[10px]">{index + 1}</td>
                          <td className="py-2">
                            <div className="font-bold">{item.productName}</div>
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">BC: {item.barcode}</div>
                          </td>
                          <td className="py-2 text-center font-mono">{item.quantity}</td>
                          <td className="py-2 text-right font-mono">{settings.currency}{item.price.toFixed(2)}</td>
                          <td className="py-2 text-right font-bold font-mono">{settings.currency}{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary Breakdown */}
                  <div className="flex justify-end mt-6">
                    <div className="w-1/2 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                      <div className="flex justify-between">
                        <span>Invoice Subtotal:</span>
                        <span className="font-mono">{settings.currency}{completedSale.subtotal.toFixed(2)}</span>
                      </div>
                      {completedSale.discount > 0 && (
                        <div className="flex justify-between text-rose-600 font-semibold">
                          <span>Discount Applied:</span>
                          <span className="font-mono">-{settings.currency}{completedSale.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Tax / VAT ({settings.taxRate}%):</span>
                        <span className="font-mono">{settings.currency}{completedSale.tax.toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-slate-200 my-1.5"></div>
                      <div className="flex justify-between text-sm font-bold text-slate-900">
                        <span>Grand Total Paid:</span>
                        <span className="font-mono text-blue-900">{settings.currency}{completedSale.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Barcode block */}
                  <div className="mt-8 py-4 border-t border-b border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <div className="flex h-8 items-end space-x-[1px]">
                      {[1,3,1,2,4,1,2,1,3,2,1,4,1,2,3,1,2,1,4,1,2,1,3,2,1,1,2,4].map((w, i) => (
                        <div key={i} className="bg-black" style={{ width: `${w}px`, height: '100%' }}></div>
                      ))}
                    </div>
                    <span className="text-[8px] font-mono tracking-widest mt-1 text-slate-500">*{completedSale.id}*</span>
                  </div>

                  {/* Footer signature */}
                  <div className="mt-8 pt-4 flex justify-between items-end">
                    <div className="text-[9px] text-slate-400 space-y-1 w-2/3 leading-normal">
                      <p>{settings.receiptHeader}</p>
                      <p>{settings.receiptFooter}</p>
                    </div>
                    <div className="text-center w-1/3">
                      <div className="border-b border-dashed border-slate-300 h-6"></div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-1">Authorized Cashier</p>
                    </div>
                  </div>
                </div>
              ) : printFormat === '58mm' ? (
                /* =================== 58MM COMPLETED RECEIPT DESIGN =================== */
                <div 
                  className="bg-[#FCFBF8] text-slate-800 shadow-xl px-3.5 py-4 w-full max-w-[220px] text-[10px] font-mono relative text-left animate-fadeIn"
                  id="receipt-print-area"
                >
                  <div className="bg-black text-white text-center font-bold px-1.5 py-0.5 mb-2.5 text-[8px] uppercase tracking-wider">
                    ✓ SECURE PAID RECEIPT
                  </div>

                  <div className="text-center space-y-0.5 mb-3">
                    <h1 className="text-[11px] font-black text-black uppercase tracking-tight leading-none">{settings.storeName}</h1>
                    <p className="text-[8px] text-slate-600 whitespace-pre-line leading-none mt-1">{settings.address}</p>
                    <div className="h-px border-t border-dotted border-slate-400 my-2"></div>
                    
                    <div className="text-[8px] text-left text-slate-700 space-y-0.5">
                      <div><strong>ID:</strong> {completedSale.id.substring(0, 12).toUpperCase()}</div>
                      <div><strong>DATE:</strong> {new Date(completedSale.timestamp).toLocaleDateString()}</div>
                      <div><strong>OP:</strong> {completedSale.cashierName || 'Cashier'}</div>
                      <div><strong>CUST:</strong> {completedSale.customerName || 'Walk-in'}</div>
                    </div>
                    <div className="h-px border-t border-dotted border-slate-400 my-2"></div>
                  </div>

                  <table className="w-full text-left text-[9px] mb-2">
                    <thead>
                      <tr className="border-b border-dotted border-slate-400 text-slate-600">
                        <th className="pb-0.5 font-bold">Item</th>
                        <th className="pb-0.5 text-center font-bold">Qty</th>
                        <th className="pb-0.5 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedSale.items.map((item) => (
                        <tr key={item.productId} className="text-black">
                          <td className="py-0.5 truncate max-w-[90px]">{item.productName}</td>
                          <td className="py-0.5 text-center">{item.quantity}</td>
                          <td className="py-0.5 text-right">{settings.currency}{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="text-[9px] space-y-1 border-t border-dotted border-slate-400 pt-1.5 mb-2 text-black">
                    <div className="flex justify-between">
                      <span>SUBTOTAL</span>
                      <span>{settings.currency}{completedSale.subtotal.toFixed(2)}</span>
                    </div>
                    {completedSale.discount > 0 && (
                      <div className="flex justify-between text-rose-700 font-bold">
                        <span>DISCOUNT</span>
                        <span>-{settings.currency}{completedSale.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>TAX VAT ({settings.taxRate}%)</span>
                      <span>{settings.currency}{completedSale.tax.toFixed(2)}</span>
                    </div>
                    <div className="h-px border-t border-dotted border-slate-400 my-0.5"></div>
                    <div className="flex justify-between text-[11px] font-black">
                      <span>GRAND TOTAL</span>
                      <span>{settings.currency}{completedSale.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Micro Barcode */}
                  <div className="py-2 border-t border-dotted border-slate-300 flex flex-col items-center">
                    <div className="flex h-6 items-end space-x-[1px]">
                      {[1,2,3,1,2,1,3,1,1,2,3,2,1,1].map((w, i) => (
                        <div key={i} className="bg-black" style={{ width: `${w}px`, height: '100%' }}></div>
                      ))}
                    </div>
                    <span className="text-[7px] text-slate-500 font-mono mt-0.5">#{completedSale.id.substring(0,8)}</span>
                  </div>

                  <div className="text-center text-[8px] text-slate-500 space-y-0.5 border-t border-dotted border-slate-300 pt-2 leading-normal">
                    <p>{settings.receiptHeader}</p>
                    <p>{settings.receiptFooter}</p>
                  </div>
                </div>
              ) : (
                /* =================== 80MM STANDARD COMPLETED RECEIPT DESIGN =================== */
                <div 
                  className="bg-[#FCFBF8] text-slate-800 shadow-xl px-5 py-6 w-full max-w-[310px] text-xs font-mono relative text-left animate-fadeIn"
                  id="receipt-print-area"
                >
                  <div className="text-center space-y-1 mb-4">
                    <h1 className="text-base font-extrabold text-black tracking-wide uppercase font-mono">{settings.storeName}</h1>
                    <p className="text-[10px] text-slate-600 whitespace-pre-line leading-tight font-mono">{settings.address}</p>
                    {settings.phone && <p className="text-[10px] text-slate-600 font-mono">Tel: {settings.phone}</p>}
                    
                    <div className="h-px border-t border-dashed border-slate-400 my-3"></div>
                    
                    <div className="text-[10px] text-left text-slate-700 space-y-0.5 font-mono">
                      <div><strong>TRANSACTION NO:</strong> {completedSale.id.toUpperCase()}</div>
                      <div><strong>DATE RECORDED:</strong> {new Date(completedSale.timestamp).toLocaleString()}</div>
                      <div><strong>OPERATOR:</strong> {completedSale.cashierName || 'System Cashier'}</div>
                      <div><strong>CUSTOMER:</strong> {completedSale.customerName || 'Walk-in Customer'}</div>
                    </div>
                    
                    <div className="h-px border-t border-dashed border-slate-400 my-3"></div>
                  </div>

                  {/* Items detailed lists */}
                  <table className="w-full text-left font-mono text-[11px] mb-4">
                    <thead>
                      <tr className="border-b border-dashed border-slate-400 text-slate-600">
                        <th className="pb-1 font-bold">Item</th>
                        <th className="pb-1 text-center font-bold">Qty</th>
                        <th className="pb-1 text-right font-bold">Price</th>
                        <th className="pb-1 text-right font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedSale.items.map((item) => (
                        <tr key={item.productId} className="text-black">
                          <td className="py-1.5 max-w-[120px] truncate">{item.productName}</td>
                          <td className="py-1.5 text-center">{item.quantity}</td>
                          <td className="py-1.5 text-right">{settings.currency}{item.price.toFixed(2)}</td>
                          <td className="py-1.5 text-right">{settings.currency}{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals breakdown */}
                  <div className="font-mono text-[11px] space-y-1.5 border-t border-dashed border-slate-400 pt-3 mb-4 text-black">
                    <div className="flex justify-between">
                      <span>SUBTOTAL</span>
                      <span>{settings.currency}{completedSale.subtotal.toFixed(2)}</span>
                    </div>
                    {completedSale.discount > 0 && (
                      <div className="flex justify-between text-rose-700 font-semibold">
                        <span>DISCOUNT APPLIED</span>
                        <span>-{settings.currency}{completedSale.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>TAX VAT ({settings.taxRate}%)</span>
                      <span>{settings.currency}{completedSale.tax.toFixed(2)}</span>
                    </div>
                    <div className="h-px border-t border-dashed border-slate-400 my-1"></div>
                    <div className="flex justify-between text-xs font-bold">
                      <span>GRAND TOTAL</span>
                      <span>{settings.currency}{completedSale.total.toFixed(2)}</span>
                    </div>
                    <div className="h-px border-t border-dashed border-slate-400 my-1"></div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-semibold uppercase">
                      <span>PAID BY</span>
                      <span>{completedSale.paymentMethod.replace(/_/g, ' ')}</span>
                    </div>
                    {completedSale.paymentMethod === 'credit' && completedSale.dueDate && (
                      <div className="flex justify-between text-[10px] text-blue-800 font-bold">
                        <span>DUE DATE</span>
                        <span>{new Date(completedSale.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {completedSale.notes && (
                      <div className="text-[10px] text-slate-500 border border-slate-200 p-1.5 rounded bg-slate-50/50 mt-2 font-sans italic">
                        <strong>Notes:</strong> "{completedSale.notes}"
                      </div>
                    )}
                  </div>

                  {/* Barcode in CSS */}
                  <div className="py-3 border-t border-dashed border-slate-300">
                    <div className="flex justify-center" title="Pre-Check ID Code">
                      <div className="flex h-10 items-end space-x-[1px]">
                        {[2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,3,1,2,1,4,1,2,1,3,2,1].map((w, i) => (
                          <div key={i} className="bg-black" style={{ width: `${w}px`, height: '100%' }}></div>
                        ))}
                      </div>
                    </div>
                    <div className="text-center text-[9px] text-slate-500 font-mono mt-1 tracking-widest">
                      *{completedSale.id}*
                    </div>
                  </div>

                  {/* Footnotes */}
                  <div className="text-center font-mono text-[9px] text-slate-500 space-y-1.5 mt-2 leading-relaxed">
                    <p className="whitespace-pre-line">{settings.receiptHeader}</p>
                    <div className="h-px border-t border-slate-300 w-1/3 mx-auto"></div>
                    <p className="whitespace-pre-line">{settings.receiptFooter}</p>
                  </div>
                </div>
              )}
            </div>

            {/* PRINT / EXPORT RECEIPT MODAL ACTIONS */}
            <div className="bg-slate-950 p-4 border-t border-slate-850 flex space-x-2.5 print:hidden">
              <button
                type="button"
                onClick={clearCart}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-3 rounded-lg font-medium cursor-pointer transition-colors border border-slate-700/50 animate-pulse"
                id="receipt-done-btn"
              >
                Done / Next Sale (Esc)
              </button>
              
              <button
                type="button"
                onClick={triggerPrintReceipt}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-3 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-blue-600/15 cursor-pointer hover:shadow-lg"
                id="receipt-print-btn"
              >
                <Printer className="w-4 h-4" />
                <span>Print Physical Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HARDWARE INTERACTION & PRINT CALIBRATION GUIDE MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn font-sans" id="help-modal-overlay">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-800 overflow-hidden flex flex-col my-8 text-left">
            
            {/* Header */}
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex justify-between items-center text-slate-400 select-none">
              <div className="flex items-center space-x-2">
                <Monitor className="text-blue-400 w-5 h-5" />
                <span className="text-white text-sm font-bold">Hardware Connection & Print Calibration Guide</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowHelpModal(false)} 
                className="text-slate-500 hover:text-white font-semibold text-xs cursor-pointer p-1"
                id="close-help-modal-x"
              >
                ✕ Close
              </button>
            </div>

            {/* Scrollable instructions */}
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
              
              {/* Timing wedges */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-blue-400 font-bold flex items-center space-x-1">
                  <span>🔌</span>
                  <span>1. Hardware Wedge Barcode Scanners (USB/PS2)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  This POS system includes an industrial-grade input-timing filter fully compatible with your <strong className="text-blue-400">ZKTECO ZKB209</strong> desktop scanner, as well as all other keyboard-wedge laser hardware (including Honeywell, Zebra, Symbol, Datalogic, and Eyoyo).
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400 font-mono">
                  <li><strong>Plug & Play (ZKB209):</strong> Connect the USB cable directly. No custom Windows drivers are required.</li>
                  <li><strong>Automatic Capture:</strong> Keystrokes received within 65ms are caught globally by the wedge engine, matching the scanned product instantly, regardless of what field is currently active.</li>
                </ul>
              </div>

              {/* Thermal printers instructions */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-emerald-400 font-bold flex items-center space-x-1">
                  <span>🖨️</span>
                  <span>2. Thermal Receipt Printer Setup (80mm Roll)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Our custom multi-format layout maps CSS grids cleanly to standard paper rolls, optimized specifically for your <strong className="text-emerald-400">SNBC BTP-S81 (80mm)</strong> thermal printer as well as Epson TM, Star Micronics, and XPrinter hardware.
                </p>
                <div className="space-y-1 bg-slate-900 p-2.5 rounded border border-slate-850/50 text-[11px] font-mono text-slate-400">
                  <p className="text-white font-bold">SNBC BTP-S81 Print Settings:</p>
                  <p>1. Toggle print preview (F9) and click "Print Physical Receipt"</p>
                  <p>2. In the Windows Print Dialog, expand <strong>"More Settings"</strong></p>
                  <p>3. Select Margins: <strong className="text-emerald-400">None</strong> or <strong className="text-emerald-400">Minimum</strong></p>
                  <p>4. Check/Enable: <strong className="text-emerald-400">"Background Graphics"</strong> (loads receipts cleanly)</p>
                  <p>5. Uncheck/Disable: <strong>"Headers and Footers"</strong> (removes unwanted URL &amp; Date stamps)</p>
                </div>
              </div>

              {/* A4 Office printer */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-indigo-400 font-bold flex items-center space-x-1">
                  <span>📄</span>
                  <span>3. A4 Corporate Invoice Printing</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  For corporate billing, client credit accounts, or legal tax invoices, toggle the width setting to <strong className="text-indigo-300">A4 Invoice</strong>. This renders a highly sophisticated multi-column invoice with a dedicated customer section, invoice header, and custom operator details perfectly suited for standard laser printers.
                </p>
              </div>

              {/* Shortcuts sheet */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-amber-400 font-bold flex items-center space-x-1">
                  <span>⌨️</span>
                  <span>4. Windows 10+ POS Keyboard Shortcuts Guide</span>
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                  <div className="flex justify-between border-b border-slate-850 pb-1"><span>[F1] Help Guide</span> <span className="text-white">Active</span></div>
                  <div className="flex justify-between border-b border-slate-850 pb-1"><span>[F2] Reset Basket</span> <span className="text-white">Clear All</span></div>
                  <div className="flex justify-between border-b border-slate-850 pb-1"><span>[F3] Search Bar</span> <span className="text-white">Focus Field</span></div>
                  <div className="flex justify-between border-b border-slate-850 pb-1"><span>[F4] Soft Camera</span> <span className="text-white">Toggle scan</span></div>
                  <div className="flex justify-between border-b border-slate-850 pb-1"><span>[F8] Custom Item</span> <span className="text-white">Toggle Form</span></div>
                  <div className="flex justify-between border-b border-slate-850 pb-1"><span>[F9] Save & Print</span> <span className="text-white">Book Order</span></div>
                </div>
              </div>

            </div>

            {/* Footer actions */}
            <div className="bg-slate-950 p-4 border-t border-slate-850 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5 py-2 rounded-lg font-bold cursor-pointer transition-all shadow-md shadow-blue-900/10"
              >
                Understood / Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close of grid container */}
      </div> 

      {/* DESKTOP KEYBOARD HOTKEYS BAR */}
      <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-sans print:hidden shadow-inner select-none" id="keyboard-hotkeys-status">
        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[9px] tracking-wider font-mono">Quick hotkeys:</span>
        <div className="flex items-center space-x-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-2xs">F1</kbd> <span className="text-slate-600 dark:text-slate-300 text-[11px]">Hardware Help</span></div>
        <div className="flex items-center space-x-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-2xs">F2</kbd> <span className="text-slate-600 dark:text-slate-300 text-[11px]">Reset Cart</span></div>
        <div className="flex items-center space-x-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-2xs">F3</kbd> <span className="text-slate-600 dark:text-slate-300 text-[11px]">Search Input</span></div>
        <div className="flex items-center space-x-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-2xs">F4</kbd> <span className="text-slate-600 dark:text-slate-300 text-[11px]">Toggle Scanner</span></div>
        <div className="flex items-center space-x-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-2xs">F8</kbd> <span className="text-slate-600 dark:text-slate-300 text-[11px]">Add Custom Item</span></div>
        <div className="flex items-center space-x-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-2xs">F9</kbd> <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">Book & Print</span></div>
        <div className="flex items-center space-x-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-2xs">Esc</kbd> <span className="text-slate-600 dark:text-slate-300 text-[11px]">Reset / Close</span></div>
      </div>

    </div> /* Close of checkout-terminal-wrapper */
  );
}
