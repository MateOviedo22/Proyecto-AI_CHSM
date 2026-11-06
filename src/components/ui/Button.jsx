const variants = {
  primary: 'bg-wine text-white hover:bg-wine-dark active:scale-[0.98]',
  secondary: 'bg-white text-ink border border-gray-300 hover:bg-gray-50 active:scale-[0.98]',
  ghost: 'bg-transparent text-ink hover:bg-black/5',
};
const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2 text-sm', lg: 'px-8 py-2.5 text-base' };

export default function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-field font-medium shadow-card transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
