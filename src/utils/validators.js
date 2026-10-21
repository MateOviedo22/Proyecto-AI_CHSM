/** Cada validador devuelve un mensaje de error (string) o '' si es válido. */
export const required = (label = 'Este campo') => (v) =>
  String(v ?? '').trim() ? '' : `${label} es obligatorio.`;

export const minLength = (n, label = 'Este campo') => (v) =>
  String(v ?? '').length >= n ? '' : `${label} debe tener al menos ${n} caracteres.`;

export const isEmail = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v ?? '').trim()) ? '' : 'Ingresa un correo válido (ej. nombre@correo.com).';

export const isPhone = (v) =>
  /^[0-9+\-\s]{8,15}$/.test(String(v ?? '').trim()) ? '' : 'Ingresa un teléfono válido (8 a 15 dígitos).';

export const matches = (otherKey, msg = 'Los valores no coinciden.') => (v, all) =>
  v === all[otherKey] ? '' : msg;

/** Ejecuta validadores en orden y devuelve el primer error. */
export const compose = (...fns) => (v, all) => {
  for (const fn of fns) {
    const err = fn(v, all);
    if (err) return err;
  }
  return '';
};

export const hasNumber = (v) => (/\d/.test(String(v ?? '')) ? '' : 'Incluye al menos un número.');
