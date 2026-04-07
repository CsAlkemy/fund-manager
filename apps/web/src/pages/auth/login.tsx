import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@fund-manager/shared';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n/useTranslation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth(false);
  const { t } = useTranslation();
  const invite = router.query.invite as string | undefined;

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const res = await api.post('/auth/login', data);
      localStorage.setItem('token', res.data.token);
      await refresh();

      if (invite) {
        try {
          const joinRes = await api.post('/groups/join', { inviteCode: invite });
          toast.success(`Joined ${joinRes.data.groupName}!`);
          router.push(`/groups/${joinRes.data.groupId}`);
          return;
        } catch {
          // Already a member or invalid code — continue to dashboard
        }
      }

      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('auth.loginFailed'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size={48} className="mx-auto mb-2" />
          <h1 className="text-3xl font-bold text-gray-900">
            {t('common.appTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-2">{t('common.tagline')}</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('auth.signIn')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('auth.enterCredentials')}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
                <input
                  type="email"
                  autoComplete="email"
                  {...form.register('email')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder={t('auth.emailPlaceholder')}
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  {...form.register('password')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder={t('auth.passwordPlaceholder')}
                />
                {form.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <Link href="/auth/forgot-password" className="text-xs text-brand-primary hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="mt-4 w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {form.formState.isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
            </button>

            <p className="mt-4 text-center text-sm text-gray-500">
              {t('auth.noAccount')}{' '}
              <Link href={invite ? `/auth/register?invite=${invite}` : '/auth/register'} className="text-brand-primary hover:underline font-medium">
                {t('auth.createAccount')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
