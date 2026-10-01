import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const tooltipStyle = {
  backgroundColor: 'var(--app-surface)',
  border: '1px solid var(--app-border)',
  borderRadius: 8,
  color: 'var(--app-text)',
  fontSize: 12,
}

export function AttendanceBarChart({ data, height = 160 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
        <XAxis dataKey="day" tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Pranishëm']} />
        <Bar dataKey="present" fill="#248675" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function PerformanceBarChart({ data, color = '#a855f7' }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
        <XAxis dataKey="class" tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="score" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TrendLineChart({ data, dataKey = 'rate', xKey = 'week', color = '#f59e0b' }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
        <XAxis dataKey={xKey} tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

const PIE_COLORS = ['#22c55e', '#ef4444', '#f6be3b', "#c7f63b"]

export function FeePieChart({ data }) {

  const hasData = data.some(item => item.value > 0);

  if (!hasData) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-500">
        Nuk ka të dhëna për frekuentimin e sotëm.
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
        {data.map((item, index) => <div key={item.name} className="flex items-center gap-1.5 text-xs text-surface-400"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />{item.name}<strong className="ml-1 text-surface-100">{item.value}</strong></div>)}
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={45}
            outerRadius={70}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i]} fillOpacity={0.7} />
            ))}
          </Pie>

          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </>
  )
}

export function RevenueBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
        <XAxis type="number" tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }} axisLine={false} />
        <YAxis type="category" dataKey="category" tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }} width={80} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`€${v}`, 'Amount']} />
        <Bar dataKey="amount" fill="rgba(34,197,94,0.6)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function EnrollmentBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" />
        <XAxis dataKey="class" tick={{ fill: 'var(--app-text-muted)', fontSize: 9 }} axisLine={false} />
        <YAxis tick={{ fill: 'var(--app-text-muted)', fontSize: 10 }} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" fill="rgba(59,130,246,0.6)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
