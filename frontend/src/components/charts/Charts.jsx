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
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(148, 163, 184, 0.1)',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 12,
}

export function AttendanceBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
        <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
        <YAxis domain={[80, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Present']} />
        <Bar dataKey="present" fill="rgba(34,197,94,0.6)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function PerformanceBarChart({ data, color = '#a855f7' }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
        <XAxis dataKey="class" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
        <YAxis domain={[50, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
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
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
        <XAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
        <YAxis domain={[70, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
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
      <div className="mb-3 space-y-1">
        <p className="text-sm" style={{ color: "#22c55e" }}>● Prezent</p>
        <p className="text-sm" style={{ color: "#f6be3b" }}>● Me arsyje</p>
        <p className="text-sm" style={{ color: "#ef4444" }}>● Mungesë</p>
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
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
        <YAxis type="category" dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} axisLine={false} />
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
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
        <XAxis dataKey="class" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" fill="rgba(59,130,246,0.6)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
