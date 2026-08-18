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
  Square,
  Truck,
  Gift,
  Building2,
  Clock,
  Coins,
  Receipt,
  Key,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  Zap,
  Tag
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
  const [viewRoleMode, setViewRoleMode] = useState<'current' | 'cashier' | 'manager' | 'admin'>('current');

  const actualRole = activeProfile?.role || 'cashier';
  const effectiveRole = viewRoleMode === 'current' ? actualRole : viewRoleMode;
  const userName = activeProfile?.name || 'Store Operator';

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

  // Role-Specific Functional Access Definitions & Inherent Scope
  const roleSpecs = {
    cashier: {
      roleKey: 'cashier',
      title: 'Frontline Cashier Profile',
      badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
      icon: ShoppingBag,
      summary: 'High-speed frontline register operator authorized for rapid POS barcode transactions, customer loyalty points lookups, cash drawer reconciliation (Z-Reports), and customer store credit ledger entries.',
      securityBoundary: '🔒 RESTRICTED ACCESS: Cashiers are strictly blocked from editing product catalog prices, altering inventory counts, creating purchase orders, dispatching branch transfers, viewing profit margins, modifying loyalty scheme ratios, downloading database backups, or accessing system administrator settings.',
      tabsAllowed: [
        'Cash Checkout (POS)',
        'Cashier Shifts & Z-Reports',
        'Store Credit Ledger',
        'Loyalty Points Lookup & Redemption',
        'Interactive Help & Training Desk'
      ],
      tabsRestricted: [
        'Stock Room & Pricing (Locked)',
        'Suppliers & Purchase Orders (Locked)',
        'Multi-Branch Transfers (Locked)',
        'Loyalty Program Admin (Locked)',
        'Business Analytics & Margins (Locked)',
        'Database Backups & Cloud Sync (Locked)'
      ],
      functionalities: [
        { 
          name: 'High-Speed POS Checkout & Dual Selling', 
          desc: 'Scan barcodes or search catalog items. Switch seamlessly between loose single units and unbroken bulk cartons with automatic pricing.' 
        },
        { 
          name: 'POS Keyboard Shortcuts (F1–F9 & Esc)', 
          desc: 'Operate without touching the mouse: F3 to search, F4 for camera scanner, F8 to tender payment, and Esc to clear modals.' 
        },
        { 
          name: 'Cashier Shifts & Drawer Reconciliation', 
          desc: 'Record opening floats, document Float-In / Cash-Out movements, utilize the built-in bill/coin denomination counter, and print end-of-shift Z-Reports.' 
        },
        { 
          name: 'Customer Loyalty Points & Promo Codes', 
          desc: 'Look up registered customers by phone number at checkout, view their reward balance, redeem points for direct invoice discounts, and apply coupon codes.' 
        },
        { 
          name: 'Store Credit & Customer Ledger Repayments', 
          desc: 'Book purchases on credit with repayment dates and customer contact details. Receive partial debt deposits and issue updated balance receipts.' 
        },
        { 
          name: 'Multi-Format Thermal Receipt Printing', 
          desc: 'Print instant 58mm mobile slips, 80mm standard supermarket receipts, or A4 invoices with automatic cash drawer kick-out pulse.' 
        }
      ],
      trainingTasks: [
        { id: 'c_task1', label: 'Start a new Cashier Shift and input your starting drawer cash float (e.g. $150.00).' },
        { id: 'c_task2', label: 'Add products to cart using barcode search (F3) and toggle between "Piece / Loose" and "Carton / Box" mode.' },
        { id: 'c_task3', label: 'Look up a loyalty customer by phone number (e.g. "08012345678") and redeem points for a checkout discount.' },
        { id: 'c_task4', label: 'Tender a cash payment (F8), view change due calculation, and print a 58mm/80mm thermal receipt.' },
        { id: 'c_task5', label: 'Log a cash drawer movement (e.g., "$15 Cash-Out for store cleaning supplies") with authorized notes.' },
        { id: 'c_task6', label: 'Open the Store Credit Ledger, locate a customer balance, and process a partial cash repayment.' },
        { id: 'c_task7', label: 'Close your Cashier Shift using the interactive Denomination Counter to produce a balanced Z-Report.' }
      ]
    },
    manager: {
      roleKey: 'manager',
      title: 'Store Operations Manager Profile',
      badgeBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30',
      icon: UserCheck,
      summary: 'Comprehensive store supervisor authorized for full catalog pricing, dual retail/wholesale inventory replenishment, supplier directory & purchase orders, inter-branch stock transfers, weekly ground audits, loyalty promotional campaigns, and store health analytics.',
      securityBoundary: '🔒 RESTRICTED ACCESS: Managers cannot modify user account credentials/passcodes, execute complete database purges/resets, configure live cloud credentials, or tamper with system architecture.',
      tabsAllowed: [
        'Cash Checkout (POS)',
        'Cashier Shifts & Shift Auditing',
        'Store Credit Ledger & Debt Statements',
        'Stock Room (Catalog, Pricing, Restocking, Audits)',
        'Suppliers & Purchase Orders (PO)',
        'Multi-Branch Stock Transfers',
        'Customer Loyalty & Promotional Discounts',
        'Business Analytics & Profit Margins',
        'Interactive Help & Training Desk'
      ],
      tabsRestricted: [
        'Database Backups & JSON Snapshots (Admin Only)',
        'Operator Passcode & Security Roster (Admin Only)',
        'System Resets & Factory Purge (Admin Only)'
      ],
      functionalities: [
        { 
          name: 'Dual Inventory & Shelf Restocking', 
          desc: 'Manage both bulk storehouse cartons (Wholesale) and frontline shelf units (Retail). Restock retail shelves with 1-click carton conversion.' 
        },
        { 
          name: 'Catalog Pricing & Profit Markup', 
          desc: 'Set wholesale supplier costs, retail selling prices, carton pack multipliers, and minimum stock threshold alert levels.' 
        },
        { 
          name: 'Supplier Directory & Purchase Orders (PO)', 
          desc: 'Create formal Purchase Orders with auto-calculated carton quantities. Receive incoming deliveries directly into wholesale inventory in 1 click.' 
        },
        { 
          name: 'Multi-Branch Inventory Transfers', 
          desc: 'Request, dispatch, and receive stock transfers between multiple warehouse depots and branch retail outlets with automatic log adjustments.' 
        },
        { 
          name: 'Weekly Ground Audits & Loss Write-Offs', 
          desc: 'Conduct physical inventory audits, key in actual shelf counts to flag surplus/deficit discrepancies, and record damaged/expired goods.' 
        },
        { 
          name: 'Promotional Campaigns & Tier Rewards', 
          desc: 'Configure discount coupons (Percentage or Fixed), minimum basket spend rules, validity dates, and manually adjust customer reward points.' 
        },
        { 
          name: 'Store Analytics & Profit Margin Auditing', 
          desc: 'Inspect gross revenue, net profit margins, hourly transaction heatmaps, top-selling items, cashier shift summaries, and order void audits.' 
        }
      ],
      trainingTasks: [
        { id: 'm_task1', label: 'Create or edit a product with wholesale cost, retail price, and carton quantity (e.g. 24 units/carton).' },
        { id: 'm_task2', label: 'Execute a "Wholesale to Retail" shelf replenishment transfer to move 5 cartons onto retail display.' },
        { id: 'm_task3', label: 'Generate a new Purchase Order for a supplier, specify item cartons, and mark as received.' },
        { id: 'm_task4', label: 'Create an Inter-Branch Stock Transfer from Main Store to Satellite Branch and complete the transfer.' },
        { id: 'm_task5', label: 'Initiate a Weekly Ground Audit, key in actual physical counts, and review auto-calculated discrepancy flags.' },
        { id: 'm_task6', label: 'Create a new 10% Promotional Coupon with a minimum spend threshold and expiration date.' },
        { id: 'm_task7', label: 'Review the Business Analytics panel to audit gross profit margins and daily sales trend curves.' }
      ]
    },
    admin: {
      roleKey: 'admin',
      title: 'System Administrator Profile',
      badgeBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
      icon: ShieldCheck,
      summary: 'Master administrative authority holding unrestricted access across all POS registers, inventory storehouses, supplier purchase orders, branch networks, financial ledgers, audit security logs, user passcodes, and non-volatile database backups.',
      securityBoundary: '🔓 UNRESTRICTED ACCESS: Full master administrative clearance across all screens, database engines, security configurations, and peripheral hardware.',
      tabsAllowed: [
        'All 11 Workspace Modules Unlocked (Checkout, Shifts, Credit, Stock Room, Suppliers & POs, Branch Transfers, Loyalty & Promos, Analytics, Backups, Settings, Training Manual)'
      ],
      tabsRestricted: [
        'None — Master System Administrator Clearance'
      ],
      functionalities: [
        { 
          name: 'Operator Roster & Passcode Security', 
          desc: 'Create, update, and manage user accounts for Cashiers and Managers. Update master PIN codes and enforce strict role boundaries.' 
        },
        { 
          name: '100% Offline JSON Database Backups', 
          desc: 'Export complete single-file database snapshots (.json) to local hard drives, USB flash drives, or cloud synced folders (Google Drive/OneDrive).' 
        },
        { 
          name: 'System State Restores & Seed Templates', 
          desc: 'Restore previous database states from backup files in 2 clicks, or load the pre-configured 12-item demo catalog for onboarding drills.' 
        },
        { 
          name: 'Global Store & Fiscal Configuration', 
          desc: 'Set system currency symbols, sales VAT / Tax rates, custom receipt header banners, footer messages, and logo branding.' 
        },
        { 
          name: 'Immutable Audit Trail Surveillance', 
          desc: 'Monitor timestamped stock modification logs, cashier shift variances, and voided/restored transaction logs with operator signatures.' 
        },
        { 
          name: 'Database Resets & System Maintenance', 
          desc: 'Perform authorized database purges, wipe transaction logs for a new accounting period, and run legacy OS compatibility diagnostics.' 
        }
      ],
      trainingTasks: [
        { id: 'a_task1', label: 'Export a complete offline JSON Database Snapshot to your local PC storage drive.' },
        { id: 'a_task2', label: 'Configure browser "Ask where to save each file before downloading" for external drive backup routing.' },
        { id: 'a_task3', label: 'Review the Operator Profile roster in Settings and verify unique security passcodes.' },
        { id: 'a_task4', label: 'Audit the immutable Stock Logs timeline to inspect timestamped operator adjustments.' },
        { id: 'a_task5', label: 'Update the global Store Profile (Tax Rate, Store Address, Receipt Header/Footer messages).' },
        { id: 'a_task6', label: 'Run the Windows 7 / Legacy PC Diagnostics tool to verify storage and audio synthesis health.' }
      ]
    }
  };

  const currentRoleSpec = roleSpecs[effectiveRole];

  // Master Standard Operating Procedures (SOPs) with Role Permissions
  const guides = [
    {
      id: 'checkout-flow',
      category: 'checkout',
      minRole: 'cashier',
      title: 'Operating POS Checkout & Dual Unit/Carton Selling',
      icon: ShoppingBag,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900',
      description: 'Standard operating procedure for ringing up customer items, scanning barcodes, switching between loose units and bulk cartons, and processing payments.',
      steps: [
        {
          title: 'Load Items via Barcode or Catalog Click',
          detail: 'Click items from the category grid or scan product barcodes using a USB laser scanner or camera scanner (F4). Scanned items append to the cart instantly.'
        },
        {
          title: 'Switch Single Piece vs. Bulk Carton Mode',
          detail: 'In the cart item row, toggle between "Piece" and "Carton". When carton mode is selected, the unit multiplier (e.g., 24 pcs/carton) and bulk wholesale pricing apply automatically.'
        },
        {
          title: 'Enter Cash Tendered & Review Change',
          detail: 'Type the physical cash amount given by the customer in "Cash Tendered". The system instantly calculates and highlights the exact change due in green.'
        },
        {
          title: 'Select Payment Method & Finalize',
          detail: 'Choose Cash, Card, Mobile Money, or Store Credit. Click "Tender & Finalize" (or press F8) to complete the sale, open the cash drawer, and spool receipt print.'
        }
      ],
      proTip: 'For maximum cashier speed, press F3 to focus the search bar. Any barcode scanned into the search bar auto-adds to the cart in under 65ms without touching the mouse!'
    },
    {
      id: 'shift-reconciliation',
      category: 'checkout',
      minRole: 'cashier',
      title: 'Cashier Shift Management, Cash Movements & Z-Reports',
      icon: Clock,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900',
      description: 'How to open a register shift with starting float cash, log mid-shift cash drawer adjustments, and reconcile end-of-day cash with automated Z-Reports.',
      steps: [
        {
          title: 'Open Shift with Starting Float',
          detail: 'At the start of your shift, open the "Cashier Shifts" tab, enter your opening cash float in drawer (e.g., $200.00), add opening notes, and click "Open Register Shift".'
        },
        {
          title: 'Record Mid-Shift Cash In & Payouts',
          detail: 'If adding emergency change coins or making authorized petty-cash withdrawals (e.g. delivery payment), click "Add Movement", select Cash-In or Cash-Out, input amount and reason.'
        },
        {
          title: 'Count Cash Using the Denomination Counter',
          detail: 'At shift close, click "Close Active Shift" and use the denomination counter to key in bill and coin counts ($100, $50, $20, $10, $5, $1). Total actual cash computes automatically.'
        },
        {
          title: 'Review Variance & Print Z-Report',
          detail: 'The system computes Expected Cash vs. Actual Cash and calculates any variance (balanced, shortage, or overage). Click "Close Shift & Generate Z-Report" for a printable shift certificate.'
        }
      ],
      proTip: 'Always document every drawer withdrawal immediately in "Cash Movements". This ensures the expected drawer cash matches your final Z-Report count with zero unexplained variance.'
    },
    {
      id: 'credit-ledger',
      category: 'checkout',
      minRole: 'cashier',
      title: 'Recording Purchases on Credit & Partial Debt Repayments',
      icon: BookOpen,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900',
      description: 'Procedures for authorizing customer credit purchases, setting due dates, tracking repayment ledgers, and recording partial payments.',
      steps: [
        {
          title: 'Select Store Credit at Checkout',
          detail: 'Assemble the cart items. In the payment methods panel, select "Store Credit / Ledger".'
        },
        {
          title: 'Enter Customer Name, Phone & Due Date',
          detail: 'Type the customer\'s full name and mobile phone number (or select from existing debtor profiles), set the agreed repayment due date (default: 14 days), and finalize.'
        },
        {
          title: 'Locate Debtor in Store Credit Ledger',
          detail: 'Navigate to the "Store Credit Ledger" tab to view all outstanding customer debt balances, days overdue, and transaction timestamps.'
        },
        {
          title: 'Process Partial or Full Repayment',
          detail: 'Click "Process Repayment" on the customer\'s row, input the cash received, choose payment channel, and issue an updated debt statement receipt.'
        }
      ],
      proTip: 'The credit ledger is keyed to customer phone numbers. Entering an existing debtor\'s phone number automatically groups subsequent credit purchases onto their unified account balance.'
    },
    {
      id: 'loyalty-redemption',
      category: 'loyalty',
      minRole: 'cashier',
      title: 'Looking Up Loyalty Points & Redeeming Discounts at Checkout',
      icon: Gift,
      iconBg: 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900',
      description: 'How to look up registered customer reward profiles during checkout and apply direct discounts using accumulated loyalty points.',
      steps: [
        {
          title: 'Search Customer by Phone or Name',
          detail: 'In the Checkout Terminal sidebar, click "Customer Loyalty & Rewards" and type the customer\'s phone number or name.'
        },
        {
          title: 'View Available Points Balance & Tier',
          detail: 'The customer\'s current tier (Standard, Silver, Gold, Platinum) and available points balance will display with their maximum redeemable discount value.'
        },
        {
          title: 'Redeem Points for Direct Bill Discount',
          detail: 'Enter the points quantity the customer wants to redeem (or click "Redeem Max"). The corresponding currency discount immediately deducts from the cart total.'
        },
        {
          title: 'Automatic Point Accrual on Sale',
          detail: 'When the transaction is finalized, new loyalty points for the net purchase amount are automatically credited to the customer\'s profile in real time.'
        }
      ],
      proTip: 'Remind customers of their membership tier benefits. Gold and Platinum members earn accelerated point rates configured by store management.'
    },
    {
      id: 'inventory-restock',
      category: 'inventory',
      minRole: 'manager',
      title: 'Dual Inventory Management, Pricing & Shelf Restocking',
      icon: Package,
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900',
      description: 'Procedures for managing bulk wholesale storehouses, retail shelf stock, product cost markups, carton packaging units, and shelf replenishment.',
      steps: [
        {
          title: 'Configure Wholesale & Retail Stock Levels',
          detail: 'In the "Stock Room" catalog, open any product to set its Bulk Wholesale Carton count, Frontline Retail Shelf count, and Units-Per-Carton packaging ratio.'
        },
        {
          title: 'Define Supplier Cost vs. Retail Selling Price',
          detail: 'Set the wholesale purchase cost and the single unit / carton retail price. The system automatically computes and displays gross profit margins.'
        },
        {
          title: '1-Click Restock from Wholesale to Shelf',
          detail: 'Click "Restock Shelf" on any product, specify the number of bulk cartons to unbox, and click confirm. Bulk cartons deduct and loose retail shelf units increase automatically.'
        },
        {
          title: 'Set Low Stock Thresholds',
          detail: 'Configure the "Min Stock Alert" level. When retail shelf units fall below this threshold, the item is highlighted in amber with instant alert tags.'
        }
      ],
      proTip: 'Use the "Move Stock (Wholesale to Retail)" quick slider to restock fast-selling items during morning pre-opening inspections without touching master product records.'
    },
    {
      id: 'physical-audits',
      category: 'inventory',
      minRole: 'manager',
      title: 'Weekly Physical Stock Ground Audits & Loss Write-Offs',
      icon: ClipboardCheck,
      iconBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900',
      description: 'How to conduct physical storehouse and shelf stock counts, reconcile digital inventory, flag shrinkage, and document damaged goods.',
      steps: [
        {
          title: 'Open Weekly Ground Audit Sheet',
          detail: 'In the "Stock Room" tab, switch the view header to "Weekly Ground Audit" to load the full store count sheet.'
        },
        {
          title: 'Enter Ground Physical Counts',
          detail: 'Walk the aisles and key in the real physical unit counts for Wholesale and Retail storage locations in the "Actual Count" input column.'
        },
        {
          title: 'Review Discrepancy Indicators',
          detail: 'The audit sheet highlights variances in yellow, displaying exact Surplus (📈) or Deficit (📉) tags and calculated financial impact.'
        },
        {
          title: 'Reconcile & Log Write-Off Justifications',
          detail: 'Add explanatory audit notes (e.g. "Water damage in carton rack B", "Expired batch write-off") and click "Reconcile Stock" to synchronize the database.'
        }
      ],
      proTip: 'Schedule ground audits every Friday before closing. Regular auditing keeps shrinkage under 0.2% and ensures accurate accounting margins.'
    },
    {
      id: 'suppliers-po',
      category: 'suppliers',
      minRole: 'manager',
      title: 'Managing Suppliers & 1-Click Purchase Order (PO) Receiving',
      icon: Truck,
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900',
      description: 'How to manage vendor address books, generate itemized Purchase Orders, and receive delivered supplier shipments directly into wholesale stock.',
      steps: [
        {
          title: 'Register Supplier Vendor Profiles',
          detail: 'In "Suppliers & Orders", click "Add Supplier" and register contact person, phone, email, tax ID, payment terms, and physical warehouse address.'
        },
        {
          title: 'Draft an Itemized Purchase Order (PO)',
          detail: 'Click "New Purchase Order", select the supplier, add catalog products with carton quantities, verify unit costs, set expected delivery date, and save.'
        },
        {
          title: 'Print / Export Purchase Order',
          detail: 'Generate a printable formal Purchase Order document to email or deliver to the vendor with itemized carton lines and financial totals.'
        },
        {
          title: '1-Click PO Receiving into Inventory',
          detail: 'When the shipment arrives, inspect the goods and click "Receive Order". All ordered bulk cartons are automatically credited to Wholesale inventory with complete audit logs.'
        }
      ],
      proTip: 'Receiving a Purchase Order updates your stock quantities automatically without manual double-entry, eliminating inventory miscounts.'
    },
    {
      id: 'branch-transfers',
      category: 'suppliers',
      minRole: 'manager',
      title: 'Multi-Branch Inventory Transfers & Stock Balancing',
      icon: Building2,
      iconBg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900',
      description: 'Procedures for managing multiple retail outlets/depots and executing inter-branch stock transfer requests.',
      steps: [
        {
          title: 'Manage Branch Locations Directory',
          detail: 'In "Branch Transfers", configure store locations (HQ Main Store, Central Bulk Depot, Satellite Branch Outlets) with addresses and phone contacts.'
        },
        {
          title: 'Create Stock Transfer Request',
          detail: 'Click "New Stock Transfer", choose Source Branch and Destination Branch, pick products and transfer quantities, add shipment notes, and dispatch.'
        },
        {
          title: 'Track Transfer Shipment Status',
          detail: 'Monitor transfer status in the transfer ledger (Pending / Completed) with dispatch timestamps and transport tracking notes.'
        },
        {
          title: 'Receive & Reconcile at Destination',
          detail: 'When the satellite branch receives physical delivery, click "Mark Completed" to finalize the transfer and update destination stock records.'
        }
      ],
      proTip: 'Use branch transfers to rebalance inventory when high-demand goods sell out at satellite branches while excess stock sits in the central warehouse depot.'
    },
    {
      id: 'loyalty-promotions',
      category: 'loyalty',
      minRole: 'manager',
      title: 'Configuring Loyalty Tiers & Promotional Discount Campaigns',
      icon: Tag,
      iconBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-100 dark:border-fuchsia-900',
      description: 'How to manage customer reward tiers, create coupon codes with spend thresholds, and adjust customer loyalty balances.',
      steps: [
        {
          title: 'Create Promotional Discount Coupons',
          detail: 'In "Loyalty & Promos", click "Add Promotion", specify coupon code (e.g. "SUMMER10"), discount type (Percentage % or Fixed Amount), minimum basket spend, and expiration date.'
        },
        {
          title: 'Toggle Campaign Activation Status',
          detail: 'Enable or disable promo campaigns instantly using the active toggle switch to start or pause seasonal promotions.'
        },
        {
          title: 'Configure Loyalty Program Parameters',
          detail: 'Set points earned per currency unit spent (e.g. 1 pt per $10) and currency redemption value per point (e.g. $0.05 per pt), plus tier thresholds (Silver, Gold, Platinum).'
        },
        {
          title: 'Manual Customer Point Adjustments',
          detail: 'Search customer accounts in the loyalty directory to view historical points earned/redeemed, and click "Adjust Points" to credit bonus points with audit notes.'
        }
      ],
      proTip: 'Set realistic minimum spend thresholds on percentage coupons (e.g. 15% off on orders above $50) to boost average customer basket size!'
    },
    {
      id: 'analytics-margins',
      category: 'analytics',
      minRole: 'manager',
      title: 'Analyzing Business Margins, Peak Hours & Order Auditing',
      icon: TrendingUp,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900',
      description: 'How to read gross sales revenue, net profit calculations, hourly sales heatmaps, and audit voided transactions.',
      steps: [
        {
          title: 'Review Gross Revenue & Net Profit',
          detail: 'Open the "Business Analytics" tab to inspect total revenue, profit margins (computed as Retail Price minus Supplier Cost across sold items), and total transactions.'
        },
        {
          title: 'Identify Peak Sales Hours',
          detail: 'Examine the 24-hour hourly sales distribution chart to determine rush hours and schedule cashier shifts accordingly.'
        },
        {
          title: 'Inspect Detailed Order History',
          detail: 'Scroll through the comprehensive sales log to review itemized receipts, customer tenders, discounts applied, and cashier signatures.'
        },
        {
          title: 'Audit Voided Sales & Restores',
          detail: 'Inspect the Voided Sales log to review any cancelled transactions, reason notes, and restore mistakenly voided orders if needed.'
        }
      ],
      proTip: 'Filter analytics by custom date ranges (Today, 7 Days, 30 Days, Year-to-Date) to compare weekly revenue growth against previous cycles.'
    },
    {
      id: 'backups-restore',
      category: 'backups',
      minRole: 'admin',
      title: 'Database Security: JSON Snapshots, HDD/SSD & Drive Backups',
      icon: Database,
      iconBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900',
      description: 'Master procedures for System Administrators to export full offline database snapshots, restore system state, and safeguard against hardware failures.',
      steps: [
        {
          title: 'Download Offline Database Snapshot (.json)',
          detail: 'Navigate to "Database Backups" and click "Download Local Backup (JSON)". This bundles all catalogs, stock logs, shifts, suppliers, POs, loyalty profiles, transfers, and settings into one secure snapshot.'
        },
        {
          title: 'Route Backups to External Storage & Drives',
          detail: 'Save backup files directly onto external USB drives, backup SSDs, or Google Drive / OneDrive synced folders (e.g. "D:\\Store_Backups\\2026-08-18_backup.json").'
        },
        {
          title: 'Restore Database State from JSON File',
          detail: 'To restore data on a new PC or recover after a hardware reset, drop the backup JSON file into the restore zone and click "Restore System State".'
        },
        {
          title: 'Load Demo Store Seed Catalog',
          detail: 'For staff training drills, click "Reload Demo Store Catalog" to seed 12 realistic barcoded products with dual wholesale/retail inventory.'
        }
      ],
      proTip: 'Perform a 1-click JSON backup export every evening before register shutdown. Storing daily snapshots on a USB drive guarantees 100% data recovery under any circumstance.'
    },
    {
      id: 'admin-security-settings',
      category: 'backups',
      minRole: 'admin',
      title: 'Operator Security Roster, PIN Management & Store Configuration',
      icon: Key,
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900',
      description: 'Procedures for managing user profiles, updating master security PINs, and configuring store-wide fiscal parameters.',
      steps: [
        {
          title: 'Manage Operator Roster & Passcodes',
          detail: 'In Settings, update usernames and security passcodes for Cashier, Manager, and Administrator accounts. Ensure staff use distinct PINs.'
        },
        {
          title: 'Configure Global Store Profile & Currency',
          detail: 'Set the store business name, tax identification number, contact telephone, physical address, and global currency symbol ($, €, £, ₦, ¥, etc.).'
        },
        {
          title: 'Set Tax / VAT Percentage & Receipt Branding',
          detail: 'Configure default sales VAT / Tax rate, customize thermal receipt header slogans, footer thank-you notes, and upload store logo graphics.'
        },
        {
          title: 'Run Legacy OS Compatibility Diagnostics',
          detail: 'Click "Windows 7 / Legacy Diagnostics" in the header to run automated diagnostics on storage quotas, memory health, audio beepers, and camera support.'
        }
      ],
      proTip: 'Change the default administrator password from "admin123" upon initial deployment to secure master system settings against unauthorized tampering.'
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
      if (!isRoleAllowed(effectiveRole, g.minRole)) return false;
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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden" id="app-tutorial-section">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 relative">
        <div className="absolute right-4 top-4 opacity-10 pointer-events-none">
          <HelpCircle className="w-40 h-40 text-white" />
        </div>
        
        <div className="max-w-3xl space-y-2 text-left">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-300 font-bold text-[10px] uppercase tracking-wider rounded-full font-mono">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Interactive Operational & Functionality Manual</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">MyShop POS Enterprise Training Manual</h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Welcome, <strong className="text-white font-semibold">{userName}</strong>! Below is the comprehensive operational curriculum, standard operating procedures (SOPs), and role-specific functionality access boundaries across all 11 store modules.
          </p>
        </div>

        {/* Role Selector & Navigation Filters */}
        <div className="mt-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between border-t border-slate-800 pt-5">
          
          {/* Active Profile Info & Role View Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-3 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
              <div className={`p-2 rounded-lg ${currentRoleSpec.badgeBg} shrink-0`}>
                <currentRoleSpec.icon className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-mono">Viewing Clearance Manual:</span>
                <span className="text-xs font-extrabold text-white block capitalize">{currentRoleSpec.title}</span>
              </div>
            </div>

            {/* Quick Role Preview Switcher */}
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-[10px] font-bold">
              <span className="text-slate-400 px-2 text-[9px] font-mono uppercase">Preview Role:</span>
              <button
                onClick={() => setViewRoleMode('current')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                  viewRoleMode === 'current' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                type="button"
              >
                My Account ({actualRole})
              </button>
              <button
                onClick={() => setViewRoleMode('cashier')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                  viewRoleMode === 'cashier' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                type="button"
              >
                Cashier
              </button>
              <button
                onClick={() => setViewRoleMode('manager')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                  viewRoleMode === 'manager' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                type="button"
              >
                Manager
              </button>
              <button
                onClick={() => setViewRoleMode('admin')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                  viewRoleMode === 'admin' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                type="button"
              >
                Admin
              </button>
            </div>
          </div>
          
          {/* Category Tabs */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 overflow-x-auto max-w-full">
            {[
              { id: 'recommended', label: `My SOPs (${effectiveRole.toUpperCase()})` },
              { id: 'all', label: 'All 12 SOPs' },
              { id: 'checkout', label: 'Checkout & Shifts' },
              { id: 'inventory', label: 'Stock & Auditing' },
              { id: 'suppliers', label: 'Suppliers & Transfers' },
              { id: 'loyalty', label: 'Loyalty & Promos' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'backups', label: 'Admin & Backups' }
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
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* PROFILE INHERENT FUNCTIONALITIES CARD (LEFT COLUMN) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* AUTHORIZED ACCESS SPECIFICATION CARD */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-5 shadow-xs space-y-4 text-left">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                <Shield className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                <h3 className="text-xs font-extrabold text-slate-950 dark:text-slate-100 uppercase tracking-wider font-sans">
                  {currentRoleSpec.title} Specific Scope
                </h3>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {currentRoleSpec.summary}
              </p>

              {/* Security Boundary Alert Box */}
              <div className={`p-3 rounded-lg text-[10px] leading-relaxed font-medium ${
                effectiveRole === 'admin' 
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900' 
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
              }`}>
                {currentRoleSpec.securityBoundary}
              </div>

              {/* Authorized Workspace Tabs */}
              <div className="space-y-2 pt-2">
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-emerald-600 dark:text-emerald-400 block font-mono">
                  Authorized Workspace Modules:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentRoleSpec.tabsAllowed.map((tab, idx) => (
                    <span key={idx} className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800">
                      ✓ {tab}
                    </span>
                  ))}
                </div>
              </div>

              {/* Restricted Tabs */}
              {currentRoleSpec.tabsRestricted && currentRoleSpec.tabsRestricted.length > 0 && effectiveRole !== 'admin' && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-rose-600 dark:text-rose-400 block font-mono">
                    Restricted Modules (Locked Out):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentRoleSpec.tabsRestricted.map((tab, idx) => (
                      <span key={idx} className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200/60 dark:border-rose-800">
                        🔒 {tab}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Inherent Operational Scope List */}
              <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 font-mono block">
                  Core Functional Capabilities:
                </span>
                
                <div className="space-y-3">
                  {currentRoleSpec.functionalities.map((func, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-blue-500 text-[10px] font-bold">●</span>
                        <span className="text-xs font-bold text-slate-850 dark:text-slate-200 leading-tight">{func.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-3 leading-relaxed">{func.desc}</p>
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
                  {Object.keys(checklist).filter(k => k.startsWith(effectiveRole[0]) && checklist[k]).length} / {currentRoleSpec.trainingTasks.length}
                </span>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Complete these practical drills directly on your terminal to certify your qualification for this role level. Click checkboxes to track your progress!
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
                placeholder={`Search ${guides.length} standard operating procedures (e.g. "shift", "transfer", "coupon", "purchase order", "backup")...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 font-sans shadow-2xs"
                id="tutorial-search-input-desktop"
              />
            </div>

            {/* Guides loop */}
            <div className="space-y-6">
              {filteredGuides.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 p-6 space-y-2">
                  <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto animate-pulse" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No matching SOP guide found</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Try searching for keywords like "shift", "transfer", "loyalty", "purchase order", "credit", or switch category filter tabs above.
                  </p>
                </div>
              ) : (
                filteredGuides.map(guide => {
                  const GuideIcon = guide.icon;
                  const isAllowed = isRoleAllowed(effectiveRole, guide.minRole);
                  
                  // Style configurations based on clearance level
                  let badgeText = '🟢 Cashier Clearance Allowed';
                  let badgeStyles = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
                  if (guide.minRole === 'manager') {
                    badgeText = '🟡 Store Manager Clearance Required';
                    badgeStyles = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
                  } else if (guide.minRole === 'admin') {
                    badgeText = '🔴 Master Administrator Clearance Required';
                    badgeStyles = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
                  }

                  return (
                    <div 
                      key={guide.id} 
                      className={`bg-white dark:bg-slate-800 rounded-xl border p-5 sm:p-6 shadow-2xs space-y-4 hover:shadow-xs transition-all relative ${
                        isAllowed 
                          ? 'border-slate-200 dark:border-slate-700' 
                          : 'border-slate-200 dark:border-slate-700/60 opacity-60 bg-slate-50/50 dark:bg-slate-800/50'
                      }`}
                      id={`tutorial-guide-${guide.id}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                        <div className="flex items-center space-x-3 text-left">
                          <div className={`p-2.5 rounded-xl shrink-0 ${guide.iconBg}`}>
                            <GuideIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-widest font-extrabold text-blue-600 dark:text-blue-400 block font-mono">
                              {guide.category} SOP recipe
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">{guide.title}</h3>
                          </div>
                        </div>

                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-1 rounded font-mono self-start sm:self-center shrink-0 ${badgeStyles}`}>
                          {badgeText}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium text-left">
                        {guide.description}
                      </p>

                      {/* Locked Feature Warning */}
                      {!isAllowed && (
                        <div className="bg-rose-500/5 border border-rose-500/20 p-3.5 rounded-lg flex items-start space-x-2.5 text-left">
                          <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                          <div className="text-[10px] text-rose-900 dark:text-rose-200 leading-relaxed">
                            <strong className="block font-bold">⚠️ Role Clearance Restriction</strong>
                            This module is restricted from your profile's live workspace. The corresponding tab has been locked out of your screen to safeguard store database integrity.
                          </div>
                        </div>
                      )}

                      {/* Step Checklist */}
                      <div className="space-y-3.5 text-left">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono block">Step-by-Step Action Workflow:</span>
                        
                        <div className="space-y-3">
                          {guide.steps.map((step, idx) => (
                            <div key={idx} className="flex items-start space-x-3">
                              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-mono">
                                {idx + 1}
                              </span>
                              <div className="text-xs leading-relaxed">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block">{step.title}</span>
                                <span className="text-slate-500 dark:text-slate-400 font-medium block mt-0.5">{step.detail}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pro Tip Box */}
                      {guide.proTip && (
                        <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 p-3 rounded-lg flex items-start space-x-2 text-left">
                          <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-blue-900 dark:text-blue-200 font-medium leading-relaxed">
                            <strong className="font-bold text-blue-950 dark:text-blue-100">Operational Tip: </strong>
                            {guide.proTip}
                          </p>
                        </div>
                      )}
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
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">Complete Role Security & Functionality Access Matrix</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Exhaustive permission and functional boundaries across Cashier, Store Operations Manager, and System Administrator accounts.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold uppercase text-[9px] tracking-wider font-mono">
                  <th className="p-2.5 rounded-tl-lg">Store Feature / System Capability</th>
                  <th className="p-2.5 text-center">Cashier</th>
                  <th className="p-2.5 text-center">Store Manager</th>
                  <th className="p-2.5 text-center rounded-tr-lg">System Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">POS Checkout, Barcode Laser/Camera & Receipts</td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Cashier Shift Reconciliation, Float-In/Out & Z-Reports</td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Own Shift</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ All Shifts Audit</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Master Audit</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Store Credit Ledger & Debt Repayment Processing</td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Customer Loyalty Lookup & Checkout Point Redemption</td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Redeem Only</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Manage & Adjust</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Master Config</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Stock Room, Dual Retail/Wholesale & Price Edits</td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Weekly Physical Stock Audits & Discrepancies</td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Suppliers Directory & Purchase Orders (PO) Intake</td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Multi-Branch Inventory Transfers & Dispatching</td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Promotional Discount Coupons & Campaign Rules</td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Business Analytics, Profit Margins & Sales Timeline</td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                  <td className="p-2.5 text-center"><span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">✓ Full Access</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Offline JSON Database Backups (HDD/SSD/Drive)</td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">★ Admin Only</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Operator Roster, User Passcodes & Master PINs</td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">🔒 Locked</span></td>
                  <td className="p-2.5 text-center"><span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">★ Admin Only</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                  <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">Database Resets, Data Purges & Fiscal Settings</td>
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Operational & Security Clearance FAQs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-300 leading-relaxed font-medium">
            
            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">Q: Why are specific navigation tabs hidden when I log in?</span>
              <p className="text-slate-400 text-[11px]">
                MyShop POS implements deterministic role-based security. Cashiers see Checkout, Shifts, Credits, and Help. Managers unlock Stock Room, Suppliers & POs, Branch Transfers, Loyalty, and Analytics. Only Administrators gain access to Backups and Master Security Settings.
              </p>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">Q: How do we start and close cash register shifts with Z-Reports?</span>
              <p className="text-slate-400 text-[11px]">
                Open the <strong>Cashier Shifts</strong> tab. Enter your opening float cash at shift start. At shift close, use the interactive bill/coin denomination counter to count cash; the system computes expected vs. actual variance and prints a verified Z-Report.
              </p>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">Q: How do incoming Supplier Purchase Orders update stock?</span>
              <p className="text-slate-400 text-[11px]">
                Store Managers create itemized Purchase Orders in the <strong>Suppliers & Orders</strong> tab. When physical delivery arrives, clicking <strong>"Receive Order"</strong> automatically transfers all carton units into Wholesale storage and generates an audit log.
              </p>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-white block">Q: Where are JSON database backup files stored?</span>
              <p className="text-slate-400 text-[11px]">
                When an Administrator clicks <strong>"Download Local Backup (JSON)"</strong>, the browser saves a standalone database snapshot. You can store this directly on an external USB SSD or a Google Drive synced folder for long-term disaster recovery.
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
