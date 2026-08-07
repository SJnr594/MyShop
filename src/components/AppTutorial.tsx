import React, { useState, useEffect } from 'react';
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
  UserCheck,
  Lock,
  Shield,
  ShieldCheck,
  Terminal,
  Info,
  FileText,
  Sparkles,
  CheckSquare,
  Square
} from 'lucide-react';

interface AppTutorialProps {
  onClose?: () => void;
  currency: string;
  activeProfile?: {
    id: string;
    name: string;
    role: 'admin' | 'manager' | 'cashier';
    passwordHash: string;
  } | null;
}

export default function AppTutorial({ onClose, currency, activeProfile }: AppTutorialProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('recommended');

  const userRole = activeProfile?.role || 'cashier';
  const userName = activeProfile?.name || 'Retail Cashier';

  // Interactive Checklist Persistence
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`myshop_tutorial_checklist_${activeProfile?.id || 'guest'}`);
      if (stored) {
        setChecklist(JSON.parse(stored));
      } else {
        setChecklist({});
      }
    } catch (e) {
      console.error('Failed to parse tutorial checklist state', e);
    }
  }, [activeProfile?.id]);

  const toggleChecklistItem = (itemId: string) => {
    const updated = { ...checklist, [itemId]: !checklist[itemId] };
    setChecklist(updated);
    try {
      localStorage.setItem(`myshop_tutorial_checklist_${activeProfile?.id || 'guest'}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save tutorial checklist state', e);
    }
  };

  // Profile-specific inherent functionalities & interactive tasks
  const roleSpecs = {
    cashier: {
      title: 'Retail Cashier Profile',
      badgeBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      icon: ShoppingBag,
      summary: 'Frontline register operator focused on fast customer checkout, barcode scanning, printing receipts, and booking store credit.',
      securityBoundary: '🔒 RESTRICTED: Cashiers cannot view profit margins, edit item pricing, alter stock counts, export database backups, or modify system settings.',
      tabsAllowed: ['Cash Checkout', 'Store Credit Ledger', 'Interactive Help Desk'],
      tabsRestricted: ['Stock Room', 'Business Analytics', 'Database Backups'],
      functionalities: [
        { name: 'Frontline Cash Checkout', desc: 'Add retail products, scan barcodes, and adjust item cart quantities.' },
        { name: 'POS Hotkeys (F1–F9 & Esc)', desc: 'Accelerate transactions using hardware function keys for fast search, scanner toggle, and single-tap printing.' },
        { name: 'Customer Credit Bookings', desc: 'Book purchases on credit by capturing customer names, phone numbers, and repayment dates.' },
        { name: 'Receipt Printer Toggles', desc: 'Switch receipt styles on the fly between 58mm Mobile rolls, 80mm Thermal, or A4 Office invoices.' },
        { name: 'Partial Debt Repayments', desc: 'Log customer cash deposits inside the Credit Ledger and issue updated account statements.' }
      ],
      trainingTasks: [
        { id: 'c_task1', label: 'Practice adding products to the cart by clicking a catalog card or pressing F3.' },
        { id: 'c_task2', label: 'Toggle dark mode (Alt + D) to enable eye-care midnight colors for night shifts.' },
        { id: 'c_task3', label: 'Toggle the receipt print format from "80mm" to "58mm" in the print checkout popup.' },
        { id: 'c_task4', label: 'Register a store credit purchase by entering a custom customer phone number.' },
        { id: 'c_task5', label: 'View the Credit Ledger, select an outstanding buyer, and log a partial repayment.' }
      ]
    },
    manager: {
      title: 'Store Operations Manager Profile',
      badgeBg: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
      icon: UserCheck,
      summary: 'Store supervisor managing catalog pricing, stock replenishment, weekly physical audits, and business performance metrics.',
      securityBoundary: '🔒 RESTRICTED: Managers cannot alter user passcodes, execute database clears/purges, configure cloud credentials, or modify core system settings.',
      tabsAllowed: ['Cash Checkout', 'Store Credit Ledger', 'Stock Room (Catalog & Logs)', 'Business Analytics', 'Interactive Help Desk'],
      tabsRestricted: ['Database Backups & Cloud Sync'],
      functionalities: [
        { name: 'Catalog & Price Management', desc: 'Edit product selling prices, supplier cost prices, SKU barcodes, and minimal stock thresholds.' },
        { name: 'Wholesale to Retail Restocking', desc: 'Shift bulk items from backroom storehouses onto active retail shelves.' },
        { name: 'Weekly Physical Stock Audits', desc: 'Reconcile digital inventory with ground shelf counts, logging surplus or deficit flags.' },
        { name: 'Supplier Delivery Intake', desc: 'Log incoming inventory shipments and view auto-generated stock logs.' },
        { name: 'Business Health Analytics', desc: 'Monitor gross markup margins, revenue timelines, peak hours, and order volume logs.' }
      ],
      trainingTasks: [
        { id: 'm_task1', label: 'Create a new warehouse location (e.g. "Wholesale Zone B") in the Stock Room.' },
        { id: 'm_task2', label: 'Fast-adjust a product\'s shelf stock count using the immediate "+" or "-" buttons.' },
        { id: 'm_task3', label: 'Initiate a Weekly Ground Audit and input a shelf count to generate a Deficit (📉) flag.' },
        { id: 'm_task4', label: 'Log a write-off for damaged goods with an audit justification note.' },
        { id: 'm_task5', label: 'Analyze gross profit margin indicators on the business health analytics panel.' }
      ]
    },
    admin: {
      title: 'System Administrator Profile',
      badgeBg: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      icon: ShieldCheck,
      summary: 'Master system administrator with full clearance to manage user accounts, offline JSON backups, cloud sync, system resets, and security settings.',
      securityBoundary: '🔓 UNRESTRICTED: Full master clearance across all registers, databases, audit logs, and system settings.',
      tabsAllowed: ['All tabs unlocked (Checkout, Credit, Stocks, Analytics, Backups, Help Desk)'],
      tabsRestricted: ['None - Master Administrator Clearance'],
      functionalities: [
        { name: 'Operator Roster & Passcodes', desc: 'Manage cashier and manager user profiles, update security PINs, and set role permissions.' },
        { name: 'Offline HDD/SSD & Drive Backups', desc: 'Export full database snapshot files (.json) for local storage drives or cloud backup.' },
        { name: 'System Resets & Data Purges', desc: 'Perform system data purges or reload clean catalog seed templates.' },
        { name: 'Global Store Settings', desc: 'Configure store currency, tax VAT percentages, receipt headers, and store logo banners.' },
        { name: 'Audit Log Surveillance', desc: 'Review immutable stock logs detailing timestamped operator adjustments.' }
      ],
      trainingTasks: [
        { id: 'a_task1', label: 'Download a secure JSON Backup of the entire register database to your local drive.' },
        { id: 'a_task2', label: 'Configure browser "Ask where to save each file before downloading" for backup routing.' },
        { id: 'a_task3', label: 'Review operator profiles and update security passcodes in System Settings.' },
        { id: 'a_task4', label: 'Inspect the system-wide Stock Logs timeline to audit operator stock adjustments.' },
        { id: 'a_task5', label: 'Toggle the system-wide Tax VAT percentage and verify the new rate on checkout carts.' }
      ]
    }
  };

  const currentRoleSpec = roleSpecs[userRole];

  // Master guides registry with clearance-tags mapped to roles
  const guides = [
    {
      id: 'checkout-flow',
      category: 'checkout',
      minRole: 'cashier',
      title: 'Operating Cash Checkout & Register Printers',
      icon: ShoppingBag,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      description: 'Step-by-step instructions on loading checkout carts, managing barcode wedge timing, and issuing printed receipts.',
      steps: [
        {
          title: 'Load the Checkout Cart',
          detail: 'Click items in the product grid to append them. Double click or use the quick inputs in the cart to change quantity levels.'
        },
        {
          title: 'Using Barcode Scanners (Wedge & Camera)',
          detail: 'For handheld laser scanners: simply squeeze the trigger; keystroke-events are intercepted automatically. For mobile, click "📷 Scan Barcode" to stream camera capture.'
        },
        {
          title: 'Verify Customer Cash Tender',
          detail: 'When the customer hands you physical currency, type that amount into the "Cash Tendered" box. The register instantly details the "Change Due" in prominent green numbers.'
        },
        {
          title: 'Choose Width & Print Receipt',
          detail: 'Click "Finalize & Issue Receipt". Choose the paper style (58mm, 80mm, or A4) matching your printer. Press "Print Physical Receipt" or press Esc to start the next cart.'
        }
      ],
      proTip: 'For high-speed registers, keep the barcode search input focused. Scanned items add directly to the cart in 65ms without manual clicking!'
    },
    {
      id: 'credit',
      category: 'credit',
      minRole: 'cashier',
      title: 'How to Record Purchases on Credit (Credit Ledger)',
      icon: BookOpen,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      description: 'Step-by-step instructions on checking out credit buyers, tracking repayment timelines, and processing partial deposits.',
      steps: [
        {
          title: 'Initiate Credit Payment',
          detail: 'Assemble the cart items. In the payment methods sidebar, select "Store Credit / Ledger".'
        },
        {
          title: 'Capture Customer Identification Specs',
          detail: 'Type in the Customer\'s Full Name and Mobile Phone. You can also pick a previous credit customer from the smart auto-suggest list!'
        },
        {
          title: 'Set Due Dates & Custom Markup',
          detail: 'Specify the repayment due date (default is 14 days) and apply optional custom interest rates to represent delayed payment markup.'
        },
        {
          title: 'Log Payments inside the Ledger',
          detail: 'When a customer makes a deposit, navigate to the "Credit Ledger" tab, click "Process Repayment", log the amount, and print an updated mini-balance sheet.'
        }
      ],
      proTip: 'In MyShop Desk, individual credit records are linked to the buyer\'s mobile number. Enter the exact same phone number to pile subsequent credits onto one consolidated profile!'
    },
    {
      id: 'warehouses',
      category: 'inventory',
      minRole: 'manager',
      title: 'Managing Customizable Warehouses & Categories',
      icon: FolderEdit,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      description: 'How to configure physical category tags, expand warehouse zones (Wholesale 1, 2, 3), and scale your catalog.',
      steps: [
        {
          title: 'Open the Warehouse Manager Tab',
          detail: 'Access the "Stock Room" tab, then click the amber "📁 Manage Warehouses" button located at the top-right catalog tools.'
        },
        {
          title: 'Add New Storage Locations',
          detail: 'Input a unique warehouse code (e.g. "Wholesale Zone C") and click "Create". It is instantly active and selectable in your catalog forms.'
        },
        {
          title: 'Safely Rename Storage Sections',
          detail: 'Edit any warehouse label. MyShop POS automatically migrates all registered stock quantities in that area to the new label in real-time!'
        },
        {
          title: 'De-register Warehouses with Safety Nets',
          detail: 'If you delete a warehouse holding registered items, the catalog safety net dynamically re-assigns them to your default category, preserving database integrity.'
        }
      ],
      proTip: 'Organize your warehouse names by rack or aisle codes (e.g. "Aisle B-Shelf 4") to give your stockers immediate location maps!'
    },
    {
      id: 'inventory-edit',
      category: 'inventory',
      minRole: 'manager',
      title: 'Catalog Adjustment & Backhouse Replenishments',
      icon: Package,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
      description: 'How to adjust pricing markups, set minimal stock alert tags, and restock frontline retail shelves from wholesale storehouses.',
      steps: [
        {
          title: 'Manual Stock Adjustments',
          detail: 'In the Catalog list, locate the product. Click the immediate "+" or "-" buttons next to the stock column to change numbers on the fly.'
        },
        {
          title: 'Define Wholesale Costs vs. Retail Prices',
          detail: 'Open the edit form on a product. Record the "Supplier Unit Cost" and the "Retail Selling Price". MyShop Desk uses this data to map profit charts.'
        },
        {
          title: 'Restock Retail Shelves from Wholesale',
          detail: 'Use the "Move Stock (Wholesale to Retail)" slider. This deducts units from backroom storage and shifts them onto the active retail shelf, keeping catalogs in sync.'
        },
        {
          title: 'Log Supplier Shipments',
          detail: 'When new bulk inventory deliveries arrive from suppliers, click "Buy Stock" to increment Wholesale levels and write corresponding stock logs.'
        }
      ],
      proTip: 'Always configure the "Min Stock Alert" number on fast-moving goods. When active retail shelves fall below this number, MyShop flags the row in amber and fires low stock alerts on your sidebar.'
    },
    {
      id: 'audit',
      category: 'inventory',
      minRole: 'manager',
      title: 'Weekly Physical Stock Ground Reconciliation',
      icon: ClipboardCheck,
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
      description: 'How to run physical audits, identify stock shrinkages, and reconcile digital database logs with real ground inventory.',
      steps: [
        {
          title: 'Open the Weekly Ground Audit Sheet',
          detail: 'Go to the "Stock Room" tab, and toggle the sub-navigation header to "Weekly Ground Audit".'
        },
        {
          title: 'Count Shelves & Key in Actual Quantities',
          detail: 'Perform a physical count of items in the storehouse (Wholesale) and shelves (Retail). Enter these counts into the corresponding "Actual" column fields.'
        },
        {
          title: 'Read Discrepancy Alerts',
          detail: 'The POS highlights discrepancy rows in yellow and displays "Surplus (📈)" or "Deficit (📉)" tags matching the difference.'
        },
        {
          title: 'Apply Calibrations with Notes',
          detail: 'Type the auditing reason (e.g., "damaged packaging", "shrinkage") and click "Reconcile Stock". The digital active stock calibrates to match the physical count.'
        }
      ],
      proTip: 'Incentivize standard auditing habits by scheduling a ground audit every Friday afternoon to ensure weekend margins represent ground reality.'
    },
    {
      id: 'analytics',
      category: 'analytics',
      minRole: 'manager',
      title: 'Reading Business Margins & Sales Timelines',
      icon: TrendingUp,
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      description: 'Learn how sales margins are computed and how to review daily revenue trends or individual order logs.',
      steps: [
        {
          title: 'Analyze Key Indicators',
          detail: 'Gross Revenue tracks total intake, profit maps out (Retail price - Supplier wholesale cost) on actual sold quantities, and order counts map total customer tickets.'
        },
        {
          title: 'Inspect hourly/daily trend lines',
          detail: 'Review the interactive sales charts to locate peak shopping times. Use this peak data to arrange cashier shifts!'
        },
        {
          title: 'Identify High-Margin Goods',
          detail: 'Review catalog cost-to-price ratios to prioritize marketing high-profit products over low-margin bulk goods.'
        }
      ],
      proTip: 'Managers can edit previous cash sales inside the Analytics panel order lists to correct cashier pricing errors. The inventory shelf levels will auto-reconcile!'
    },
    {
      id: 'backups',
      category: 'backups',
      minRole: 'admin',
      title: 'Database Security: Snapshot Backups & State Restores',
      icon: Database,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      description: 'Exclusive instructions for System Administrators to download secure JSON registers, restore backup snapshots, or wipe systems safely.',
      steps: [
        {
          title: 'Create Secure JSON Backups',
          detail: 'Navigate to the "Database Backups" tab and click "Download Local Backup (JSON)". This aggregates all catalogs, stock logs, credit accounts, and settings into one snapshot file.'
        },
        {
          title: 'Upload & Restore Snapshots',
          detail: 'Drag and drop any previously saved MyShop Desk JSON backup file into the restore slot. Click "Restore System State" to repopulate the register database instantly.'
        },
        {
          title: 'Complete Register Purges',
          detail: 'To wipe old records for a new business quarter, click "Clear & Format Database". Note: This action is irreversible and requires the master administrator passcode.'
        },
        {
          title: 'Load Sandbox Seed Templates',
          detail: 'To perform training drills or verify receipt printers with demo stock, click "Reload Demo Store Catalog" to seed 12 premium barcoded products instantly.'
        }
      ],
      proTip: 'Perform daily JSON exports at close of business to preserve full sales ledgers against hardware failures or browser cache wipes!'
    },
    {
      id: 'drive-storage-guide',
      category: 'backups',
      minRole: 'admin',
      title: 'Saving Backups to HDD / SSD & Google Drive',
      icon: Shield,
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
      description: 'How to route your local JSON database exports to physical drives (USB, HDD, SSD) and auto-sync with cloud drives like Google Drive or OneDrive.',
      steps: [
        {
          title: 'Configure Browser "Ask Where to Save"',
          detail: 'In Chrome or Edge Settings > Downloads, toggle ON "Ask where to save each file before downloading". This lets you pick your exact external drive or synced folder for every export.'
        },
        {
          title: 'Direct Export to HDD / SSD / USB',
          detail: 'When clicking "Download Local Backup (JSON)", select your external hard drive or flash drive in the save popup (e.g., E:\\Store_Backups\\2026-08-06_backup.json).'
        },
        {
          title: 'Auto-Sync with Google Drive / OneDrive',
          detail: 'Install the Google Drive for Desktop app and set your default download location to a Google Drive synced folder (e.g., Google Drive > My Drive > POS_Backups). Every backup instantly mirrors to cloud storage.'
        },
        {
          title: 'Optional Firebase Realtime Cloud Sync',
          detail: 'In the Backups tab, enable "Cloud Sync Mode" with your Firebase project config to continuously backup transactions live across multi-terminal setups.'
        }
      ],
      proTip: 'Maintaining copies on both a physical external SSD and a cloud storage folder (Google Drive) guarantees maximum data resilience.'
    }
  ];

  const isRoleAllowed = (role: string, minRole: string) => {
    if (role === 'admin') return true;
    if (role === 'manager') return minRole === 'manager' || minRole === 'cashier';
    if (role === 'cashier') return minRole === 'cashier';
    return false;
  };

  const filteredGuides = guides.filter(g => {
    // Topic filters
    if (selectedTopic === 'recommended') {
      if (!isRoleAllowed(userRole, g.minRole)) return false;
    } else if (selectedTopic !== 'all' && g.category !== selectedTopic) {
      return false;
    }

    // Search query
    const query = searchQuery.toLowerCase();
    const matchesSearch = g.title.toLowerCase().includes(query) || 
                          g.description.toLowerCase().includes(query) ||
                          g.steps.some(s => s.title.toLowerCase().includes(query) || s.detail.toLowerCase().includes(query));
    return matchesSearch;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden" id="app-tutorial-section">
      {/* Dynamic Header Banner based on logged in Profile */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 relative">
        <div className="absolute right-4 top-4 opacity-10 pointer-events-none">
          <HelpCircle className="w-40 h-40 text-white" />
        </div>
        
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-300 font-bold text-[10px] uppercase tracking-wider rounded-full font-mono">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Interactive {currentRoleSpec.title} Manual</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">MyShop Desk Training Manual</h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Welcome, <strong className="text-white font-semibold">{userName}</strong>! Below is your tailor-made training course and operational guidelines mapped to your active profile functionalities.
          </p>
        </div>

        {/* Dynamic Profile Badge & Tabs */}
        <div className="mt-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-t border-slate-800 pt-5">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${currentRoleSpec.badgeBg} shrink-0`}>
              <currentRoleSpec.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block font-mono">Active Role Level</span>
              <span className="text-xs font-extrabold text-white block capitalize">{userRole} / Full Local Offline Permissions</span>
            </div>
          </div>
          
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 overflow-x-auto max-w-full">
            {[
              { id: 'recommended', label: `My SOPs (${userRole.toUpperCase()})` },
              { id: 'all', label: 'All SOP Guides' },
              { id: 'checkout', label: 'Checkout & Credits' },
              { id: 'inventory', label: 'Stocks & Auditing' },
              { id: 'backups', label: 'Admin Backups' }
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

      {/* Main Panel Content */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/50">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* PROFILE INHERENT FUNCTIONALITIES CARD (LEFT COLUMN) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* INHERENT FUNCTIONALITIES CARD */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4 text-left">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Shield className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                <h3 className="text-xs font-extrabold text-slate-950 uppercase tracking-wider font-sans">Authorized Functionalities</h3>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                {currentRoleSpec.summary}
              </p>

              <div className="space-y-3">
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-emerald-600 block font-mono">Allowed Workspace Tabs:</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentRoleSpec.tabsAllowed.map((tab, idx) => (
                    <span key={idx} className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100/80">
                      ✓ {tab}
                    </span>
                  ))}
                </div>
              </div>

              {currentRoleSpec.tabsRestricted && currentRoleSpec.tabsRestricted.length > 0 && userRole !== 'admin' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-rose-500 block font-mono">Restricted Tabs (Locked Out):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentRoleSpec.tabsRestricted.map((tab, idx) => (
                      <span key={idx} className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-100/80">
                        🔒 {tab}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3.5 pt-2 border-t border-slate-100">
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 font-mono block">Operational Scope:</span>
                
                <div className="space-y-3">
                  {currentRoleSpec.functionalities.map((func, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-blue-500 text-[10px] font-bold">●</span>
                        <span className="text-xs font-bold text-slate-800 leading-tight">{func.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 pl-3 leading-relaxed">{func.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* INTERACTIVE LEARNING CHECKLIST CARD */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-slate-200 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 text-left">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 justify-between">
                <div className="flex items-center space-x-2">
                  <ClipboardCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider font-sans">Hands-On Practice Checklist</h3>
                </div>
                <span className="bg-slate-800 text-emerald-300 font-mono font-bold text-[9px] px-2 py-0.5 rounded border border-slate-700">
                  {Object.keys(checklist).filter(k => k.startsWith(userRole[0]) && checklist[k]).length} / {currentRoleSpec.trainingTasks.length}
                </span>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Complete these physical exercises on your terminal to qualify for today's active registers. Click checkboxes to save your progress!
              </p>

              <div className="space-y-3 pt-2">
                {currentRoleSpec.trainingTasks.map((task) => {
                  const isChecked = !!checklist[task.id];
                  return (
                    <div 
                      key={task.id}
                      onClick={() => toggleChecklistItem(task.id)}
                      className="flex items-start space-x-2.5 cursor-pointer select-none group"
                    >
                      <button 
                        type="button" 
                        className="shrink-0 mt-0.5 text-slate-500 group-hover:text-slate-300 transition-colors"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                      <span className={`text-[11px] leading-relaxed transition-all ${isChecked ? 'text-slate-500 line-through' : 'text-slate-300 font-medium'}`}>
                        {task.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* SOP WALKTHROUGH DOCUMENTATION LISTING (RIGHT COLUMNS) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search inputs */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Search guides matching ${userName.split(' ')[0]} clearance...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 font-sans shadow-2xs"
                id="tutorial-search-input-desktop"
              />
            </div>

            {/* Guides loop */}
            <div className="space-y-6">
              {filteredGuides.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200/60 p-6 space-y-2">
                  <HelpCircle className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
                  <h4 className="text-sm font-bold text-slate-800">No matching SOP guide found</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Try searching for keywords like "credit", "warehouse", "reconciliation", or check if they belong to a higher profile clearance.
                  </p>
                </div>
              ) : (
                filteredGuides.map(guide => {
                  const GuideIcon = guide.icon;
                  const isAllowed = isRoleAllowed(userRole, guide.minRole);
                  
                  // Style configurations based on clearance level
                  let badgeText = '🟢 Cashier Clearance Allowed';
                  let badgeStyles = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                  if (guide.minRole === 'manager') {
                    badgeText = '🟡 Operations Manager Clearance Required';
                    badgeStyles = 'bg-amber-50 text-amber-700 border border-amber-100';
                  } else if (guide.minRole === 'admin') {
                    badgeText = '🔴 System Administrator Clearance Required';
                    badgeStyles = 'bg-rose-50 text-rose-700 border border-rose-100';
                  }

                  return (
                    <div 
                      key={guide.id} 
                      className={`bg-white rounded-xl border p-5 sm:p-6 shadow-2xs space-y-4 hover:shadow-xs transition-all relative ${
                        isAllowed ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
                      }`}
                      id={`tutorial-guide-${guide.id}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-3 text-left">
                          <div className={`p-2.5 rounded-xl shrink-0 ${guide.iconBg}`}>
                            <GuideIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-widest font-extrabold text-blue-600 block font-mono">
                              {guide.category} SOP recipe
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">{guide.title}</h3>
                          </div>
                        </div>

                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-1 rounded font-mono self-start sm:self-center shrink-0 ${badgeStyles}`}>
                          {badgeText}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed font-medium text-left">
                        {guide.description}
                      </p>

                      {/* Locked Feature Warning */}
                      {!isAllowed && (
                        <div className="bg-rose-500/5 border border-rose-500/20 p-3.5 rounded-lg flex items-start space-x-2.5 text-left">
                          <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="text-[10px] text-rose-900 leading-relaxed">
                            <strong className="block font-bold">⚠️ Security Clearance Restriction</strong>
                            This standard operating procedure is restricted from your profile's live workspace. The corresponding tabs/menus (e.g. Backups, Analytics) have been automatically locked out of your screen to prevent unauthorized database transactions.
                          </div>
                        </div>
                      )}

                      {/* Step Checklist */}
                      <div className="space-y-3.5 text-left">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Action Steps Workflow:</span>
                        
                        <div className="space-y-3">
                          {guide.steps.map((step, idx) => (
                            <div key={idx} className="flex items-start space-x-3">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-mono">
                                {idx + 1}
                              </span>
                              <div className="text-xs leading-relaxed">
                                <span className="font-bold text-slate-800 block">{step.title}</span>
                                <span className="text-slate-500 font-medium block mt-0.5">{step.detail}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

        {/* ROLE SECURITY & PERMISSIONS COMPARISON MATRIX */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4 text-left">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Shield className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">Profile Security & Feature Access Matrix</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Clear operational boundaries across Cashier, Manager, and Administrator accounts.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold uppercase text-[9px] tracking-wider font-mono">
                  <th className="p-2.5 rounded-tl-lg">Feature / System Capability</th>
                  <th className="p-2.5 text-center">Cashier</th>
                  <th className="p-2.5 text-center">Store Manager</th>
                  <th className="p-2.5 text-center rounded-tr-lg">Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">POS Checkout, Barcode Scan & Receipts</td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Credit Ledger & Customer Repayments</td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Stock Room, Price Edits & Restocking</td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Weekly Stock Ground Audits & Discrepancies</td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Store Analytics & Profit Margins</td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Offline JSON Database Backups (HDD/SSD/Drive)</td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">★ Admin Only</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">User Roster Passcodes & PIN Management</td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">★ Admin Only</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Database Resets, Purges & Cloud Sync Config</td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">★ Admin Only</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Role FAQ Card */}
        <div className="bg-slate-900 text-slate-100 rounded-xl p-5 sm:p-6 border border-slate-800 space-y-4 text-left">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <HelpCircle className="w-4.5 h-4.5 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Clearance-Based Frequently Asked Questions</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-300 leading-relaxed font-medium">
            
            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">Q: How do we change default Operator Passcodes?</span>
              <p className="text-slate-400 text-[11px]">
                Passcode values (e.g. <strong>"admin123"</strong>) are secured in local client configurations. To modify operator rosters or passcodes, an <strong>Administrator</strong> must go to settings and rewrite the Profile Security registry.
              </p>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">Q: Why are certain navigation buttons hidden from my bottom bar?</span>
              <p className="text-slate-400 text-[11px]">
                MyShop Desk implements strict active role filters. Retail Cashiers are restricted to Checkout, Credits, and Help. Store Managers unlock Stock Rooms and Analytics. Only Administrators gain full Backups access.
              </p>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">Q: Where do we log manual cash ledger repayments?</span>
              <p className="text-slate-400 text-[11px]">
                Go to the <strong>Store Credit Ledger</strong>. Search for the customer\'s name, click <strong>"Process Repayment"</strong>, input their deposit cash, and the system dynamically voids corresponding debt balances.
              </p>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">Q: Does the offline cache expire or get deleted?</span>
              <p className="text-slate-400 text-[11px]">
                The local IndexedDB cache does not expire automatically. However, clearing your browser\'s temporary storage or hard drives will wipe the database. Ensure your <strong>Administrator</strong> performs weekly JSON backups to avoid loss!
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
