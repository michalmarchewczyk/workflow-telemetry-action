import { ProcessedStats } from './interfaces'

/**
 * Format timestamp to HH:MM format
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

/**
 * Sample data points to avoid overcrowding the chart
 * Mermaid has limitations on the number of data points
 */
function sampleDataPoints(
  points: ProcessedStats[],
  maxPoints = 100
): ProcessedStats[] {
  if (points.length <= maxPoints) {
    return points
  }

  const sampledPoints: ProcessedStats[] = []
  const step = Math.floor(points.length / maxPoints)

  for (let i = 0; i < points.length; i += step) {
    sampledPoints.push(points[i])
  }

  // Always include the last point
  if (sampledPoints[sampledPoints.length - 1] !== points[points.length - 1]) {
    sampledPoints.push(points[points.length - 1])
  }

  return sampledPoints
}

/**
 * Generate time labels from data points
 */
function generateTimeLabels(points: ProcessedStats[]): string[] {
  return points.map(p => formatTime(p.x))
}

/**
 * Generate values array from data points
 */
function generateValues(points: ProcessedStats[]): number[] {
  return points.map(p => Math.round(p.y * 100) / 100)
}

/**
 * Generate a line chart using Mermaid XY chart syntax
 */
export function generateLineChart(
  title: string,
  yAxisLabel: string,
  lineLabel: string,
  points: ProcessedStats[],
): string {
  if (points.length === 0) {
    return `<!-- No data available for ${title} -->`
  }

  const sampledPoints = sampleDataPoints(points)
  const timeLabels = generateTimeLabels(sampledPoints)
  const values = generateValues(sampledPoints)

  return `\`\`\`mermaid
---
config:
  xyChart:
    width: 1200
    xAxis:
      labelFontSize: 10
---
xychart
    title "${title}"
    x-axis [${timeLabels.map(t => `"${t}"`).join(', ')}]
    y-axis "${yAxisLabel}"
    line [${values.join(', ')}]
\`\`\``
}

/**
 * Generate a stacked area/bar chart using Mermaid XY chart syntax
 * Note: Mermaid XY charts don't support true stacked areas, so we use multiple lines
 */
export function generateStackedChart(
  title: string,
  yAxisLabel: string,
  areas: Array<{ label: string; points: ProcessedStats[] }>
): string {
  if (areas.length === 0 || areas[0].points.length === 0) {
    return `<!-- No data available for ${title} -->`
  }

  const sampledAreas = areas.map(area => ({
    label: area.label,
    points: sampleDataPoints(area.points)
  }))

  const timeLabels = generateTimeLabels(sampledAreas[0].points)

  const lines = sampledAreas
    .map(area => {
      const values = generateValues(area.points)
      return `    line [${values.join(', ')}]`
    })
    .join('\n')

  return `\`\`\`mermaid
---
config:
  xyChart:
    width: 1200
    xAxis:
      labelFontSize: 10
---
xychart
    title "${title}"
    x-axis [${timeLabels.map(t => `"${t}"`).join(', ')}]
    y-axis "${yAxisLabel}"
${lines}
\`\`\``
}

/**
 * Generate a chart showing cumulative stacked values
 * This is useful for memory/disk usage where you want to show total capacity
 */
export function generateCumulativeStackedChart(
  title: string,
  yAxisLabel: string,
  areas: Array<{ label: string; points: ProcessedStats[] }>
): string {
  if (areas.length === 0 || areas[0].points.length === 0) {
    return `<!-- No data available for ${title} -->`
  }

  const sampledAreas = areas.map(area => ({
    label: area.label,
    points: sampleDataPoints(area.points)
  }))

  const timeLabels = generateTimeLabels(sampledAreas[0].points)

  // Calculate cumulative values
  const cumulativeData: Array<{ label: string; values: number[] }> = []
  const numPoints = sampledAreas[0].points.length

  for (let i = 0; i < sampledAreas.length; i++) {
    const values: number[] = []
    for (let j = 0; j < numPoints; j++) {
      let sum = sampledAreas[i].points[j].y
      for (let k = 0; k < i; k++) {
        sum += sampledAreas[k].points[j].y
      }
      values.push(Math.round(sum * 100) / 100)
    }
    cumulativeData.push({
      label: sampledAreas[i].label,
      values
    })
  }

  const lines = cumulativeData
    .map(data => `    line [${data.values.join(', ')}]`)
    .join('\n')

  return `\`\`\`mermaid
---
config:
  xyChart:
    width: 1200
    xAxis:
      labelFontSize: 10
---
xychart
    title "${title}"
    x-axis [${timeLabels.map(t => `"${t}"`).join(', ')}]
    y-axis "${yAxisLabel}"
${lines}
\`\`\``
}
