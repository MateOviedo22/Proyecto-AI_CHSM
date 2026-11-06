
export default function Logo({ size = 40, withText = true }) {
  return (
    <span className="inline-flex items-center gap-2 shrink-0">
      <img
        src="https://tse1.mm.bing.net/th/id/OIP.gcXW_lfk2nhbURb3uRuu1wHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"
        alt="Logo Sunshine"
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover aspect-square"
      />

      {withText && (
        <span className="font-semibold text-gray-900">
          Sunshine
          <span className="text-sun"> Handmade</span>
        </span>
      )}
    </span>
  );
}
