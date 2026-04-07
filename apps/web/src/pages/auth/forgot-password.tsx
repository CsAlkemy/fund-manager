import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '@fund-manager/shared';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import { useTranslation } from '@/i18n/useTranslation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');

  const emailForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onRequestCode = async (data: ForgotPasswordInput) => {
    try {
      await api.post('/auth/forgot-password', data);
      setEmail(data.email);
      resetForm.setValue('email', data.email);
      setStep('reset');
      toast.success(t('auth.resetCodeSent'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.failedGeneric'));
    }
  };

  const onResetPassword = async (data: ResetPasswordInput) => {
    try {
      await api.post('/auth/reset-password', data);
      toast.success(t('auth.passwordResetSuccess'));
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.failedGeneric'));
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
          {step === 'email' ? (
            <form onSubmit={emailForm.handleSubmit(onRequestCode)} autoComplete="off">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('auth.forgotPassword')}</h2>
              <p className="text-sm text-gray-500 mb-6">{t('auth.forgotPasswordDesc')}</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
                <input
                  type="email"
                  autoComplete="email"
                  {...emailForm.register('email')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder={t('auth.emailPlaceholder')}
                />
                {emailForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={emailForm.formState.isSubmitting}
                className="mt-6 w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {emailForm.formState.isSubmitting ? t('common.processing') : t('auth.sendResetCode')}
              </button>

              <p className="mt-4 text-center text-sm text-gray-500">
                <Link href="/auth/login" className="text-brand-primary hover:underline font-medium">
                  {t('auth.backToLogin')}
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={resetForm.handleSubmit(onResetPassword)} autoComplete="off">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('auth.resetPassword')}</h2>
              <p className="text-sm text-gray-500 mb-6">
                {t('auth.resetPasswordDesc', { email })}
              </p>

              <input type="hidden" {...resetForm.register('email')} />

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.resetCode')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    {...resetForm.register('code')}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-lg outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary tracking-widest text-center"
                    placeholder="000000"
                  />
                  {resetForm.formState.errors.code && (
                    <p className="mt-1 text-xs text-red-500">{resetForm.formState.errors.code.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.newPassword')}</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    {...resetForm.register('newPassword')}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    placeholder={t('auth.newPasswordPlaceholder')}
                  />
                  {resetForm.formState.errors.newPassword && (
                    <p className="mt-1 text-xs text-red-500">{resetForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={resetForm.formState.isSubmitting}
                className="mt-6 w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {resetForm.formState.isSubmitting ? t('common.processing') : t('auth.resetPassword')}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                {t('auth.resendCode')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
