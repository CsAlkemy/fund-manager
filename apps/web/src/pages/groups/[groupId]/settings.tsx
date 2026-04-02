import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateGroupSchema, type UpdateGroupInput } from '@fund-manager/shared';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n/useTranslation';

export default function GroupSettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { groupId } = router.query;
  const [loading, setLoading] = useState(true);

  const form = useForm<UpdateGroupInput>({
    resolver: zodResolver(updateGroupSchema),
  });

  useEffect(() => {
    if (!groupId) return;
    api.get(`/groups/${groupId}`)
      .then((res) => {
        form.reset({
          name: res.data.name,
          description: res.data.description || '',
          monthlyAmount: res.data.monthlyAmount,
          fineAmount: res.data.fineAmount,
          fineDeadlineDay: res.data.fineDeadlineDay,
        });
      })
      .finally(() => setLoading(false));
  }, [groupId, form]);

  const onSubmit = async (data: UpdateGroupInput) => {
    try {
      await api.patch(`/groups/${groupId}`, data);
      toast.success(t('groups.settingsUpdated'));
      router.push(`/groups/${groupId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('profile.updateFailed'));
    }
  };

  if (loading) return <DashboardLayout><p className="text-gray-400">{t('common.loading')}</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('groups.settings')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('groups.updateConfig')}</p>

        <div className="rounded-xl bg-white p-6 border border-gray-100">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('groups.groupName')}</label>
              <input {...form.register('name')} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('groups.description')}</label>
              <input {...form.register('description')} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('groups.monthly')}</label>
                <input type="number" {...form.register('monthlyAmount', { valueAsNumber: true })} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('groups.fine')}</label>
                <input type="number" {...form.register('fineAmount', { valueAsNumber: true })} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('groups.deadline')}</label>
                <input type="number" min={1} max={28} {...form.register('fineDeadlineDay', { valueAsNumber: true })} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
            </div>
            <button type="submit" disabled={form.formState.isSubmitting} className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50">
              {form.formState.isSubmitting ? t('common.saving') : t('common.save')}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
