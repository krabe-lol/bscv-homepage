interface StatProps {
  value: string | number;
  label: string;
  className?: string;
}

const Stat = ({ value, label, className = "" }: StatProps) => (
  <div className={`bg-ink px-5 py-6 ${className}`}>
    <div className="text-4xl font-extrabold leading-none">{value}</div>
    <div className="mt-1.5 text-sm text-muted">{label}</div>
  </div>
);

export default Stat;
