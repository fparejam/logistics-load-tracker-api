export function AcmeLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer blue A/chevron shape - two slanted lines meeting at top point, flat bottom edges */}
      <path
        d="M20 4 L34 36 L32 36 L20 10 L8 36 L6 36 Z"
        fill="#3B82F6"
      />
      {/* Inner green V/chevron shape - nested within the blue */}
      <path
        d="M20 14 L28 34 L26 34 L20 22 L14 34 L12 34 Z"
        fill="#10B981"
      />
    </svg>
  );
}

