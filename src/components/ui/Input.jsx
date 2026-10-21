/** `as="textarea"` reutiliza los mismos estilos para mensajes largos. */
export default function Input({ id, error, as: Tag = 'input', className = '', ...props }) {
  return (
    <Tag
      id={id}
      name={id}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`w-full rounded-field border bg-white px-3 py-2 text-sm text-ink placeholder:italic placeholder:text-gray-400 transition focus:outline-none focus:ring-2 ${
        error ? 'border-status-bad focus:ring-status-bad/40' : 'border-gray-300 hover:border-gray-400 focus:border-brand focus:ring-brand/40'
      } ${className}`}
      {...props}
    />
  );
}
