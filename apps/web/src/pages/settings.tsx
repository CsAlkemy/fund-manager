import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { assetUrl } from '@/lib/api';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';
import {
  Sun, Moon, Monitor, Bell, BellOff, Shield, Globe,
  ChevronRight, Palette, Lock, Database, Info,
} from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export default function SettingsPage() {
  const { user, isSuperAdmin, logout } = useAuth();

  // Theme
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('theme') as Theme) || 'light';
    return 'light';
  });

  // Notifications
  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('notifications') !== 'false';
    return true;
  });

  // Language
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('language') || 'en';
    return 'en';
  });

  // Modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const saveTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('theme', t);
    toast.success(`Theme set to ${t}`);
  };

  const toggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem('notifications', String(next));
    toast.success(next ? 'Notifications enabled' : 'Notifications disabled');
  };

  const saveLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    toast.success('Language updated');
  };

  const selectCls = "rounded-lg border border-gray-200 pl-3 pr-10 py-2.5 text-sm outline-none focus:border-brand-primary bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%226%22%20viewBox%3D%220%200%2010%206%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M5%206L0%200h10z%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_12px_center] bg-no-repeat";

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-sm text-gray-500 mb-8">Manage your preferences</p>

        {/* Appearance */}
        <div className="rounded-xl bg-white border border-gray-100 mb-6">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-gray-400" /> Appearance
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">Choose your preferred theme</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'light' as Theme, label: 'Light', icon: Sun, desc: 'Default light' },
                { key: 'dark' as Theme, label: 'Dark', icon: Moon, desc: 'Coming soon' },
                { key: 'system' as Theme, label: 'System', icon: Monitor, desc: 'Match OS' },
              ]).map(({ key, label, icon: Icon, desc }) => (
                <button
                  key={key}
                  onClick={() => key !== 'dark' ? saveTheme(key) : toast('Dark mode coming soon!')}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-colors',
                    theme === key ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100 hover:border-gray-200',
                    key === 'dark' && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Icon className={cn('w-5 h-5 mb-2', theme === key ? 'text-brand-primary' : 'text-gray-400')} />
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl bg-white border border-gray-100 mb-6">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-400" /> Notifications
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">Push Notifications</p>
                <p className="text-xs text-gray-400">Get notified about payment verifications and fines</p>
              </div>
              <button
                onClick={toggleNotifications}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  notifications ? 'bg-brand-primary' : 'bg-gray-200'
                )}
              >
                <span className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                  notifications ? 'translate-x-6' : 'translate-x-1'
                )} />
              </button>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">Email Notifications</p>
                <p className="text-xs text-gray-400">Monthly summaries and payment reminders</p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">Coming soon</span>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="rounded-xl bg-white border border-gray-100 mb-6">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" /> Language & Region
            </h2>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900">Language</p>
              <p className="text-xs text-gray-400">Choose your display language</p>
            </div>
            <select value={language} onChange={(e) => saveLanguage(e.target.value)} className={selectCls}>
              <option value="en">English</option>
              <option value="bn">বাংলা (Bangla)</option>
            </select>
          </div>
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-50">
            <div>
              <p className="text-sm text-gray-900">Currency</p>
              <p className="text-xs text-gray-400">Display currency format</p>
            </div>
            <span className="text-sm font-medium text-gray-700">৳ BDT (Taka)</span>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-xl bg-white border border-gray-100 mb-6">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" /> Security
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">Authentication</p>
                <p className="text-xs text-gray-400">Email OTP (one-time password)</p>
              </div>
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
              </span>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">Active Sessions</p>
                <p className="text-xs text-gray-400">Manage your logged-in devices</p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">1 session</span>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900">Sign out everywhere</p>
                <p className="text-xs text-gray-400">Log out from all devices</p>
              </div>
              <button onClick={logout} className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50">
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Platform Info (Super Admin) */}
        {isSuperAdmin && (
          <div className="rounded-xl bg-white border border-gray-100 mb-6">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-gray-400" /> Platform
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              <div className="px-6 py-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">Default OTP (Staging)</p>
                <span className="text-sm font-mono text-gray-700 bg-gray-50 px-3 py-1 rounded">000000</span>
              </div>
              <div className="px-6 py-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">API Docs</p>
                <a href={assetUrl('/docs')} target="_blank" rel="noreferrer" className="text-xs text-brand-primary hover:underline">
                  Open Swagger →
                </a>
              </div>
              <div className="px-6 py-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">Database</p>
                <span className="text-xs text-gray-400">PostgreSQL</span>
              </div>
            </div>
          </div>
        )}

        {/* About */}
        <div className="rounded-xl bg-white border border-gray-100 mb-6">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400" /> About
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="px-6 py-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">Version</p>
              <span className="text-sm text-gray-700">1.0.0</span>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">Built with</p>
              <span className="text-xs text-gray-400">Next.js · NestJS · PostgreSQL</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl bg-white border border-red-100 mb-6">
          <div className="px-6 py-4 border-b border-red-50">
            <h2 className="text-sm font-semibold text-red-600 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Danger Zone
            </h2>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900">Delete Account</p>
              <p className="text-xs text-gray-400">Permanently delete your account and all data</p>
            </div>
            <button onClick={() => setShowDeleteConfirm(true)} className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50">
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Account">
        <div className="text-center py-4">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm text-gray-900 font-medium mb-1">Are you sure?</p>
          <p className="text-xs text-gray-500 mb-6">This action cannot be undone. All your data will be permanently deleted.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={() => { toast.error('Account deletion not implemented yet'); setShowDeleteConfirm(false); }} className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600">
              Delete Forever
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
