import { formatCurrency } from './formatters';

export const stockStatus = (stock) => (stock <= 10 ? 'Bajo' : 'Normal');
export const stockTone = (stock) => (stock <= 10 ? 'bad' : stock <= 20 ? 'warn' : 'ok');

/** Filas "Precio / Existencias / Costo Unitario" que muestran las tarjetas. */
export const productDetails = (p) => [
  ['Precio', formatCurrency(p.price)],
  ['Existencias', `${p.stock} Unidades`, stockTone(p.stock)],
  ['Costo Unitario', formatCurrency(p.unitCost)],
];
