function MetricSparkline({ values = [] }) {
  if (!Array.isArray(values) || values.length < 2) {
    return <div className="dashboard-metric-empty-chart" />
  }

  const width = 260
  const height = 48
  const padding = 5

  const normalizedValues = values.map((value) => Number(value || 0))
  const minimum = Math.min(...normalizedValues)
  const maximum = Math.max(...normalizedValues)
  const range = maximum - minimum || 1

  const coordinates = normalizedValues.map((value, index) => {
    const x =
      padding +
      (index / (normalizedValues.length - 1)) *
        (width - padding * 2)

    const y =
      height -
      padding -
      ((value - minimum) / range) *
        (height - padding * 2)

    return { x, y }
  })

  const points = coordinates
    .map(({ x, y }) => `${x},${y}`)
    .join(' ')

  return (
    <svg
      className="dashboard-metric-sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        className="dashboard-metric-chart-base"
        x1="0"
        y1={height - 4}
        x2={width}
        y2={height - 4}
      />

      <polyline
        className="dashboard-metric-chart-line"
        points={points}
      />

      {coordinates.map(({ x, y }, index) => (
        <circle
          key={index}
          className="dashboard-metric-chart-dot"
          cx={x}
          cy={y}
          r="2.7"
        />
      ))}
    </svg>
  )
}

export function DashboardMetricGrid({ children, className = '' }) {
  return (
    <section className={`dashboard-metric-grid ${className}`}>
      {children}
    </section>
  )
}

export default function DashboardMetricCard({
  label,
  value,
  icon: Icon,
  total,
  footer,
  footerValue,
  sparkline = [],
  tone = 'teal',
}) {
  const numericValue = Number(value || 0)
  const numericTotal = Number(total || 0)

  const percentage =
    numericTotal > 0
      ? Math.min(
          100,
          Math.round((numericValue / numericTotal) * 100),
        )
      : 0

  return (
    <article className={`dashboard-metric-card metric-tone-${tone}`}>
      <div className="dashboard-metric-top">
        <span className="dashboard-metric-icon">
          {Icon && <Icon size={25} />}
        </span>

        <div className="dashboard-metric-copy">
          <strong className="dashboard-metric-value">
            {numericValue.toLocaleString('fa-IR')}
          </strong>

          <span className="dashboard-metric-label">
            {label}
          </span>
        </div>

        <div className="dashboard-metric-percentage">
          <strong>
            {percentage.toLocaleString('fa-IR')}٪
          </strong>

          <span>از مجموع</span>
        </div>
      </div>

      {sparkline.length >= 2 ? (
        <MetricSparkline values={sparkline} />
      ) : (
        <div className="dashboard-metric-progress">
          <span style={{ width: `${percentage}%` }} />
        </div>
      )}

      <div className="dashboard-metric-footer">
        <span>{footer}</span>

        {footerValue !== undefined && (
          <strong>
            {typeof footerValue === 'number'
              ? footerValue.toLocaleString('fa-IR')
              : footerValue}
          </strong>
        )}
      </div>
    </article>
  )
}