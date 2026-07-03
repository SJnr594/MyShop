import React, { useState, useEffect } from 'react';
import { Product, Sale, SaleItem, StoreSettings, UserProfile } from '../types';
import { ShoppingCart, Search, User, Trash2, CreditCard, DollarSign, Tag, Printer, CheckCircle, Barcode, Camera, Sparkles, AlertCircle } from 'lucide-react';
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

  // Global key listener for physical hardware scanners (Keyboard wedge)
  useEffect(() => {
    let rawKeysBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      // Avoid capturing input if the user is actively typing in a standard input field
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      )) {
        // If it's the barcode manual field, we allow it, but we don't intercept globally to prevent breaking manual typers.
        return;
      }

      const currentTime = Date.now();
      // Hardware scanners type extremely fast (usually < 30ms between characters)
      if (currentTime - lastKeyTime > 150) {
        rawKeysBuffer = ''; // stale buffer, reset
      }

      lastKeyTime = currentTime;

      // Handle standard scan characters
      if (e.key === 'Enter') {
        if (rawKeysBuffer.length >= 3) {
          handleBarcodeScanned(rawKeysBuffer);
          rawKeysBuffer = '';
        }
      } else if (e.key.length === 1 && /[0-9a-zA-Z]/.test(e.key)) {
        rawKeysBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyPress);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyPress);
    };
  }, [products, cart]);

  const handleBarcodeScanned = (scannedCode: string) => {
    // Find matching product
    const matchingProduct = products.find(p => p.barcode === scannedCode);
    if (matchingProduct) {
      addProductToCart(matchingProduct);
    } else {
      alert(`Scanned Barcode "${scannedCode}" is not registered in the product catalog yet.`);
    }
  };

  const addProductToCart = (product: Product) => {
    // Check if product is in cart
    const existingIndex = cart.findIndex(item => item.productId === product.id);
    const alreadyInCartQty = existingIndex !== -1 ? cart[existingIndex].quantity : 0;

    // Check shelf stock availability
    if (product.retailStock <= alreadyInCartQty) {
      alert(`Insufficient Retail Shelf Stock! Only ${product.retailStock} units of "${product.name}" are placed on store shelves.`);
      return;
    }

    if (existingIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        quantity: 1,
        price: product.retailPrice,
        wholesaleCost: product.wholesaleCost
      };
      setCart([...cart, newItem]);
    }
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
    if (product && product.retailStock < newQty) {
      alert(`Cannot exceed available shelf stock (${product.retailStock} units) for "${product.name}".`);
      return;
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

  const handleCheckoutSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cart.length === 0) return;

    if (paymentMethod === 'credit') {
      if (!customerName.trim() || !customerPhone.trim()) {
        alert("To log a Store Credit purchase, you must provide the Customer Name and Phone Number so we can track their balance and send payment reminders.");
        return;
      }
    }

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
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (showCustomItemForm) setShowCustomItemForm(false);
                }}
                placeholder="Search by name, barcode, or category for quick checkout..."
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
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60 max-h-48 overflow-y-auto space-y-1 animate-fadeIn">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">Matching items found ({searchableProducts.length}):</span>
              {searchableProducts.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-2">No matching items. Type a barcode or scan to add.</div>
              ) : (
                searchableProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      addProductToCart(p);
                      setSearchQuery('');
                    }}
                    className="w-full text-left bg-white hover:bg-blue-50/40 p-2.5 rounded border border-slate-100 transition-all flex justify-between items-center text-xs hover:border-blue-100"
                    type="button"
                    id={`quick-add-${p.id}`}
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">UPC: {p.barcode} | Category: {p.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-slate-900">{settings.currency}{p.retailPrice.toFixed(2)}</span>
                      <span className="text-[10px] text-blue-600 block font-medium">Shelf Stock: {p.retailStock} {p.unit || 'units'}</span>
                    </div>
                  </button>
                ))
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
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 max-h-[170px] overflow-y-auto pr-1 scrollbar-thin">
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
                const isOutOfStock = p.retailStock <= 0;

                return (
                  <div 
                    key={p.id} 
                    className={`p-2 rounded-xl border flex flex-col justify-between space-y-1.5 transition-all ${
                      qtyInCart > 0 
                        ? 'bg-blue-50/40 border-blue-200' 
                        : isOutOfStock 
                          ? 'bg-slate-50 border-slate-100 opacity-60' 
                          : 'bg-slate-50/50 border-slate-250/60 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                        <span className="truncate max-w-[60px]">{p.category}</span>
                        {isOutOfStock ? (
                          <span className="text-rose-600">OUT</span>
                        ) : (
                          <span className={p.retailStock <= 5 ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                            {p.retailStock} {p.unit || 'left'}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-800 text-[10.5px] block truncate leading-tight" title={p.name}>
                        {p.name}
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-[10px] block">
                        {settings.currency}{p.retailPrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Quick controls inside the card */}
                    <div>
                      {qtyInCart === 0 ? (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => addProductToCart(p)}
                          className={`w-full font-bold text-[9px] py-1 px-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                            isOutOfStock 
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs active:scale-95 cursor-pointer'
                          }`}
                        >
                          <span>➕ Add</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between w-full bg-white border border-blue-100 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              const itemIndex = cart.findIndex(item => item.productId === p.id);
                              if (itemIndex !== -1) {
                                updateCartQty(itemIndex, qtyInCart - 1);
                              }
                            }}
                            className="w-5 h-5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold rounded flex items-center justify-center transition-all text-[11px] cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-[9px] text-blue-700">
                            {qtyInCart}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const itemIndex = cart.findIndex(item => item.productId === p.id);
                              if (itemIndex !== -1) {
                                updateCartQty(itemIndex, qtyInCart + 1);
                              }
                            }}
                            className="w-5 h-5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold rounded flex items-center justify-center transition-all text-[11px] cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      )}
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
                  cart.map((item, idx) => (
                    <tr key={item.productId} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{item.productName}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">Barcode: {item.barcode}</div>
                      </td>
                      <td className="p-4 font-mono text-right text-slate-600">
                        {settings.currency}{item.price.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => updateCartQty(idx, item.quantity - 1)}
                            className="w-6 h-6 border border-slate-200 hover:border-slate-400 rounded-lg flex items-center justify-center text-slate-600 active:bg-slate-100 font-bold transition-all"
                            id={`qty-minus-${item.productId}`}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateCartQty(idx, parseInt(e.target.value, 10) || 1)}
                            className="w-10 text-center font-mono border border-slate-200 rounded p-1 text-xs"
                            id={`qty-input-${item.productId}`}
                          />
                          <button
                            onClick={() => updateCartQty(idx, item.quantity + 1)}
                            className="w-6 h-6 border border-slate-200 hover:border-slate-400 rounded-lg flex items-center justify-center text-slate-600 active:bg-slate-100 font-bold transition-all"
                            id={`qty-plus-${item.productId}`}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-right font-bold text-slate-900">
                        {settings.currency}{(item.price * item.quantity).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => removeCartItem(idx)}
                          className="text-slate-400 hover:text-red-500 p-1"
                          id={`remove-item-${item.productId}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
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
                  { id: 'cash', label: 'Cash Tendered', icon: DollarSign },
                  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
                  { id: 'mobile_money', label: 'Mobile Transfer', icon: Sparkles },
                  { id: 'credit', label: 'Store Credit', icon: User }
                ].map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id as Sale['paymentMethod'])}
                      className={`p-2.5 rounded-lg border text-left font-semibold flex items-center space-x-2 transition-all ${
                        paymentMethod === item.id 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      id={`pay-method-${item.id}`}
                    >
                      <IconComponent className="w-4 h-4 shrink-0" />
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
                  <span>80mm Preview</span>
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

      {/* 80MM THERMAL PRINTER - LIVE PRINT PREVIEW MODAL */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn font-sans" id="print-preview-overlay">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-800 overflow-hidden flex flex-col my-8">
            
            {/* Simulated Hardware Terminal Header */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center text-slate-400 select-none">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-wider text-blue-400 font-bold">POS Terminal Roll Simulator</span>
                <span className="text-white text-xs font-bold font-sans">80mm Thermal Receipt Preview</span>
              </div>
              <button 
                onClick={() => setShowPrintPreview(false)} 
                className="text-slate-500 hover:text-white font-semibold text-xs cursor-pointer p-1"
                id="close-preview-modal-x"
              >
                ✕ Close
              </button>
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
              <span className="bg-slate-950 px-2 py-0.5 rounded text-[9px] text-blue-300 font-bold">80MM COATED ROLL</span>
            </div>

            {/* Simulated Hardware Paper Feed Outlet Slot */}
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 h-4 border-b border-slate-950 flex justify-between items-center px-6 text-[8px] text-slate-600 font-mono select-none">
              <span>▼ THERMAL HEAD</span>
              <span>FEED SLOT</span>
              <span>TEAR BAR ▼</span>
            </div>

            {/* PHYSICAL SCROLLABLE PAPER ROLL */}
            <div className="p-4 bg-slate-900 overflow-y-auto max-h-[50vh] flex flex-col items-center">
              <div 
                className="bg-[#FCFBF8] text-slate-800 shadow-xl px-5 py-6 w-full max-w-[310px] text-xs font-mono relative transition-transform"
                style={{ 
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.03)',
                  clipPath: 'polygon(0% 8px, 2.5% 0px, 5% 8px, 7.5% 0px, 10% 8px, 12.5% 0px, 15% 8px, 17.5% 0px, 20% 8px, 22.5% 0px, 25% 8px, 27.5% 0px, 30% 8px, 32.5% 0px, 35% 8px, 37.5% 0px, 40% 8px, 42.5% 0px, 45% 8px, 47.5% 0px, 50% 8px, 52.5% 0px, 55% 8px, 57.5% 0px, 60% 8px, 62.5% 0px, 65% 8px, 67.5% 0px, 70% 8px, 72.5% 0px, 75% 8px, 77.5% 0px, 80% 8px, 82.5% 0px, 85% 8px, 87.5% 0px, 90% 8px, 92.5% 0px, 95% 8px, 97.5% 0px, 100% 8px, 100% calc(100% - 8px), 97.5% 100%, 95% calc(100% - 8px), 92.5% 100%, 90% calc(100% - 8px), 87.5% 100%, 85% calc(100% - 8px), 82.5% 100%, 80% calc(100% - 8px), 77.5% 100%, 75% calc(100% - 8px), 72.5% 100%, 70% calc(100% - 8px), 67.5% 100%, 65% calc(100% - 8px), 62.5% 100%, 60% calc(100% - 8px), 57.5% 100%, 55% calc(100% - 8px), 52.5% 100%, 50% calc(100% - 8px), 47.5% 100%, 45% calc(100% - 8px), 42.5% 100%, 40% calc(100% - 8px), 37.5% 100%, 35% calc(100% - 8px), 32.5% 100%, 30% calc(100% - 8px), 27.5% 100%, 25% calc(100% - 8px), 22.5% 100%, 20% calc(100% - 8px), 17.5% 100%, 15% calc(100% - 8px), 12.5% 100%, 10% calc(100% - 8px), 7.5% 100%, 5% calc(100% - 8px), 2.5% 100%, 0% calc(100% - 8px))'
                }}
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
            </div>

            {/* INTEGRATED OPERATOR PRE-FLIGHT CHECKLIST (Bypasses errors & increases cashier accuracy) */}
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
                    Confirm customer identification details are typed correctly: <strong className="text-white font-semibold">{customerName.trim() || 'Walk-in Customer'}</strong>
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
                <span>Confirm & Print Roll</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED CHECKOUT RECEIPT PREVIEW MODAL */}
      {completedSale && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn font-sans" id="receipt-modal-overlay">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-800 overflow-hidden flex flex-col my-8">
            
            {/* Completed Header */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center text-slate-400 print:hidden select-none">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold">✓ Transaction Saved Offline</span>
                <span className="text-white text-xs font-bold">Physical Thermal Receipt Issued</span>
              </div>
              <button 
                onClick={clearCart} 
                className="text-slate-500 hover:text-white font-semibold text-xs cursor-pointer p-1"
                id="close-receipt-modal-x"
              >
                ✕ Reset Cart
              </button>
            </div>

            {/* LEDs Status */}
            <div className="bg-slate-900/90 border-b border-slate-950 px-5 py-2.5 flex items-center justify-between text-[10px] text-slate-400 font-mono print:hidden">
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
              <span className="bg-slate-950 px-2 py-0.5 rounded text-[9px] text-emerald-300 font-bold">80MM ORIGINAL PRINT</span>
            </div>

            {/* Paper slot cut line */}
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 h-4 border-b border-slate-950 flex justify-between items-center px-6 text-[8px] text-slate-600 font-mono print:hidden select-none">
              <span>▼ THERMAL HEAD</span>
              <span>FEED SLOT</span>
              <span>TEAR BAR ▼</span>
            </div>

            {/* REALISTIC SCROLLABLE PHYSICAL PAPER ROLL FOR FINAL PRINT */}
            <div className="p-4 bg-slate-900 overflow-y-auto max-h-[55vh] flex flex-col items-center" id="receipt-print-area">
              <div 
                className="bg-[#FCFBF8] text-slate-800 shadow-xl px-5 py-6 w-full max-w-[310px] text-xs font-mono relative transition-transform"
                style={{ 
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4), inset 0 0 20px rgba(0,0,0,0.03)',
                  clipPath: 'polygon(0% 8px, 2.5% 0px, 5% 8px, 7.5% 0px, 10% 8px, 12.5% 0px, 15% 8px, 17.5% 0px, 20% 8px, 22.5% 0px, 25% 8px, 27.5% 0px, 30% 8px, 32.5% 0px, 35% 8px, 37.5% 0px, 40% 8px, 42.5% 0px, 45% 8px, 47.5% 0px, 50% 8px, 52.5% 0px, 55% 8px, 57.5% 0px, 60% 8px, 62.5% 0px, 65% 8px, 67.5% 0px, 70% 8px, 72.5% 0px, 75% 8px, 77.5% 0px, 80% 8px, 82.5% 0px, 85% 8px, 87.5% 0px, 90% 8px, 92.5% 0px, 95% 8px, 97.5% 0px, 100% 8px, 100% calc(100% - 8px), 97.5% 100%, 95% calc(100% - 8px), 92.5% 100%, 90% calc(100% - 8px), 87.5% 100%, 85% calc(100% - 8px), 82.5% 100%, 80% calc(100% - 8px), 77.5% 100%, 75% calc(100% - 8px), 72.5% 100%, 70% calc(100% - 8px), 67.5% 100%, 65% calc(100% - 8px), 62.5% 100%, 60% calc(100% - 8px), 57.5% 100%, 55% calc(100% - 8px), 52.5% 100%, 50% calc(100% - 8px), 47.5% 100%, 45% calc(100% - 8px), 42.5% 100%, 40% calc(100% - 8px), 37.5% 100%, 35% calc(100% - 8px), 32.5% 100%, 30% calc(100% - 8px), 27.5% 100%, 25% calc(100% - 8px), 22.5% 100%, 20% calc(100% - 8px), 17.5% 100%, 15% calc(100% - 8px), 12.5% 100%, 10% calc(100% - 8px), 7.5% 100%, 5% calc(100% - 8px), 2.5% 100%, 0% calc(100% - 8px))'
                }}
              >
                {/* Store Header details */}
                <div className="text-center space-y-1 mb-4">
                  <h1 className="text-base font-extrabold text-black tracking-wide uppercase font-mono">{settings.storeName}</h1>
                  <p className="text-[10px] text-slate-600 whitespace-pre-line leading-tight font-mono">{settings.address}</p>
                  {settings.phone && <p className="text-[10px] text-slate-600 font-mono">Tel: {settings.phone}</p>}
                  
                  <div className="h-px border-t border-dashed border-slate-400 my-3"></div>
                  
                  <div className="text-[10px] text-left text-slate-700 space-y-0.5 font-mono">
                    <div><strong>RECEIPT #:</strong> {completedSale.id}</div>
                    <div><strong>DATE:</strong> {new Date(completedSale.timestamp).toLocaleString()}</div>
                    <div><strong>CASHIER:</strong> {completedSale.cashierName || 'System Operator'}</div>
                    <div><strong>CUSTOMER:</strong> {completedSale.customerName}</div>
                    {completedSale.customerPhone && completedSale.customerPhone !== 'N/A' && (
                      <div><strong>CUSTOMER TEL:</strong> {completedSale.customerPhone}</div>
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
            </div>

            {/* PRINT / EXPORT RECEIPT MODAL ACTIONS */}
            <div className="bg-slate-950 p-4 border-t border-slate-850 flex space-x-2.5 print:hidden">
              <button
                onClick={clearCart}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-3 rounded-lg font-medium cursor-pointer transition-colors border border-slate-700/50"
                id="receipt-done-btn"
              >
                Done / Next Sale
              </button>
              
              <button
                onClick={triggerPrintReceipt}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-3 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-blue-600/15 cursor-pointer"
                id="receipt-print-btn"
              >
                <Printer className="w-4 h-4" />
                <span>Print Physical Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
