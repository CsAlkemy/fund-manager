import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@fund-manager/shared';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await api.post('/auth/register', data);
      toast.success('Registration complete!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            <span className="text-brand-primary">✦</span> Fund Manager
          </h1>
          <p className="text-sm text-gray-500 mt-2">Complete your profile</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Your Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  {...form.register('name')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder="Your full name"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  {...form.register('phone')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder="+880 1XXX XXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">bKash Number (optional)</label>
                <input
                  type="text"
                  {...form.register('bkashNumber')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder="01XXX XXXXXX"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="mt-6 w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {form.formState.isSubmitting ? 'Saving...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
