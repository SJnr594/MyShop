import React, { useState } from 'react';
import { LoyaltyAccount, Promotion, StoreSettings, LoyaltySettings, UserProfile } from '../types';
import { 
  Gift, Tag, Award, Plus, Search, CheckCircle2, AlertCircle, Trash2, 
  Settings, Users, DollarSign, Percent, Sparkles, TrendingUp, Edit2, Check
} from 'lucide-react';

interface LoyaltyAndPromotionsProps {
  promotions: Promotion[];
  loyaltyAccounts: LoyaltyAccount[];
  settings: StoreSettings;
  activeProfile: UserProfile | null;
  onAddPromotion: (promo: Omit<Promotion, 'id' | 'usageCount'>) => void;
  onTogglePromotion: (id: string) => void;
  onDeletePromotion: (id: string) => void;
  onUpdateLoyaltySettings: (settings: LoyaltySettings) => void;
  onAdjustCustomerPoints: (customerId: string, pointsDelta: number, reason: string) => void;
  onAddLoyaltyCustomer: (customer: Omit<LoyaltyAccount, 'pointsBalance' | 'totalPointsEarned' | 'totalPointsRedeemed' | 'tier' | 'lastUpdated'>) => void;
}

export default function LoyaltyAndPromotions({
  promotions,
  loyaltyAccounts,
  settings,
  activeProfile,
  onAddPromotion,
  onTogglePromotion,
  onDeletePromotion,
  onUpdateLoyaltySettings,
  onAdjustCustomerPoints,
  onAddLoyaltyCustomer
}: LoyaltyAndPromotionsProps) {
  const [activeTab, setActiveTab] = useState<'promotions' | 'loyalty' | 'settings'>('promotions');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Promo Modal & Form
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoType, setPromoType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [promoValue, setPromoValue] = useState('10');
  const [promoMinOrder, setPromoMinOrder] = useState('20');
  const [promoExpiryDays, setPromoExpiryDays] = useState('90');

  // Customer Modal & Form
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');

  // Points Adjustment Modal
  const [adjustingCust, setAdjustingCust] = useState<LoyaltyAccount | null>(null);
  const [pointsDelta, setPointsDelta] = useState('20');
  const [adjustReason, setAdjustReason] = useState('Customer reward bonus');

  // Local Loyalty Settings
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(settings.loyaltySettings?.enabled ?? true);
  const [ptsPerUnit, setPtsPerUnit] = useState(settings.loyaltySettings?.pointsPerCurrencyUnit?.toString() || '0.1');
  const [currencyPerPt, setCurrencyPerPt] = useState(settings.loyaltySettings?.currencyPerPointRedeemed?.toString() || '0.05');
  const [minPts, setMinPts] = useState(settings.loyaltySettings?.minPointsToRedeem?.toString() || '20');

  // Submit Promo
  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim() || !promoTitle.trim()) {
      alert("Please provide promo code and title.");
      return;
    }

    const val = parseFloat(promoValue);
    if (isNaN(val) || val <= 0) {
      alert("Please provide a valid discount value.");
      return;
    }

    const expiryMs = parseInt(promoExpiryDays) * 24 * 60 * 60 * 1000;

    onAddPromotion({
      code: promoCode.trim().toUpperCase(),
      title: promoTitle.trim(),
      type: promoType,
      value: val,
      minOrderAmount: parseFloat(promoMinOrder) || undefined,
      startDate: Date.now(),
      endDate: expiryMs ? Date.now() + expiryMs : undefined,
      isActive: true
    });

    setShowPromoModal(false);
    setPromoCode('');
    setPromoTitle('');
    setPromoValue('10');
  };

  // Submit Customer
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      alert("Customer name and phone number are required.");
      return;
    }

    onAddLoyaltyCustomer({
      customerId: custPhone.trim(),
      customerName: custName.trim(),
      customerPhone: custPhone.trim()
    });

    setShowCustomerModal(false);
    setCustName('');
    setCustPhone('');
  };

  // Submit Adjustment
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingCust) return;
    const delta = parseInt(pointsDelta);
    if (isNaN(delta) || delta === 0) {
      alert("Please enter a non-zero points adjustment.");
      return;
    }

    onAdjustCustomerPoints(adjustingCust.customerId, delta, adjustReason.trim());
    setAdjustingCust(null);
    setPointsDelta('20');
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLoyaltySettings({
      enabled: loyaltyEnabled,
      pointsPerCurrencyUnit: parseFloat(ptsPerUnit) || 0.1,
      currencyPerPointRedeemed: parseFloat(currencyPerPt) || 0.05,
      minPointsToRedeem: parseInt(minPts) || 20
    });
    alert("Loyalty program parameters saved successfully!");
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300';
      case 'Gold': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300';
      case 'Silver': return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="loyalty-promotions-workspace">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Customer Loyalty Program & Promotional Discounts
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Drive customer retention with automated points accumulation, VIP tiers, and instant promotional coupon codes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {activeTab === 'promotions' && (
              <button
                onClick={() => setShowPromoModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                id="create-promo-btn"
                type="button"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Promo Code</span>
              </button>
            )}

            {activeTab === 'loyalty' && (
              <button
                onClick={() => setShowCustomerModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                id="register-loyalty-cust-btn"
                type="button"
              >
                <Plus className="w-4 h-4" />
                <span>+ Register VIP Customer</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex items-center space-x-2 mt-6 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('promotions')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'promotions'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Discount Coupons ({promotions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('loyalty')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'loyalty'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer Loyalty Accounts ({loyaltyAccounts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Program Rates & Rules</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROMOTIONS */}
      {activeTab === 'promotions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map(promo => (
            <div 
              key={promo.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm space-y-3 flex flex-col justify-between transition-all ${
                promo.isActive 
                  ? 'border-slate-200 dark:border-slate-800 hover:border-indigo-300' 
                  : 'border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-extrabold text-sm bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      {promo.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      promo.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {promo.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {promo.type === 'percentage' ? `${promo.value}% OFF` : `-${settings.currency}${promo.value.toFixed(2)}`}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 dark:text-white text-sm">{promo.title}</h3>

                <div className="text-xs text-slate-500 space-y-1 font-mono">
                  {promo.minOrderAmount && (
                    <div>Min. Basket: <strong className="text-slate-700 dark:text-slate-300">{settings.currency}{promo.minOrderAmount.toFixed(2)}</strong></div>
                  )}
                  {promo.endDate && (
                    <div>Expires: {new Date(promo.endDate).toLocaleDateString()}</div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Used: <strong>{promo.usageCount}</strong> times
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onTogglePromotion(promo.id)}
                    className={`text-xs font-bold px-2.5 py-1 rounded transition-all cursor-pointer ${
                      promo.isActive
                        ? 'text-amber-600 hover:bg-amber-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {promo.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete promotion "${promo.code}"?`)) {
                        onDeletePromotion(promo.id);
                      }
                    }}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 px-2.5 py-1 rounded hover:bg-rose-50 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: LOYALTY CUSTOMERS */}
      {activeTab === 'loyalty' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search VIP customer by phone number or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loyaltyAccounts
              .filter(c => !searchQuery || c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || c.customerPhone.includes(searchQuery))
              .map(cust => {
                const discountValue = cust.pointsBalance * (settings.loyaltySettings?.currencyPerPointRedeemed || 0.05);

                return (
                  <div
                    key={cust.customerId}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{cust.customerName}</h3>
                          <p className="text-xs text-slate-400 font-mono">{cust.customerPhone}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getTierColor(cust.tier)}`}>
                          ★ {cust.tier}
                        </span>
                      </div>

                      {/* Points Balance Card */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase block">Available Points</span>
                          <span className="text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                            {cust.pointsBalance} pts
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase block">Cash Value</span>
                          <span className="text-xs font-bold font-mono text-emerald-600">
                            {settings.currency}{discountValue.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono text-slate-500 flex justify-between">
                        <span>Lifetime Earned: <strong>{cust.totalPointsEarned}</strong></span>
                        <span>Redeemed: <strong>{cust.totalPointsRedeemed}</strong></span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={() => {
                          setAdjustingCust(cust);
                          setPointsDelta('20');
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Adjust / Gift Points
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: PROGRAM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-sm block">Enable Customer Loyalty System</span>
                <p className="text-slate-400 text-[11px]">Automatically credit customer accounts based on checkout spend</p>
              </div>
              <input
                type="checkbox"
                checked={loyaltyEnabled}
                onChange={(e) => setLoyaltyEnabled(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Points Accrual Rate (Points per {settings.currency}1 spent)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={ptsPerUnit}
                onChange={(e) => setPtsPerUnit(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">e.g. 0.1 means 1 point earned for every {settings.currency}10 spent.</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Point Redemption Cash Value ({settings.currency} discount per point)
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={currencyPerPt}
                onChange={(e) => setCurrencyPerPt(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">e.g. 0.05 means 100 points = {settings.currency}5.00 discount at checkout.</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Minimum Points Threshold for Redemption
              </label>
              <input
                type="number"
                min="1"
                value={minPts}
                onChange={(e) => setMinPts(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Save Program Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 1. MODAL: CREATE PROMOTION */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl my-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-xl">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Discount Promo Coupon</h3>
                <p className="text-xs text-slate-500">Configure storewide or bulk order promo codes</p>
              </div>
            </div>

            <form onSubmit={handlePromoSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAVE20"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Discount Type</label>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount ({settings.currency})</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Promo Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 20% Off Weekend Wholesale Orders"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Value {promoType === 'percentage' ? '(%)' : `(${settings.currency})`} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={promoValue}
                    onChange={(e) => setPromoValue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Min. Order Amount ({settings.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={promoMinOrder}
                    onChange={(e) => setPromoMinOrder(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Validity (Days from Today)</label>
                <input
                  type="number"
                  min="1"
                  value={promoExpiryDays}
                  onChange={(e) => setPromoExpiryDays(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Create Promo Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: REGISTER VIP CUSTOMER */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Register Loyalty Customer</h3>
                <p className="text-xs text-slate-500">Enroll new customer into loyalty points program</p>
              </div>
            </div>

            <form onSubmit={handleCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number (Loyalty ID) *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0551234567"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL: ADJUST / GIFT POINTS */}
      {adjustingCust && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Adjust Loyalty Points</h3>
                <p className="text-xs text-slate-500">Customer: <strong>{adjustingCust.customerName}</strong> ({adjustingCust.pointsBalance} pts)</p>
              </div>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Points Delta (+ or -) *</label>
                <input
                  type="number"
                  required
                  placeholder="+50 or -20"
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reason / Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP goodwill bonus"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingCust(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  Apply Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
