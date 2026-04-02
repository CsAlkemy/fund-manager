import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/hooks/AuthProvider';
import { TranslationProvider } from '@/i18n/TranslationProvider';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import '@/styles/globals.css';

NProgress.configure({ showSpinner: false, speed: 300, minimum: 0.2 });

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const start = () => NProgress.start();
    const done = () => NProgress.done();

    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', done);
    router.events.on('routeChangeError', done);

    return () => {
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', done);
      router.events.off('routeChangeError', done);
    };
  }, [router]);

  return (
    <TranslationProvider>
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster position="top-right" />
      </AuthProvider>
    </TranslationProvider>
  );
}
