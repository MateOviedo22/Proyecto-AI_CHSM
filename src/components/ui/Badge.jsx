import { statusTone } from '../../data/mockData';

const tones = {
  ok: 'bg-status-okBg text-status-ok',
  bad: 'bg-status-badBg text-status-bad',
  warn: 'bg-status-warnBg text-status-warn',
  info: 'bg-status-infoBg text-status-info',
};

export default function Badge({ children, tone }) {
  const t = tone ?? statusTone[children] ?? 'info';
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tones[t]}`}>{children}</span>;
}
