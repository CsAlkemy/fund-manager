import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestOtpSchema, type RequestOtpInput } from '@fund-manager/shared';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const otpCodeSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
});
type OtpCodeInput = z.infer<typeof otpCodeSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');

  const emailForm = useForm<RequestOtpInput>({
    resolver: zodResolver(requestOtpSchema),
  });

  const otpForm = useForm<OtpCodeInput>({
    resolver: zodResolver(otpCodeSchema),
    defaultValues: { code: '' },
  });

  const onRequestOtp = async (data: RequestOtpInput) => {
    try {
      await api.post('/auth/request-otp', data);
      setEmail(data.email);
      setStep('otp');
      otpForm.reset({ code: '' });
      toast.success('OTP sent to your email!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const onVerifyOtp = async (data: OtpCodeInput) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, code: data.code });
      localStorage.setItem('token', res.data.token);
      if (res.data.isNewUser) {
        router.push('/auth/register');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            <span className="text-brand-primary">✦</span> Fund Manager
          </h1>
          <p className="text-sm text-gray-500 mt-2">Track every taka, trust every transaction</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          {step === 'email' ? (
            <form onSubmit={emailForm.handleSubmit(onRequestOtp)} autoComplete="off">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign In</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your email to receive a one-time code</p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  {...emailForm.register('email')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder="you@example.com"
                />
                {emailForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={emailForm.formState.isSubmitting}
                className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {emailForm.formState.isSubmitting ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} autoComplete="off">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Enter OTP</h2>
              <p className="text-sm text-gray-500 mb-6">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                  {...otpForm.register('code')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-center tracking-[0.5em] outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder="000000"
                />
                {otpForm.formState.errors.code && (
                  <p className="mt-1 text-xs text-red-500">{otpForm.formState.errors.code.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={otpForm.formState.isSubmitting}
                className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {otpForm.formState.isSubmitting ? 'Verifying...' : 'Verify & Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700"
              >
                ← Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
