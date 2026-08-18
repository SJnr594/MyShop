# MyShop — Enterprise POS & Store Management Platform

A resilient, offline-first Point of Sale (POS) and Enterprise Store Management system built with React, TypeScript, and Tailwind CSS. Designed to operate smoothly for years with zero external service lock-ins, robust local persistence, thermal receipt printing, and complete retail & wholesale operations.

---

## 📑 Table of Contents
1. [Overview & Architecture](#overview--architecture)
2. [Key Capabilities & Modules](#key-capabilities--modules)
3. [System Requirements](#system-requirements)
4. [Installation & Setup Guide](#installation--setup-guide)
   - [A. Running Locally (Development Mode)](#a-running-locally-development-mode)
   - [B. Production Build & Local Server](#b-production-build--local-server)
   - [C. Desktop App Deployment (Windows 7 / 10 / 11, macOS, Linux)](#c-desktop-app-deployment-windows-7--10--11-macos-linux)
   - [D. Progressive Web App (PWA / Offline Chrome)](#d-progressive-web-app-pwa--offline-chrome)
5. [Hardware & Peripheral Configuration](#hardware--peripheral-configuration)
   - [USB & Bluetooth Barcode Scanners](#usb--bluetooth-barcode-scanners)
   - [Thermal Receipt Printers (58mm & 80mm ESC/POS)](#thermal-receipt-printers-58mm--80mm-escpos)
   - [Cash Drawers & Customer Displays](#cash-drawers--customer-displays)
6. [Keyboard Shortcuts Reference](#keyboard-shortcuts-reference)
7. [Enterprise Data Durability & 10-Year Long-Term Guarantee](#enterprise-data-durability--10-year-long-term-guarantee)
8. [Troubleshooting & Diagnostics](#troubleshooting--diagnostics)

---

## 🏪 Overview & Architecture

MyShop is architected as an **offline-first single-page application (SPA)** with strict deterministic data models. All store states (products, sales, cashier shifts, suppliers, purchase orders, customer loyalty accounts, branches, transfers, and credit ledgers) are kept synchronized in local state with continuous persistence.

```
┌─────────────────────────────────────────────────────────────────┐
│                           MyShop POS                            │
├─────────────────┬───────────────────────────────┬───────────────┤
│  Point of Sale  │    Inventory & Warehousing    │ Fiscal/Audits │
│  • Barcode Scan │    • Retail Shelf Stock       │ • Shift Z-Rpt │
│  • Cartons/Units│    • Bulk Wholesale Room      │ • Float In/Out│
│  • Promo Codes  │    • Purchase Orders (PO)     │ • Credit Book │
│  • Loyalty Pts  │    • Multi-Branch Transfers   │ • Sales Void  │
│  • Fast Tendering│   • Damage/Loss Write-offs   │ • Analytics   │
└─────────────────┴───────────────────────────────┴───────────────┘
```

---

## 🌟 Key Capabilities & Modules

### 1. ⚡ High-Speed Checkout Terminal
- **Dual Unit & Carton Selling**: Sell loose units or unbroken cartons with automatic per-carton price calculations and bulk discount rules.
- **Dynamic Payment Options**: Cash, Card, Mobile Money, and Customer Store Credit.
- **Promotions & Loyalty Integration**: Apply percentage/fixed coupons and redeem customer loyalty points as instant checkout discounts.
- **Direct Thermal Printing**: Automatic formatted receipt rendering for 58mm, 80mm, and A4 invoice printers with cash register drawer trigger cues.

### 2. 🕒 Cashier Shift Management & Reconciliation (Z-Reports)
- **Opening Float Tracking**: Record starting drawer cash per cashier session.
- **Float-In & Paid-Out Movements**: Document all cash drawer adjustments with manager authorization reasons.
- **Built-in Denomination Counter**: Input bill/coin counts (100, 50, 20, 10, 5, 2, 1) to eliminate human counting errors.
- **End-of-Shift Z-Report**: Calculate expected vs. actual drawer cash, determine cash variances (overage/shortage), and generate printable shift summaries.

### 3. 📦 Dual Inventory & Bulk Stock Management
- **Shelf vs. Wholesale Storehouse**: Track retail stock and unopened bulk cartons independently.
- **1-Click Shelf Restock**: Move bulk cartons to retail shelf with automatic unit conversion.
- **Damaged & Expired Goods Log**: Audit write-offs without skewing profit-and-loss margins.
- **CSV/Excel Bulk Import & Export**: Import your product catalog and barcode databases in seconds.

### 4. 🚚 Supplier Directory & Purchase Orders (PO)
- **Supplier Address Book**: Manage vendor contacts, payment terms, and tax IDs.
- **PO Creation & Tracking**: Generate itemized Purchase Orders with auto-calculated carton totals.
- **1-Click PO Receiving**: Automatically receive incoming supplier shipments into wholesale inventory and append audit trails.

### 5. 🎁 Customer Loyalty Points & Promo Code Engine
- **Tiered Rewards Program**: Standard, Silver, Gold, and Platinum tier progressions based on cumulative customer spending.
- **Points Accumulation & Redemption**: Configure points earned per currency unit and cash value per redeemed point.
- **Promotional Coupons**: Schedule percentage or fixed discounts with minimum basket spend thresholds and expiration dates.

### 6. 🏢 Multi-Branch Inventory Transfers
- **Store Network Directory**: Track multiple branches, warehouses, and satellite outlets.
- **Inter-Branch Stock Movement**: Create, dispatch, and receive transfer requests between branches with full quantity reconciliation.

### 7. 💳 Store Credit & Customer Debt Ledger
- Track unpaid customer balances and due dates.
- Partial payment reconciliation with automatic balance recalculation.

---

## 👥 Role-Based Functionality Access & Permissions Matrix

The interactive **Training Manual (`F1` or Help Tab)** dynamically maps operating procedures, allowed workspace modules, and practice checklists based on the logged-in operator account:

| Capability / Module | Frontline Cashier | Store Operations Manager | System Administrator |
|---|:---:|:---:|:---:|
| **POS Checkout & Dual Unit/Carton Selling** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Cashier Shifts, Drawers & Z-Reports** | ✅ Own Shift & Float | ✅ All Shifts Audit | ✅ Master Audit |
| **Store Credit Ledger & Repayments** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Loyalty Points Lookup & Checkout Discounts** | ✅ Redeem Points | ✅ Manage Tiers & Points | ✅ Master Config |
| **Stock Room, Pricing & Shelf Restocking** | 🔒 Restricted | ✅ Full Access | ✅ Full Access |
| **Weekly Ground Audits & Loss Write-Offs** | 🔒 Restricted | ✅ Full Access | ✅ Full Access |
| **Suppliers & Purchase Orders (PO) Intake** | 🔒 Restricted | ✅ Full Access | ✅ Full Access |
| **Multi-Branch Stock Transfers & Dispatch** | 🔒 Restricted | ✅ Full Access | ✅ Full Access |
| **Promotional Coupon Campaigns** | 🔒 Restricted | ✅ Full Access | ✅ Full Access |
| **Business Analytics & Margin Audits** | 🔒 Restricted | ✅ Full Access | ✅ Full Access |
| **Offline JSON Database Backups** | 🔒 Restricted | 🔒 Restricted | ⭐ Admin Master Only |
| **Operator Security Passcodes & System Resets** | 🔒 Restricted | 🔒 Restricted | ⭐ Admin Master Only |

---

## 💻 System Requirements

- **Operating System**: Windows 7 SP1 or newer, Windows 10, Windows 11, macOS 10.13+, or any modern Linux distribution (Ubuntu, Debian, Fedora, Raspberry Pi OS).
- **Runtime / Environment**: Node.js (v18.0.0 or later recommended) & npm (v9.0.0 or later).
- **Browser**: Any modern browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, Safari, or Chromium-based kiosk browsers).
- **Memory**: Minimum 2 GB RAM (4 GB recommended).
- **Storage**: ~150 MB for installation files.

---

## 🚀 Installation & Setup Guide

### A. Running Locally (Development Mode)

1. **Clone or Extract the Project Directory**:
   ```bash
   cd myshop-pos
   ```

2. **Install Required Node Packages**:
   ```bash
   npm install
   ```

3. **Start the Local Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the Application**:
   Open your browser and navigate to `http://localhost:3000`.

---

### B. Production Build & Local Server

To generate an optimized, high-performance production build:

1. **Compile the Static Bundle**:
   ```bash
   npm run build
   ```
   This creates a lightweight, compiled `dist/` directory containing minified HTML, JavaScript, and CSS.

2. **Serve with Any Static File Server**:
   You can serve the `dist/` folder using `serve`, `http-server`, or Nginx:
   ```bash
   npx serve -s dist -p 3000
   ```

---

### C. Desktop App Deployment (Windows 7 / 10 / 11, macOS, Linux)

You can package MyShop as a standalone native desktop `.exe` or `.app` using **Electron**:

1. **Install Electron Tools**:
   ```bash
   npm install --save-dev electron electron-builder
   ```

2. **Add an Electron Entry Point (`electron-main.js`)**:
   ```javascript
   const { app, BrowserWindow } = require('electron');
   const path = require('path');

   function createWindow() {
     const win = new BrowserWindow({
       width: 1280,
       height: 800,
       kiosk: false, // Set to true for dedicated POS terminal lock
       webPreferences: {
         nodeIntegration: false,
         contextIsolation: true
       }
     });

     // Load production dist or local dev server
     win.loadFile(path.join(__dirname, 'dist', 'index.html'));
   }

   app.whenReady().then(createWindow);

   app.on('window-all-closed', () => {
     if (process.platform !== 'darwin') app.quit();
   });
   ```

3. **Build Windows Executable**:
   ```bash
   npx electron-builder --win portable
   ```
   This generates a standalone `MyShop.exe` that runs without requiring an internet connection.

---

### D. Progressive Web App (PWA / Offline Chrome)

1. Open `http://localhost:3000` in Google Chrome or Microsoft Edge.
2. Click the **Install Icon** in the browser address bar (or Menu → *Install MyShop*).
3. The app opens in a distraction-free standalone window that launches from your Desktop or Start Menu and caches all resources for full offline operation.

---

## 🖨️ Hardware & Peripheral Configuration

### USB & Bluetooth Barcode Scanners
- **No drivers required**: Any standard barcode scanner operating in **HID Keyboard Emulation Mode** works automatically out of the box.
- The terminal automatically captures rapid barcode keystrokes (ending in Enter/CR) and adds items to the active cart without requiring manual focus on the search bar.

### Thermal Receipt Printers (58mm & 80mm ESC/POS)
- Configure your default receipt layout in **Settings → Receipt & Store Profile**:
  - **58mm Thermal Rolls**: Condensed 32-character layout with large totals and barcode footer.
  - **80mm Thermal Rolls**: Full 48-character layout with itemized tax and payment details.
  - **A4 / Letter Invoices**: Professional multi-column invoice sheets for wholesale orders.
- Use the **Auto-Print / Silent Print** browser configuration (`--kiosk-printing` flag in Chrome) for instant 1-click receipt dispensing.

### Cash Drawers & Customer Displays
- Connect your RJ11/RJ12 cash drawer directly to the thermal printer's kick-out port. The drawer will automatically open when a receipt print signal is transmitted.

---

## ⌨️ Keyboard Shortcuts Reference

Designed for lightning-fast cashier operation without touching the mouse:

| Shortcut | Function | Description |
|---|---|---|
| `F1` | **Help Manual** | Opens the interactive quick-reference guide |
| `F2` | **Clear Basket** | Empties the current cart with confirmation |
| `F3` | **Search Focus** | Focuses the product search & barcode input |
| `F4` | **Camera Scanner** | Toggles integrated camera barcode scanner |
| `F8` | **Tender Payment** | Focuses amount-received input / completes tender |
| `F9` | **Lock Terminal** | Instantly locks the register screen for security |
| `Ctrl + P` | **Print Receipt** | Intercepts browser print to trigger thermal spooler |
| `Esc` | **Close Dialog** | Closes any open modal window or print preview |

---

## 🛡️ Enterprise Data Durability & 10-Year Long-Term Guarantee

To guarantee continuous operation for the next decade without maintenance headaches:

1. **Zero External Cloud Dependencies**:
   - The application does not depend on fragile third-party APIs that may deprecate over time.
   - Core checkout, inventory, shift auditing, and printing work 100% offline.

2. **JSON Database Backups**:
   - Access **Backup & Restore** anytime to export a complete, portable JSON snapshot of your entire database.
   - To migrate to a new computer, simply export the JSON file from the old machine and restore it on the new machine in 2 clicks.

3. **Defensive Schema Versioning**:
   - All state structures include deterministic fallback values to ensure backwards-compatibility across updates.

4. **Non-Volatile Browser Storage**:
   - Uses atomic `localStorage` write pipelines with corruption guards and automated backup prompts.

---

## 🔧 Troubleshooting & Diagnostics

- **Windows 7 / Legacy PC Diagnostics**: Click the *Diagnostics* button in the top navigation bar to run an instant diagnostic check on local storage, audio synthesis, camera support, and memory health.
- **Thermal Printer Spooling**: If receipt margins are clipped in the browser print dialog, set *Margins* to **None** and disable *Headers and Footers*.
- **Resetting to Fresh State**: Navigate to *Backup & Database* and click *Factory Reset* (requires master password verification).

---

*MyShop POS — Engineered for reliability, speed, and long-term durability.*
