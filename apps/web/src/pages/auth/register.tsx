import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@fund-manager/shared';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/i18n/useTranslation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth(false);
  const { t } = useTranslation();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const res = await api.post('/auth/register', data);
      localStorage.setItem('token', res.data.token);
      toast.success(t('auth.registrationComplete'));
      await refresh();
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('auth.registrationFailed'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            <span className="text-brand-primary">✦</span> {t('common.appTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-2">{t('common.tagline')}</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('auth.createAccount')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('auth.fillDetails')}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.fullName')}</label>
                <input
                  type="text"
                  {...form.register('name')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder={t('auth.namePlaceholder')}
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

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
                  autoComplete="new-password"
                  {...form.register('password')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder={t('auth.passwordPlaceholder')}
                />
                {form.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phoneOptional')}</label>
                <input
                  type="tel"
                  {...form.register('phone')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder={t('auth.phonePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.bkashOptional')}</label>
                <input
                  type="text"
                  {...form.register('bkashNumber')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder={t('auth.bkashPlaceholder')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="mt-6 w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {form.formState.isSubmitting ? t('common.saving') : t('auth.createAccount')}
            </button>

            <p className="mt-4 text-center text-sm text-gray-500">
              {t('auth.haveAccount')}{' '}
              <Link href="/auth/login" className="text-brand-primary hover:underline font-medium">
                {t('auth.signIn')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
