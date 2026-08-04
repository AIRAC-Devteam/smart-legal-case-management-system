export function buildDailySeries(
  items = [],
  dateField = 'created_at',
  days = 7,
) {
  const result = []
  const today = new Date()

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today)
    date.setHours(0, 0, 0, 0)
    date.setDate(today.getDate() - offset)

    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    const count = items.filter((item) => {
      const value = item?.[dateField]

      if (!value) {
        return false
      }

      const itemDate = new Date(value)

      return itemDate >= date && itemDate < nextDate
    }).length

    result.push(count)
  }

  return result
}