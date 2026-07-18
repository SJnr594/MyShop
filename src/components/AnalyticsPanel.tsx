import React, { useState, useEffect } from 'react';
import { Sale, Product } from '../types';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Box, 
  Award, 
  Calendar, 
  ArrowRight, 
  HeartHandshake, 
  Filter, 
  Search, 
  Receipt, 
  Printer, 
  ShieldCheck, 
  RefreshCw, 
  ShoppingBag,
  Eye,
  Edit,
  Trash2,
  X,
  Check,
  Plus,
  Minus,
  Save,
  Lock
} from 'lucide-react';

interface AnalyticsPanelProps {
  sales: Sale[];
  products: Product[];
  currency: string;
  onUpdateSale?: (updatedSale: Sale) => void;
  onDeleteSale?: (saleId: string, restock: boolean) => void;
  activeProfile?: { id: string; name: string; role: string } | null;
}

export default function AnalyticsPanel({ sales, products, currency, onUpdateSale, onDeleteSale, activeProfile }: AnalyticsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'insights' | 'receipts'>('insights');
  const [timeframe, setTimeframe] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // Receipt vault states
  const [auditSearch, setAuditSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Edit sale states
  const [isEditing, setIsEditing] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'card' | 'mobile_money' | 'credit'>('cash');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<any[]>([]);

  useEffect(() => {
    if (selectedSale) {
      setIsEditing(false);
      setEditCustomerName(selectedSale.customerName);
      setEditCustomerPhone(selectedSale.customerPhone);
      setEditPaymentMethod(selectedSale.paymentMethod);
      setEditNotes(selectedSale.notes || '');
      setEditItems(selectedSale.items.map(item => ({ ...item })));
    }
  }, [selectedSale]);

  const updateItemQty = (productId: string, delta: number) => {
    setEditItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    setEditItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, price: Math.max(0, newPrice) };
      }
      return item;
    }));
  };

  const removeItemFromEdit = (productId: string) => {
    if (editItems.length <= 1) {
      alert("A transaction must have at least 1 item. If you want to void the whole sale, you can delete it or zero it out.");
      return;
    }
    setEditItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleSaveEdit = () => {
    if (!selectedSale || !onUpdateSale) return;

    const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = selectedSale.discount || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxRate = 16; // 16% standard tax
    const tax = taxableAmount * (taxRate / 100);
    const total = taxableAmount + tax;

    const updatedSale: Sale = {
      ...selectedSale,
      customerName: editCustomerName.trim() || 'Guest Customer',
      customerPhone: editCustomerPhone.trim() || 'N/A',
      paymentMethod: editPaymentMethod,
      notes: editNotes.trim(),
      items: editItems,
      subtotal,
      tax,
      total
    };

    onUpdateSale(updatedSale);
    setSelectedSale(updatedSale);
    setIsEditing(false);
    alert("Transaction logs updated successfully and physical inventory adjusted.");
  };

  const now = new Date();

  // Helper date comparisons for stats
  const isToday = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toDateString() === now.toDateString();
  };

  const isThisWeek = (timestamp: number) => {
    const oneWeekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    return timestamp >= oneWeekAgo;
  };

  const isThisMonth = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  // 1. Calculate Core Comparative Sales Statistics (Daily, Weekly, Monthly)
  const salesToday = sales.filter(s => isToday(s.timestamp));
  const salesWeek = sales.filter(s => isThisWeek(s.timestamp));
  const salesMonth = sales.filter(s => isThisMonth(s.timestamp));

  const revenueToday = salesToday.reduce((sum, s) => sum + s.total, 0);
  const revenueWeek = salesWeek.reduce((sum, s) => sum + s.total, 0);
  const revenueMonth = salesMonth.reduce((sum, s) => sum + s.total, 0);
  const revenueAll = sales.reduce((sum, s) => sum + s.total, 0);

  // Helper to calculate profit of a subset of sales
  const calculateProfit = (subset: Sale[]) => {
    return subset.reduce((sum, s) => {
      const cogs = s.items.reduce((itemSum, item) => itemSum + ((item.wholesaleCost || 0) * item.quantity), 0);
      return sum + (s.total - cogs);
    }, 0);
  };

  const profitToday = calculateProfit(salesToday);
  const profitWeek = calculateProfit(salesWeek);
  const profitMonth = calculateProfit(salesMonth);
  const profitAll = calculateProfit(sales);

  // Filter sales based on active timeframe selection
  const filteredSales = sales.filter(s => {
    if (timeframe === 'all') return true;
    if (timeframe === 'today') return isToday(s.timestamp);
    if (timeframe === 'week') return isThisWeek(s.timestamp);
    if (timeframe === 'month') return isThisMonth(s.timestamp);
    return true;
  });

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalCOGS = filteredSales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum, item) => itemSum + ((item.wholesaleCost || 0) * item.quantity), 0);
  }, 0);

  const netProfit = totalRevenue - totalCOGS;
  const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Aggregate Product Sales Volume
  const productSalesMap: { 
    [id: string]: { 
      name: string; 
      barcode: string; 
      quantity: number; 
      revenue: number; 
      profit: number;
    } 
  } = {};

  filteredSales.forEach(s => {
    s.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.productName,
          barcode: item.barcode,
          quantity: 0,
          revenue: 0,
          profit: 0
        };
      }
      const itemRev = item.price * item.quantity;
      const itemCost = (item.wholesaleCost || 0) * item.quantity;
      const itemProfit = itemRev - itemCost;

      productSalesMap[item.productId].quantity += item.quantity;
      productSalesMap[item.productId].revenue += itemRev;
      productSalesMap[item.productId].profit += itemProfit;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Aggregate Customer Leaderboard
  const customerSalesMap: {
    [phoneOrName: string]: {
      name: string;
      phone: string;
      totalSpent: number;
      ordersCount: number;
      lastVisit: number;
    }
  } = {};

  filteredSales.forEach(s => {
    if (s.customerName === 'Walk-in Customer' && s.customerPhone === 'N/A') {
      return; 
    }
    const key = s.customerPhone !== 'N/A' ? s.customerPhone : s.customerName;
    if (!customerSalesMap[key]) {
      customerSalesMap[key] = {
        name: s.customerName,
        phone: s.customerPhone,
        totalSpent: 0,
        ordersCount: 0,
        lastVisit: 0
      };
    }
    customerSalesMap[key].totalSpent += s.total;
    customerSalesMap[key].ordersCount += 1;
    if (s.timestamp > customerSalesMap[key].lastVisit) {
      customerSalesMap[key].lastVisit = s.timestamp;
    }
  });

  const topCustomers = Object.values(customerSalesMap)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  // Outreach simulation
  const handleCustomerCheckIn = (customerName: string, customerPhone: string) => {
    const messages = [
      `Hi ${customerName}, we really appreciate your support at MyShop! Here is a 10% discount coupon for your next purchase: LOYAL10.`,
      `Hello ${customerName}, thank you for shopping with us. We have received new stocks of your favorite categories! Pop in anytime.`,
      `Dear ${customerName}, thank you for being a valued customer. Let us know if you need any wholesale items delivered to your doorstep.`
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    alert(`📢 Customer Outreach Simulation:\n\nTo contact ${customerName} (${customerPhone}), you can send this appreciation message:\n\n"${randomMsg}"`);
  };

  // 2. Receipt Vault Search & Filtering
  const matchingReceipts = sales.filter(s => {
    // Search query matches Receipt ID, Customer Name, Customer Phone, Cashier, or contains product names
    const q = auditSearch.toLowerCase().trim();
    const matchesQuery = !q ? true : (
      s.id.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.customerPhone.toLowerCase().includes(q) ||
      (s.cashierName && s.cashierName.toLowerCase().includes(q)) ||
      s.items.some(item => item.productName.toLowerCase().includes(q))
    );

    const matchesPayment = paymentFilter === 'all' ? true : s.paymentMethod === paymentFilter;

    return matchesQuery && matchesPayment;
  }).sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

  const triggerReceiptPrint = () => {
    if (!selectedSale) return;
    
    // Create an elegant print-only style block
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #print-receipt-container, #print-receipt-container * {
          visibility: visible;
        }
        #print-receipt-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          max-width: 80mm;
          background: white;
          color: black;
          padding: 10px;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="analytics-panel-view">
      
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/10">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">MyShop Security & Intelligence Center</h2>
            <p className="text-[11px] text-slate-500">Compare dynamic time periods and verify customer receipts to prevent loss.</p>
          </div>
        </div>

        {/* Primary Sub-tab Selectors */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('insights')}
            className={`flex items-center space-x-1.5 text-xs px-4 py-2 font-bold rounded-lg transition-all ${
              activeSubTab === 'insights' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Store Performance</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('receipts');
              if (sales.length > 0 && !selectedSale) {
                setSelectedSale(sales[sales.length - 1]); // default to newest
              }
            }}
            className={`flex items-center space-x-1.5 text-xs px-4 py-2 font-bold rounded-lg transition-all ${
              activeSubTab === 'receipts' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Receipt Vault & Audit</span>
            {sales.length > 0 && (
              <span className="bg-blue-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-black">
                {sales.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* COMPARATIVE DAILY, WEEKLY, MONTHLY SALES STRIP (Always Visible for fast tracking) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="comparative-sales-dashboard">
        {/* Today */}
        <div className="bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-blue-300/60 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Today's Sales (Daily)</span>
              <h4 className="text-lg font-bold font-mono text-slate-900 mt-1">{currency}{revenueToday.toFixed(2)}</h4>
            </div>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase font-mono">
              Today
            </span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
            <span className="text-slate-500">Profit Margin: <strong className="text-emerald-600 font-bold font-mono">{currency}{profitToday.toFixed(2)}</strong></span>
            <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded font-mono">{salesToday.length} invoices</span>
          </div>
        </div>

        {/* This Week */}
        <div className="bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-emerald-300/60 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Last 7 Days (Weekly)</span>
              <h4 className="text-lg font-bold font-mono text-slate-900 mt-1">{currency}{revenueWeek.toFixed(2)}</h4>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase font-mono">
              7 Days
            </span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
            <span className="text-slate-500">Profit Margin: <strong className="text-emerald-600 font-bold font-mono">{currency}{profitWeek.toFixed(2)}</strong></span>
            <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded font-mono">{salesWeek.length} invoices</span>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-amber-300/60 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">This Month (Monthly)</span>
              <h4 className="text-lg font-bold font-mono text-slate-900 mt-1">{currency}{revenueMonth.toFixed(2)}</h4>
            </div>
            <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase font-mono">
              Month
            </span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
            <span className="text-slate-500">Profit Margin: <strong className="text-emerald-600 font-bold font-mono">{currency}{profitMonth.toFixed(2)}</strong></span>
            <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded font-mono">{salesMonth.length} invoices</span>
          </div>
        </div>

        {/* All-time */}
        <div className="bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 p-4 rounded-xl shadow-xs relative overflow-hidden group hover:border-purple-300/60 transition-all">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">All-Time Cumulative</span>
              <h4 className="text-lg font-bold font-mono text-slate-900 mt-1">{currency}{revenueAll.toFixed(2)}</h4>
            </div>
            <span className="bg-purple-50 text-purple-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase font-mono">
              All-Time
            </span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
            <span className="text-slate-500">Profit Margin: <strong className="text-emerald-600 font-bold font-mono">{currency}{profitAll.toFixed(2)}</strong></span>
            <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded font-mono">{sales.length} invoices</span>
          </div>
        </div>
      </div>


      {/* TAB CONTAINER 1: BUSINESS INSIGHTS */}
      {activeSubTab === 'insights' && (
        <div className="space-y-6">
          
          {/* Performance Filters & Secondary Metrics Grid */}
          <div className="bg-white rounded-xl border border-slate-200/65 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5">
              <span className="bg-slate-100 p-1.5 rounded-lg text-slate-600"><Filter className="w-4 h-4" /></span>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Time-Range Filtered Metrics</span>
                <span className="text-[10px] text-slate-400 block">Adjust timeframe below to focus rankings & margins.</span>
              </div>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
              {[
                { id: 'all', label: 'All-Time' },
                { id: 'month', label: 'This Month' },
                { id: 'week', label: 'Last 7 Days' },
                { id: 'today', label: 'Today Only' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTimeframe(t.id as any)}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all ${
                    timeframe === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex items-center space-x-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">Store Revenue</span>
                <span className="text-sm font-bold font-mono text-slate-900">{currency}{totalRevenue.toFixed(2)}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">filtered period</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex items-center space-x-3.5">
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">Total Supplier Cost</span>
                <span className="text-sm font-bold font-mono text-slate-900">{currency}{totalCOGS.toFixed(2)}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">cogs wholesale value</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex items-center space-x-3.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">Gross Profits</span>
                <span className="text-sm font-bold font-mono text-blue-600">{currency}{netProfit.toFixed(2)}</span>
                <span className="text-[9px] text-emerald-600 font-semibold block mt-0.5">Margin: {profitMarginPercent.toFixed(1)}%</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs flex items-center space-x-3.5">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">Invoices Generated</span>
                <span className="text-sm font-bold font-mono text-slate-900">{filteredSales.length} checkouts</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">stored in database</span>
              </div>
            </div>
          </div>

          {/* Ranking & leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="analytics-ranking-boards">
            
            {/* TOP SELLING PRODUCTS */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-5 space-y-4" id="top-selling-products-card">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Award className="w-4.5 h-4.5 text-blue-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Top-Selling Products ({timeframe})</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">By units sold</span>
              </div>

              {topProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  No sales recorded for this period yet. Complete some sales in Checkout to populate stats!
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Visual mini bar distribution chart */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-3">Volume Distribution:</span>
                    <div className="space-y-3">
                      {topProducts.map((p, idx) => {
                        const maxQty = Math.max(...topProducts.map(item => item.quantity));
                        const barWidth = maxQty > 0 ? (p.quantity / maxQty) * 100 : 0;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-700 font-medium">
                              <span className="truncate max-w-[200px]">{p.name}</span>
                              <span className="font-mono font-bold">{p.quantity} sold</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed product profit metrics */}
                  <div className="space-y-2 text-xs">
                    {topProducts.map((p, index) => (
                      <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-lg hover:bg-slate-100/50 transition-all">
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                            index === 0 ? 'bg-amber-100 text-amber-800' :
                            index === 1 ? 'bg-slate-200 text-slate-800' :
                            index === 2 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 block truncate">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">UPC: {p.barcode}</span>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-bold text-slate-900 block">{currency}{p.revenue.toFixed(2)}</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">+{currency}{p.profit.toFixed(2)} profit</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CUSTOMER LOYALTY LEADERBOARD */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-5 space-y-4" id="valued-customers-card">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-4.5 h-4.5 text-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Valued Customers ({timeframe})</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">By cash spent</span>
              </div>

              {topCustomers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  No specific customer records registered. To track customer behavior, make sure to enter customer details during checkout!
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                    Identify your store's champion buyers. Reach out to them to check on them or send promotional loyalty vouchers:
                  </p>

                  {topCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl hover:bg-slate-100/50 transition-all border border-slate-150">
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold font-mono text-xs">
                          #{index + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 block truncate">{customer.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Phone: {customer.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right font-mono">
                          <span className="font-extrabold text-slate-900 block">{currency}{customer.totalSpent.toFixed(2)}</span>
                          <span className="text-[10px] text-blue-600 font-medium block">{customer.ordersCount} checkouts</span>
                        </div>

                        <button
                          onClick={() => handleCustomerCheckIn(customer.name, customer.phone)}
                          className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all"
                          title="Outreach check-in"
                          type="button"
                        >
                          <HeartHandshake className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* TAB CONTAINER 2: SECURE RECEIPT VAULT & LOSS PREVENTION AUDIT */}
      {activeSubTab === 'receipts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn" id="receipt-vault-workspace">
          
          {/* Left Column: Search & Filtered Invoice List (cols 5) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            {/* Search Input Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs space-y-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Loss Prevention Audit Filter</span>
              
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Receipt #, customer, cashier, product..."
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 bg-slate-50/50 font-medium"
                />
              </div>

              {/* Payment filter select */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400 font-medium text-[11px] shrink-0">Method:</span>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 w-full focus:outline-none"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="cash">Cash Tendered</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="mobile_money">Mobile Transfer</option>
                  <option value="credit">Store Credit</option>
                </select>
              </div>
            </div>

            {/* List of Receipts */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden flex-1 min-h-[400px] max-h-[550px] overflow-y-auto flex flex-col">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>Matching Sales Logs ({matchingReceipts.length})</span>
                <span>Sorted: Newest</span>
              </div>

              {matchingReceipts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                  <Receipt className="w-10 h-10 text-slate-300 stroke-1" />
                  <p className="text-xs font-semibold text-slate-600">No matching receipts found</p>
                  <p className="text-[10px] max-w-xs text-slate-400">
                    Try refining your search keyword or selecting "All Payment Methods" above.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                  {matchingReceipts.map((s) => {
                    const isSelected = selectedSale?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSale(s)}
                        className={`w-full text-left p-3.5 flex justify-between items-start transition-all ${
                          isSelected 
                            ? 'bg-blue-50/70 border-l-4 border-l-blue-600' 
                            : 'hover:bg-slate-50/50 border-l-4 border-l-transparent'
                        }`}
                        type="button"
                      >
                        <div className="space-y-1 min-w-0 pr-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-900 font-mono text-[11px] block truncate">{s.id}</span>
                            <span className="bg-slate-100 text-slate-600 text-[8px] font-bold px-1 py-0.2 rounded font-mono">
                              {s.paymentMethod.replace(/_/g, ' ')}
                            </span>
                          </div>
                          
                          <div className="text-[10px] text-slate-500 space-y-0.5">
                            <div className="truncate font-medium">Customer: {s.customerName}</div>
                            <div className="text-slate-400 font-mono text-[9px]">
                              {new Date(s.timestamp).toLocaleString()}
                            </div>
                            {s.cashierName && (
                              <div className="text-slate-400 text-[9px] italic">
                                Cashier: {s.cashierName}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900 font-mono text-xs block">{currency}{s.total.toFixed(2)}</span>
                          <span className="text-[9px] font-semibold text-slate-400 block">{s.items.length} unique items</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: High-fidelity POS Receipt Viewer (cols 7) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {selectedSale ? (
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-5 flex flex-col">
                
                {/* Header Audit Tools */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4.5 h-4.5 text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Audited Customer Receipt</span>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                        <span>● Verified Paid State</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {activeProfile?.role === 'admin' ? (
                      <>
                        {!isEditing && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all border border-amber-200 cursor-pointer"
                            title="Edit cashier's checkout details to ensure correct vouchers"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Entry</span>
                          </button>
                        )}
                        {!isEditing && onDeleteSale && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to permanently delete/void receipt ${selectedSale.id}? This action will restock the items to retail shelf inventory and cannot be undone.`)) {
                                onDeleteSale(selectedSale.id, true);
                                setSelectedSale(null);
                                alert("Receipt successfully deleted and stock restocked.");
                              }
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all border border-rose-200 cursor-pointer"
                            title="Void receipt and restock physical inventory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Receipt</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="text-[10px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Admin-Only Edit/Delete</span>
                      </div>
                    )}
                    <button
                      onClick={triggerReceiptPrint}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                      title="Simulate paper thermal printing of this audited receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Hard Copy</span>
                    </button>
                  </div>
                </div>

                {/* THE HIGH FIDELITY THERMAL RECEIPT CANVAS OR EDIT INTERFACE */}
                {isEditing ? (
                  <div className="flex justify-center p-6 bg-amber-50/40 rounded-xl border border-amber-200" id="receipt-edit-wrapper">
                    <div 
                      className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full border border-amber-300 overflow-hidden text-xs text-slate-800 font-mono flex flex-col relative"
                      id="edit-receipt-container"
                    >
                      <div className="absolute top-[2%] right-[4%] bg-amber-100 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 text-[9px] rounded uppercase font-sans animate-pulse">
                        Editing Entry
                      </div>

                      {/* Header */}
                      <div className="text-center space-y-1 mb-4">
                        <h3 className="text-sm font-bold text-black uppercase tracking-wide">Edit Receipt</h3>
                        <p className="text-[10px] text-amber-600 font-sans font-semibold">
                          Modify parameters to match accurate sales vouchers
                        </p>
                        <div className="h-px border-t border-dashed border-slate-300 my-2.5"></div>
                        
                        <div className="text-[10px] text-left text-slate-600 space-y-2 font-mono">
                          <div><strong>RECEIPT ID:</strong> {selectedSale.id}</div>
                          <div><strong>TIMESTAMP:</strong> {new Date(selectedSale.timestamp).toLocaleString()}</div>
                          
                          <div>
                            <label className="block text-[9px] font-sans font-bold text-slate-500 uppercase">Customer Name *</label>
                            <input
                              type="text"
                              value={editCustomerName}
                              onChange={(e) => setEditCustomerName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-amber-500 mt-0.5"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-sans font-bold text-slate-500 uppercase">Customer Phone</label>
                              <input
                                type="text"
                                value={editCustomerPhone}
                                onChange={(e) => setEditCustomerPhone(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-amber-500 mt-0.5"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-sans font-bold text-slate-500 uppercase">Payment Method *</label>
                              <select
                                value={editPaymentMethod}
                                onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-amber-500 mt-0.5"
                              >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="mobile_money">Mobile Money</option>
                                <option value="credit">Store Credit</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="h-px border-t border-dashed border-slate-300 my-2.5"></div>
                      </div>

                      {/* Items table */}
                      <div className="space-y-2 mb-4">
                        <div className="grid grid-cols-12 gap-1 border-b border-dashed border-slate-300 text-[10px] text-slate-500 pb-1 uppercase font-bold">
                          <span className="col-span-5 text-left">Item Name</span>
                          <span className="col-span-3 text-center">Qty</span>
                          <span className="col-span-3 text-right">Price</span>
                          <span className="col-span-1 text-center"></span>
                        </div>
                        {editItems.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-1 items-center py-1 border-b border-slate-50">
                            <span className="col-span-5 truncate text-slate-800 font-sans" title={item.productName}>
                              {item.productName}
                            </span>
                            
                            <div className="col-span-3 flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => updateItemQty(item.productId, -1)}
                                className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold flex items-center justify-center text-[10px]"
                              >
                                -
                              </button>
                              <span className="text-center font-bold text-slate-900 w-5">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateItemQty(item.productId, 1)}
                                className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold flex items-center justify-center text-[10px]"
                              >
                                +
                              </button>
                            </div>

                            <div className="col-span-3 text-right relative">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.price}
                                onChange={(e) => updateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-50 border border-slate-200 rounded p-0.5 text-right font-mono text-[10px] text-slate-800"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItemFromEdit(item.productId)}
                              className="col-span-1 text-red-500 hover:text-red-700 flex justify-center cursor-pointer"
                              title="Delete item from receipt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Totals Breakdown */}
                      <div className="font-mono text-[11px] space-y-1.5 border-t border-dashed border-slate-300 pt-2.5 mb-4 text-black">
                        {(() => {
                          const subtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                          const discount = selectedSale.discount || 0;
                          const taxableAmount = Math.max(0, subtotal - discount);
                          const taxRate = 16;
                          const tax = taxableAmount * (taxRate / 100);
                          const total = taxableAmount + tax;

                          return (
                            <>
                              <div className="flex justify-between text-slate-500">
                                <span>RECALCULATED SUB</span>
                                <span>{currency}{subtotal.toFixed(2)}</span>
                              </div>
                              {discount > 0 && (
                                <div className="flex justify-between text-rose-700 font-semibold">
                                  <span>DISCOUNT SAVINGS</span>
                                  <span>-{currency}{discount.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-slate-500">
                                <span>RECALCULATED VAT (16%)</span>
                                <span>{currency}{tax.toFixed(2)}</span>
                              </div>
                              <div className="h-px border-t border-dashed border-slate-300 my-1"></div>
                              <div className="flex justify-between text-xs font-bold text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200/50">
                                <span>ADJUSTED TOTAL</span>
                                <span>{currency}{total.toFixed(2)}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Notes / Reason for editing */}
                      <div className="space-y-1 mb-4 font-sans text-[10px]">
                        <label className="block font-bold text-slate-500 uppercase">Audit Adjustment Notes *</label>
                        <textarea
                          required
                          placeholder="e.g. Corrected cashier entry typo; updated physical payment mode to Card"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      {/* Action buttons inside the receipt */}
                      <div className="flex space-x-2 pt-2 border-t border-dashed border-slate-200">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 font-sans font-bold py-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center space-x-1 text-[11px]"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-sans font-bold py-2 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center space-x-1 text-[11px] shadow-sm shadow-amber-600/10"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center p-6 bg-slate-50 rounded-xl border border-slate-200/45" id="receipt-print-wrapper">
                    <div 
                      className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full border border-slate-200 overflow-hidden text-xs text-slate-800 font-mono flex flex-col relative"
                      id="print-receipt-container"
                    >
                      {/* Security Stamp overlay */}
                      <div className="absolute top-[35%] right-[5%] -rotate-12 pointer-events-none select-none opacity-15 border-[3px] border-emerald-600 text-emerald-600 font-black px-4 py-2 text-sm tracking-widest rounded-md">
                        PAID & VERIFIED
                      </div>

                      {/* Receipt Details and Header */}
                      <div className="text-center space-y-1 mb-4">
                        <h3 className="text-sm font-bold text-black uppercase tracking-wide">MyShop POS Receipt</h3>
                        <p className="text-[9px] text-slate-500 leading-normal">
                          100 Storefront Plaza, Suite A<br />
                          New York, NY 10001
                        </p>
                        <div className="h-px border-t border-dashed border-slate-300 my-2.5"></div>
                        
                        <div className="text-[10px] text-left text-slate-600 space-y-0.5 font-mono">
                          <div><strong>RECEIPT ID:</strong> {selectedSale.id}</div>
                          <div><strong>TIMESTAMP:</strong> {new Date(selectedSale.timestamp).toLocaleString()}</div>
                          <div><strong>CASHIER:</strong> {selectedSale.cashierName || 'System Admin'}</div>
                          <div><strong>CUSTOMER:</strong> {selectedSale.customerName}</div>
                          {selectedSale.customerPhone && selectedSale.customerPhone !== 'N/A' && (
                            <div><strong>PHONE:</strong> {selectedSale.customerPhone}</div>
                          )}
                        </div>
                        <div className="h-px border-t border-dashed border-slate-300 my-2.5"></div>
                      </div>

                      {/* Items table */}
                      <table className="w-full text-left text-[11px] font-mono mb-4">
                        <thead>
                          <tr className="border-b border-dashed border-slate-300 text-slate-500">
                            <th className="pb-1 text-left">Item Name</th>
                            <th className="pb-1 text-center">Qty</th>
                            <th className="pb-1 text-right">Unit</th>
                            <th className="pb-1 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSale.items.map((item, idx) => (
                            <tr key={idx} className="text-black hover:bg-slate-50/20">
                              <td className="py-1 max-w-[140px] truncate">{item.productName}</td>
                              <td className="py-1 text-center">{item.quantity}</td>
                              <td className="py-1 text-right">{currency}{item.price.toFixed(2)}</td>
                              <td className="py-1 text-right">{currency}{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Receipt totals breakdown */}
                      <div className="font-mono text-[11px] space-y-1.5 border-t border-dashed border-slate-300 pt-2.5 mb-4 text-black">
                        <div className="flex justify-between">
                          <span>SUBTOTAL</span>
                          <span>{currency}{selectedSale.subtotal.toFixed(2)}</span>
                        </div>
                        {selectedSale.discount > 0 && (
                          <div className="flex justify-between text-rose-700 font-semibold">
                            <span>DISCOUNT SAVINGS</span>
                            <span>-{currency}{selectedSale.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>TAX VAT RATE ({sales[0] ? '16%' : 'Tax'})</span>
                          <span>{currency}{selectedSale.tax.toFixed(2)}</span>
                        </div>
                        <div className="h-px border-t border-dashed border-slate-300 my-1"></div>
                        <div className="flex justify-between text-xs font-bold text-black">
                          <span>GRAND TOTAL</span>
                          <span>{currency}{selectedSale.total.toFixed(2)}</span>
                        </div>
                        <div className="h-px border-t border-dashed border-slate-300 my-1"></div>
                        <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase">
                          <span>METHOD OF PAYMENT</span>
                          <span>{selectedSale.paymentMethod.replace(/_/g, ' ')}</span>
                        </div>
                      </div>

                      {/* Notes if any */}
                      {selectedSale.notes && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/50 text-[10px] text-slate-600 mb-4 font-mono leading-relaxed">
                          <span className="font-bold text-[9px] text-slate-400 block uppercase mb-0.5">Audit Checkout Notes:</span>
                          "{selectedSale.notes}"
                        </div>
                      )}

                      {/* Authentic-looking barcode representation */}
                      <div className="flex flex-col items-center justify-center space-y-1 py-1 text-center">
                        <div className="flex h-10 items-stretch space-x-[1px] opacity-80" title={selectedSale.id}>
                          {selectedSale.id.split('').map((char, index) => {
                            const barClass = (char.charCodeAt(0) % 3 === 0) ? 'w-[3px]' : (char.charCodeAt(0) % 2 === 0) ? 'w-[1.5px]' : 'w-[0.5px]';
                            const colorClass = (index % 4 === 0) ? 'bg-transparent' : 'bg-slate-900';
                            return <div key={index} className={`${barClass} ${colorClass}`}></div>;
                          })}
                        </div>
                        <span className="text-[8px] text-slate-400 tracking-wider font-mono uppercase">{selectedSale.id}</span>
                      </div>

                      {/* Receipt footers */}
                      <div className="text-center font-mono text-[9px] text-slate-400 space-y-1.5 mt-3 pt-3 border-t border-dashed border-slate-200 leading-normal">
                        <p>THANK YOU FOR YOUR VALUED BUSINESS!</p>
                        <p className="text-[8px]">Please retain receipt for verification.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit verification advice card */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-800 space-y-1.5">
                  <span className="font-bold block text-blue-900 uppercase tracking-wide text-[10px]">Anti-Theft Auditing Tip:</span>
                  <p className="leading-relaxed">
                    Verify the **Receipt ID** printed on the customer's paper slip or mobile wallet matches this electronic record. Check that the cashier is **{selectedSale.cashierName || 'an authorized account'}** to ensure no unauthorized items were self-tendering!
                  </p>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                <Receipt className="w-12 h-12 text-slate-300 stroke-1" />
                <h4 className="font-bold text-slate-700">No Receipt Selected</h4>
                <p className="text-xs max-w-sm text-slate-400 leading-normal">
                  Click on any transaction log in the left panel to inspect its high-fidelity thermal receipt, audit cashier records, and confirm verification statuses.
                </p>
              </div>
            )}
          </div>
          
        </div>
      )}

    </div>
  );
}
