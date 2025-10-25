// src/components/AssistantAvatar.tsx
'use client';

import Image from 'next/image';
import clsx from 'clsx';
import { useState } from 'react';

type Props = {
  size?: number;          // px, default 110
  glow?: boolean;         // cyan brand glow
  bordered?: boolean;     // subtle ring
  className?: string;
  alt?: string;
};

export default function AssistantAvatar({
  size = 110,
  glow = true,
  bordered = true,
  className,
  alt = 'Zolarus Assistant',
}: Props) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={clsx(
        'rounded-full overflow-hidden relative transition-all duration-400 ease-out',
        glow && 'shadow-[0_0_45px_rgba(0,220,255,0.55)]',
        bordered && 'ring-2 ring-white/25',
        hover && 'scale-110 -translate-y-2',
        className
      )}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        background:
          'radial-gradient(50% 50% at 50% 50%, rgba(0,219,255,0.22), transparent 70%)',
        flexShrink: 0,
      }}
    >
      <Image
        src="/zolarus-avatar.png"
        alt={alt}
        fill
        sizes={`${size * 3}px`}
        priority
        style={{
          objectFit: 'cover',
          borderRadius: '50%',
          filter: hover
            ? 'contrast(1.15) saturate(1.25) brightness(1.05)'
            : 'contrast(1.1) saturate(1.2)',
          transition: 'transform 0.35s ease-out, filter 0.35s ease-out',
          transform: hover ? 'translateY(-4px)' : 'none',
        }}
      />
    </div>
  );
}
