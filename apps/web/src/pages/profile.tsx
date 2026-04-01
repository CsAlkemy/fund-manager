import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Mail, Phone, Wallet, Shield, Users, Pen, Lock, Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function ProfilePage() {
  const { user, isSuperAdmin, refresh } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const isManager = !isSuperAdmin && (user?.memberships?.some((m) => m.role === 'MANAGER') || false);

  const roleLabel = isSuperAdmin ? 'Super Admin' : isManager ? 'Manager' : 'Member';
  const avatarColor = isSuperAdmin ? 'from-red-500 to-red-700' : isManager ? 'from-purple-500 to-purple-700' : 'from-brand-primary to-green-700';
  const roleBadgeBg = isSuperAdmin ? 'bg-red-500/20 text-red-200 border-red-400/30' : isManager ? 'bg-purple-500/20 text-purple-200 border-purple-400/30' : 'bg-white/20 text-white/90 border-white/30';

  const form = useForm({
    defaultValues: { name: '', phone: '', bkashNumber: '' },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        phone: user.phone || '',
        bkashNumber: user.bkashNumber || '',
      });
    }
  }, [user, form]);

  const onSubmit = async (data: any) => {
    try {
      await api.post('/auth/register', data);
      toast.success('Profile updated!');
      setShowEdit(false);
      await refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const joined = user?.memberships?.[0] ? 'Active member' : 'No group yet';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">

        {/* Hero Card */}
        <div className="rounded-2xl overflow-hidden mb-6 bg-white border border-gray-100 shadow-sm">
          {/* Banner */}
          <div className={cn('relative h-32 bg-gradient-to-br', avatarColor)}>
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-8 w-20 h-20 rounded-full border-2 border-white" />
              <div className="absolute top-10 right-20 w-12 h-12 rounded-full border-2 border-white" />
              <div className="absolute -bottom-4 left-12 w-16 h-16 rounded-full border-2 border-white" />
            </div>

            {/* Edit button */}
            <button
              onClick={() => setShowEdit(true)}
              className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Pen className="w-3 h-3" /> Edit Profile
            </button>

            {/* Role badge */}
            <div className="absolute top-4 left-4">
              <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border', roleBadgeBg)}>
                <Shield className="w-3 h-3" /> {roleLabel}
              </span>
            </div>
          </div>

          {/* Avatar + Name */}
          <div className="relative px-6 pb-6">
            <div className={cn('absolute -top-10 left-6 h-20 w-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg', avatarColor)}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="pt-14">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Personal Info */}
          <div className="rounded-xl bg-white border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" /> Personal Info
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-500 mt-0.5"><Mail className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Lock className="w-3 h-3 text-gray-300" />
                    <span className="text-[10px] text-gray-400">Cannot be changed</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-50 text-green-500 mt-0.5"><Phone className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{user?.phone || <span className="text-gray-300 italic">Not set</span>}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-pink-50 text-pink-500 mt-0.5"><Wallet className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-gray-400">bKash Number</p>
                  <p className="text-sm font-medium text-gray-900">{user?.bkashNumber || <span className="text-gray-300 italic">Not set</span>}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Group Info */}
          <div className="rounded-xl bg-white border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" /> Fund Group
            </h3>
            {user?.memberships && user.memberships.length > 0 ? (
              <div className="space-y-4">
                {user.memberships.map((m) => (
                  <div key={m.group.id} className="flex items-center gap-3">
                    <div className={cn('h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold', avatarColor)}>
                      {m.group.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{m.group.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium',
                          m.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                        )}>{m.role}</span>
                        <span className="text-[10px] text-gray-400">{joined}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">No group assigned</p>
                <p className="text-xs text-gray-400 mt-0.5">Your manager will add you</p>
              </div>
            )}

          </div>
        </div>

        {/* Security section */}
        <div className="rounded-xl bg-white border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" /> Security
          </h3>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-gray-900">Authentication</p>
              <p className="text-xs text-gray-400">Email OTP (one-time password)</p>
            </div>
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
            </span>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Profile">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed pl-10"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              {...form.register('name')}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              {...form.register('phone')}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              placeholder="+880 1XXX XXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">bKash Number</label>
            <input
              {...form.register('bkashNumber')}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              placeholder="01XXX XXXXXX"
            />
          </div>
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
