import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  shape?: 'circle' | 'rounded' | 'wide';
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  className?: string;
}

const sizeMap = {
  sm: { circle: 'h-12 w-12', rounded: 'h-12 w-12', wide: 'h-12 w-24' },
  md: { circle: 'h-20 w-20', rounded: 'h-20 w-20', wide: 'h-20 w-40' },
  lg: { circle: 'h-24 w-24', rounded: 'h-24 w-24', wide: 'h-32 w-full' },
};

export function ImageUpload({
  currentUrl,
  onUploaded,
  shape = 'circle',
  size = 'md',
  placeholder,
  className = '',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const displayUrl = preview || currentUrl;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded(res.data.url);
    } catch {
      toast.error('Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const shapeClass = shape === 'circle' ? 'rounded-full' : shape === 'wide' ? 'rounded-xl' : 'rounded-2xl';

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={cn(
        'relative group overflow-hidden border-2 border-dashed border-gray-200 hover:border-brand-primary/50 transition-colors bg-gray-50',
        shapeClass,
        sizeMap[size][shape],
        className,
      )}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {displayUrl ? (
        <img src={displayUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <span className="text-gray-300 text-lg font-bold">{placeholder || '+'}</span>
      )}

      {/* Hover overlay */}
      <div className={cn(
        'absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity',
        uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )}>
        {uploading ? (
          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Camera className="w-5 h-5 text-white" />
        )}
      </div>
    </button>
  );
}
