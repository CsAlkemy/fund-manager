import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitContributionSchema, type SubmitContributionInput } from '@fund-manager/shared';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n/useTranslation';

export default function ContributePage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { groupId } = router.query;
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const form = useForm<SubmitContributionInput>({
    resolver: zodResolver(submitContributionSchema),
    defaultValues: {
      groupId: groupId as string,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amount: 1000,
      paymentMethod: 'BKASH',
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/upload/screenshot', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setScreenshotUrl(res.data.url);
      toast.success(t('groups.screenshotUploaded'));
    } catch {
      toast.error(t('payment.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: SubmitContributionInput) => {
    if (!screenshotUrl) {
      toast.error(t('groups.screenshotRequired'));
      return;
    }
    try {
      await api.post(`/groups/${groupId}/contributions`, {
        ...data,
        groupId,
        screenshotUrl,
      });
      toast.success(t('groups.paymentSubmittedVerification'));
      router.push(`/groups/${groupId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('groups.submissionFailed'));
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('groups.submitPaymentTitle')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('groups.submitPaymentSubtitle')}</p>

        <div className="rounded-xl bg-white p-6 border border-gray-100">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('payment.month')}</label>
                <select
                  {...form.register('month', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString(locale, { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('payment.year')}</label>
                <input
                  type="number"
                  {...form.register('year', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('payment.amount')}</label>
              <input
                type="number"
                {...form.register('amount', { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('payment.method')}</label>
              <select
                {...form.register('paymentMethod')}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
              >
                <option value="BKASH">{t('payment.bkash')}</option>
                <option value="BANK">{t('payment.bank')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('payment.txId')}</label>
              <input
                {...form.register('transactionId')}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                placeholder={t('payment.txIdPlaceholder')}
              />
              {form.formState.errors.transactionId && (
                <p className="mt-1 text-xs text-red-500">{form.formState.errors.transactionId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('payment.screenshot')} <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20"
              />
              {uploading && <p className="mt-1 text-xs text-gray-400">{t('payment.uploading')}</p>}
              {screenshotUrl && <p className="mt-1 text-xs text-green-600">{t('payment.uploaded')}</p>}
            </div>

            <button
              type="submit"
              disabled={form.formState.isSubmitting || uploading || !screenshotUrl}
              className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {form.formState.isSubmitting ? t('payment.submitting') : t('payment.submitPayment')}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
