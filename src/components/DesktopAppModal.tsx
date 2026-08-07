import React, { useState, useEffect } from 'react';
import { 
  Laptop, Monitor, Download, ShieldCheck, CheckCircle2, Copy, Check, 
  ExternalLink, HardDrive, Cpu, Terminal, Zap, X, Layers, Users, RefreshCw
} from 'lucide-react';
import { StoreSettings } from '../types';

interface DesktopAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  deferredPrompt?: any;
  onTriggerPwaInstall?: () => void;
}

export default function DesktopAppModal({
  isOpen,
  onClose,
  settings,
  deferredPrompt,
  onTriggerPwaInstall
}: DesktopAppModalProps) {
  const [activeTab, setActiveTab] = useState<'pwa' | 'shortcut' | 'multipc' | 'offline'>('pwa');
  const [copiedScript, setCopiedScript] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone PWA window
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);
  }, []);

  if (!isOpen) return null;

  const currentAppUrl = window.location.href;

  const windowsBatScript = `@echo off
title Launching MyShop Store Desk Desktop App
echo ========================================================
echo   Launching MyShop Desk in Standalone Desktop Mode
echo ========================================================
start chrome.exe --app="${currentAppUrl}" --window-size=1280,800 || start msedge.exe --app="${currentAppUrl}" --window-size=1280,800
exit`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const downloadBatScript = () => {
    const blob = new Blob([windowsBatScript], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Install-MyShop-Desk.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">Desktop Application Setup</h2>
                {isStandalone ? (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Running as Desktop App
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Web Browser Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Run MyShop Desk like Microsoft Word as a native standalone desktop app on your computer.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="bg-slate-100 dark:bg-slate-800/60 p-2 border-b border-slate-200 dark:border-slate-800 flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>1-Click Native Install</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcut')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'shortcut'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Desktop Shortcut (.bat)</span>
          </button>

          <button
            onClick={() => setActiveTab('multipc')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'multipc'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Multi-PC Setup (Cashiers & Manager)</span>
          </button>

          <button
            onClick={() => setActiveTab('offline')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'offline'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Offline & Electron</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-slate-800 dark:text-slate-200">

          {/* TAB 1: 1-CLICK PWA INSTALL */}
          {activeTab === 'pwa' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-blue-900 dark:text-blue-200 text-sm">
                    Method 1: Install directly as a Progressive Desktop App (Recommended)
                  </h3>
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    This turns MyShop Desk into a native desktop application with its own desktop icon, taskbar pin, and standalone borderless window — exactly like Microsoft Word or Excel.
                  </p>
                </div>
              </div>

              {/* Install Callout Button */}
              {deferredPrompt || onTriggerPwaInstall ? (
                <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                  <div>
                    <h4 className="font-bold text-base text-white">Ready to Install on Desktop</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Click the button below to add MyShop Desk to your Windows Start Menu, Desktop, and Taskbar.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (onTriggerPwaInstall) onTriggerPwaInstall();
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download className="w-5 h-5" />
                    <span>Install MyShop Desktop App</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    How to install in your browser right now:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">1</span>
                        Google Chrome / Microsoft Edge
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                        Look at the right side of your address bar at the top of your screen. Click the <strong>"Install MyShop Desk"</strong> icon (or click the 3-dot menu → <em>Save and Share</em> → <em>Install page as app</em>).
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">2</span>
                        Pin to Taskbar & Desktop
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                        Check <strong>"Create Desktop Shortcut"</strong> and <strong>"Pin to Taskbar"</strong>. MyShop will open in its own clean window without any web browser tabs or address bar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* What You Get Highlights */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Standalone Window</div>
                  <div className="text-[10px] text-slate-500">No browser tabs or address bar</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <HardDrive className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">100% Offline Capable</div>
                  <div className="text-[10px] text-slate-500">Works without active internet</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Instant Boot</div>
                  <div className="text-[10px] text-slate-500">Launches instantly from desktop</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DESKTOP SHORTCUT BATCH FILE */}
          {activeTab === 'shortcut' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Method 2: Create a Windows Desktop Launcher Shortcut (.bat file)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  You can create a custom double-clickable icon on your Windows desktop that launches MyShop Desk directly in full-screen application window mode.
                </p>
              </div>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs relative">
                <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-sans font-bold border-b border-slate-800 pb-2">
                  <span>Windows Launcher Script (Install-MyShop-Desk.bat)</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={downloadBatScript}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded flex items-center gap-1 cursor-pointer font-sans transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .bat File</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(windowsBatScript)}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-sans"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap overflow-x-auto text-emerald-400 text-[11px]">
                  {windowsBatScript}
                </pre>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-4 rounded-xl text-xs space-y-1.5 text-amber-900 dark:text-amber-200">
                <div className="font-bold flex items-center gap-1.5">
                  <span>💡 How to use this launcher script:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 dark:text-amber-300">
                  <li>Click <strong>"Download .bat File"</strong> above to save <code>Install-MyShop-Desk.bat</code> onto your PC.</li>
                  <li>Move the file to your Windows Desktop.</li>
                  <li>Double click <code>Install-MyShop-Desk.bat</code> anytime to open MyShop as a standalone native desktop app!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: MULTI-PC SETUP FOR CASHIERS & MANAGER */}
          {activeTab === 'multipc' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-900 text-white p-5 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-sm text-white">How to setup Cashier PCs & Manager Personal PC</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You can install MyShop Desk as a native desktop application on all your computers (Cashier POS terminals and your personal Manager computer) while keeping them connected in real time.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Cashier PC Card */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-blue-600" /> Cashier Computer (POS Desk)
                    </div>
                    <span className="bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Cashier Mode
                    </span>
                  </div>
                  <ul className="space-y-2 text-slate-600 dark:text-slate-300 text-[11px]">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Install MyShop Desk Desktop App on cashier PC.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Log in as <strong>Retail Cashier</strong> (restricted to checkout sales only; inventory edit tabs are locked).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Connect USB barcode scanner and thermal receipt printer.</span>
                    </li>
                  </ul>
                </div>

                {/* Manager PC Card */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-amber-600" /> Manager Personal Computer
                    </div>
                    <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Admin / Manager
                    </span>
                  </div>
                  <ul className="space-y-2 text-slate-600 dark:text-slate-300 text-[11px]">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Install MyShop Desk Desktop App on your personal laptop/PC.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Log in as <strong>System Administrator</strong> to monitor live cash intake, profit analytics, and inventory levels.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Enable <strong>Online Sync Mode</strong> in Backups tab so cashier transactions automatically sync to your personal computer!</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OFFLINE & ELECTRON / NATIVE BUNDLE */}
          {activeTab === 'offline' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-600" /> Offline Desktop Executable (.exe) Packaging
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  If you prefer a completely offline standalone file that never needs an internet connection or web browser server, you can wrap MyShop Desk using <strong>Electron</strong> or <strong>Tauri</strong>.
                </p>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200">Building an Electron .EXE file:</div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                    <li>Run <code>npm install electron electron-builder --save-dev</code> in the project directory.</li>
                    <li>Add <code>"main": "electron-main.js"</code> to package.json.</li>
                    <li>Run <code>npm run build && npx electron-builder</code> to generate <code>MyShop-Desk-Setup.exe</code> for Windows!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 dark:bg-slate-800/60 p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            MyShop Store Management Desk v3.5 Desktop Edition
          </span>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl transition-all cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
