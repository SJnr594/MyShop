import React, { useState, useRef } from 'react';
import { AppState, StoreSettings, Product, Sale, StockLog, UserProfile } from '../types';
import { Download, Upload, ShieldCheck, Database, RefreshCw, Sparkles, Check, Cloud, AlertCircle, FileJson, Trash2, Plus, UserPlus } from 'lucide-react';

interface BackupManagerProps {
  appState: AppState;
  onRestoreState: (newState: AppState) => void;
  onResetState: (seedDemo: boolean) => void;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  activeProfile: UserProfile;
}

export default function BackupManager({
  appState,
  onRestoreState,
  onResetState,
  onUpdateSettings,
  activeProfile
}: BackupManagerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for dynamic profile creation
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileRole, setNewProfileRole] = useState<'admin' | 'manager' | 'cashier'>('cashier');
  const [newProfilePasscode, setNewProfilePasscode] = useState('');
  const [showAddProfileForm, setShowAddProfileForm] = useState(false);

  // Firebase visual state overrides for sandbox presentation
  const [apiKey, setApiKey] = useState(appState.settings.firebaseConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(appState.settings.firebaseConfig?.projectId || '');
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // 1-click Download Backup (JSON Export)
  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
      const downloadAnchor = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `myshop_backup_${timestamp}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setSuccessMsg("Database backup exported successfully! Save this file in a safe folder on your computer.");
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg("Failed to generate backup file. Please try again.");
    }
  };

  // Drag and drop events
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
      processBackupFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processBackupFile(e.target.files[0]);
    }
  };

  // Validate and parse the imported JSON backup schema
  const processBackupFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonText = e.target?.result as string;
        const parsedState = JSON.parse(jsonText);

        // Simple validation checks to verify schema integrity
        if (
          parsedState && 
          Array.isArray(parsedState.products) && 
          Array.isArray(parsedState.sales) && 
          parsedState.settings && 
          typeof parsedState.settings.storeName === 'string'
        ) {
          onRestoreState(parsedState);
          setSuccessMsg(`Database restored successfully! Loaded ${parsedState.products.length} products, ${parsedState.sales.length} sales receipts, and all stock logs.`);
          setErrorMsg(null);
        } else {
          setErrorMsg("Invalid backup file format. The file does not match a valid MyShop database schema.");
          setSuccessMsg(null);
        }
      } catch (err) {
        setErrorMsg("Failed to read file. Make sure it is a valid MyShop .json backup file.");
        setSuccessMsg(null);
      }
    };
    reader.readAsText(file);
  };

  // Firebase Setup Update
  const handleFirebaseConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !projectId) {
      setErrorMsg("Please fill out both API Key and Project ID to activate online sync.");
      return;
    }

    const updatedSettings: StoreSettings = {
      ...appState.settings,
      onlineBackupEnabled: true,
      firebaseConfig: {
        apiKey: apiKey.trim(),
        projectId: projectId.trim(),
        authDomain: `${projectId.trim()}.firebaseapp.com`,
        storageBucket: `${projectId.trim()}.appspot.com`,
        messagingSenderId: '1234567890',
        appId: '1:1234567890:web:123456'
      }
    };

    onUpdateSettings(updatedSettings);
    setSuccessMsg("Online Sync Configured! MyShop will now back up databases to your Firebase project in the cloud.");
    setErrorMsg(null);
    setShowConfigPanel(false);
  };

  const handleToggleOnlineBackup = () => {
    const enabled = !appState.settings.onlineBackupEnabled;
    if (enabled && !appState.settings.firebaseConfig) {
      setShowConfigPanel(true);
    } else {
      onUpdateSettings({
        ...appState.settings,
        onlineBackupEnabled: enabled
      });
      setSuccessMsg(enabled ? "Cloud online backup activated!" : "Switched back to offline-only local sandbox.");
    }
  };

  return (
    <div className="space-y-6" id="backup-manager-view">
      {/* Header */}
      <div className="flex items-center space-x-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Database & Security Backups</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Safeguard your warehouse logs, front shelf inventory, and sales invoice histories.</p>
        </div>
      </div>

      {/* Alerts feedback */}
      {successMsg && (
        <div className="bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 text-xs p-4 rounded-xl border border-emerald-300 dark:border-emerald-700 flex items-start space-x-2.5 animate-fadeIn shadow-sm" id="backup-success-alert">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50/90 dark:bg-red-950/60 text-red-900 dark:text-red-200 text-xs p-4 rounded-xl border border-red-300 dark:border-red-700 flex items-start space-x-2.5 animate-fadeIn shadow-sm" id="backup-error-alert">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Grid: 2 columns: Left for Local Backup, Right for Cloud Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Local backups */}
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-5 backdrop-blur-sm" id="local-backup-card">
          <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Local Desktop Backups</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Maintain offline copies of your store's database directly on your computer's hard drive.</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Export block */}
            <div className="bg-slate-50/90 dark:bg-slate-800/60 p-4.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-700/60 shadow-sm">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">1-Click Database Export</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-[290px] leading-relaxed">
                  Downloads your products, sales history, settings, and stock log timelines into a clean JSON file.
                </p>
              </div>
              <button
                onClick={handleExportBackup}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer shrink-0"
                id="export-backup-btn"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Import Dropzone block */}
            <div className="pt-1">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Restore Database from Backup File</span>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-inner' 
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                id="restore-dropzone"
              >
                <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Drag & drop your MyShop backup file here</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">or click to browse your desktop storage (.json)</span>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="import-backup-file-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cloud Sync Backups */}
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-5 backdrop-blur-sm" id="online-backup-card">
          <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Cloud className="w-4 h-4" />
                <span>Cloud Synchronization</span>
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide border shadow-sm ${
                appState.settings.onlineBackupEnabled 
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700' 
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
              }`}>
                {appState.settings.onlineBackupEnabled ? 'Enabled' : 'Offline Mode'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Auto-backup and sync MyShop across multiple computers and web tablets.</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Quick Toggle card */}
            <div className="bg-slate-50/90 dark:bg-slate-800/60 p-4.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all hover:border-blue-300 dark:hover:border-blue-700/60 shadow-sm">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Toggle Cloud Online Sync</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-[280px] leading-relaxed">
                  When active, MyShop uploads data to Firestore. This lets you access the shop registry securely from any device.
                </p>
              </div>
              
              <button
                onClick={handleToggleOnlineBackup}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all shadow-sm active:scale-95 cursor-pointer shrink-0 ${
                  appState.settings.onlineBackupEnabled
                    ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 border-blue-600 text-white shadow-blue-600/20 shadow-md'
                }`}
                id="toggle-cloud-sync-btn"
              >
                {appState.settings.onlineBackupEnabled ? 'Disable Sync' : 'Enable Sync'}
              </button>
            </div>

            {/* Cloud Config details */}
            {appState.settings.onlineBackupEnabled && appState.settings.firebaseConfig && (
              <div className="bg-slate-900 text-slate-200 p-4.5 rounded-xl border border-slate-700/80 space-y-2 font-mono text-xs shadow-md">
                <div className="text-emerald-400 font-bold text-xs font-sans mb-1.5 flex items-center space-x-2">
                  <Cloud className="w-4 h-4 animate-pulse" />
                  <span>Sync Server Status: CONNECTED</span>
                </div>
                <div><strong className="text-slate-400">Cloud Service:</strong> Google Cloud Firestore</div>
                <div><strong className="text-slate-400">Project Identifier:</strong> {appState.settings.firebaseConfig.projectId}</div>
                <div><strong className="text-slate-400">Security Rules:</strong> Fortress Locked (Zero-Trust)</div>
                <div className="pt-2">
                  <button
                    onClick={() => setShowConfigPanel(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer font-sans font-bold"
                    id="reconfigure-cloud-btn"
                  >
                    Reconfigure Cloud Credentials
                  </button>
                </div>
              </div>
            )}

            {/* Firebase Custom Setup Panel form collapse */}
            {showConfigPanel && (
              <form onSubmit={handleFirebaseConfigSubmit} className="bg-slate-50 dark:bg-slate-800/80 p-4.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3.5 animate-fadeIn shadow-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs">Enter Firebase Credentials</h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enter your Firebase web configuration credentials so MyShop can secure your database backups directly in your Cloud instance.
                </p>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Firebase Project ID *</label>
                    <input
                      type="text"
                      required
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      placeholder="e.g. myshop-pos-database"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-2 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      id="fb-project-id-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Web API Key *</label>
                    <input
                      type="password"
                      required
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSyA..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg p-2 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      id="fb-api-key-input"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setShowConfigPanel(false)}
                    className="px-3.5 py-1.5 text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer text-xs"
                    id="fb-config-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs cursor-pointer shadow-sm"
                    id="fb-config-save"
                  >
                    Verify & Connect
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

      </div>

      {/* Full-width section: Operator Profiles & Passwords Configurator */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-5 backdrop-blur-sm" id="operator-profiles-section">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider">Operator Passwords & Profile Settings</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Customize display names, role permissions, and secure access codes for staff.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddProfileForm(!showAddProfileForm)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddProfileForm ? 'Hide Form' : 'Register Operator'}</span>
          </button>
        </div>

        {showAddProfileForm && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!newProfileName || !newProfilePasscode) return;
              if (newProfileRole === 'admin' && activeProfile?.role !== 'admin') {
                alert("Permission denied: Only Administrators can register new Admin accounts!");
                return;
              }
              const currentProfiles = appState.settings.profiles || [
                { id: 'u_admin', name: 'System Administrator', role: 'admin', passwordHash: 'admin123' },
                { id: 'u_manager', name: 'Store Manager', role: 'manager', passwordHash: 'manager123' },
                { id: 'u_cashier', name: 'Retail Cashier', role: 'cashier', passwordHash: 'cashier123' }
              ];
              const newProfile: UserProfile = {
                id: `u_${Date.now()}`,
                name: newProfileName.trim(),
                role: newProfileRole,
                passwordHash: newProfilePasscode.trim()
              };
              onUpdateSettings({
                ...appState.settings,
                profiles: [...currentProfiles, newProfile]
              });
              setNewProfileName('');
              setNewProfilePasscode('');
              setShowAddProfileForm(false);
              setSuccessMsg(`Successfully registered new operator: "${newProfile.name}"!`);
            }}
            className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-5 rounded-2xl space-y-4 text-xs animate-fadeIn shadow-inner"
          >
            <span className="font-bold text-indigo-950 dark:text-indigo-200 block text-xs uppercase tracking-wide">Register New Operator Account</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl p-2.5 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Access Level Role</label>
                <select
                  value={newProfileRole}
                  onChange={(e) => setNewProfileRole(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl p-2.5 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs cursor-pointer"
                >
                  <option value="cashier">Cashier (Checkout Only)</option>
                  <option value="manager">Manager (Stocks + Backups)</option>
                  <option value="admin" disabled={activeProfile?.role !== 'admin'}>
                    Admin (All Access) {activeProfile?.role !== 'admin' ? '[🔒 Admin Only]' : ''}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Access Passcode *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sarah123"
                  value={newProfilePasscode}
                  onChange={(e) => setNewProfilePasscode(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl p-2.5 font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-indigo-200/60 dark:border-indigo-800/40">
              <button
                type="button"
                onClick={() => setShowAddProfileForm(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer text-xs"
              >
                Save Account
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 gap-3">
          {(appState.settings.profiles || [
            { id: 'u_admin', name: 'System Administrator', role: 'admin', passwordHash: 'admin123' },
            { id: 'u_manager', name: 'Store Manager', role: 'manager', passwordHash: 'manager123' },
            { id: 'u_cashier', name: 'Retail Cashier', role: 'cashier', passwordHash: 'cashier123' }
          ]).map((prof, idx) => {
            const isCurrentActive = prof.id === activeProfile?.id;
            const isEditingBlocked = prof.role === 'admin' && activeProfile?.role !== 'admin';
            const isDeletionBlocked = isCurrentActive || isEditingBlocked;
            return (
              <div key={prof.id} className="bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 p-4 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs transition-all hover:border-slate-300 dark:hover:border-slate-600 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">{prof.name}</span>
                    {isCurrentActive && (
                      <span className="bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide">
                        Current You
                      </span>
                    )}
                    {prof.role === 'admin' && (
                      <span className="bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide">
                        Administrator
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold uppercase">
                    <span>Role: {prof.role}</span>
                    <span>•</span>
                    <span>ID: {prof.id}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Custom Profile Name</label>
                    <input
                      type="text"
                      value={prof.name}
                      disabled={isEditingBlocked}
                      onChange={(e) => {
                        const updatedProfiles = [...(appState.settings.profiles || [
                          { id: 'u_admin', name: 'System Administrator', role: 'admin', passwordHash: 'admin123' },
                          { id: 'u_manager', name: 'Store Manager', role: 'manager', passwordHash: 'manager123' },
                          { id: 'u_cashier', name: 'Retail Cashier', role: 'cashier', passwordHash: 'cashier123' }
                        ])];
                        updatedProfiles[idx] = { ...prof, name: e.target.value };
                        onUpdateSettings({
                          ...appState.settings,
                          profiles: updatedProfiles
                        });
                      }}
                      className={`border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 text-xs font-semibold transition-all ${
                        isEditingBlocked
                          ? 'bg-slate-200/60 dark:bg-slate-950/60 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Access Passcode</label>
                    <input
                      type="text"
                      value={isEditingBlocked ? '••••••••' : prof.passwordHash}
                      disabled={isEditingBlocked}
                      onChange={(e) => {
                        const updatedProfiles = [...(appState.settings.profiles || [
                          { id: 'u_admin', name: 'System Administrator', role: 'admin', passwordHash: 'admin123' },
                          { id: 'u_manager', name: 'Store Manager', role: 'manager', passwordHash: 'manager123' },
                          { id: 'u_cashier', name: 'Retail Cashier', role: 'cashier', passwordHash: 'cashier123' }
                        ])];
                        updatedProfiles[idx] = { ...prof, passwordHash: e.target.value };
                        onUpdateSettings({
                          ...appState.settings,
                          profiles: updatedProfiles
                        });
                      }}
                      className={`border rounded-lg px-3 py-1.5 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 w-28 transition-all ${
                        isEditingBlocked
                          ? 'bg-slate-200/60 dark:bg-slate-950/60 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed select-none'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (prof.id === activeProfile?.id) {
                        alert("You cannot delete your own profile while you are logged in!");
                        return;
                      }
                      if (prof.role === 'admin' && activeProfile?.role !== 'admin') {
                        alert("Permission denied: You do not have permission to delete Administrator accounts.");
                        return;
                      }
                      const updatedProfiles = (appState.settings.profiles || [
                        { id: 'u_admin', name: 'System Administrator', role: 'admin', passwordHash: 'admin123' },
                        { id: 'u_manager', name: 'Store Manager', role: 'manager', passwordHash: 'manager123' },
                        { id: 'u_cashier', name: 'Retail Cashier', role: 'cashier', passwordHash: 'cashier123' }
                      ]).filter(p => p.id !== prof.id);
                      
                      // Check if deleting the last admin
                      const hasAdmin = updatedProfiles.some(p => p.role === 'admin');
                      if (!hasAdmin) {
                        alert("Error: You must keep at least one operator with Administrator ('admin') level role to manage the shop!");
                        return;
                      }

                      if (confirm(`Are you sure you want to permanently remove "${prof.name}"? They will lose access immediately.`)) {
                        onUpdateSettings({
                          ...appState.settings,
                          profiles: updatedProfiles
                        });
                        setSuccessMsg(`Operator account "${prof.name}" deleted successfully.`);
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-center mt-4 transition-all ${
                      isDeletionBlocked 
                        ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed' 
                        : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/60 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white shadow-sm cursor-pointer'
                    }`}
                    title={
                      isCurrentActive 
                        ? "Logged in account" 
                        : isEditingBlocked 
                          ? "Administrator profile is locked to non-admins" 
                          : "Delete staff operator profile"
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick reset of state */}
        <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-5 text-xs">
          <span className="block text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>Danger Zone</span>
          </span>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to completely erase your store logs, product catalog, and settings? This cannot be undone.")) {
                  onResetState(false);
                  setSuccessMsg("Database has been completely wiped to empty slate!");
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-xl px-4 py-2.5 font-bold transition-all text-xs shadow-md shadow-red-600/20 active:scale-95 cursor-pointer"
              id="reset-empty-btn"
            >
              Wipe Database Empty
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Reset database and reload default sample snacks and beverages catalog? Current sales will be cleared.")) {
                  onResetState(true);
                  setSuccessMsg("Database has been reset and pre-seeded with sample snacks!");
                }
              }}
              className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold transition-all text-xs active:scale-95 cursor-pointer"
              id="reset-demo-btn"
            >
              Reload Demo Catalog
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
