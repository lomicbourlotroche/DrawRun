import type { IconProps } from './types';

export function Nutrition({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 20V10" />
      <path d="M18 20v-4a6 6 0 0 0-12 0v4" />
      <path d="M2 20h20" />
      <path d="M18 8a6 6 0 0 1-12 0" />
      <circle cx="12" cy="4" r="2" />
    </svg>
  );
}
