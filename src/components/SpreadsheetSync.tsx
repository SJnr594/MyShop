import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Product } from '../types';
import { Upload, Link, Download, FileSpreadsheet, CheckCircle, AlertTriangle, Play, HelpCircle, RefreshCw } from 'lucide-react';

interface SpreadsheetSyncProps {
  products: Product[];
  onBulkImport: (newProducts: Omit<Product, 'id'>[], updatedProducts: Product[]) => void;
  onClose: () => void;
  currency: string;
}

interface ParsedResult {
  newItems: Omit<Product, 'id'>[];
  updatedItems: Product[];
  errors: string[];
}

export default function SpreadsheetSync({ products, onBulkImport, onClose, currency }: SpreadsheetSyncProps) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResult | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    // Generate template headers
    const headers = ['Barcode', 'Product Name', 'Category', 'Wholesale Cost', 'Retail Price', 'Wholesale Stock', 'Retail Stock', 'Min Stock Alert'];
    const sampleData = [
      ['8801007123456', 'Fresh Tomato Juice 500ml', 'Beverages', '0.90', '1.80', '50', '15', '10'],
      ['4001234567890', 'Gourmet Salted Crackers 150g', 'Snacks & Sweets', '1.20', '2.49', '40', '8', '5']
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...sampleData.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "myshop_inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setLoading(true);
    setMessage(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        parseSheetArray(data);
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Failed to read spreadsheet. Please ensure it is a valid .xlsx, .xls, or .csv file.' });
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Error reading file.' });
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleGoogleSheetSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) return;

    setLoading(true);
    setMessage(null);

    let parsedUrl = sheetUrl.trim();
    // Transform Google Sheets edit URL into standard export CSV URL
    // e.g., https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0 -> export?format=csv
    const gSheetMatch = parsedUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    
    if (gSheetMatch && gSheetMatch[1]) {
      const spreadsheetId = gSheetMatch[1];
      parsedUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
    } else {
      setMessage({ type: 'error', text: 'Invalid Google Sheets link. Please make sure to share the link from your browser bar.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(parsedUrl);
      if (!response.ok) {
        throw new Error('Could not access spreadsheet. Is it set to "Anyone with the link can view"?');
      }
      const csvText = await response.text();
      
      // Parse CSV Text via Simple CSV Parser in XLSX
      const wb = XLSX.read(csvText, { type: 'string' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      parseSheetArray(data);
    } catch (err: any) {
      console.error(err);
      setMessage({ 
        type: 'error', 
        text: err.message || 'Failed to fetch Google Sheet. Please verify that link sharing is active (Anyone with link can view).'
      });
      setLoading(false);
    }
  };

  const parseSheetArray = (rows: any[][]) => {
    if (!rows || rows.length < 2) {
      setMessage({ type: 'error', text: 'Spreadsheet contains no data or headers.' });
      setLoading(false);
      return;
    }

    // Clean headers
    const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
    
    // Auto-map headers
    const barcodeIdx = headers.findIndex(h => h.includes('barcode') || h.includes('sku') || h.includes('upc') || h === 'code');
    const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('title') || h === 'product');
    const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('type') || h === 'dept' || h === 'department');
    const costIdx = headers.findIndex(h => h.includes('cost') || h.includes('wholesale') || h.includes('buy') || h === 'wholesale_cost');
    const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('retail') || h.includes('sell') || h === 'retail_price');
    const wholesaleStockIdx = headers.findIndex(h => h.includes('wholesale stock') || h.includes('wholesale_stock') || h.includes('warehouse') || h.includes('bulk'));
    const retailStockIdx = headers.findIndex(h => h.includes('retail stock') || h.includes('retail_stock') || h.includes('shelf') || h.includes('on hand'));
    const alertIdx = headers.findIndex(h => h.includes('alert') || h.includes('min') || h.includes('alert_level') || h === 'min_stock');

    if (barcodeIdx === -1 || nameIdx === -1) {
      setMessage({ 
        type: 'error', 
        text: 'Required columns not found! Your spreadsheet must contain columns named "Barcode" (or SKU/UPC) and "Product Name" (or Product/Title).' 
      });
      setLoading(false);
      return;
    }

    const newItems: Omit<Product, 'id'>[] = [];
    const updatedItems: Product[] = [];
    const errors: string[] = [];

    // Process row by row starting at row 1 (index 1)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row[barcodeIdx]) continue; // skip empty rows

      const barcodeVal = String(row[barcodeIdx]).trim();
      const nameVal = String(row[nameIdx] || '').trim();

      if (!barcodeVal || !nameVal) {
        errors.push(`Row ${i + 1}: Missing Barcode or Product Name.`);
        continue;
      }

      const categoryVal = categoryIdx !== -1 && row[categoryIdx] ? String(row[categoryIdx]).trim() : 'General';
      const wholesaleCostVal = costIdx !== -1 ? parseFloat(String(row[costIdx]).replace(/[^0-9.]/g, '')) || 0 : 0;
      const retailPriceVal = priceIdx !== -1 ? parseFloat(String(row[priceIdx]).replace(/[^0-9.]/g, '')) || 0 : 0;
      const wholesaleStockVal = wholesaleStockIdx !== -1 ? parseInt(String(row[wholesaleStockIdx]).replace(/[^0-9]/g, '')) || 0 : 0;
      const retailStockVal = retailStockIdx !== -1 ? parseInt(String(row[retailStockIdx]).replace(/[^0-9]/g, '')) || 0 : 0;
      const minStockAlertVal = alertIdx !== -1 ? parseInt(String(row[alertIdx]).replace(/[^0-9]/g, '')) || 5 : 5;

      // Check if product with this barcode already exists in standard products
      const existingProduct = products.find(p => p.barcode === barcodeVal);

      if (existingProduct) {
        updatedItems.push({
          id: existingProduct.id,
          barcode: barcodeVal,
          name: nameVal,
          category: categoryVal,
          wholesaleCost: wholesaleCostVal,
          retailPrice: retailPriceVal,
          wholesaleStock: wholesaleStockVal,
          retailStock: retailStockVal,
          minStockAlert: minStockAlertVal
        });
      } else {
        newItems.push({
          barcode: barcodeVal,
          name: nameVal,
          category: categoryVal,
          wholesaleCost: wholesaleCostVal,
          retailPrice: retailPriceVal,
          wholesaleStock: wholesaleStockVal,
          retailStock: retailStockVal,
          minStockAlert: minStockAlertVal
        });
      }
    }

    setParsedData({ newItems, updatedItems, errors });
    setLoading(false);
  };

  const handleCommitImport = () => {
    if (!parsedData) return;
    onBulkImport(parsedData.newItems, parsedData.updatedItems);
    setMessage({ 
      type: 'success', 
      text: `Successfully imported inventory database! Added ${parsedData.newItems.length} new products, updated ${parsedData.updatedItems.length} existing products.`
    });
    setParsedData(null);
    setSheetUrl('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden animate-fadeIn" id="spreadsheet-sync-card">
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide uppercase">Spreadsheet Inventory Suite</h3>
            <p className="text-[10px] text-slate-400">Bulk sync wholesale warehouse and retail prices from Excel or Sheets</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-all text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
          type="button"
        >
          Cancel
        </button>
      </div>

      <div className="p-6 space-y-6">
        {message && (
          <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-rose-50 border-rose-100 text-rose-800'
          }`} id="sync-status-alert">
            <CheckCircle className={`w-5 h-5 shrink-0 mt-0.5 ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`} />
            <div className="text-xs">
              <span className="font-bold block mb-1">{message.type === 'success' ? 'Database Synchronized' : 'Import Unsuccessful'}</span>
              <p className="font-medium leading-relaxed">{message.text}</p>
            </div>
          </div>
        )}

        {/* Action Panel */}
        {!parsedData && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Drag & Drop local file */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-600 block">Option A: Upload Excel/CSV File</label>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-48 ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50/20 text-blue-700' 
                    : 'border-slate-200 hover:border-blue-400 bg-slate-50 text-slate-500 hover:bg-white'
                }`}
                id="excel-drop-zone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-blue-500 mb-2.5 animate-bounce" />
                <span className="text-xs font-semibold text-slate-700">Drag & Drop Spreadsheet here</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Supports Microsoft Excel (.xlsx, .xls) & CSV files</span>
                <span className="text-[10px] text-blue-600 font-bold mt-2 hover:underline">Or browse files</span>
              </div>
            </div>

            {/* Right: Google Sheet Link URL */}
            <div className="space-y-3 flex flex-col justify-between">
              <form onSubmit={handleGoogleSheetSync} className="space-y-3">
                <label className="text-xs font-bold text-slate-600 block">Option B: Connect Live Google Sheet</label>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Provide your spreadsheet share link. Make sure the file is set to <strong>"Anyone with link can view"</strong> so MyShop POS can securely synchronize.
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Link className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                    id="gsh-link-input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!sheetUrl.trim()}
                  className={`w-full py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                    sheetUrl.trim() 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/10' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                  id="gsh-sync-btn"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Fetch & Synchronize Live Sheet</span>
                </button>
              </form>

              {/* Template Area */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs mt-3">
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-600">Need a starting layout?</span>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="bg-white hover:bg-slate-100 text-blue-700 border border-slate-200 px-3 py-1 rounded font-bold text-[10px] uppercase tracking-wide transition-all"
                  id="download-template-btn"
                >
                  Get CSV Template
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3" id="sync-loading-spinner">
            <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
            <h4 className="text-xs font-bold text-slate-700">Parsing spreadsheet columns & stock entries...</h4>
            <p className="text-[10px] text-slate-400 font-mono">Running secure local mapping algorithms</p>
          </div>
        )}

        {/* Preview and Review Screen */}
        {parsedData && (
          <div className="space-y-4 animate-scaleUp">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Spreadsheet Review & Mapping Stage</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Carefully verify the mapped columns before writing changes to the system registry.</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setParsedData(null)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                  type="button"
                >
                  Cancel Import
                </button>
                <button
                  onClick={handleCommitImport}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/10"
                  type="button"
                  id="commit-import-btn"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Database Sync ({parsedData.newItems.length + parsedData.updatedItems.length} products)</span>
                </button>
              </div>
            </div>

            {/* Sync Summary Badges */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-blue-500 block uppercase">New SKU Products</span>
                <span className="text-xl font-bold text-blue-900 font-mono">{parsedData.newItems.length}</span>
                <span className="text-[9px] text-blue-600 block mt-0.5">Will be registered</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-amber-600 block uppercase">Matching SKUs (Update)</span>
                <span className="text-xl font-bold text-amber-900 font-mono">{parsedData.updatedItems.length}</span>
                <span className="text-[9px] text-amber-600 block mt-0.5">Will update prices & stock</span>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-rose-500 block uppercase">Failed Rows</span>
                <span className="text-xl font-bold text-rose-900 font-mono">{parsedData.errors.length}</span>
                <span className="text-[9px] text-rose-600 block mt-0.5">Lines missed due to errors</span>
              </div>
            </div>

            {/* Error logs */}
            {parsedData.errors.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl space-y-1 text-[11px] text-rose-800 font-mono">
                <div className="flex items-center space-x-1.5 font-bold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Mapping Exclusions Details:</span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1 font-medium">
                  {parsedData.errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Combined preview list */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-3 bg-slate-900 text-white font-bold text-[10px] tracking-wider uppercase">
                Synchronized Registry Preview Table
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">Barcode / SKU</th>
                      <th className="p-2.5">Product Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Wholesale Cost</th>
                      <th className="p-2.5 text-right">Retail Price</th>
                      <th className="p-2.5 text-center">Back Stock</th>
                      <th className="p-2.5 text-center">Shelf Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 font-medium text-slate-700 bg-white">
                    {parsedData.newItems.map((p, i) => (
                      <tr key={`new-${i}`} className="hover:bg-blue-50/20 text-blue-900 font-sans">
                        <td className="p-2.5 text-[10px]"><span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">NEW</span></td>
                        <td className="p-2.5 font-mono text-[11px]">{p.barcode}</td>
                        <td className="p-2.5 truncate max-w-[180px]">{p.name}</td>
                        <td className="p-2.5">{p.category}</td>
                        <td className="p-2.5 text-right font-mono">{currency}{p.wholesaleCost.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono">{currency}{p.retailPrice.toFixed(2)}</td>
                        <td className="p-2.5 text-center font-mono">{p.wholesaleStock}</td>
                        <td className="p-2.5 text-center font-mono">{p.retailStock}</td>
                      </tr>
                    ))}
                    {parsedData.updatedItems.map((p, i) => {
                      const prevProduct = products.find(orig => orig.id === p.id);
                      const isCostDiff = prevProduct ? prevProduct.wholesaleCost !== p.wholesaleCost : false;
                      const isPriceDiff = prevProduct ? prevProduct.retailPrice !== p.retailPrice : false;
                      return (
                        <tr key={`upd-${i}`} className="hover:bg-amber-50/20 text-amber-900 font-sans">
                          <td className="p-2.5 text-[10px]"><span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">UPDATE</span></td>
                          <td className="p-2.5 font-mono text-[11px]">{p.barcode}</td>
                          <td className="p-2.5 truncate max-w-[180px]">{p.name}</td>
                          <td className="p-2.5">{p.category}</td>
                          <td className="p-2.5 text-right font-mono">
                            <span className={isCostDiff ? "line-through text-slate-400 mr-1 block text-[10px]" : ""}>
                              {isCostDiff && prevProduct && `${currency}${prevProduct.wholesaleCost.toFixed(2)}`}
                            </span>
                            <span>{currency}{p.wholesaleCost.toFixed(2)}</span>
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            <span className={isPriceDiff ? "line-through text-slate-400 mr-1 block text-[10px]" : ""}>
                              {isPriceDiff && prevProduct && `${currency}${prevProduct.retailPrice.toFixed(2)}`}
                            </span>
                            <span>{currency}{p.retailPrice.toFixed(2)}</span>
                          </td>
                          <td className="p-2.5 text-center font-mono">{p.wholesaleStock}</td>
                          <td className="p-2.5 text-center font-mono">{p.retailStock}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span className="flex items-center space-x-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Column mapping is smart-associative and case-insensitive.</span>
        </span>
        <span>Version 1.2 Excel Sync Engine</span>
      </div>
    </div>
  );
}
