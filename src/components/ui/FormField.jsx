/** Etiqueta + control + mensaje de error accesible (aria-describedby). */
export default function FormField({ id, label, error, onDark = false, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={`text-sm font-medium ${onDark ? 'text-white' : 'text-ink'}`}>{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="rounded-md bg-status-badBg px-2 py-1 text-xs font-medium text-status-bad">
          {error}
        </p>
      )}
    </div>
  );
}
