export default function Card({ as: Tag = 'section', className = '', children, ...props }) {
  return <Tag className={`rounded-card bg-white p-4 shadow-card ${className}`} {...props}>{children}</Tag>;
}
