import React, { useState } from 'react';
import { StoreSettings, Product } from '../types';
import { SAMPLE_PRODUCTS, DEFAULT_SETTINGS } from '../initialData';
import { Store, Coins, Receipt, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, PackageCheck } from 'lucide-react';

interface SetupWizardProps {
  onComplete: (settings: StoreSettings, initialProducts: Product[]) => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<StoreSettings>({ ...DEFAULT_SETTINGS });
  const [seedSampleProducts, setSeedSampleProducts] = useState(true);

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    const productsToSeed = seedSampleProducts ? SAMPLE_PRODUCTS : [];
    const completedSettings = {
      ...settings,
      isSetupCompleted: true
    };
    onComplete(completedSettings, productsToSeed);
  };

  const updateSettingField = (field: keyof StoreSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100" id="setup-wizard-container">
      <div className="max-w-xl w-full bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-slate-800 flex">
          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        {/* Wizard Header */}
        <div className="p-6 border-b border-slate-900 bg-slate-950 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-widest">Setup Wizard</span>
            <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">Configure MyShop</h1>
          </div>
          <div className="text-xs font-mono text-slate-500">
            Step {step} of 4
          </div>
        </div>

        {/* Wizard Main Area */}
        <div className="p-6 flex-1 min-h-[340px] flex flex-col justify-center">
          {step === 1 && (
            <div className="space-y-4" id="setup-step-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Store Identity</h2>
                  <p className="text-xs text-slate-400">Set the name, contact, and branding of your shop.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Shop Name *</label>
                  <input
                    type="text"
                    value={settings.storeName}
                    onChange={(e) => updateSettingField('storeName', e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 font-medium"
                    placeholder="e.g. MyShop Wholesale & Retail"
                    id="wizard-store-name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => updateSettingField('phone', e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                    placeholder="+1 (555) 000-0000"
                    id="wizard-store-phone"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Currency Symbol *</label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={(e) => updateSettingField('currency', e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="$, €, £, Ksh, etc."
                    maxLength={5}
                    id="wizard-store-currency"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Physical Address</label>
                  <textarea
                    value={settings.address}
                    onChange={(e) => updateSettingField('address', e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 h-16 resize-none"
                    placeholder="123 Retail Lane, Commerce City"
                    id="wizard-store-address"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5" id="setup-step-2">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Initial Stock Seed</h2>
                  <p className="text-xs text-slate-400">Initialize your database with demo products or start empty.</p>
                </div>
              </div>

              <div className="space-y-3">
                <label 
                  onClick={() => setSeedSampleProducts(true)}
                  className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all ${
                    seedSampleProducts 
                      ? 'bg-blue-500/5 border-blue-500/50 text-blue-200' 
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                  id="wizard-seed-sample-products"
                >
                  <input
                    type="radio"
                    checked={seedSampleProducts}
                    onChange={() => setSeedSampleProducts(true)}
                    className="mt-1 mr-3 accent-blue-50"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">Load Demo Products (Recommended)</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pre-populates MyShop with chocolates, soda, milk, ketchup, and chips. Excellent for testing barcode scans and stocks immediately without entering items manually.
                    </p>
                  </div>
                </label>

                <label 
                  onClick={() => setSeedSampleProducts(false)}
                  className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all ${
                    !seedSampleProducts 
                      ? 'bg-blue-500/5 border-blue-500/50 text-blue-200' 
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                  id="wizard-seed-empty-products"
                >
                  <input
                    type="radio"
                    checked={!seedSampleProducts}
                    onChange={() => setSeedSampleProducts(false)}
                    className="mt-1 mr-3 accent-blue-50"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">Start from Scratch (Empty Catalog)</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No initial products will be loaded. You will manually add your inventory items, costs, pricing, and barcodes through the product management dashboard.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4" id="setup-step-3">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Receipt Customization</h2>
                  <p className="text-xs text-slate-400">Tailor the layout of printed receipt headers and footers.</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.taxRate}
                    onChange={(e) => updateSettingField('taxRate', parseFloat(e.target.value) || 0)}
                    className="w-1/2 text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                    id="wizard-store-tax"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Receipt Header Notice</label>
                  <textarea
                    value={settings.receiptHeader}
                    onChange={(e) => updateSettingField('receiptHeader', e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 h-16 font-mono"
                    id="wizard-store-receipt-header"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Receipt Footer / Policy Notice</label>
                  <textarea
                    value={settings.receiptFooter}
                    onChange={(e) => updateSettingField('receiptFooter', e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 h-16 font-mono"
                    id="wizard-store-receipt-footer"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4" id="setup-step-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Data Protection & Backups</h2>
                  <p className="text-xs text-slate-400">Keep your wholesale, retail, and sales logs accessible and secure.</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div className="font-semibold text-blue-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Local-First Sandbox Active</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your store operates in local sandbox mode. Data is saved in the browser's persistent storage so it stays intact even if you refresh or close the browser.
                  </p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div className="font-semibold text-teal-400">💾 Safe Manual Backups</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    MyShop comes with a **"Database Backups"** console where you can download your entire stock database, sales history, and logs with 1-click as a `.json` backup file. You can import this backup on any other device to restore your exact states.
                  </p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div className="font-semibold text-blue-400">☁️ Real-time Cloud Backups (Optional)</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    If you want real-time syncing across multiple computers, you can toggle **Online Sync Mode** in the settings. This uses Firebase Cloud to backup all your wholesale, retail, and receipt registries in real-time under your own secure credentials.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-5 border-t border-slate-900 bg-slate-950 flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={handlePrev}
              className="text-xs text-slate-400 hover:text-white font-medium flex items-center space-x-1.5 transition-all p-2 rounded-lg hover:bg-slate-900"
              id="wizard-back-button"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div></div> // empty spacer
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 && !settings.storeName.trim()}
              className={`text-xs px-5 py-2 rounded-lg font-medium flex items-center space-x-1.5 transition-all ${
                step === 1 && !settings.storeName.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/10'
              }`}
              id="wizard-next-button"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="text-xs px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center space-x-1.5 transition-all shadow-lg shadow-emerald-500/10"
              id="wizard-launch-button"
            >
              <span>Launch MyShop</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
