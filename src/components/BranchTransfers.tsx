import React, { useState } from 'react';
import { StoreBranch, StockTransfer, StockTransferItem, Product, StoreSettings, UserProfile } from '../types';
import { 
  Network, ArrowLeftRight, Plus, Search, Building, MapPin, Phone, 
  CheckCircle2, Clock, Package, FileText, Printer, Trash2, Check, X, Shield
} from 'lucide-react';

interface BranchTransfersProps {
  branches: StoreBranch[];
  stockTransfers: StockTransfer[];
  products: Product[];
  settings: StoreSettings;
  activeProfile: UserProfile | null;
  onAddBranch: (branch: Omit<StoreBranch, 'id'>) => void;
  onUpdateBranch: (id: string, updated: Partial<StoreBranch>) => void;
  onDeleteBranch: (id: string) => void;
  onCreateTransfer: (transfer: Omit<StockTransfer, 'id' | 'createdAt'>) => void;
  onCompleteTransfer: (transferId: string) => void;
}

export default function BranchTransfers({
  branches,
  stockTransfers,
  products,
  settings,
  activeProfile,
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  onCreateTransfer,
  onCompleteTransfer
}: BranchTransfersProps) {
  const [activeTab, setActiveTab] = useState<'transfers' | 'branches'>('transfers');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_transit' | 'completed' | 'cancelled'>('all');

  // Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);

  // New Transfer Form State
  const [fromBranchId, setFromBranchId] = useState(branches[0]?.id || '');
  const [toBranchId, setToBranchId] = useState(branches[1]?.id || '');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferItems, setTransferItems] = useState<StockTransferItem[]>([]);

  // Item Picker for Transfer
  const [selectedProductId, setSelectedProductId] = useState('');
  const [transferQty, setTransferQty] = useState('10');

  // New Branch Form State
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [isMainBranch, setIsMainBranch] = useState(false);

  // Add Item to Transfer Draft
  const handleAddItemToTransfer = () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const qty = parseInt(transferQty);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid transfer quantity greater than 0.");
      return;
    }

    const existingIdx = transferItems.findIndex(i => i.productId === prod.id);
    if (existingIdx !== -1) {
      const updated = [...transferItems];
      updated[existingIdx].quantity += qty;
      setTransferItems(updated);
    } else {
      const newItem: StockTransferItem = {
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode,
        quantity: qty,
        unit: prod.unit || 'units'
      };
      setTransferItems([...transferItems, newItem]);
    }

    setSelectedProductId('');
    setTransferQty('10');
  };

  const removeTransferItem = (index: number) => {
    const updated = [...transferItems];
    updated.splice(index, 1);
    setTransferItems(updated);
  };

  // Submit Transfer Order
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromBranchId || !toBranchId) {
      alert("Please select source and destination branches.");
      return;
    }
    if (fromBranchId === toBranchId) {
      alert("Source and Destination branches must be different.");
      return;
    }
    if (transferItems.length === 0) {
      alert("Please add at least one line item to transfer.");
      return;
    }

    const fromBranch = branches.find(b => b.id === fromBranchId);
    const toBranch = branches.find(b => b.id === toBranchId);

    onCreateTransfer({
      fromBranchId,
      fromBranchName: fromBranch ? fromBranch.name : 'Origin Depot',
      toBranchId,
      toBranchName: toBranch ? toBranch.name : 'Destination Branch',
      status: 'in_transit',
      items: transferItems,
      notes: transferNotes.trim() || undefined,
      dispatchedBy: activeProfile?.name || 'Inventory Officer'
    });

    setShowTransferModal(false);
    setTransferItems([]);
    setTransferNotes('');
  };

  // Submit Branch
  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || !branchCode.trim()) {
      alert("Branch name and location code are required.");
      return;
    }

    onAddBranch({
      name: branchName.trim(),
      code: branchCode.trim().toUpperCase(),
      address: branchAddress.trim(),
      phone: branchPhone.trim(),
      isMain: isMainBranch
    });

    setShowBranchModal(false);
    setBranchName('');
    setBranchCode('');
    setBranchAddress('');
    setBranchPhone('');
    setIsMainBranch(false);
  };

  // Print Stock Transfer Waybill
  const handlePrintWaybill = (transfer: StockTransfer) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const itemsHtml = transfer.items.map(item => `
      <tr>
        <td style="padding: 6px; border-bottom: 1px solid #ddd;">
          <strong>${item.productName}</strong><br/>
          <span style="font-size: 10px; color: #666;">Barcode: ${item.barcode}</span>
        </td>
        <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 13px;">
          ${item.quantity} ${item.unit || 'units'}
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transfer Waybill ${transfer.id}</title>
          <style>
            body { font-family: sans-serif; padding: 25px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background: #f1f5f9; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; }
            .route-box { display: flex; justify-content: space-between; margin-top: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 20px;">INTER-BRANCH STOCK WAYBILL</h1>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Waybill #: <strong>${transfer.id}</strong></div>
              <div style="font-size: 12px; color: #64748b;">Dispatch Date: ${new Date(transfer.createdAt).toLocaleString()}</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 16px;">${settings.storeName}</h2>
              <div style="font-size: 11px; color: #64748b;">Central Logistics Network</div>
            </div>
          </div>

          <div class="route-box">
            <div>
              <strong>DISPATCH FROM (ORIGIN):</strong><br/>
              ${transfer.fromBranchName}<br/>
              <span style="font-size: 11px; color: #64748b;">Dispatched By: ${transfer.dispatchedBy}</span>
            </div>
            <div style="text-align: right;">
              <strong>DESTINATION (RECEIVING):</strong><br/>
              ${transfer.toBranchName}<br/>
              <span style="font-size: 11px; color: #64748b;">Status: ${transfer.status.toUpperCase()}</span>
            </div>
          </div>

          ${transfer.notes ? `<div style="margin-top: 10px; font-size: 11px; color: #475569;"><strong>Notes / Route Instructions:</strong> ${transfer.notes}</div>` : ''}

          <table>
            <thead>
              <tr>
                <th>Transferred Item Description</th>
                <th style="text-align: right;">Quantity Dispatched</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 60px; display: flex; justify-content: space-between; font-size: 11px;">
            <div>
              <div style="border-top: 1px solid #94a3b8; width: 140px; padding-top: 4px;">Dispatched Officer</div>
            </div>
            <div>
              <div style="border-top: 1px solid #94a3b8; width: 140px; padding-top: 4px; text-align: center;">Driver / Courier</div>
            </div>
            <div>
              <div style="border-top: 1px solid #94a3b8; width: 140px; padding-top: 4px; text-align: right;">Receiving Storekeeper</div>
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

  const filteredTransfers = stockTransfers.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch = !searchQuery ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.fromBranchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.toBranchName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn" id="branch-transfers-workspace">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-teal-50 dark:bg-teal-950/60 rounded-xl text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Multi-Branch & Warehouse Stock Transfers
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Seamlessly move stock between main stores, warehouse depots, and regional outlets with verifiable dispatch waybills.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setShowBranchModal(true)}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
              id="add-branch-location-btn"
              type="button"
            >
              <Building className="w-4 h-4 text-teal-600" />
              <span>+ Add Branch Location</span>
            </button>

            <button
              onClick={() => {
                setTransferItems([]);
                setShowTransferModal(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              id="dispatch-stock-btn"
              type="button"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Dispatch Stock Transfer</span>
            </button>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex items-center space-x-2 mt-6 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('transfers')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'transfers'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transfer Waybills ({stockTransfers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'branches'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Store & Depot Locations ({branches.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TRANSFERS LIST */}
      {activeTab === 'transfers' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search waybill ID, source or destination branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
              {(['all', 'in_transit', 'completed', 'pending', 'cancelled'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    statusFilter === status
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {filteredTransfers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-3">
              <ArrowLeftRight className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">No stock transfer waybills found matching query.</p>
              <button
                onClick={() => setShowTransferModal(true)}
                className="text-xs font-bold text-teal-600 hover:underline cursor-pointer"
              >
                + Dispatch new stock transfer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTransfers.map(trf => {
                const isCompleted = trf.status === 'completed';

                return (
                  <div
                    key={trf.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:border-teal-200 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-xl ${
                          isCompleted
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                            : 'bg-teal-50 dark:bg-teal-950 text-teal-600'
                        }`}>
                          <ArrowLeftRight className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">{trf.id}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isCompleted
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                            }`}>
                              {trf.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            Route: <strong className="text-slate-800 dark:text-slate-200">{trf.fromBranchName}</strong> ➔ <strong className="text-teal-600 dark:text-teal-400">{trf.toBranchName}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-wrap">
                        <button
                          onClick={() => handlePrintWaybill(trf)}
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all cursor-pointer"
                          title="Print Waybill"
                          type="button"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Waybill</span>
                        </button>

                        {!isCompleted && (
                          <button
                            onClick={() => onCompleteTransfer(trf.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                            id={`complete-trf-${trf.id}`}
                            type="button"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm Receipt & Settle Stock</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Transferred Items */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transferred Cargo Items ({trf.items.length})</span>
                        <div className="space-y-1 text-xs">
                          {trf.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800 font-mono">
                              <span className="font-sans font-medium text-slate-800 dark:text-slate-200 truncate pr-2">
                                {item.productName}
                              </span>
                              <span className="font-bold text-teal-700 dark:text-teal-300 shrink-0">
                                {item.quantity} {item.unit || 'units'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
                        <div className="flex justify-between text-slate-500">
                          <span>Dispatched:</span>
                          <span>{new Date(trf.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Officer:</span>
                          <span>{trf.dispatchedBy}</span>
                        </div>
                        {trf.completedAt && (
                          <div className="flex justify-between text-emerald-600 font-bold">
                            <span>Delivered:</span>
                            <span>{new Date(trf.completedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {trf.notes && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-sans italic">
                            "{trf.notes}"
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BRANCH LOCATIONS */}
      {activeTab === 'branches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(b => (
            <div 
              key={b.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-teal-50 dark:bg-teal-950 text-teal-600 rounded-xl">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{b.name}</h3>
                      <span className="font-mono text-xs text-teal-600 dark:text-teal-400 font-bold block">{b.code}</span>
                    </div>
                  </div>

                  {b.isMain && (
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                      ★ Main HQ
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{b.address}</span>
                  </div>
                  <div className="flex items-center space-x-2 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.phone}</span>
                  </div>
                </div>
              </div>

              {!b.isMain && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete branch "${b.name}"?`)) {
                        onDeleteBranch(b.id);
                      }
                    }}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 cursor-pointer"
                  >
                    Delete Location
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 1. MODAL: DISPATCH STOCK TRANSFER */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl my-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-950 text-teal-600 rounded-xl">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Dispatch Inter-Branch Stock Transfer</h3>
                <p className="text-xs text-slate-500">Relocate bulk cartons or units to another warehouse depot or store</p>
              </div>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Source Depot (From) *</label>
                  <select
                    required
                    value={fromBranchId}
                    onChange={(e) => setFromBranchId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-teal-500"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Destination Branch (To) *</label>
                  <select
                    required
                    value={toBranchId}
                    onChange={(e) => setToBranchId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-teal-500"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Item Adder */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block">Add Cargo Items to Transfer</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Product</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-slate-800 dark:text-slate-200 text-xs"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.wholesaleStock} ctns / {p.retailStock} shelf units)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Quantity Units</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="10"
                      value={transferQty}
                      onChange={(e) => setTransferQty(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 font-mono font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddItemToTransfer}
                    disabled={!selectedProductId}
                    className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    + Add Item to Manifest
                  </button>
                </div>
              </div>

              {/* Added Manifest Items */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transfer Manifest Table</span>
                {transferItems.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl text-center text-slate-400 text-xs">
                    No items on manifest yet. Select products above to build your transfer list.
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] uppercase">
                        <tr>
                          <th className="p-2.5">Item</th>
                          <th className="p-2.5 text-right">Transfer Quantity</th>
                          <th className="p-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {transferItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">{item.productName}</td>
                            <td className="p-2.5 text-right font-bold text-teal-600">{item.quantity} {item.unit}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeTransferItem(idx)}
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

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Waybill Notes & Driver Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Courier Truck #GT-9921-26, Driver Emmanuel"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferItems.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  Issue Dispatch Waybill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: ADD BRANCH LOCATION */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-950 text-teal-600 rounded-xl">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Store / Warehouse Location</h3>
                <p className="text-xs text-slate-500">Register satellite branch or distribution warehouse</p>
              </div>
            </div>

            <form onSubmit={handleBranchSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Branch / Warehouse Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tema Port Distribution Hub"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Location Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-TEMA"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 000-1111"
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. Plot 14 Harbour Bypass"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
