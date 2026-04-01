import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { joinGroupSchema, type JoinGroupInput } from '@fund-manager/shared';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function JoinGroupPage() {
  const router = useRouter();
  const { code } = router.query;

  const form = useForm<JoinGroupInput>({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: { inviteCode: '' },
  });

  useEffect(() => {
    if (code) form.setValue('inviteCode', code as string);
  }, [code, form]);

  const onSubmit = async (data: JoinGroupInput) => {
    try {
      const res = await api.post('/groups/join', data);
      toast.success(`Joined "${res.data.groupName}"!`);
      router.push(`/groups/${res.data.groupId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to join group');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Join a Group</h1>
        <p className="text-sm text-gray-500 mb-6">Enter the invite code shared by your group manager</p>

        <div className="rounded-xl bg-white p-6 border border-gray-100">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invite Code</label>
              <input
                {...form.register('inviteCode')}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary font-mono"
                placeholder="Paste invite code here"
              />
              {form.formState.errors.inviteCode && (
                <p className="mt-1 text-xs text-red-500">{form.formState.errors.inviteCode.message}</p>
              )}
            </div>
            <button type="submit" disabled={form.formState.isSubmitting} className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50">
              {form.formState.isSubmitting ? 'Joining...' : 'Join Group'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
