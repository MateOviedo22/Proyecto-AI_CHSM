/** Moneda estándar del sistema: córdobas (C$). Normaliza el "$" mixto del diseño. */
export const formatCurrency = (value) =>
  `C$${Number(value).toLocaleString('es-NI', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const formatDate = (iso, opts = { day: '2-digit', month: 'short' }) =>
  new Date(iso).toLocaleDateString('es-NI', opts);

export const formatPercent = (value) => `${value > 0 ? '+' : ''}${value}%`;
