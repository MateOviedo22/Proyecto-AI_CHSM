/** Sol de marca en SVG. Para usar el logo oficial: <img src="/src/assets/logo-sunshine.png" />. */
export default function Logo({ size = 40, withText = true }) {
  const rays = Array.from({ length: 14 }, (_, i) => i * (360 / 14));
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        {rays.map((a) => (
          <line key={a} x1="24" y1="3" x2="24" y2="9" stroke="#F6C945" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${a} 24 24)`} />
        ))}
        <circle cx="24" cy="24" r="12" fill="#F4A62A" />
        <path d="M5 33q19 6 38 0v6q-19 6-38 0z" fill="#2FBFAE" />
      </svg>
      {withText && <span className="text-xl font-bold text-sun">Sunshine</span>}
    </span>
  );
}
