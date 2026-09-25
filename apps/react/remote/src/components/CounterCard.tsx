import React from 'react';

type CounterCardProps = {
  title: string;
  count: number;
  onIncrement?: () => void;
  tone?: 'sun' | 'ink';
};

const THEMES = {
  sun: {
    background: 'linear-gradient(135deg, rgba(107,57,18,0.96), rgba(55,29,8,0.96))',
    border: '#c97a1d',
    label: '#ffbf47',
    buttonBackground: '#ffbf47',
    buttonText: '#18181b',
  },
  ink: {
    background: 'linear-gradient(135deg, rgba(9,24,41,0.98), rgba(24,71,99,0.96))',
    border: '#38bdf8',
    label: '#7dd3fc',
    buttonBackground: '#38bdf8',
    buttonText: '#082f49',
  },
} as const;

export default function CounterCard({
  title,
  count,
  onIncrement,
  tone = 'sun',
}: CounterCardProps) {
  const theme = THEMES[tone];

  return (
    <section
      style={{
        background: theme.background,
        border: `1px solid ${theme.border}`,
        borderRadius: '24px',
        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.24)',
        color: '#fff7ea',
        display: 'grid',
        gap: '1rem',
        maxWidth: '26rem',
        padding: '1.25rem',
      }}
    >
      <div style={{ display: 'grid', gap: '0.35rem' }}>
        <p
          style={{
            color: theme.label,
            fontSize: '0.72rem',
            letterSpacing: '0.14em',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          remote: react
        </p>
        <h2 style={{ fontSize: '1.5rem', lineHeight: 1.05, margin: 0 }}>{title}</h2>
      </div>

      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: '0.9rem',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.72, textTransform: 'uppercase' }}>
            count
          </p>
          <strong style={{ fontSize: '3rem', lineHeight: 0.9 }}>{count}</strong>
        </div>

        <button
          type="button"
          onClick={onIncrement}
          disabled={!onIncrement}
          style={{
            background: theme.buttonBackground,
            border: 0,
            borderRadius: '999px',
            color: theme.buttonText,
            cursor: onIncrement ? 'pointer' : 'default',
            fontSize: '0.95rem',
            fontWeight: 700,
            opacity: onIncrement ? 1 : 0.72,
            padding: '0.8rem 1.1rem',
          }}
        >
          increment
        </button>
      </div>
    </section>
  );
}
