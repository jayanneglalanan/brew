import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid #E7DCCD',
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(61,48,42,0.08)',
};

export function SalesChart({ data }: { data: Array<{ label: string; sales: number; transactions: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B6F5A" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#8B6F5A" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E7DCCD" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#8A7A70' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#8A7A70' }} axisLine={false} tickLine={false} width={46} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Area type="monotone" dataKey="sales" name="Sales" stroke="#8B6F5A" strokeWidth={2.5} fill="url(#salesFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PeakBar({ data }: { data: Array<{ label: string; sales: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E7DCCD" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8A7A70' }} axisLine={false} tickLine={false} interval={1} />
        <YAxis tick={{ fontSize: 12, fill: '#8A7A70' }} axisLine={false} tickLine={false} width={46} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="sales" name="Sales" fill="#8B6F5A" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, colors = ['#8B6F5A', '#C9A98F', '#8FAF91', '#D5A85C', '#C98278', '#A9896F', '#5C4033'] }: { data: Array<{ name: string; value: number }>; colors?: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} strokeWidth={0}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ProgressBar({ value, color = 'bg-brand-500' }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
