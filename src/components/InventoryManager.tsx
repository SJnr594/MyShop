import React, { useState, useEffect } from 'react';
import { Product, StockLog, StoreSettings } from '../types';
import { Package, Plus, Search, AlertTriangle, ArrowUpDown, ChevronDown, Check, ArrowRight, History, Calendar, FileText, FileSpreadsheet, ClipboardCheck, Trash2, Edit2, FolderEdit } from 'lucide-react';
import SpreadsheetSync from './SpreadsheetSync';

interface InventoryManagerProps {
  products: Product[];
  stockLogs: StockLog[];
  settings: StoreSettings;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onRestockShelf: (productId: string, quantity: number, notes: string) => void;
  onBuyWholesaleStock: (productId: string, quantity: number, notes: string) => void;
  onBulkImport: (newProducts: Omit<Product, 'id'>[], updatedProducts: Product[]) => void;
  onUpdateSettings?: (newSettings: StoreSettings) => void;
  onLogDamagedGoods: (productId: string, quantity: number, location: 'wholesale' | 'retail', reason: string, notes: string) => void;
}

export default function InventoryManager({
  products,
  stockLogs,
  settings,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRestockShelf,
  onBuyWholesaleStock,
  onBulkImport,
  onUpdateSettings,
  onLogDamagedGoods
}: InventoryManagerProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'transfer' | 'logs' | 'audit'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Physical count audit states
  const [physicalWholesale, setPhysicalWholesale] = useState<Record<string, number>>({});
  const [physicalRetail, setPhysicalRetail] = useState<Record<string, number>>({});
  const [auditNotes, setAuditNotes] = useState<Record<string, string>>({});

  // Initialize ground counts when entering audit tab
  useEffect(() => {
    if (activeTab === 'audit') {
      const initialWholesale: Record<string, number> = {};
      const initialRetail: Record<string, number> = {};
      const initialNotes: Record<string, string> = {};
      
      products.forEach(p => {
        initialWholesale[p.id] = p.wholesaleStock;
        initialRetail[p.id] = p.retailStock;
        initialNotes[p.id] = 'Weekly ground cross-check';
      });
      
      setPhysicalWholesale(initialWholesale);
      setPhysicalRetail(initialRetail);
      setAuditNotes(initialNotes);
    }
  }, [activeTab, products]);

  // New product form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSyncSuite, setShowSyncSuite] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState((settings.categories && settings.categories[0]) || 'Wholesale 1');
  const [wholesaleCost, setWholesaleCost] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesaleStock, setWholesaleStock] = useState('');
  const [retailStock, setRetailStock] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('5');
  const [unit, setUnit] = useState('pcs');

  // Customizable category states
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');

  // Update category when settings.categories updates
  useEffect(() => {
    if (settings.categories && settings.categories.length > 0) {
      setCategory(settings.categories[0]);
    }
  }, [settings.categories]);

  // Edit product states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick transfers states
  const [transferProductId, setTransferProductId] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // Bulk wholesale purchase states
  const [purchaseProductId, setPurchaseProductId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Damaged goods/shrinkage states
  const [damageProductId, setDamageProductId] = useState('');
  const [damageQty, setDamageQty] = useState('');
  const [damageLocation, setDamageLocation] = useState<'wholesale' | 'retail'>('retail');
  const [damageReason, setDamageReason] = useState('Broken / Leaked / Damaged');
  const [damageNotes, setDamageNotes] = useState('');

  // Extract unique categories, blending configured settings categories with any product categories
  const configuredCategories = settings.categories && settings.categories.length > 0
    ? settings.categories
    : ['Wholesale 1', 'Wholesale 2', 'Wholesale 3'];

  const categories = ['All', ...Array.from(new Set([...configuredCategories, ...products.map(p => p.category)]))];

  // Category management handlers
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const catName = newCategoryName.trim();
    if (configuredCategories.includes(catName)) {
      alert("This warehouse/category already exists.");
      return;
    }
    const updatedCats = [...configuredCategories, catName];
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        categories: updatedCats
      });
    }
    setNewCategoryName('');
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (configuredCategories.length <= 1) {
      alert("Action Blocked: You must retain at least one category/warehouse zone.");
      return;
    }
    const productsInCat = products.filter(p => p.category === catToDelete);
    if (productsInCat.length > 0) {
      if (!confirm(`Warning: There are ${productsInCat.length} products assigned to warehouse/category "${catToDelete}". If you delete this warehouse, these products will be automatically reassigned to the first available category. Do you want to proceed?`)) {
        return;
      }
    }
    const fallbackCat = configuredCategories.find(c => c !== catToDelete) || 'General';
    // Reassign products
    if (productsInCat.length > 0) {
      productsInCat.forEach(p => {
        onUpdateProduct({ ...p, category: fallbackCat });
      });
    }
    const updatedCats = configuredCategories.filter(c => c !== catToDelete);
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        categories: updatedCats
      });
    }
    alert(`Warehouse "${catToDelete}" has been deleted. ${productsInCat.length} products were reassigned to "${fallbackCat}".`);
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const formattedNewName = newName.trim();
    if (!formattedNewName || oldName === formattedNewName) {
      setEditingCategoryName(null);
      return;
    }
    if (configuredCategories.includes(formattedNewName)) {
      alert("A warehouse/category with this name already exists.");
      return;
    }
    // Update all products in this category
    const productsInCat = products.filter(p => p.category === oldName);
    if (productsInCat.length > 0) {
      productsInCat.forEach(p => {
        onUpdateProduct({ ...p, category: formattedNewName });
      });
    }
    const updatedCats = configuredCategories.map(c => c === oldName ? formattedNewName : c);
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        categories: updatedCats
      });
    }
    setEditingCategoryName(null);
    alert(`Warehouse/Category "${oldName}" has been renamed to "${formattedNewName}". ${productsInCat.length} products updated.`);
  };

  // Filters
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.barcode.includes(searchQuery);
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesLowStock = !showLowStockOnly || p.retailStock <= p.minStockAlert;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !barcode) return;

    onAddProduct({
      barcode: barcode.trim(),
      name: name.trim(),
      category: category.trim(),
      wholesaleCost: parseFloat(wholesaleCost) || 0,
      retailPrice: parseFloat(retailPrice) || 0,
      wholesaleStock: parseInt(wholesaleStock, 10) || 0,
      retailStock: parseInt(retailStock, 10) || 0,
      minStockAlert: parseInt(minStockAlert, 10) || 5,
      unit: unit.trim() || 'pcs'
    });

    // Reset Form
    setBarcode('');
    setName('');
    setCategory('General');
    setWholesaleCost('');
    setRetailPrice('');
    setWholesaleStock('');
    setRetailStock('');
    setMinStockAlert('5');
    setUnit('pcs');
    setShowAddForm(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    onUpdateProduct(editingProduct);
    setEditingProduct(null);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProductId || !transferQty) return;
    const qty = parseInt(transferQty, 10);
    if (qty <= 0) return;

    const selectedProd = products.find(p => p.id === transferProductId);
    if (!selectedProd) return;

    if (selectedProd.wholesaleStock < qty) {
      alert(`Insufficient Wholesale Stock! Only ${selectedProd.wholesaleStock} bulk units available.`);
      return;
    }

    onRestockShelf(
      transferProductId,
      qty,
      transferNotes || `Transferred ${qty} units to store shelves.`
    );

    // Reset
    setTransferProductId('');
    setTransferQty('');
    setTransferNotes('');
    alert("Shelf restocked successfully!");
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseProductId || !purchaseQty) return;
    const qty = parseInt(purchaseQty, 10);
    if (qty <= 0) return;

    onBuyWholesaleStock(
      purchaseProductId,
      qty,
      purchaseNotes || `Purchased supplier stock-in: ${qty} units.`
    );

    // If purchase cost was adjusted, update the product cost
    if (purchaseCost) {
      const selectedProd = products.find(p => p.id === purchaseProductId);
      if (selectedProd) {
        onUpdateProduct({
          ...selectedProd,
          wholesaleCost: parseFloat(purchaseCost) || selectedProd.wholesaleCost
        });
      }
    }

    // Reset
    setPurchaseProductId('');
    setPurchaseQty('');
    setPurchaseCost('');
    setPurchaseNotes('');
    alert("Wholesale stock received and logged!");
  };

  const handleDamageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!damageProductId || !damageQty) return;
    const qty = parseInt(damageQty, 10);
    if (qty <= 0) return;

    const selectedProd = products.find(p => p.id === damageProductId);
    if (!selectedProd) return;

    const currentStock = damageLocation === 'wholesale' ? selectedProd.wholesaleStock : selectedProd.retailStock;
    if (currentStock < qty) {
      alert(`Warning: Selected quantity (${qty}) exceeds current stock level (${currentStock})! Proceeding will set stock to 0.`);
    }

    onLogDamagedGoods(
      damageProductId,
      qty,
      damageLocation,
      damageReason,
      damageNotes || `Shrinkage: ${damageReason}`
    );

    // Reset
    setDamageProductId('');
    setDamageQty('');
    setDamageLocation('retail');
    setDamageReason('Broken / Leaked / Damaged');
    setDamageNotes('');
    alert("Damaged goods write-off logged and inventory updated!");
  };

  return (
    <div className="space-y-6" id="inventory-manager-view">
      {/* View Header with Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-900 text-white rounded-lg">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Dual-Stock Control Desk</h2>
            <p className="text-xs text-slate-500">Track and transfer wholesale bulk boxes to retail front shelves.</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`text-xs px-3.5 py-1.5 font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'catalog' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-950'
            }`}
            id="tab-catalog"
          >
            Product Catalog
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className={`text-xs px-3.5 py-1.5 font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'transfer' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-950'
            }`}
            id="tab-transfer"
          >
            Restock Shelf & Supplier Buying
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`text-xs px-3.5 py-1.5 font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-950'
            }`}
            id="tab-audit"
          >
            Weekly Ground Audit
          </button>
          <button
            onClick={() => {
              setActiveTab('logs');
              // trigger smooth scroll down or log load if any
            }}
            className={`text-xs px-3.5 py-1.5 font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'logs' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-950'
            }`}
            id="tab-logs"
          >
            Stock Adjust Logs
          </button>
        </div>
      </div>

      {/* CATALOG TAB */}
      {activeTab === 'catalog' && (
        <div className="space-y-5" id="inventory-catalog-panel">
          {/* Controls: Search, Add product, Filters */}
          <div className="flex flex-col lg:flex-row gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name or barcode..."
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                  id="catalog-search-input"
                />
              </div>

              {/* Category selector */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs border border-slate-200 bg-white text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                id="catalog-category-filter"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat} Products</option>
                ))}
              </select>

              {/* Low stock check */}
              <label className="flex items-center space-x-2 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={showLowStockOnly}
                  onChange={(e) => setShowLowStockOnly(e.target.checked)}
                  className="accent-slate-900"
                  id="catalog-low-stock-checkbox"
                />
                <span className="font-medium text-red-600">Low shelf stock warnings</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              <button
                onClick={() => {
                  setShowCategoryManager(!showCategoryManager);
                  setShowAddForm(false);
                  setShowSyncSuite(false);
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-amber-600/10 cursor-pointer"
                id="manage-categories-toggle-btn"
                type="button"
              >
                <FolderEdit className="w-4 h-4" />
                <span>📁 Manage Warehouses ({configuredCategories.length})</span>
              </button>

              <button
                onClick={() => {
                  setShowSyncSuite(!showSyncSuite);
                  setShowAddForm(false);
                  setShowCategoryManager(false);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
                id="spreadsheet-sync-toggle-btn"
                type="button"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Spreadsheet Sync Suite</span>
              </button>

              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setShowSyncSuite(false);
                  setShowCategoryManager(false);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                id="add-new-product-btn"
                type="button"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Product</span>
              </button>
            </div>
          </div>

          {/* Category/Warehouse Manager Collapse */}
          {showCategoryManager && (
            <div className="bg-amber-50/20 rounded-xl p-5 border border-amber-200/60 animate-fadeIn space-y-4" id="category-manager-container">
              <div className="flex items-center justify-between border-b border-amber-200/40 pb-2">
                <div className="flex items-center space-x-2">
                  <FolderEdit className="w-4.5 h-4.5 text-amber-700 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">Custom Category & Warehouse Manager</h3>
                </div>
                <span className="text-[10px] text-amber-600 font-medium font-mono">Dynamic warehouse allocation logs and zones</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {/* Left col: Add new warehouse category */}
                <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-slate-700">Add New Category / Warehouse</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Enter the name of your new warehouse storage zone. It will immediately become selectable across your store catalog.
                  </p>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Wholesale 4"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                      id="new-category-name-input"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded font-bold text-xs cursor-pointer transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Right col: List and manage existing warehouse categories */}
                <div className="md:col-span-2 space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-slate-700">Existing Warehouse Storage Zones</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {configuredCategories.map((cat) => {
                      const count = products.filter(p => p.category === cat).length;
                      const isEditing = editingCategoryName === cat;

                      return (
                        <div key={cat} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-150 group">
                          {isEditing ? (
                            <div className="flex items-center space-x-1.5 w-full">
                              <input
                                type="text"
                                value={editingCategoryValue}
                                onChange={(e) => setEditingCategoryValue(e.target.value)}
                                className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold focus:outline-none"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleRenameCategory(cat, editingCategoryValue);
                                  } else if (e.key === 'Escape') {
                                    setEditingCategoryName(null);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleRenameCategory(cat, editingCategoryValue)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded font-bold text-[10px]"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategoryName(null)}
                                className="bg-slate-300 hover:bg-slate-400 text-slate-700 px-2 py-1 rounded font-bold text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-800">{cat}</span>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">{count} registered {count === 1 ? 'item' : 'items'}</span>
                              </div>
                              <div className="flex items-center space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCategoryName(cat);
                                    setEditingCategoryValue(cat);
                                  }}
                                  className="p-1 hover:bg-slate-200 text-blue-600 hover:text-blue-700 rounded transition-all cursor-pointer"
                                  title="Rename Warehouse"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="p-1 hover:bg-red-50 text-red-600 hover:text-red-700 rounded transition-all cursor-pointer"
                                  title="Delete Warehouse"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Spreadsheet Sync Container */}
          {showSyncSuite && (
            <div className="mb-6">
              <SpreadsheetSync 
                products={products}
                currency={settings.currency}
                onClose={() => setShowSyncSuite(false)}
                onBulkImport={(newProds, updatedProds) => {
                  onBulkImport(newProds, updatedProds);
                  setShowSyncSuite(false);
                }}
              />
            </div>
          )}

          {/* Add Product Form Collapse */}
          {showAddForm && (
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 animate-fadeIn" id="add-product-form-container">
              <h3 className="text-xs font-semibold uppercase text-slate-700 tracking-wider mb-4">Register New Item in MyShop</h3>
              <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Barcode / UPC *</label>
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g. 4008400200122"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono"
                    id="new-product-barcode"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-500 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ferrero Rocher Chocolates 200g"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                    id="new-product-name"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Category / Warehouse</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                    id="new-product-category"
                  >
                    {configuredCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Wholesale Cost ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={wholesaleCost}
                    onChange={(e) => setWholesaleCost(e.target.value)}
                    placeholder="4.50"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono"
                    id="new-product-cost"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Retail Shelf Price ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    placeholder="7.99"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono"
                    id="new-product-price"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Wholesale Stock (Storehouse)</label>
                  <input
                    type="number"
                    value={wholesaleStock}
                    onChange={(e) => setWholesaleStock(e.target.value)}
                    placeholder="24"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono"
                    id="new-product-wholesale-stock"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Retail Stock (On Shelf)</label>
                  <input
                    type="number"
                    value={retailStock}
                    onChange={(e) => setRetailStock(e.target.value)}
                    placeholder="5"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono"
                    id="new-product-retail-stock"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-500 mb-1 font-semibold text-slate-700">Unit Label (Product Type Unit)</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. pcs, kg, bottles, packs"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                    id="new-product-unit"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['pcs', 'packs', 'boxes', 'bottles', 'cans', 'bags', 'kg', 'liters'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={`px-2 py-0.5 rounded text-[10px] border font-medium transition-all cursor-pointer ${
                          unit === u 
                            ? 'bg-slate-900 border-slate-900 text-white font-bold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center">
                  <label className="inline-flex items-center space-x-2">
                    <span className="text-slate-500">Low shelf stock alarm limit:</span>
                    <input
                      type="number"
                      value={minStockAlert}
                      onChange={(e) => setMinStockAlert(e.target.value)}
                      className="w-16 bg-white border border-slate-200 rounded p-1 font-mono text-center"
                      id="new-product-alert"
                    />
                  </label>
                </div>

                <div className="md:col-span-4 flex justify-end border-t border-slate-200/60 pt-3 mt-1">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                      id="cancel-add-product"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded-lg cursor-pointer"
                      id="save-new-product"
                    >
                      Save Product
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Edit Product Modal/Box */}
          {editingProduct && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden text-xs">
                <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
                  <span className="font-semibold">Edit Product Specs</span>
                  <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
                </div>
                <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
                  <div>
                    <label className="block text-slate-500 mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-medium"
                      id="edit-product-name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Barcode / UPC</label>
                      <input
                        type="text"
                        required
                        value={editingProduct.barcode}
                        onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-mono"
                        id="edit-product-barcode"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Category / Warehouse</label>
                      <select
                        value={editingProduct.category}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-medium focus:outline-none"
                        id="edit-product-category"
                      >
                        {configuredCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Wholesale Cost ({settings.currency})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingProduct.wholesaleCost}
                        onChange={(e) => setEditingProduct({ ...editingProduct, wholesaleCost: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-mono"
                        id="edit-product-cost"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Retail Price ({settings.currency})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingProduct.retailPrice}
                        onChange={(e) => setEditingProduct({ ...editingProduct, retailPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-mono"
                        id="edit-product-price"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold text-slate-700">Wholesale Stock</label>
                      <input
                        type="number"
                        value={editingProduct.wholesaleStock}
                        onChange={(e) => setEditingProduct({ ...editingProduct, wholesaleStock: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 font-mono"
                        id="edit-product-wholesale-stock"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold text-slate-700">Retail Stock</label>
                      <input
                        type="number"
                        value={editingProduct.retailStock}
                        onChange={(e) => setEditingProduct({ ...editingProduct, retailStock: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 font-mono"
                        id="edit-product-retail-stock"
                      />
                    </div>
                  </div>

                   <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold text-slate-700">Low Shelf Warning Limit</label>
                      <input
                        type="number"
                        value={editingProduct.minStockAlert}
                        onChange={(e) => setEditingProduct({ ...editingProduct, minStockAlert: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-mono"
                        id="edit-product-alert"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold text-slate-700">Unit Label</label>
                      <input
                        type="text"
                        value={editingProduct.unit || 'pcs'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 font-medium font-mono"
                        id="edit-product-unit"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {['pcs', 'packs', 'boxes', 'bottles', 'cans', 'bags', 'kg', 'liters'].map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => setEditingProduct({ ...editingProduct, unit: u })}
                            className={`px-1.5 py-0.5 rounded text-[9px] border transition-all cursor-pointer ${
                              (editingProduct.unit || 'pcs') === u
                                ? 'bg-slate-800 border-slate-800 text-white font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to permanently delete "${editingProduct.name}" from the store catalog? All stock levels and catalogs will be de-registered.`)) {
                          onDeleteProduct(editingProduct.id);
                          setEditingProduct(null);
                        }
                      }}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold transition-all"
                      id="delete-product-btn"
                    >
                      Delete Product
                    </button>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded hover:bg-slate-50"
                        id="cancel-edit-product"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800 font-semibold"
                        id="save-edit-product"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Catalog Table */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <th className="p-4">Product Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 font-mono text-right">Wholesale Cost</th>
                    <th className="p-4 font-mono text-right">Retail Price</th>
                    <th className="p-4 font-semibold text-center bg-teal-50/40 text-teal-800 border-x border-slate-100/60">Wholesale Stock (Storehouse)</th>
                    <th className="p-4 font-semibold text-center bg-blue-50/40 text-blue-800 border-r border-slate-100/60">Retail Stock (On Shelf)</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No products match your search or filter settings.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isLowStock = p.retailStock <= p.minStockAlert;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-slate-800">{p.name}</div>
                            <div className="text-[10px] font-mono text-slate-400 tracking-wider mt-0.5">UPC: {p.barcode}</div>
                          </td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium uppercase">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-right text-slate-600">
                            {settings.currency}{p.wholesaleCost.toFixed(2)}
                          </td>
                          <td className="p-4 font-mono text-right font-medium text-slate-800">
                            {settings.currency}{p.retailPrice.toFixed(2)}
                          </td>
                          <td className="p-2 text-center font-mono bg-teal-50/10 text-teal-800 border-x border-slate-100/60">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateProduct({ ...p, wholesaleStock: Math.max(0, p.wholesaleStock - 1) });
                                }}
                                className="w-5 h-5 rounded bg-teal-100/60 hover:bg-teal-200/80 text-teal-900 flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-all"
                                title="Decrease Wholesale Stock"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={p.wholesaleStock}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  onUpdateProduct({ ...p, wholesaleStock: isNaN(val) ? 0 : val });
                                }}
                                className="w-12 text-center bg-white border border-slate-200 rounded py-0.5 text-xs font-semibold text-teal-900 focus:outline-none focus:border-teal-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateProduct({ ...p, wholesaleStock: p.wholesaleStock + 1 });
                                }}
                                className="w-5 h-5 rounded bg-teal-100/60 hover:bg-teal-200/80 text-teal-900 flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-all"
                                title="Increase Wholesale Stock"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans font-medium uppercase tracking-wider">{p.unit || 'pcs'}</span>
                          </td>
                          <td className="p-2 text-center font-mono bg-blue-50/10 text-blue-800 border-r border-slate-100/60">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateProduct({ ...p, retailStock: Math.max(0, p.retailStock - 1) });
                                }}
                                className="w-5 h-5 rounded bg-blue-100/60 hover:bg-blue-200/80 text-blue-900 flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-all"
                                title="Decrease Retail Stock"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={p.retailStock}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  onUpdateProduct({ ...p, retailStock: isNaN(val) ? 0 : val });
                                }}
                                className="w-12 text-center bg-white border border-slate-200 rounded py-0.5 text-xs font-semibold text-blue-900 focus:outline-none focus:border-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateProduct({ ...p, retailStock: p.retailStock + 1 });
                                }}
                                className="w-5 h-5 rounded bg-blue-100/60 hover:bg-blue-200/80 text-blue-900 flex items-center justify-center font-bold text-xs select-none cursor-pointer transition-all"
                                title="Increase Retail Stock"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans font-medium uppercase tracking-wider">{p.unit || 'pcs'}</span>
                          </td>
                          <td className="p-4 text-center">
                            {isLowStock ? (
                              <span className="inline-flex items-center space-x-1 bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-red-100 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Low Shelf</span>
                              </span>
                            ) : p.retailStock === 0 ? (
                              <span className="inline-flex items-center space-x-1 bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-rose-200">
                                <span>Out of Stock</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-100">
                                <span>Active</span>
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setEditingProduct(p)}
                              className="text-blue-600 hover:text-blue-800 font-semibold p-1 hover:bg-blue-50 rounded transition-all"
                              id={`edit-btn-${p.id}`}
                            >
                              Edit Specs
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
      )}

      {/* TRANSFERS & SUPPLIER tab */}
      {activeTab === 'transfer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="inventory-transfer-panel">
          {/* Form 1: Shelf Restock (Wholesale -> Retail) */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4" id="shelf-restock-box">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Execute Shelf Restock</h3>
                <p className="text-[10px] text-slate-400">Move products from the Wholesale Storage room onto front display shelves.</p>
              </div>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Select Product *</label>
                <select
                  required
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  id="transfer-product-select"
                >
                  <option value="">-- Choose item to transfer --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Wholesale stock: {p.wholesaleStock} left | Shelf stock: {p.retailStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Transfer Quantity (Units) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 10"
                    value={transferQty}
                    onChange={(e) => setTransferQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
                    id="transfer-qty-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Adjustment Notes</label>
                  <input
                    type="text"
                    placeholder="Shelf replenishment"
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                    id="transfer-notes-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!transferProductId || !transferQty}
                className={`w-full py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  !transferProductId || !transferQty
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                }`}
                id="transfer-submit-btn"
              >
                <span>Replenish Store Shelves</span>
                <Check className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Form 2: Bulk Wholesale Purchase (Stock In) */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4" id="wholesale-purchase-box">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <div className="p-1.5 bg-teal-50 text-teal-600 rounded-md">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Receive Supplier Stock-In</h3>
                <p className="text-[10px] text-slate-400">Buy bulk goods from suppliers to increment wholesale storehouse stock.</p>
              </div>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Select Product *</label>
                <select
                  required
                  value={purchaseProductId}
                  onChange={(e) => setPurchaseProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  id="purchase-product-select"
                >
                  <option value="">-- Choose item purchased --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Wholesale Stock: {p.wholesaleStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-500 mb-1">Purchased Qty *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50"
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
                    id="purchase-qty-input"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1">Supplier Unit Cost ({settings.currency}) (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Leave blank to use current"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
                    id="purchase-cost-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Invoice / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Invoice #29384 from supplier"
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  id="purchase-notes-input"
                />
              </div>

              <button
                type="submit"
                disabled={!purchaseProductId || !purchaseQty}
                className={`w-full py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  !purchaseProductId || !purchaseQty
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                }`}
                id="purchase-submit-btn"
              >
                <span>Acknowledge Supplier Delivery</span>
                <Check className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Form 3: Record Damaged Goods / Write-offs */}
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-5 space-y-4 lg:col-span-2" id="damaged-goods-box">
            <div className="flex items-center space-x-2.5 border-b border-red-50 pb-3">
              <div className="p-1.5 bg-red-50 text-red-600 rounded-md">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-800">Record Damaged Goods & Write-Offs (Shrinkage)</h3>
                <p className="text-[10px] text-red-500">Log spoiled, expired, broken, or stolen items. This will write off stock immediately.</p>
              </div>
            </div>

            <form onSubmit={handleDamageSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-1">
                <label className="block text-slate-500 mb-1 font-medium">Select Damaged Item *</label>
                <select
                  required
                  value={damageProductId}
                  onChange={(e) => setDamageProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  id="damage-product-select"
                >
                  <option value="">-- Choose item to write off --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Wholesale: {p.wholesaleStock} | Shelf: {p.retailStock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">Stock Room Location *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDamageLocation('retail')}
                    className={`p-2.5 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                      damageLocation === 'retail'
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Front Retail Shelf
                  </button>
                  <button
                    type="button"
                    onClick={() => setDamageLocation('wholesale')}
                    className={`p-2.5 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                      damageLocation === 'wholesale'
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Wholesale Warehouse
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">Write-off Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 5"
                  value={damageQty}
                  onChange={(e) => setDamageQty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
                  id="damage-qty-input"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium">Primary Write-off Reason *</label>
                <select
                  required
                  value={damageReason}
                  onChange={(e) => setDamageReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none font-sans"
                  id="damage-reason-select"
                >
                  <option value="Broken / Leaked / Damaged">Broken / Leaked / Damaged</option>
                  <option value="Expired / Outdated">Expired / Outdated</option>
                  <option value="Theft / Shrinkage / Missing">Theft / Shrinkage / Missing</option>
                  <option value="Spoilage / Rotting">Spoilage / Rotting</option>
                  <option value="Returned & Defective">Returned & Defective</option>
                  <option value="Other Adjustment">Other Adjustment</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-500 mb-1 font-medium">Additional Audit Details (Operator Sign-off/Notes)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Leaked bottle, signed off by manager"
                    value={damageNotes}
                    onChange={(e) => setDamageNotes(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-sans"
                    id="damage-notes-input"
                  />
                  <button
                    type="submit"
                    disabled={!damageProductId || !damageQty}
                    className={`px-6 py-2.5 font-semibold rounded-lg text-white flex items-center space-x-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      !damageProductId || !damageQty
                        ? 'bg-red-300 cursor-not-allowed opacity-50'
                        : 'bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/10'
                    }`}
                    id="damage-submit-btn"
                  >
                    <span>Log Write-off</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4" id="inventory-logs-panel">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <History className="w-4.5 h-4.5 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Stock Adjustment Audit Log</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">System Recorded History</span>
          </div>

          <div className="overflow-y-auto max-h-[450px] pr-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-medium uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-center">Action Type</th>
                  <th className="p-3 text-right">Adjustment Qty</th>
                  <th className="p-3">Operation Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {stockLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 font-sans">
                      No stock adjustments have been recorded yet.
                    </td>
                  </tr>
                ) : (
                  [...stockLogs].sort((a, b) => b.timestamp - a.timestamp).map((log) => {
                    let typeBadge = '';
                    if (log.type === 'wholesale_to_retail') {
                      typeBadge = 'bg-blue-50 text-blue-700 border border-blue-100';
                    } else if (log.type === 'purchase_stock') {
                      typeBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                    } else if (log.type === 'sales_deduction') {
                      typeBadge = 'bg-slate-50 text-slate-600 border border-slate-100';
                    } else {
                      typeBadge = 'bg-amber-50 text-amber-700 border border-amber-100';
                    }

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-400 text-[10px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 font-sans font-semibold text-slate-800">
                          {log.productName}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${typeBadge}`}>
                            {log.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-bold ${log.quantity > 0 && log.type !== 'sales_deduction' ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {log.type === 'sales_deduction' ? `-${log.quantity}` : log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                        </td>
                        <td className="p-3 text-slate-500 font-sans text-[11px]">
                          {log.notes}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AUDIT TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4" id="inventory-audit-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <ClipboardCheck className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Weekly Physical Ground Audit & Reconciliation</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Cross-Check DB levels vs Actual Counts</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-150">
            📊 <strong>How to perform audit:</strong> Count the physical products available in your storehouse (Wholesale) and on shelves (Retail). Enter the exact numbers below. If a discrepancy exists, click <strong>"Submit Reconciliation"</strong> on that row to automatically calibrate the system to match ground reality and log the audit adjustment.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <th className="p-3">Product Specs</th>
                  <th className="p-3 text-center bg-teal-50/20 text-teal-950">Wholesale Stock (Storehouse)</th>
                  <th className="p-3 text-center bg-blue-50/20 text-blue-900">Retail Stock (On Shelf)</th>
                  <th className="p-3">Reconciliation Notes</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No products registered in catalog. Please add products first.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const currentWholesale = p.wholesaleStock;
                    const currentRetail = p.retailStock;
                    
                    // Get input states, defaulting to current levels if not yet in state
                    const inputWholesale = physicalWholesale[p.id] !== undefined ? physicalWholesale[p.id] : currentWholesale;
                    const inputRetail = physicalRetail[p.id] !== undefined ? physicalRetail[p.id] : currentRetail;
                    const notes = auditNotes[p.id] || 'Weekly ground cross-check';

                    const wholesaleDiff = inputWholesale - currentWholesale;
                    const retailDiff = inputRetail - currentRetail;
                    const hasDiscrepancy = wholesaleDiff !== 0 || retailDiff !== 0;

                    return (
                      <tr key={p.id} className={`hover:bg-slate-50/40 transition-colors ${hasDiscrepancy ? 'bg-amber-50/10' : ''}`}>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{p.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">UPC: {p.barcode} | Unit: {p.unit || 'pcs'}</div>
                        </td>
                        
                        {/* Wholesale inputs and status */}
                        <td className="p-3 bg-teal-50/5 text-center border-x border-slate-100/60">
                          <div className="flex flex-col items-center space-y-1">
                            <div className="text-[10px] text-slate-400 font-medium">Database: <strong>{currentWholesale}</strong> {p.unit || 'pcs'}</div>
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                min="0"
                                value={inputWholesale}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setPhysicalWholesale(prev => ({ ...prev, [p.id]: isNaN(val) ? 0 : val }));
                                }}
                                className="w-16 text-center border border-slate-200 rounded p-1 font-mono text-xs font-bold bg-white focus:border-teal-500 focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-500 font-mono">{p.unit || 'pcs'}</span>
                            </div>
                            {wholesaleDiff !== 0 && (
                              <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded ${wholesaleDiff > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {wholesaleDiff > 0 ? `📈 Surplus (+${wholesaleDiff})` : `📉 Deficit (${wholesaleDiff})`}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Retail inputs and status */}
                        <td className="p-3 bg-blue-50/5 text-center border-r border-slate-100/60">
                          <div className="flex flex-col items-center space-y-1">
                            <div className="text-[10px] text-slate-400 font-medium">Database: <strong>{currentRetail}</strong> {p.unit || 'pcs'}</div>
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                min="0"
                                value={inputRetail}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setPhysicalRetail(prev => ({ ...prev, [p.id]: isNaN(val) ? 0 : val }));
                                }}
                                className="w-16 text-center border border-slate-200 rounded p-1 font-mono text-xs font-bold bg-white focus:border-blue-500 focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-500 font-mono">{p.unit || 'pcs'}</span>
                            </div>
                            {retailDiff !== 0 && (
                              <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded ${retailDiff > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {retailDiff > 0 ? `📈 Surplus (+${retailDiff})` : `📉 Deficit (${retailDiff})`}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Audit Note */}
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Reason for adjustment..."
                            value={notes}
                            onChange={(e) => {
                              setAuditNotes(prev => ({ ...prev, [p.id]: e.target.value }));
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none"
                          />
                        </td>

                        {/* Action */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            disabled={!hasDiscrepancy}
                            onClick={() => {
                              const updatedProd = {
                                ...p,
                                wholesaleStock: inputWholesale,
                                retailStock: inputRetail
                              };
                              onUpdateProduct(updatedProd);
                              alert(`Physical ground reconciliation submitted successfully for "${p.name}"!\nSystem records have been updated, and detailed audit stock logs have been written.`);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center mx-auto space-x-1 transition-all cursor-pointer ${
                              hasDiscrepancy
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-150'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>Reconcile Stock</span>
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
      )}
    </div>
  );
}
