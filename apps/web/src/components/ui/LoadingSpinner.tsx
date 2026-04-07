export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <style>{`
        @keyframes loader-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.65; }
        }
        @keyframes loader-blob1 {
          0%, 100% { transform: translate(0,0) rotate(0deg); }
          33% { transform: translate(-2px,-3px) rotate(-6deg); }
          66% { transform: translate(2px,2px) rotate(5deg); }
        }
        @keyframes loader-blob2 {
          0%, 100% { transform: translate(0,0) rotate(0deg); }
          33% { transform: translate(3px,2px) rotate(6deg); }
          66% { transform: translate(-2px,-2px) rotate(-5deg); }
        }
        .loader-wrap { animation: loader-pulse 1.6s ease-in-out infinite; }
        .loader-blob1 { animation: loader-blob1 2.4s ease-in-out infinite; transform-origin: 40% 45%; }
        .loader-blob2 { animation: loader-blob2 2.4s ease-in-out infinite; transform-origin: 60% 55%; }
        .loader-glow {
          position: absolute; inset: -16px;
          background: radial-gradient(circle, rgba(74,124,89,0.25) 0%, transparent 70%);
          animation: loader-pulse 1.6s ease-in-out infinite;
        }
      `}</style>
      <div className="relative" style={{ width: 64, height: 64 }}>
        <div className="loader-glow" />
        <svg width="64" height="64" viewBox="0 0 100 100" fill="none" className="loader-wrap relative">
          <path
            className="loader-blob1"
            d="M52 18C63 16 74 22 78 34C82 46 76 58 66 66C56 74 40 76 30 68C20 60 16 44 22 32C28 20 41 20 52 18Z"
            fill="#155e63"
            opacity="0.92"
          />
          <path
            className="loader-blob2"
            d="M72 40C80 48 82 62 76 74C70 86 56 88 46 82C36 76 32 64 36 52C40 40 50 36 58 34C66 32 64 32 72 40Z"
            fill="#6db89a"
            opacity="0.78"
          />
        </svg>
      </div>
    </div>
  );
}
