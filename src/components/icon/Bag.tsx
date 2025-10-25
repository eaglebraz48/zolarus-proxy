'use client';

type Props = { size?: number; color?: string; className?: string };

export default function BagIcon({ size = 16, color = '#111827', className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7 8V7a5 5 0 0 1 10 0v1"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect
        x="4"
        y="8"
        width="16"
        height="13"
        rx="2.5"
        stroke={color}
        strokeWidth="1.6"
      />
      <path d="M9 12v1M15 12v1" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
