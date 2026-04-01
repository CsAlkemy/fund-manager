import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitContributionSchema, type SubmitContributionInput } from '@fund-manager/shared';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function ContributePage() {
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
      toast.success('Screenshot uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: SubmitContributionInput) => {
    if (!screenshotUrl) {
      toast.error('Screenshot is required');
      return;
    }
    try {
      await api.post(`/groups/${groupId}/contributions`, {
        ...data,
        groupId,
        screenshotUrl,
      });
      toast.success('Payment submitted for verification!');
      router.push(`/groups/${groupId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Submit Payment</h1>
        <p className="text-sm text-gray-500 mb-6">Submit your monthly contribution with proof</p>

        <div className="rounded-xl bg-white p-6 border border-gray-100">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  {...form.register('month', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('en', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  {...form.register('year', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳)</label>
              <input
                type="number"
                {...form.register('amount', { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                {...form.register('paymentMethod')}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
              >
                <option value="BKASH">bKash</option>
                <option value="BANK">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
              <input
                {...form.register('transactionId')}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                placeholder="e.g. TXN123456789"
              />
              {form.formState.errors.transactionId && (
                <p className="mt-1 text-xs text-red-500">{form.formState.errors.transactionId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Screenshot Proof <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20"
              />
              {uploading && <p className="mt-1 text-xs text-gray-400">Uploading...</p>}
              {screenshotUrl && <p className="mt-1 text-xs text-green-600">Screenshot uploaded ✓</p>}
            </div>

            <button
              type="submit"
              disabled={form.formState.isSubmitting || uploading || !screenshotUrl}
              className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {form.formState.isSubmitting ? 'Submitting...' : 'Submit Payment'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
