const tones = { ok: 'text-status-ok', warn: 'text-yellow-600', bad: 'text-status-bad' };

/** details: [[etiqueta, valor, tono?]]. Con onSelect la tarjeta es un botón seleccionable. */
export default function ProductCard({ name, image, description, details, layout = 'column', onSelect, selected }) {
  const Root = onSelect ? 'button' : 'article';
  const row = layout === 'row';
  return (
    <Root
      {...(onSelect && { type: 'button', onClick: onSelect, 'aria-pressed': Boolean(selected) })}
      className={`group flex w-full overflow-hidden rounded-card bg-white text-left shadow-card transition hover:shadow-lift ${row ? 'gap-4 p-3' : 'flex-col'} ${selected ? 'ring-2 ring-sun' : ''}`}
    >
      <div className={`shrink-0 overflow-hidden bg-gradient-to-br from-[#8a5a3c] to-[#4a2c1c] ${row ? 'h-24 w-24 rounded-lg' : 'aspect-square w-full'}`}>
        <img src={`/products/${image}`} alt={name} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      </div>
      <div className={row ? 'flex-1' : 'p-4'}>
        <h3 className="text-lg font-semibold">{name}</h3>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        {details && (
          <dl className="mt-2 space-y-1 text-xs">
            {details.map(([k, v, tone]) => (
              <div key={k} className="flex justify-between gap-2"><dt className="text-gray-500">{k}:</dt><dd className={`font-medium ${tones[tone] ?? ''}`}>{v}</dd></div>
            ))}
          </dl>
        )}
      </div>
    </Root>
  );
}
