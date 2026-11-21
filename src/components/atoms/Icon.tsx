export type IconName =
  | 'home'
  | 'stories'
  | 'games'
  | 'music'
  | 'learning'
  | 'settings'
  | 'teacher'
  | 'sound'
  | 'shield'
  | 'keyboard';

const paths: Record<IconName, string> = {
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  stories:
    'M12 6c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1zm0 0v15',
  games:
    'M7 7h10c3 0 5 12 2 12-2 0-3-3-4-3H9c-1 0-2 3-4 3C2 19 4 7 7 7zm0 3v5m-2-2.5h4m6-1.5h.1m3 3h.1',
  music:
    'M9 18V5l11-2v13M9 8l11-2M9 18c0 3-6 4-6 1 0-2 6-4 6-1zm11-2c0 3-6 4-6 1 0-2 6-4 6-1z',
  learning: 'm2 9 10-5 10 5-10 5zm4 3v6c4 3 8 3 12 0v-6m4-3v8',
  settings:
    'm9 3-1 3-3 1-2 3 2 2-1 3 2 3h3l2 3h3l2-3h3l2-3-1-3 2-2-2-3-3-1-1-3zm6 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  teacher:
    'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 22v-3a8 8 0 0 1 16 0v3M9 16l3 3 3-3',
  sound: 'M4 10v4m4-8v12m4-15v18m4-15v12m4-8v4',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6zm-4 9 3 3 5-6',
  keyboard: 'M3 6h18v13H3zm4 4h.1m4 0h.1m4 0h.1m3 0h.1M7 14h.1m3 1h6',
};

export function Icon({
  name,
  className = '',
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
