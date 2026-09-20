import type { ReactNode } from 'react';

type Tone = 'gray' | 'green' | 'yellow' | 'red' | 'blue';

const tones: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
};

export function Badge({
  children,
  tone = 'gray',
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Map an attendance status to a badge tone. */
export function StatusBadge({ status }: { status: string }) {
  const tone: Tone =
    status === 'PRESENT'
      ? 'green'
      : status === 'LATE'
        ? 'yellow'
        : status === 'ABSENT'
          ? 'red'
          : 'blue';
  return <Badge tone={tone}>{status}</Badge>;
}
