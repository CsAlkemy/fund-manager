import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e293b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Fund Manager" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
      </Head>
      <body>
        {/* Splash Screen — visible until React hydrates */}
        <div id="splash-screen">
          <div className="splash-icon"><svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M52 18C63 16 74 22 78 34C82 46 76 58 66 66C56 74 40 76 30 68C20 60 16 44 22 32C28 20 41 20 52 18Z" fill="#155e63" opacity="0.92"/><path d="M72 40C80 48 82 62 76 74C70 86 56 88 46 82C36 76 32 64 36 52C40 40 50 36 58 34C66 32 64 32 72 40Z" fill="#6db89a" opacity="0.78"/></svg></div>
          <div className="splash-title">Fund Manager</div>
          <div className="splash-tagline">Track every taka, trust every transaction</div>
          <div className="splash-loader" />
        </div>

        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
