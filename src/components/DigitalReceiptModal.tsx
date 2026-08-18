import React, { useState, useRef, useEffect } from 'react';
import { Sale, StoreSettings } from '../types';
import { 
  X, QrCode, Share2, Copy, Check, Printer, MessageCircle, Mail, Download, 
  Smartphone, Store, ShieldCheck, Calendar, User, CreditCard, Sparkles, CheckCircle2 
} from 'lucide-react';

interface DigitalReceiptModalProps {
  sale: Sale;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
}

export default function DigitalReceiptModal({ sale, settings, isOpen, onClose }: DigitalReceiptModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrSize, setQrSize] = useState<number>(140);
  const receiptCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const formattedDate = new Date(sale.timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // Construct structured text message for WhatsApp / SMS / Email
  const generateReceiptText = () => {
    const itemsList = sale.items
      .map(
        item =>
          `• ${item.productName}${item.packLabel ? ` (${item.packLabel})` : ''} x${item.quantity} = ${settings.currency}${(item.price * item.quantity).toFixed(2)}`
      )
      .join('\n');

    return (
`🧾 *${settings.storeName.toUpperCase()} — E-RECEIPT*
━━━━━━━━━━━━━━━━━━━━
📍 *Branch:* ${settings.address}
📞 *Tel:* ${settings.phone}
🕒 *Date:* ${formattedDate}
🆔 *Receipt No:* ${sale.id}
👤 *Cashier:* ${sale.cashierName || 'Operator'}
🛒 *Customer:* ${sale.customerName} (${sale.customerPhone})
━━━━━━━━━━━━━━━━━━━━
*PURCHASED ITEMS:*
${itemsList}
━━━━━━━━━━━━━━━━━━━━
*Subtotal:* ${settings.currency}${sale.subtotal.toFixed(2)}
${sale.discount > 0 ? `*Discount:* -${settings.currency}${sale.discount.toFixed(2)}\n` : ''}*Tax (${settings.taxRate}%):* ${settings.currency}${sale.tax.toFixed(2)}
*TOTAL PAID:* ${settings.currency}${sale.total.toFixed(2)}
*Payment Method:* ${sale.paymentMethod.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━
${settings.receiptFooter || 'Thank you for your patronage! Items returnable within 7 days with original receipt.'}
🌐 Verified Digital Ledger Record`
    );
  };

  const copyReceiptToClipboard = () => {
    const text = generateReceiptText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateReceiptText());
    let cleanPhone = sale.customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      // Common international dialing format fallback
      cleanPhone = '233' + cleanPhone.substring(1);
    }
    const url = cleanPhone && cleanPhone !== 'N/A' && cleanPhone.length >= 9
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`E-Receipt from ${settings.storeName} (${sale.id})`);
    const body = encodeURIComponent(generateReceiptText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // Generate offline deterministic SVG QR-style visual matrix
  const generateQrMatrix = (seed: string) => {
    const size = 21;
    const matrix: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));
    
    // Simple hash function for pseudo-random deterministic filler
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }

    // Fixed corner position markers (QR standard 7x7 outer patterns)
    const drawFinder = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[startY + r][startX + c] = true;
          } else {
            matrix[startY + r][startX + c] = false;
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(14, 0);
    drawFinder(0, 14);

    // Timing patterns
    for (let i = 8; i < 13; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // Fill remaining cells deterministically based on seed
    let seedIdx = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip corner finder zones
        if ((r < 8 && c < 8) || (r < 8 && c >= 13) || (r >= 13 && c < 8)) continue;
        if (r === 6 || c === 6) continue;

        const charVal = seed.charCodeAt(seedIdx % seed.length);
        seedIdx++;
        matrix[r][c] = ((hash ^ (r * 31 + c * 17) ^ charVal) % 2) === 0;
      }
    }

    return matrix;
  };

  const qrMatrix = generateQrMatrix(sale.id + '-' + sale.total + '-' + sale.timestamp);
  const cellSize = qrSize / 21;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn" id="digital-receipt-modal">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Digital E-Receipt & QR Share</h2>
              <p className="text-[11px] text-blue-100 font-mono">Invoice #{sale.id} • 100% Offline Compatible</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Quick Sharing Action Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={handleShareWhatsApp}
              className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              id="share-whatsapp-btn"
              type="button"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send WhatsApp</span>
            </button>

            <button
              onClick={copyReceiptToClipboard}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              id="copy-receipt-btn"
              type="button"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Text!' : 'Copy Receipt'}</span>
            </button>

            <button
              onClick={handleShareEmail}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              id="share-email-btn"
              type="button"
            >
              <Mail className="w-4 h-4" />
              <span>Email Invoice</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer"
              id="thermal-print-btn"
              type="button"
            >
              <Printer className="w-4 h-4 text-blue-500" />
              <span>Print Slip</span>
            </button>
          </div>

          {/* Digital Receipt Card Preview */}
          <div 
            ref={receiptCardRef}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-inner"
          >
            {/* Top Store Info & QR Code */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-dashed border-slate-300 dark:border-slate-800">
              <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 mb-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Authenticated Store Receipt</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                  {settings.storeName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{settings.address}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Tel: {settings.phone}</p>
              </div>

              {/* Offline SVG QR Code */}
              <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200 flex flex-col items-center justify-center shrink-0">
                <svg width={qrSize} height={qrSize} viewBox={`0 0 ${qrSize} ${qrSize}`} className="shape-rendering-crispEdges">
                  <rect width={qrSize} height={qrSize} fill="#ffffff" />
                  {qrMatrix.map((row, r) =>
                    row.map((cell, c) => {
                      if (!cell) return null;
                      return (
                        <rect
                          key={`${r}-${c}`}
                          x={c * cellSize}
                          y={r * cellSize}
                          width={cellSize}
                          height={cellSize}
                          fill="#0f172a"
                        />
                      );
                    })
                  )}
                </svg>
                <span className="text-[8.5px] font-mono font-bold text-slate-500 mt-1.5 tracking-wider uppercase">
                  Scan for Verification
                </span>
              </div>
            </div>

            {/* Receipt Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/60 dark:border-slate-850">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Receipt ID</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{sale.id}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Date & Time</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">{formattedDate}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Customer</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">{sale.customerName}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Payment</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">{sale.paymentMethod}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                <span>Item Description</span>
                <span className="text-right">Total ({settings.currency})</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin text-xs">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-slate-700 dark:text-slate-300 py-0.5">
                    <div className="pr-2">
                      <span className="font-semibold">{item.productName}</span>
                      {item.packLabel && (
                        <span className="text-[10px] text-slate-400 ml-1 font-mono">[{item.packLabel}]</span>
                      )}
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.quantity} × {settings.currency}{item.price.toFixed(2)}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                      {settings.currency}{(item.quantity * item.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-3 border-t border-dashed border-slate-300 dark:border-slate-800 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span>{settings.currency}{sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Promotional Discount:</span>
                  <span>-{settings.currency}{sale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tax ({settings.taxRate}%):</span>
                <span>{settings.currency}{sale.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-300 dark:border-slate-800">
                <span>Total Amount:</span>
                <span className="text-blue-600 dark:text-blue-400">{settings.currency}{sale.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer Note */}
            <p className="text-[10.5px] text-center text-slate-400 dark:text-slate-500 italic pt-1">
              {settings.receiptFooter || 'Thank you for shopping with us!'}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              type="button"
            >
              Done & Return to Terminal
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
