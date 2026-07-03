import React, { useState } from 'react';
import { 
  HelpCircle, 
  ShoppingBag, 
  BookOpen, 
  Package, 
  TrendingUp, 
  Database, 
  Search, 
  ChevronRight, 
  ArrowRight, 
  Printer, 
  Smartphone, 
  Check, 
  FolderEdit, 
  ClipboardCheck, 
  Plus, 
  UserCheck 
} from 'lucide-react';

interface AppTutorialProps {
  onClose?: () => void;
  currency: string;
}

export default function AppTutorial({ onClose, currency }: AppTutorialProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  const guides = [
    {
      id: 'credit',
      category: 'credit',
      title: 'How to Record Purchases on Credit (Credit Ledger)',
      icon: BookOpen,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      description: 'Step-by-step instructions on keying in details of people purchasing on credit, tracking debts, and processing repayments.',
      steps: [
        {
          title: 'Start at Cash Checkout Terminal',
          detail: 'Add products to the active cart in the "Cash Checkout" tab. Scan barcoded items or click their cards.'
        },
        {
          title: 'Select Payment Method: Credit Ledger',
          detail: 'When the cart is ready, locate the payment selection panel on the right sidebar and click the "Store Credit / Ledger" payment method button.'
        },
        {
          title: 'Enter Customer Identification Specs',
          detail: 'A secure form will slide down. Enter the Customer\'s Full Name and Mobile Phone Number. You can also select an existing customer from the auto-suggest list if they have bought on credit before!'
        },
        {
          title: 'Authorize and Finalize',
          detail: 'Review the interest configurations (if any) and click "Record Credit Transaction". This saves the invoice, updates product stocks, and creates a debt entry in the Credit Ledger.'
        },
        {
          title: 'Track, Repay, or Settle debts',
          detail: 'Navigate to the "Credit Ledger" tab to view all unpaid balances, add partial repayments with logs, view individual repayment histories, or download balance statements.'
        }
      ],
      proTip: 'You can charge standard optional custom interest rates (e.g., 5%) when creating a credit record to account for delayed terms.'
    },
    {
      id: 'warehouses',
      category: 'inventory',
      title: 'Managing Customizable Warehouses & Categories',
      icon: FolderEdit,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      description: 'Learn how to customize categories, define warehouse zones (Wholesale 1, 2, 3), and scale up or down as your storage space changes.',
      steps: [
        {
          title: 'Open the Stock Room Tab',
          detail: 'Go to the "Stock Room" tab from the sidebar (requires Administrator or Manager clearance level).'
        },
        {
          title: 'Click "Manage Warehouses" Button',
          detail: 'At the top of the inventory page, click the amber "📁 Manage Warehouses" button to slide open the custom Category & Warehouse Manager.'
        },
        {
          title: 'Add New Warehouse Storage Zone',
          detail: 'Enter your new warehouse zone name (e.g. "Wholesale 4") and click "Add". It instantly becomes available in the dropdown lists of your catalog.'
        },
        {
          title: 'Modify or Rename Existing Zones',
          detail: 'Click the "Edit" pencil icon on any listed warehouse zone, rename it (e.g., change "Wholesale 1" to "Storage B1"), and click Save. All registered products in that zone are automatically migrated to the new name in real time!'
        },
        {
          title: 'Remove / Scale Down Warehouses Safely',
          detail: 'Click the "Delete" trash icon. If products are registered in that warehouse, MyShop POS warns you and safely auto-reassigns those catalog items to the first available category to prevent any data corruption!'
        }
      ],
      proTip: 'Always name your warehouses clearly based on location or aisle numbers so cashiers can locate storage units effortlessly.'
    },
    {
      id: 'inventory-edit',
      category: 'inventory',
      title: 'Manual Inventory Adjustment & Fast Stock Increments',
      icon: Package,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
      description: 'How to perform immediate changes on storehouse (wholesale) and shelf (retail) stock levels without spreadsheet overrides.',
      steps: [
        {
          title: 'Locate Product in Stock Room Catalog',
          detail: 'Search by Product Name or scan the barcode to find the exact item card in the "Catalog" list.'
        },
        {
          title: 'Fast-Adjust Stock using + / - buttons',
          detail: 'In the stock list, look at the "Wholesale Stock" and "Retail Stock" columns. You can click the intuitive "+" or "-" buttons on either side of the count to instantly add or subtract units.'
        },
        {
          title: 'Type Custom Amounts Directly',
          detail: 'Double click or tap the stock count input box to type in any exact physical number directly. The change registers on focus lose.'
        },
        {
          title: 'Automatic Logs & Reconciliations',
          detail: 'Every manual stock adjustment triggers an automated entry in the Stock Logs ledger, describing the quantity changed and marking the timestamp.'
        }
      ],
      proTip: 'To restock your store shelf directly from your storehouse in one sweep, use the "Restock Shelf & Supplier Buying" form inside the Stock Room tab.'
    },
    {
      id: 'audit',
      category: 'inventory',
      title: 'Performing a Weekly Physical Ground Audit',
      icon: ClipboardCheck,
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
      description: 'Reconcile digital database records with the real count of products physically sitting on your store shelves and backrooms.',
      steps: [
        {
          title: 'Navigate to "Weekly Ground Audit" Tab',
          detail: 'Open the Stock Room tab, and select "Weekly Ground Audit" from the sub-navigation header.'
        },
        {
          title: 'Key in Actual Ground Counts',
          detail: 'Count physical products in the storehouse (Wholesale) and shelves (Retail). Enter these exact counted figures into the "Actual Count" column inputs.'
        },
        {
          title: 'Observe Discrepancy Alerts',
          detail: 'If the physical counts do not match the database counts, MyShop POS immediately highlights the row in yellow and displays a "Surplus (📈)" or "Deficit (📉)" tag with the exact difference.'
        },
        {
          title: 'Specify Reconciliation Notes',
          detail: 'Provide a reason for the discrepancy (e.g., "damaged box", "returns from customer") in the reason text box.'
        },
        {
          title: 'Apply Ground Calibration',
          detail: 'Click "Reconcile Stock" on the discrepancy row. The POS dynamically updates active database levels to ground reality and logs the physical audit adjustment.'
        }
      ],
      proTip: 'Run a physical audit every Friday evening to ensure your profit margins and analytics represent true inventory states.'
    },
    {
      id: 'checkout-flow',
      category: 'checkout',
      title: 'Operating Cash Checkout & Register Printers',
      icon: ShoppingBag,
      iconBg: 'bg-pink-50 text-pink-600 border border-pink-100',
      description: 'How to add products, handle scans, calculate taxes, process cash, and trigger thermal printer receipt Wedge emulation.',
      steps: [
        {
          title: 'Load the Cart',
          detail: 'Click any item card in the checkout section. Use the search bar to locate specific SKUs quickly.'
        },
        {
          title: 'Using Barcode Scanner (Camera or Hardware Wedge)',
          detail: 'Click "📷 Scan Barcode" to open your computer/mobile camera and read live UPC barcodes. Alternatively, type the barcode directly into the rapid-entry box and hit enter.'
        },
        {
          title: 'Apply Discounts or Modifiers',
          detail: 'Customize quantities directly in the cart, configure optional item-specific discounts, or set general cart discounts.'
        },
        {
          title: 'Input Customer Tender (Cash Amount)',
          detail: 'Under Cash payments, type in the currency amount handed over by the customer. The register immediately shows the exact change due!'
        },
        {
          title: 'Print Thermal Receipt',
          detail: 'Click "Finalize & Issue Receipt". A digital high-contrast thermal-formatted receipt displays on the terminal, and your device\'s system print dialog is triggered for physical paper output.'
        }
      ],
      proTip: 'Ensure your thermal roll is 58mm or 80mm and correctly loaded. You can verify printer status at any time on the top register window bar.'
    },
    {
      id: 'analytics',
      category: 'analytics',
      title: 'Analyzing Business Health & Profit Margins',
      icon: TrendingUp,
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      description: 'How to read financial analytics charts, gross margins, average order value, and operator performance.',
      steps: [
        {
          title: 'Understand Key Indicators',
          detail: 'Gross Revenue shows total sales, Profit is calculated as (Retail Sale Price - Wholesale Cost) on sold quantities, and Average Cart indicates average spend size.'
        },
        {
          title: 'Daily Sales Trend Line',
          detail: 'An interactive SVG chart depicts sales volume spikes across hourly/daily intervals, allowing you to identify peak shopping periods.'
        },
        {
          title: 'Monitor Low Stock Warnings',
          detail: 'Low stocks are highlighted in the Stock Room and visible to managers immediately, ensuring you order items before they run out of stock.'
        }
      ],
      proTip: 'Filter analytics frequently to evaluate which products are yielding the highest markup ratios for your grocery operations.'
    }
  ];

  const filteredGuides = guides.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.steps.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.detail.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedTopic === 'all' || g.category === selectedTopic;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden" id="app-tutorial-section">
      {/* Tutorial Header banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 relative">
        <div className="absolute right-4 top-4 opacity-10 pointer-events-none">
          <HelpCircle className="w-40 h-40 text-white" />
        </div>
        
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-300 font-bold text-[10px] uppercase tracking-wider rounded-full font-mono">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Interactive POS Training Manual</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">MyShop Desk Interactive Knowledge Base</h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Welcome to your master POS system guide! Here you will find direct operational recipes for managing checkouts, handling store credits, managing warehouse zones, and physical audits.
          </p>
        </div>

        {/* Search & Topic Tabs bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tutorial guides, questions, or steps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 font-sans"
              id="tutorial-search-input"
            />
          </div>
          
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 overflow-x-auto">
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'credit', label: 'Credit Ledger' },
              { id: 'inventory', label: 'Warehouses / Stock' },
              { id: 'checkout', label: 'Checkout & Sales' },
              { id: 'analytics', label: 'Analytics' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTopic(tab.id)}
                className={`text-[10px] px-3 py-1.5 font-bold rounded-md whitespace-nowrap cursor-pointer transition-all ${
                  selectedTopic === tab.id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Guide Listing & Walkthrough Content */}
      <div className="p-5 sm:p-6 lg:p-8 space-y-8 bg-slate-50/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGuides.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-slate-200/60 p-6 space-y-2">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No match found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No guides fit your search query "{searchQuery}". Try searching for keywords like "credit", "warehouse", "reconciliation", or "repay".
              </p>
            </div>
          ) : (
            filteredGuides.map(guide => {
              const GuideIcon = guide.icon;
              return (
                <div 
                  key={guide.id} 
                  className="bg-white rounded-xl border border-slate-200/70 p-5 shadow-xs space-y-4 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
                  id={`tutorial-guide-${guide.id}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${guide.iconBg}`}>
                        <GuideIcon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-widest font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono">
                          {guide.category} manual
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">{guide.title}</h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {guide.description}
                    </p>

                    {/* Step-by-Step interactive process */}
                    <div className="border-t border-slate-100 pt-4 mt-2 space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Action Checklist:</span>
                      
                      <div className="space-y-2.5">
                        {guide.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start space-x-2.5">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-mono">
                              {idx + 1}
                            </span>
                            <div className="text-[11px] leading-relaxed">
                              <span className="font-bold text-slate-800 block">{step.title}</span>
                              <span className="text-slate-500 font-medium block">{step.detail}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pro Tip Callout Box */}
                  <div className="mt-5 pt-3 border-t border-slate-100 bg-amber-50/40 p-3 rounded-lg border border-amber-100 flex items-start space-x-2">
                    <span className="text-xs mt-0.5">💡</span>
                    <div className="text-[11px] text-amber-900 leading-relaxed">
                      <strong>Operator Tip:</strong> {guide.proTip}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Extra FAQ / Special instructions section */}
        <div className="bg-slate-900 text-slate-100 rounded-xl p-5 sm:p-6 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <HelpCircle className="w-4.5 h-4.5 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Terminal Operational Frequently Asked Questions</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-300 leading-relaxed font-medium">
            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">Q: How do I change the default currency prefix?</span>
              <p className="text-slate-400 text-[11px]">
                The default currency prefix has been locked to Cedis (<strong>{currency}</strong>) according to your workspace settings. You can review store details in the onboarding file settings at any time.
              </p>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">Q: Does MyShop POS need internet connection?</span>
              <p className="text-slate-400 text-[11px]">
                No! The entire suite operates 100% offline. All catalog additions, stock logs, customer ledgers, and configurations are securely saved in your browser's persistent IndexedDB local cache.
              </p>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">Q: How do I key in details of people purchasing on credit?</span>
              <p className="text-slate-400 text-[11px]">
                Go to <strong>Cash Checkout</strong>, add items to the cart, select <strong>"Store Credit / Ledger"</strong> as the payment method, type the person's name and phone number, and click record. You can manage them later in the <strong>Credit Ledger</strong>.
              </p>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">Q: Can I backup or move my data to another PC?</span>
              <p className="text-slate-400 text-[11px]">
                Yes! Head to the <strong>Database Backups</strong> tab, click <strong>"Download JSON Backup"</strong>. Take that file to any other terminal running MyShop, and upload it using the restore system. Your entire registry restores instantly.
              </p>
            </div>
          </div>
        </div>

        {onClose && (
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-md cursor-pointer transition-colors"
              type="button"
            >
              Close Training Manual
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.187L15 15l-5.187.904zM18 10.5l-.5 2.5-2.5-.5.5-2.5 2.5.5z"
      />
    </svg>
  );
}
