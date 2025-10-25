'use client';

export default function BagIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ display: 'inline-block', verticalAlign: '-2px' }}
    >
      <path
        d="M6 9h12l-1 10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 9Z"
        stroke="url(#c)"
        strokeWidth="1.6"
        fill="rgba(14,165,233,0.08)"
      />
      <path
        d="M9 9V7a3 3 0 1 1 6 0v2"
        stroke="url(#c)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="c" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee"/><stop offset="1" stopColor="#60a5fa"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
