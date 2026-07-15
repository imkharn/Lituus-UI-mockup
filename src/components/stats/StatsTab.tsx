import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { mockStats } from '../../data/mockQueries'
import { formatRep } from '../../lib/actions'

export function StatsTab() {
  const s = mockStats

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h2 className="text-lg font-semibold text-gray-900">Protocol stats</h2>
      <p className="mt-1 text-sm text-gray-500">
        Live metrics for reporters and query creators. Open interest is fetched
        from Dune in production.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Average reporter APY"
          value={`${s.averageReporterApy}%`}
          hint="Across escalation game rewards"
        />
        <MetricCard
          label="% of supply staked"
          value={`${s.percentSupplyStaked}%`}
          hint={`TVL $${(s.tvlUsd / 1e6).toFixed(1)}M (escalation stakes + query tokens)`}
        />
        <MetricCard
          label="Estimated open interest"
          value={`$${(s.estimatedOpenInterest! / 1e6).toFixed(1)}M`}
          hint="via Dune"
        />
        <MetricCard
          label="Estimated attack cost"
          value={`$${(s.attackCostUsd / 1e6).toFixed(1)}M`}
          hint={`$${(s.repFdvUsd / 1e6).toFixed(1)}M REP FDV × ${s.securityMargin} = $${(s.attackCostUsd / 1e6).toFixed(1)}M`}
        />
        <MetricCard
          label="Average burn rate"
          value={`$${(s.averageBurnUsdPerYear / 1e6).toFixed(2)}M / yr`}
          hint={`${((s.averageBurnUsdPerYear / s.repFdvUsd) * 100).toFixed(1)}% of supply burned per year on average since launch`}
        />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-white p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Queries & fees since launch
            </h3>
            <p className="text-sm text-gray-500">
              Log scale · dotted line = projected next fee move (
              {s.feeProjectionDirection})
            </p>
          </div>
        </div>
        <LaunchCharts />
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  )
}

function LaunchCharts() {
  const data = mockStats.chartSeries

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            label={{
              value: 'Days since launch',
              position: 'insideBottom',
              offset: -2,
              style: { fontSize: 11, fill: '#6b7280' },
            }}
          />
          <YAxis
            yAxisId="left"
            scale="log"
            domain={['auto', 'auto']}
            allowDataOverflow
            tick={{ fontSize: 11, fill: '#6b7280' }}
            width={48}
            label={{
              value: 'Queries / day',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 11, fill: '#6b7280' },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            scale="log"
            domain={['auto', 'auto']}
            allowDataOverflow
            tick={{ fontSize: 11, fill: '#6b7280' }}
            width={48}
            label={{
              value: 'Fee ($)',
              angle: 90,
              position: 'insideRight',
              style: { fontSize: 11, fill: '#6b7280' },
            }}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
            }}
            formatter={(value, name) => {
              const n = typeof value === 'number' ? value : Number(value)
              const label = String(name)
              if (label === 'queriesPerDay') {
                return [formatRep(n), 'Queries/day']
              }
              if (label === 'queryFee') return [`$${n}`, 'Query fee']
              if (label === 'projectedFee') return [`$${n}`, 'Projected fee']
              return [value, name]
            }}
            labelFormatter={(day) => `Day ${day}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => {
              if (value === 'queriesPerDay') return 'Queries / day'
              if (value === 'queryFee') return 'Query fee'
              if (value === 'projectedFee') return 'Fee projection'
              return value
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="queriesPerDay"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="queriesPerDay"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="queryFee"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            name="queryFee"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="projectedFee"
            stroke="#6366f1"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            connectNulls={false}
            name="projectedFee"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
