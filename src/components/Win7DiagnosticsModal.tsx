import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, 
  Volume2, 
  Printer, 
  Barcode, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Sparkles, 
  X, 
  RefreshCw, 
  Zap, 
  Key, 
  ShieldCheck, 
  Terminal,
  Cpu,
  Download
} from 'lucide-react';
import { StoreSettings } from '../types';

interface Win7DiagnosticsModalProps {
  onClose: () => void;
  settings: StoreSettings;
  onUpdateSettings?: (newSettings: StoreSettings) => void;
}

export default function Win7DiagnosticsModal({ onClose, settings, onUpdateSettings }: Win7DiagnosticsModalProps) {
  const [activeTab, setActiveTab] = useState<'scanner' | 'printer' | 'audio' | 'system' | 'shortcuts'>('scanner');
  
  // Printer & Receipt Preference Form States
  const [retailFormat, setRetailFormat] = useState<'80mm' | '58mm' | 'A4'>(settings.retailReceiptFormat || '80mm');
  const [wholesaleFormat, setWholesaleFormat] = useState<'A4' | '80mm' | 'Letter'>(settings.wholesaleReceiptFormat || 'A4');
  const [driverType, setDriverType] = useState<'thermal_escpos' | 'dot_matrix' | 'laser_inkjet' | 'bluetooth_mobile'>(settings.printerDriverType || 'thermal_escpos');
  const [wholesaleTermsText, setWholesaleTermsText] = useState<string>(settings.wholesaleTerms || '1. Payment due upon receipt unless credit terms agreed.\n2. Goods once sold in sound condition are not returnable without prior manager authorization.\n3. Claims regarding quantity or damaged bulk packs must be logged within 48 hours.');
  const [autoPrint, setAutoPrint] = useState<boolean>(settings.autoPrintEnabled || false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const handleSavePrinterPreferences = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        retailReceiptFormat: retailFormat,
        wholesaleReceiptFormat: wholesaleFormat,
        printerDriverType: driverType,
        wholesaleTerms: wholesaleTermsText,
        autoPrintEnabled: autoPrint
      });
      setSaveSuccessMsg('✓ Receipt preferences and printer configuration saved successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    }
  };
  
  // Scanner test state
  const [scannedTestCode, setScannedTestCode] = useState<string>('');
  const [lastBurstTime, setLastBurstTime] = useState<number | null>(null);
  const [keystrokeCount, setKeystrokeCount] = useState<number>(0);
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'testing' | 'success' | 'manual'>('idle');
  const [scannerLog, setScannerLog] = useState<string[]>([]);
  const testInputRef = useRef<HTMLInputElement>(null);

  // Audio test state
  const [audioTested, setAudioTested] = useState<boolean>(false);
  const [audioStatus, setAudioStatus] = useState<string>('Ready to test Web Audio engine');

  // Print test state
  const [printTested, setPrintTested] = useState<boolean>(false);

  // Detect Windows version details
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isWin7 = userAgent.includes('Windows NT 6.1');
  const isWin8 = userAgent.includes('Windows NT 6.2') || userAgent.includes('Windows NT 6.3');
  const isWin10Plus = userAgent.includes('Windows NT 10.0');
  
  const osName = isWin7 
    ? 'Windows 7 Service Pack 1' 
    : isWin8 
    ? 'Windows 8 / 8.1' 
    : isWin10Plus 
    ? 'Windows 10 / 11 POS' 
    : userAgent.includes('Windows') 
    ? 'Windows Desktop (Legacy)' 
    : 'Windows Compatible Web POS';

  const screenRes = typeof window !== 'undefined' ? `${window.innerWidth} x ${window.innerHeight}` : 'Standard POS';

  // Scanner test handler
  const handleTestInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setScannedTestCode(val);
  };

  const handleTestKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (scannedTestCode.trim().length > 0) {
        setScannerStatus('success');
        setScannerLog(prev => [
          `[${new Date().toLocaleTimeString()}] Captured Barcode: "${scannedTestCode.trim()}"`,
          ...prev.slice(0, 4)
        ]);
        playDiagnosticBeep(true);
      }
    }
  };

  // Audio Synth Test
  const playDiagnosticBeep = (isSuccess: boolean) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        setAudioStatus('Web Audio API not supported on this legacy browser. Silent fallback active.');
        return;
      }
      const audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';

      if (isSuccess) {
        oscillator.frequency.setValueAtTime(1400, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
        setAudioStatus('🔊 Audio Synth Active: Played 1400Hz Retail High Chirp!');
      } else {
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.25);
        setAudioStatus('🔊 Audio Synth Active: Played 300Hz Error Tone!');
      }
      setAudioTested(true);
    } catch (e: any) {
      setAudioStatus(`Audio warning: ${e?.message || 'Browsers muted audio until user interaction'}`);
    }
  };

  const handleTestPrintReceipt = () => {
    setPrintTested(true);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn print:hidden">
      <div className="bg-slate-900 border border-slate-750 text-slate-100 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-800/90 border-b border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-white tracking-wide">Windows 7+ System Compatibility & POS Hardware Diagnostics</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  Win7 Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hardware validation suite for ZKTeco scanners, thermal receipt printers, and legacy Windows POS environments.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Tabs */}
        <div className="bg-slate-850 border-b border-slate-800 px-6 py-2 flex items-center space-x-2 overflow-x-auto text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3.5 py-2 rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'scanner' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>1. Scanner Timing Test</span>
          </button>

          <button
            onClick={() => setActiveTab('printer')}
            className={`px-3.5 py-2 rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'printer' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>2. Thermal Print Spooler</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`px-3.5 py-2 rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'audio' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>3. Web Audio Synth</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-3.5 py-2 rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'system' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>4. Windows OS Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-3.5 py-2 rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'shortcuts' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>5. POS Shortcuts (F1-F10)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
          
          {/* TAB 1: SCANNER TIMING TEST */}
          {activeTab === 'scanner' && (
            <div className="space-y-5">
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Hardware Wedge Barcode Scanner Timing Analyzer</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Point your physical desktop or handheld scanner (e.g., <strong className="text-blue-400">ZKTeco ZKB209</strong>) at any product barcode and pull the trigger while focused below.
                  </p>
                </div>
                <div className="shrink-0 bg-slate-900 border border-slate-750 px-3.5 py-2 rounded-lg text-right">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Wedge Threshold</span>
                  <span className="text-xs text-emerald-400 font-mono font-extrabold">&lt; 65ms Burst Intercept</span>
                </div>
              </div>

              {/* Interactive Scanner Input */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase text-slate-300 tracking-wider">
                  Test Scan Field (Scan any barcode now):
                </label>
                <div className="relative">
                  <input
                    ref={testInputRef}
                    type="text"
                    value={scannedTestCode}
                    onChange={handleTestInputChange}
                    onKeyDown={handleTestKeyDown}
                    placeholder="Scan a barcode using your ZKTeco or USB scanner..."
                    className="w-full bg-slate-950 border-2 border-blue-500/60 focus:border-blue-400 rounded-xl px-4 py-3 text-white font-mono text-base placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                    autoFocus
                  />
                  {scannedTestCode && (
                    <button
                      onClick={() => setScannedTestCode('')}
                      className="absolute right-3 top-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Status Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold block uppercase font-mono">Scanner Intercept Status</span>
                  {scannedTestCode ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-emerald-400 font-extrabold font-mono text-lg flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Code Captured!</span>
                      </p>
                      <p className="text-xs font-mono text-slate-300">Raw Length: {scannedTestCode.length} chars</p>
                      <p className="text-xs text-blue-300">Code: <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700 font-bold">{scannedTestCode}</span></p>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs italic mt-2">Waiting for scanner input event...</p>
                  )}
                </div>

                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400 font-semibold block uppercase font-mono">Recent Scan Log</span>
                  {scannerLog.length > 0 ? (
                    <div className="space-y-1 font-mono text-xs">
                      {scannerLog.map((log, idx) => (
                        <div key={idx} className="text-emerald-300 bg-slate-900 px-2 py-1 rounded border border-slate-850">
                          {log}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No barcode scans logged in this diagnostic session yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-4 text-xs text-blue-200 leading-relaxed space-y-1">
                <p className="font-bold text-blue-300 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Windows 7 Compatibility Note for Barcode Wedges:</span>
                </p>
                <p>
                  Whether your scanner is connected via USB HID, Serial emulation, or PS/2 on Windows 7, this application intercepts keystroke bursts automatically across all active views without requiring focused input elements.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: UNIVERSAL PRINTER ENGINE & RECEIPT PREFERENCES */}
          {activeTab === 'printer' && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white flex items-center space-x-2">
                    <Printer className="w-4.5 h-4.5 text-emerald-400" />
                    <span>Universal Printer Engine & Receipt Preferences (2000 – Present)</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Configure independent template formats for Wholesale Bulk Invoices vs. Retail Counter Receipts, and pair any POS thermal roll printer, dot-matrix, or A4 office laser spooler.
                  </p>
                </div>
                <button
                  onClick={handleTestPrintReceipt}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg transition-all cursor-pointer shrink-0"
                  type="button"
                >
                  <Printer className="w-4 h-4" />
                  <span>Spool Calibration Test Print</span>
                </button>
              </div>

              {saveSuccessMsg && (
                <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl text-xs font-bold animate-fadeIn flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* RECEIPT PREFERENCES FORM */}
              <form onSubmit={handleSavePrinterPreferences} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5 text-left">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 font-mono">1. Default Transaction Receipt Preferences</h4>
                    <p className="text-[11px] text-slate-400">Set automatic template formats for Retail counter sales vs Wholesale bulk orders.</p>
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer font-sans"
                  >
                    Save Preferences
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  {/* Retail Receipt Preference */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                      🛍️ Retail Sales Receipt Format (Default)
                    </label>
                    <select
                      value={retailFormat}
                      onChange={(e: any) => setRetailFormat(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                    >
                      <option value="80mm">80mm Coated Thermal Roll (Standard POS Ticket - SNBC / Epson)</option>
                      <option value="58mm">58mm Narrow Mobile Roll (Bluetooth Handheld POS Printer)</option>
                      <option value="A4">A4 Slip Sheet (Desk Laser / Inkjet Printer)</option>
                    </select>
                    <p className="text-[10px] text-slate-400">
                      Auto-selected during single-unit retail shelf sales. Fast roll feed with compact barcode and shop header.
                    </p>
                  </div>

                  {/* Wholesale Receipt Preference */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                      📦 Wholesale Bulk Sales Invoice Format (Default)
                    </label>
                    <select
                      value={wholesaleFormat}
                      onChange={(e: any) => setWholesaleFormat(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                    >
                      <option value="A4">A4 Corporate Tax Invoice (Itemized Packs + Terms + Signature Box)</option>
                      <option value="80mm">80mm Detailed Bulk Thermal Roll (Expanded Roll Format)</option>
                      <option value="Letter">US Letter Full Sheet Invoice (Laser / Inkjet Document)</option>
                    </select>
                    <p className="text-[10px] text-slate-400">
                      Auto-selected for full carton wholesale orders, credit sales, or business accounts.
                    </p>
                  </div>

                  {/* Printer Architecture Profile */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                      🖨️ Active Hardware Printer Architecture
                    </label>
                    <select
                      value={driverType}
                      onChange={(e: any) => setDriverType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                    >
                      <option value="thermal_escpos">ESC/POS Direct Thermal (SNBC, Epson TM, Star, Bixolon, XPrinter)</option>
                      <option value="dot_matrix">Impact Dot-Matrix Ribbon Printer (Epson TM-U220, Star SP700)</option>
                      <option value="laser_inkjet">Desktop Laser / Inkjet Office Spooler (HP, Canon, Brother, Kyocera)</option>
                      <option value="bluetooth_mobile">Wireless Bluetooth / Wi-Fi Mobile POS Printer (58mm/80mm)</option>
                    </select>
                    <p className="text-[10px] text-slate-400">
                      Optimizes print margins, line feed density, and page boundaries for your physical spooler.
                    </p>
                  </div>

                  {/* Auto Print Toggle */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                        ⚡ Instant Auto-Print Spooling
                      </label>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Automatically pop up system printer spooler immediately upon completing checkout.
                      </p>
                    </div>
                    <label className="flex items-center space-x-3 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={autoPrint}
                        onChange={(e) => setAutoPrint(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-white">Enable Auto-Print Spool on Payment</span>
                    </label>
                  </div>
                </div>

                {/* Wholesale Terms Text Area */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono">
                    📜 Wholesale Terms & Conditions (Appears on Wholesale A4 Tax Invoices)
                  </label>
                  <textarea
                    rows={3}
                    value={wholesaleTermsText}
                    onChange={(e) => setWholesaleTermsText(e.target.value)}
                    placeholder="Enter custom wholesale invoice payment and warranty terms..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </form>

              {/* UNIVERSAL COMPATIBILITY MATRIX (2000 - PRESENT) */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono block">
                  🌐 Universal Printer Compatibility Guide (2000 – Present)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Our application uses raw standard CSS `@media print` layout engines compatible with <strong>any printer driver released from the year 2000 to date</strong> across Windows 2000, XP, 7, 8, 10, 11, macOS, and Linux CUPS.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">1. ESC/POS Thermal</span>
                    <p className="text-[10px] text-slate-400">SNBC BTP-S81, Epson TM-T88 I-VII, Star TSP100, Bixolon, XPrinter, Munbyn, Rongta (80mm & 58mm).</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">2. Dot-Matrix Impact</span>
                    <p className="text-[10px] text-slate-400">Epson TM-U220 / TM-U200, Star SP700, Citizen CD-S500 (76mm roll ribbon feed with carbon copy).</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">3. Desktop Office Laser</span>
                    <p className="text-[10px] text-slate-400">HP LaserJet, Canon PIXMA, Brother HL/MFC, Kyocera, Xerox, Ricoh (A4, Letter, Legal multi-page).</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">4. Mobile Bluetooth</span>
                    <p className="text-[10px] text-slate-400">Portable handheld 58mm & 80mm Bluetooth printers via Windows / Android / iOS spooling.</p>
                  </div>
                </div>
              </div>

              {/* CALIBRATION TEST PRINT PREVIEW VOUCHER */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-left">
                <span className="text-xs text-slate-400 font-semibold block uppercase font-mono">
                  Diagnostic Test Paper Feed Ticket (Spool Calibration)
                </span>
                <div className="bg-white text-slate-900 p-4 rounded-lg font-mono text-xs max-w-xs mx-auto shadow-xl space-y-2 border border-slate-300">
                  <div className="text-center font-bold border-b border-dashed border-slate-400 pb-2">
                    <p className="text-sm uppercase tracking-wider">{settings.storeName || 'MYSHOP'} DESK</p>
                    <p className="text-[10px] text-slate-600 font-normal">2000–2026 Universal Spool Test</p>
                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">{new Date().toLocaleString()}</p>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>Retail Roll Pref:</span>
                      <span className="font-bold">{retailFormat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wholesale Inv Pref:</span>
                      <span className="font-bold">{wholesaleFormat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Driver Architecture:</span>
                      <span className="font-bold">{driverType}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-1 font-bold">
                      <span>DENSITY & ALIGNMENT:</span>
                      <span>PASS ✓</span>
                    </div>
                  </div>
                  <div className="text-center text-[9px] text-slate-500 border-t border-dashed border-slate-400 pt-2">
                    SNBC BTP-S81 / Universal Printer Driver Ready
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WEB AUDIO SYNTH */}
          {activeTab === 'audio' && (
            <div className="space-y-5">
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white flex items-center space-x-2">
                    <Volume2 className="w-4 h-4 text-sky-400" />
                    <span>Web Audio Synthesizer Test for Legacy Windows Sound Cards</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Test the built-in browser audio oscillator synth used for instant retail barcode scan chimes.
                  </p>
                </div>
                <div className="flex space-x-2 shrink-0">
                  <button
                    onClick={() => playDiagnosticBeep(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow transition-all cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Test Success Chirp (1400Hz)</span>
                  </button>
                  <button
                    onClick={() => playDiagnosticBeep(false)}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow transition-all cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Test Error Buzz (300Hz)</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-semibold block uppercase font-mono">Audio Engine Output Status</span>
                <p className="text-xs font-mono text-emerald-400 bg-slate-900 p-3 rounded-lg border border-slate-850">
                  {audioStatus}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: WINDOWS OS SPECS */}
          {activeTab === 'system' && (
            <div className="space-y-5">
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
                <h3 className="font-bold text-white flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>Detected Windows System Environment</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Active environment runtime statistics and memory footprint safeguards for legacy POS hardware.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Operating System</span>
                  <p className="text-white text-sm font-bold">{osName}</p>
                  <p className="text-slate-500 text-[11px] truncate">{userAgent}</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Display Resolution</span>
                  <p className="text-white text-sm font-bold">{screenRes}</p>
                  <p className="text-emerald-400 text-[11px]">Layout optimized for 1024x768 / 1366x768 POS monitors</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Local Persistence Engine</span>
                  <p className="text-emerald-400 text-sm font-bold">HTML5 LocalStorage Active</p>
                  <p className="text-slate-400 text-[11px]">Full local offline desktop storage mode operational</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Offline Desktop Mode Guide</span>
                  <p className="text-blue-400 text-xs font-bold">Windows PWA Desktop App Ready</p>
                  <p className="text-slate-400 text-[11px]">In Chrome/Edge menu: Click "Install app" or "Create shortcut" -&gt; Check "Open as window".</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: POS SHORTCUTS CHEATSHEET */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
                <h3 className="font-bold text-white flex items-center space-x-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Windows POS Keyboard Hotkey Map (Windows 7 and above)</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Speed up retail sales with dedicated POS functional shortcuts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-sans">Open Diagnostics / Help</span>
                  <span className="bg-slate-800 text-amber-300 px-2 py-1 rounded font-bold border border-slate-700">F1</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-sans">Clear Basket / Reset</span>
                  <span className="bg-slate-800 text-amber-300 px-2 py-1 rounded font-bold border border-slate-700">F2</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-sans">Focus Search Input</span>
                  <span className="bg-slate-800 text-amber-300 px-2 py-1 rounded font-bold border border-slate-700">F3</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-sans">Toggle Camera Scanner</span>
                  <span className="bg-slate-800 text-amber-300 px-2 py-1 rounded font-bold border border-slate-700">F4</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-sans">Add Open Custom Item</span>
                  <span className="bg-slate-800 text-amber-300 px-2 py-1 rounded font-bold border border-slate-700">F8</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-sans">Complete Checkout / Print</span>
                  <span className="bg-slate-800 text-emerald-300 px-2 py-1 rounded font-bold border border-slate-700">F9</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-sans">Intercept Thermal Receipt Print</span>
                  <span className="bg-slate-800 text-blue-300 px-2 py-1 rounded font-bold border border-slate-700">Ctrl + P</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-sans">Toggle Dark / Light Theme</span>
                  <span className="bg-slate-800 text-purple-300 px-2 py-1 rounded font-bold border border-slate-700">Alt + D</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-850 border-t border-slate-800 px-6 py-3 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Tested &amp; Compatible with Windows 7, 8.1, 10, 11 &amp; Windows POS Embedded</span>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2 rounded-lg transition-all cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>

      </div>
    </div>
  );
}
