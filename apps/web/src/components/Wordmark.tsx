type Size = 'sm' | 'md' | 'lg';

const PIXEL_GRID = [
  '11111100',
  '11000110',
  '11000110',
  '11111100',
  '11011000',
  '11001100',
  '11000110',
  '11000011',
];

export function Mark({ size = 24 }: { size?: number }) {
  const px = size / 8;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', flex: 'none' }}
      aria-hidden="true"
    >
      {PIXEL_GRID.flatMap((row, y) =>
        row.split('').map((c, x) =>
          c === '1' ? (
            <rect
              key={`${x}-${y}`}
              x={x * px}
              y={y * px}
              width={px}
              height={px}
              fill="currentColor"
              opacity={0.85 + ((x + y) % 3) * 0.05}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

export function Wordmark({ size = 'sm' }: { size?: Size }) {
  const fs = size === 'lg' ? 56 : size === 'md' ? 28 : 18;
  const ms = size === 'lg' ? 56 : size === 'md' ? 28 : 18;
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: 'var(--accent)' }}>
        <Mark size={ms} />
      </span>
      <span
        className="font-semibold"
        style={{ fontSize: fs, lineHeight: 1, letterSpacing: '-0.02em' }}
      >
        reach
      </span>
    </div>
  );
}
