interface LogoProps {
  size?: number;
  className?: string;
  withBg?: boolean;
}

export function Logo({ size = 32, className = '', withBg = false }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {withBg && <rect width="100" height="100" rx="22" fill="white" opacity="0.12" />}
      {/* Dark teal blob */}
      <path
        d="M52 18C63 16 74 22 78 34C82 46 76 58 66 66C56 74 40 76 30 68C20 60 16 44 22 32C28 20 41 20 52 18Z"
        fill="#155e63"
        opacity="0.92"
      />
      {/* Light green blob */}
      <path
        d="M72 40C80 48 82 62 76 74C70 86 56 88 46 82C36 76 32 64 36 52C40 40 50 36 58 34C66 32 64 32 72 40Z"
        fill="#6db89a"
        opacity="0.78"
      />
    </svg>
  );
}
