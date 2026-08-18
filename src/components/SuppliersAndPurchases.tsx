import React, { useState } from 'react';
import { Supplier, PurchaseOrder, PurchaseOrderItem, Product, StoreSettings, UserProfile, StockLog } from '../types';
import { 
  Truck, Plus, Search, Building2, Phone, Mail, MapPin, CheckCircle2, Clock, 
  Package, FileText, AlertCircle, Trash2, Printer, Check, X, ArrowRight, DollarSign, Calendar
} from 'lucide-react';

interface SuppliersAndPurchasesProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  settings: StoreSettings;
  activeProfile: UserProfile | null;
  onAddSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  onUpdateSupplier: (id: string, updated: Partial<Supplier>) => void;
  onDeleteSupplier: (id: string) => void;
  onCreatePurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'createdAt'>) => void;
  onReceivePurchaseOrder: (poId: string) => void;
}

export default function SuppliersAndPurchases({
  suppliers,
  purchaseOrders,
  products,
  settings,
  activeProfile,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onCreatePurchaseOrder,
  onReceivePurchaseOrder
}: SuppliersAndPurchasesProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'ordered' | 'received' | 'cancelled'>('all');

  // Modal toggles
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showPOModal, setShowPOModal] = useState(false);

  // New Supplier Form State
  const [supplierName, setSupplierName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [notes, setNotes] = useState('');

  // New PO Form State
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poExpectedDate, setPoExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  
  // Quick item picker for PO
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemCartons, setItemCartons] = useState('10');
  const [itemUnitCost, setItemUnitCost] = useState('');

  // Handle Supplier Submit
  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !phone.trim()) {
      alert("Supplier name and phone number are required.");
      return;
    }

    if (editingSupplier) {
      onUpdateSupplier(editingSupplier.id, {
        name: supplierName.trim(),
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        taxId: taxId.trim() || undefined,
        paymentTerms: paymentTerms.trim() || undefined,
        notes: notes.trim() || undefined
      });
    } else {
      onAddSupplier({
        name: supplierName.trim(),
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        taxId: taxId.trim() || undefined,
        paymentTerms: paymentTerms.trim() || undefined,
        notes: notes.trim() || undefined
      });
    }

    setShowSupplierModal(false);
    resetSupplierForm();
  };

  const resetSupplierForm = () => {
    setEditingSupplier(null);
    setSupplierName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setTaxId('');
    setPaymentTerms('Net 30 Days');
    setNotes('');
  };

  const startEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierName(s.name);
    setContactPerson(s.contactPerson || '');
    setPhone(s.phone);
    setEmail(s.email || '');
    setAddress(s.address || '');
    setTaxId(s.taxId || '');
    setPaymentTerms(s.paymentTerms || 'Net 30 Days');
    setNotes(s.notes || '');
    setShowSupplierModal(true);
  };

  // Add Item to active PO draft
  const handleAddItemToPO = () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const cartonsNum = parseFloat(itemCartons) || 0;
    const unitsPerCarton = prod.unitsPerCarton || 24;
    const totalUnits = cartonsNum > 0 ? cartonsNum * unitsPerCarton : 1;
    const costPerUnit = parseFloat(itemUnitCost) || prod.wholesaleCost;

    const existingIdx = poItems.findIndex(i => i.productId === prod.id);
    if (existingIdx !== -1) {
      const updated = [...poItems];
      updated[existingIdx].quantityCartons = (updated[existingIdx].quantityCartons || 0) + cartonsNum;
      updated[existingIdx].quantityUnits = updated[existingIdx].quantityUnits + totalUnits;
      updated[existingIdx].totalCost = updated[existingIdx].quantityUnits * costPerUnit;
      setPoItems(updated);
    } else {
      const newItem: PurchaseOrderItem = {
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode,
        quantityCartons: cartonsNum,
        quantityUnits: totalUnits,
        unitCost: costPerUnit,
        totalCost: totalUnits * costPerUnit
      };
      setPoItems([...poItems, newItem]);
    }

    setSelectedProductId('');
    setItemCartons('10');
    setItemUnitCost('');
  };

  const removePOItem = (index: number) => {
    const updated = [...poItems];
    updated.splice(index, 1);
    setPoItems(updated);
  };

  // Handle PO Submit
  const handlePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId) {
      alert("Please select a supplier for this Purchase Order.");
      return;
    }
    if (poItems.length === 0) {
      alert("Please add at least one line item to this Purchase Order.");
      return;
    }

    const supplierObj = suppliers.find(s => s.id === poSupplierId);
    const totalAmount = poItems.reduce((sum, item) => sum + item.totalCost, 0);

    onCreatePurchaseOrder({
      supplierId: poSupplierId,
      supplierName: supplierObj ? supplierObj.name : 'Unknown Supplier',
      expectedDeliveryDate: poExpectedDate ? new Date(poExpectedDate).getTime() : undefined,
      status: 'ordered',
      items: poItems,
      totalAmount,
      notes: poNotes.trim() || undefined,
      createdBy: activeProfile?.name || 'Store Manager'
    });

    setShowPOModal(false);
    setPoSupplierId('');
    setPoNotes('');
    setPoItems([]);
  };

  // Print PO Voucher
  const handlePrintPOVoucher = (po: PurchaseOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const itemsHtml = po.items.map(item => `
      <tr>
        <td style="padding: 6px; border-bottom: 1px solid #ddd;">
          <strong>${item.productName}</strong><br/>
          <span style="font-size: 10px; color: #666;">UPC: ${item.barcode || 'N/A'}</span>
        </td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantityCartons || 0} cartons (${item.quantityUnits} units)</td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right;">${settings.currency}${item.unitCost.toFixed(2)}</td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${settings.currency}${item.totalCost.toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Order ${po.id}</title>
          <style>
            body { font-family: sans-serif; padding: 25px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background: #f1f5f9; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; }
            .total-box { margin-top: 20px; text-align: right; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 20px;">PURCHASE ORDER VOUCHER</h1>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">PO #: <strong>${po.id}</strong></div>
              <div style="font-size: 12px; color: #64748b;">Date: ${new Date(po.createdAt).toLocaleDateString()}</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 16px;">${settings.storeName}</h2>
              <div style="font-size: 11px; color: #64748b;">${settings.address}</div>
              <div style="font-size: 11px; color: #64748b;">Tel: ${settings.phone}</div>
            </div>
          </div>

          <div style="margin-top: 20px; background: #f8fafc; padding: 12px; border-radius: 6px;">
            <strong>SUPPLIER DETAILS:</strong><br/>
            ${po.supplierName}<br/>
            ${po.notes ? `<em>Notes: ${po.notes}</em>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Item & Description</th>
                <th style="text-align: center;">Order Quantity</th>
                <th style="text-align: right;">Unit Cost</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-box">
            <div>Total Purchase Cost: <strong style="font-size: 18px; color: #0f172a;">${settings.currency}${po.totalAmount.toFixed(2)}</strong></div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Status: ${po.status.toUpperCase()}</div>
          </div>

          <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 11px;">
            <div>
              <div style="border-top: 1px solid #94a3b8; width: 150px; padding-top: 4px;">Authorized Buyer (Store)</div>
            </div>
            <div>
              <div style="border-top: 1px solid #94a3b8; width: 150px; padding-top: 4px; text-align: right;">Supplier Acceptance</div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchesSearch = !searchQuery || 
      po.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn" id="suppliers-purchases-workspace">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Suppliers & Purchase Order (PO) Tracking
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage vendor relationships, issue purchase orders, and automatically receive incoming stock into storehouse.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                resetSupplierForm();
                setShowSupplierModal(true);
              }}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
              id="add-supplier-btn"
              type="button"
            >
              <Building2 className="w-4 h-4 text-blue-500" />
              <span>+ Add Supplier</span>
            </button>

            <button
              onClick={() => {
                setPoItems([]);
                setShowPOModal(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              id="create-po-btn"
              type="button"
            >
              <Plus className="w-4 h-4" />
              <span>Create Purchase Order</span>
            </button>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex items-center space-x-2 mt-6 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Purchase Orders ({purchaseOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Suppliers Directory ({suppliers.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PURCHASE ORDERS LIST */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search PO ID, supplier name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
              {(['all', 'ordered', 'received', 'draft', 'cancelled'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    statusFilter === status
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Cards / Table */}
          {filteredPOs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3">
              <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">No purchase orders found matching your search.</p>
              <button
                onClick={() => setShowPOModal(true)}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                + Create new purchase order
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredPOs.map(po => {
                const isReceived = po.status === 'received';

                return (
                  <div 
                    key={po.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:border-amber-200 dark:hover:border-amber-900/50 transition-all"
                  >
                    {/* Header Strip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-xl ${
                          isReceived 
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600' 
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                        }`}>
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">{po.id}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isReceived
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : po.status === 'ordered'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                            }`}>
                              {po.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">Supplier: <strong className="text-slate-800 dark:text-slate-200">{po.supplierName}</strong></p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-wrap">
                        <button
                          onClick={() => handlePrintPOVoucher(po)}
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all cursor-pointer"
                          title="Print PO Voucher"
                          type="button"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Voucher</span>
                        </button>

                        {!isReceived && (
                          <button
                            onClick={() => onReceivePurchaseOrder(po.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                            id={`receive-po-${po.id}`}
                            type="button"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Receive & Restock Into Warehouse</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* PO Items Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ordered Line Items ({po.items.length})</span>
                        <div className="space-y-1 text-xs">
                          {po.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800 font-mono">
                              <span className="font-sans font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                                {item.productName}
                              </span>
                              <div className="flex items-center space-x-3 shrink-0">
                                <span className="text-slate-600 dark:text-slate-400">
                                  {item.quantityCartons ? `${item.quantityCartons} ctns (${item.quantityUnits} units)` : `${item.quantityUnits} units`}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {settings.currency}{item.totalCost.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-500 font-mono">
                          <span>Created Date:</span>
                          <span>{new Date(po.createdAt).toLocaleDateString()}</span>
                        </div>
                        {po.expectedDeliveryDate && (
                          <div className="flex justify-between text-slate-500 font-mono">
                            <span>Expected Date:</span>
                            <span>{new Date(po.expectedDeliveryDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {po.receivedAt && (
                          <div className="flex justify-between text-emerald-600 font-mono font-bold">
                            <span>Received At:</span>
                            <span>{new Date(po.receivedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                          <span>Total PO Value:</span>
                          <span className="text-amber-600 dark:text-amber-400">{settings.currency}{po.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(s => {
            const supplierPOs = purchaseOrders.filter(po => po.supplierId === s.id);
            const totalPOVolume = supplierPOs.reduce((sum, po) => sum + po.totalAmount, 0);

            return (
              <div 
                key={s.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</h3>
                        {s.contactPerson && (
                          <p className="text-xs text-slate-500 font-medium">Rep: {s.contactPerson}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.phone}</span>
                    </div>
                    {s.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                    {s.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate font-sans">{s.address}</span>
                      </div>
                    )}
                  </div>

                  {s.paymentTerms && (
                    <div className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-1 rounded inline-block">
                      Terms: {s.paymentTerms}
                    </div>
                  )}

                  {s.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-850">
                      {s.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-slate-500">
                    <span>{supplierPOs.length} POs • </span>
                    <strong className="text-slate-900 dark:text-white">{settings.currency}{totalPOVolume.toFixed(2)}</strong>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => startEditSupplier(s)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete supplier "${s.name}"?`)) {
                          onDeleteSupplier(s.id);
                        }
                      }}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. MODAL: ADD / EDIT SUPPLIER */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl my-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingSupplier ? 'Edit Supplier Information' : 'Register New Vendor Supplier'}
                </h3>
                <p className="text-xs text-slate-500">Maintain contacts, tax IDs, and agreed payment terms</p>
              </div>
            </div>

            <form onSubmit={handleSupplierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Atlantic FMCG Wholesalers"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Marcus Vance"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1 (555) 234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="orders@supplier.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tax ID / VAT No</label>
                  <input
                    type="text"
                    placeholder="TAX-US-99281"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Physical / Warehouse Address</label>
                <input
                  type="text"
                  placeholder="e.g. 88 Harbour Shipping Hub, Dock 4"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Agreed Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 14 Days">Net 14 Days</option>
                  <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                  <option value="Advance Payment">Advance Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notes & Products Supplied</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Supplies wholesale Ferrero Rocher and soft drinks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  {editingSupplier ? 'Save Changes' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: CREATE PURCHASE ORDER */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl my-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-xl">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Purchase Order (PO)</h3>
                <p className="text-xs text-slate-500">Order wholesale inventory cartons from registered suppliers</p>
              </div>
            </div>

            <form onSubmit={handlePOSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Supplier *</label>
                  <select
                    required
                    value={poSupplierId}
                    onChange={(e) => setPoSupplierId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={poExpectedDate}
                    onChange={(e) => setPoExpectedDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Add Line Items Section */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Add Catalog Items to PO</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Product</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        setSelectedProductId(pid);
                        const p = products.find(prod => prod.id === pid);
                        if (p) setItemUnitCost(p.wholesaleCost.toString());
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-slate-800 dark:text-slate-200 text-xs"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.wholesaleStock} ctns in stock)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Cartons to Order</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="10"
                      value={itemCartons}
                      onChange={(e) => setItemCartons(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Unit Cost ({settings.currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={itemUnitCost}
                      onChange={(e) => setItemUnitCost(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddItemToPO}
                    disabled={!selectedProductId}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    + Add Item to Order
                  </button>
                </div>
              </div>

              {/* Added Line Items Table */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Order Summary Table</span>
                {poItems.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl text-center text-slate-400 text-xs">
                    No items added yet. Select products above to build your order list.
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] uppercase">
                        <tr>
                          <th className="p-2.5">Item</th>
                          <th className="p-2.5 text-center">Cartons / Units</th>
                          <th className="p-2.5 text-right">Unit Cost</th>
                          <th className="p-2.5 text-right">Total Cost</th>
                          <th className="p-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {poItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">{item.productName}</td>
                            <td className="p-2.5 text-center">{item.quantityCartons} ctns ({item.quantityUnits} units)</td>
                            <td className="p-2.5 text-right">{settings.currency}{item.unitCost.toFixed(2)}</td>
                            <td className="p-2.5 text-right font-bold text-amber-600">{settings.currency}{item.totalCost.toFixed(2)}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => removePOItem(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Total Summary */}
              {poItems.length > 0 && (
                <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-900 font-mono">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Total Purchase Value:</span>
                  <span className="text-base font-extrabold text-amber-700 dark:text-amber-300">
                    {settings.currency}{poItems.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Please deliver to Warehouse Bay 2 before Friday"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={poItems.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
