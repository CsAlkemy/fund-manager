import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n/useTranslation';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface GroupInfo {
  name: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  status: string;
  memberCount: number;
}

export default function InvitePage() {
  const router = useRouter();
  const { code } = router.query;
  const { user, loading: authLoading } = useAuth(false);
  const { t } = useTranslation();
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    api.get(`/invite/${code}`)
      .then((res) => setGroup(res.data))
      .catch(() => setError('Invalid or expired invite link'))
      .finally(() => setLoading(false));
  }, [code]);

  // Auto-join if user is logged in
  const handleJoin = async () => {
    if (!code) return;
    setJoining(true);
    try {
      const res = await api.post('/groups/join', { inviteCode: code });
      toast.success(t('join.joined', { name: res.data.groupName }));
      router.push(`/groups/${res.data.groupId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('join.failed'));
      setJoining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Logo size={48} className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">{error || 'Group not found'}</h1>
          <Link href="/auth/login" className="text-sm text-brand-primary hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <Logo size={48} className="mx-auto mb-2" />
          <p className="text-sm text-gray-500">{t('common.tagline')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Cover */}
          {group.coverUrl ? (
            <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url(${group.coverUrl})` }} />
          ) : (
            <div className="h-28 bg-gradient-to-br from-brand-primary to-green-700" />
          )}

          {/* Group info */}
          <div className="px-6 pb-6">
            <div className="-mt-8 mb-4">
              <Avatar src={group.logoUrl} name={group.name} size="lg" shape="rounded" className="border-4 border-white shadow-md h-16 w-16 text-xl" />
            </div>

            <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
            {group.description && (
              <p className="text-sm text-gray-500 mt-1">{group.description}</p>
            )}

            <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              <span>{group.memberCount} members</span>
            </div>

            <div className="mt-6 space-y-3">
              {user ? (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
                >
                  {joining ? t('join.joining') : t('join.joinGroup')}
                </button>
              ) : (
                <>
                  <Link
                    href={`/auth/register?invite=${code}`}
                    className="block w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-brand-primary/90 text-center"
                  >
                    {t('auth.createAccount')}
                  </Link>
                  <Link
                    href={`/auth/login?invite=${code}`}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 text-center"
                  >
                    {t('auth.signIn')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
