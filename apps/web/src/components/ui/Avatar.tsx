import { cn } from '@/lib/cn';
import { assetUrl } from '@/lib/api';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'rounded';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function Avatar({ src, name, size = 'sm', shape = 'circle', className = '' }: AvatarProps) {
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  if (src) {
    return (
      <img
        src={assetUrl(src)}
        alt={name}
        className={cn('object-cover shrink-0', shapeClass, sizeClasses[size], className)}
      />
    );
  }

  return (
    <div className={cn('bg-brand-primary flex items-center justify-center text-white font-medium shrink-0', shapeClass, sizeClasses[size], className)}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}
