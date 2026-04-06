import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
}

export function TextareaElastique({
  value,
  onChange,
  placeholder = 'Saisissez votre commentaire…',
  className = '',
  minRows = 3,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => { onChange(e.target.value); resize(); }}
      placeholder={placeholder}
      rows={minRows}
      className={cn(
        'w-full resize-none overflow-hidden',
        'border border-input rounded-md',
        'p-3 text-sm leading-relaxed',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'bg-muted/30 focus:bg-background',
        'transition-colors',
        className,
      )}
      style={{
        minHeight: `${minRows * 1.6}rem`,
        height: 'auto',
      }}
    />
  );
}
