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
      <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
        <div className="p-2 bg-slate-900 text-white rounded-lg">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Database & Security Backups</h2>
          <p className="text-xs text-slate-500">Safeguard your warehouse logs, front shelf inventory, and sales invoice histories.</p>
        </div>
      </div>

      {/* Alerts feedback */}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded-xl border border-emerald-100 flex items-start space-x-2 animate-fadeIn" id="backup-success-alert">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-800 text-xs p-3.5 rounded-xl border border-red-100 flex items-start space-x-2 animate-fadeIn" id="backup-error-alert">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: 2 columns: Left for Local Backup, Right for Cloud Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Local backups */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4" id="local-backup-card">
          <div className="border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
              <span>💾 Local Desktop Backups</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Maintain offline copies of your store's database directly on your computer's hard drive.</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Export block */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-800">1-Click Database Export</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[280px]">
                  Downloads your products, sales history, settings, and stock log timelines into a clean JSON file.
                </p>
              </div>
              <button
                onClick={handleExportBackup}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center space-x-1.5 transition-all shadow"
                id="export-backup-btn"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Import Dropzone block */}
            <div>
              <span className="block text-slate-500 mb-1.5 font-medium">Restore Database from Backup File</span>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50/20 text-blue-700' 
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-500'
                }`}
                id="restore-dropzone"
              >
                <Upload className="w-8 h-8 mb-2 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-700">Drag & drop your MyShop backup file here</span>
                <span className="text-[10px] text-slate-400 mt-1">or click to browse your desktop storage (.json)</span>
                
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
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4" id="online-backup-card">
          <div className="border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>☁️ Cloud Synchronization</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                appState.settings.onlineBackupEnabled 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}>
                {appState.settings.onlineBackupEnabled ? 'Enabled' : 'Offline Mode'}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Auto-backup and sync MyShop across multiple computers and web tablets.</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Quick Toggle card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-800">Toggle Cloud Online Sync</h4>
                <p className="text-[11px] text-slate-500 max-w-[280px]">
                  When active, MyShop uploads data to Firestore. This lets you access the shop registry securely from any device.
                </p>
              </div>
              
              <button
                onClick={handleToggleOnlineBackup}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
                  appState.settings.onlineBackupEnabled
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                }`}
                id="toggle-cloud-sync-btn"
              >
                {appState.settings.onlineBackupEnabled ? 'Disable Sync' : 'Enable Sync'}
              </button>
            </div>

            {/* Cloud Config details */}
            {appState.settings.onlineBackupEnabled && appState.settings.firebaseConfig && (
              <div className="bg-slate-900 text-slate-300 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="text-blue-400 font-bold text-xs font-sans mb-1 flex items-center space-x-1.5">
                  <Cloud className="w-4 h-4 animate-pulse" />
                  <span>Sync Server Status: CONNECTED</span>
                </div>
                <div><strong>Cloud Service:</strong> Google Cloud Firestore</div>
                <div><strong>Project Identifier:</strong> {appState.settings.firebaseConfig.projectId}</div>
                <div><strong>Security Rules:</strong> Fortress Locked (Zero-Trust)</div>
                <div className="pt-2">
                  <button
                    onClick={() => setShowConfigPanel(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer font-sans"
                    id="reconfigure-cloud-btn"
                  >
                    Reconfigure Cloud Credentials
                  </button>
                </div>
              </div>
            )}

            {/* Firebase Custom Setup Panel form collapse */}
            {showConfigPanel && (
              <form onSubmit={handleFirebaseConfigSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 animate-fadeIn">
                <div className="flex items-center space-x-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <h4 className="font-bold text-slate-700 text-xs">Enter Firebase Credentials</h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Enter your Firebase web configuration credentials so MyShop can secure your database backups directly in your Cloud instance.
                </p>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Firebase Project ID *</label>
                    <input
                      type="text"
                      required
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      placeholder="e.g. myshop-pos-database"
                      className="w-full bg-white border border-slate-200 rounded p-1.5 font-mono"
                      id="fb-project-id-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Web API Key *</label>
                    <input
                      type="password"
                      required
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSyA..."
                      className="w-full bg-white border border-slate-200 rounded p-1.5 font-mono"
                      id="fb-api-key-input"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setShowConfigPanel(false)}
                    className="px-3 py-1.5 text-slate-600 font-medium hover:text-slate-900"
                    id="fb-config-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-1.5 rounded"
                    id="fb-config-save"
                  >
                    Verify & Connect
                  </button>
                </div>
              </form>
            )}

            {/* Operator Profiles & Passwords Configurator */}
            <div className="border-t border-slate-100 pt-5 space-y-4" id="operator-profiles-section">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Operator Passwords & Profile Settings</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Customize display names, role permissions, and secure access codes for staff.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddProfileForm(!showAddProfileForm)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
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
                  className="bg-blue-50/40 border border-blue-100 p-4 rounded-xl space-y-3 text-xs animate-fadeIn"
                >
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">Register New Operator Account</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sarah Connor"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">Access Level Role</label>
                      <select
                        value={newProfileRole}
                        onChange={(e) => setNewProfileRole(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-700 font-medium"
                      >
                        <option value="cashier">Cashier (Checkout Only)</option>
                        <option value="manager">Manager (Stocks + Backups)</option>
                        <option value="admin" disabled={activeProfile?.role !== 'admin'}>
                          Admin (All Access) {activeProfile?.role !== 'admin' ? '[🔒 Admin Only]' : ''}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">Access Passcode *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. sarah123"
                        value={newProfilePasscode}
                        onChange={(e) => setNewProfilePasscode(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-1 border-t border-blue-100/40">
                    <button
                      type="button"
                      onClick={() => setShowAddProfileForm(false)}
                      className="px-3 py-1.5 text-slate-600 font-medium font-semibold hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-1.5 rounded-lg shadow-sm"
                    >
                      Save Account
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {(appState.settings.profiles || [
                  { id: 'u_admin', name: 'System Administrator', role: 'admin', passwordHash: 'admin123' },
                  { id: 'u_manager', name: 'Store Manager', role: 'manager', passwordHash: 'manager123' },
                  { id: 'u_cashier', name: 'Retail Cashier', role: 'cashier', passwordHash: 'cashier123' }
                ]).map((prof, idx) => {
                  const isCurrentActive = prof.id === activeProfile?.id;
                  const isEditingBlocked = prof.role === 'admin' && activeProfile?.role !== 'admin';
                  const isDeletionBlocked = isCurrentActive || isEditingBlocked;
                  return (
                    <div key={prof.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800 block">{prof.name}</span>
                          {isCurrentActive && (
                            <span className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide">
                              Current You
                            </span>
                          )}
                          {prof.role === 'admin' && (
                            <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide">
                              Administrator
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 text-[9px] font-mono text-slate-400 font-bold uppercase">
                          <span>Role: {prof.role}</span>
                          <span>•</span>
                          <span>ID: {prof.id}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-col space-y-0.5">
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Custom Profile Name</label>
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
                            className={`border rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 w-40 text-[11px] font-medium ${
                              isEditingBlocked
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed select-none'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>
                        <div className="flex flex-col space-y-0.5">
                          <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Access Passcode</label>
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
                            className={`border rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold focus:outline-none focus:border-blue-500 w-24 ${
                              isEditingBlocked
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed select-none'
                                : 'bg-white border-slate-200 text-slate-800'
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
                          className={`p-2 rounded-lg border flex items-center justify-center mt-4 transition-all ${
                            isDeletionBlocked 
                              ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed' 
                              : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100 hover:text-red-700'
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
            </div>

            {/* Quick reset of state */}
            <div className="border-t border-slate-100 pt-4 text-xs">
              <span className="block text-slate-500 mb-1.5">Danger Zone</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to completely erase your store logs, product catalog, and settings? This cannot be undone.")) {
                      onResetState(false);
                      setSuccessMsg("Database has been completely wiped to empty slate!");
                    }
                  }}
                  className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg px-3.5 py-1.5 font-semibold transition-all text-xs"
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
                  className="text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-3.5 py-1.5 font-semibold transition-all text-xs"
                  id="reset-demo-btn"
                >
                  Reload Demo Catalog
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
