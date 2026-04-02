import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createGroupSchema, type CreateGroupInput } from '@fund-manager/shared';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n/useTranslation';

export default function CreateGroupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const form = useForm({
    defaultValues: { name: '', description: '', monthlyAmount: 1000, fineAmount: 100, fineDeadlineDay: 15 },
  });

  const onSubmit = async (data: any) => {
    try {
      const res = await api.post('/groups', data);
      toast.success(t('groups.created'));
      router.push(`/groups/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('groups.failedToCreate'));
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('groups.createTitle')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('groups.setupNew')}</p>

        <div className="rounded-xl bg-white p-6 border border-gray-100">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('groups.groupName')}</label>
              <input
                {...form.register('name')}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                placeholder={t('groups.namePlaceholder')}
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.descriptionOptionalLabel')}</label>
              <input
                {...form.register('description')}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                placeholder={t('groups.descPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('groups.monthly')}</label>
                <input
                  type="number"
                  {...form.register('monthlyAmount', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('groups.fine')}</label>
                <input
                  type="number"
                  {...form.register('fineAmount', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.deadlineDayLabel')}</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  {...form.register('fineDeadlineDay', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {form.formState.isSubmitting ? t('groups.creating') : t('groups.createTitle')}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
