import { ProcessedStats } from './interfaces'

export interface ChartDimensions {
  width: number
  height: number
  padding: { top: number; right: number; bottom: number; left: number }
  chartWidth: number
  chartHeight: number
}

export interface AxisTick {
  x?: number
  y?: number
  label: string
}

export interface ScaleFunctions {
  scaleX: (x: number) => number
  scaleY: (y: number) => number
}

export interface DataRange {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

/**
 * Get chart dimensions with default padding
 */
export function getChartDimensions(
  width = 1000,
  height = 500,
  topPadding = 40
): ChartDimensions {
  const padding = { top: topPadding, right: 40, bottom: 60, left: 80 }
  return {
    width,
    height,
    padding,
    chartWidth: width - padding.left - padding.right,
    chartHeight: height - padding.top - padding.bottom
  }
}

/**
 * Calculate data range from points
 */
export function calculateDataRange(
  points: ProcessedStats[],
  paddingPercent = 0.1
): DataRange {
  const xValues = points.map(p => new Date(p.x).getTime())
  const yValues = points.map(p => p.y)
  return {
    xMin: Math.min(...xValues),
    xMax: Math.max(...xValues),
    yMin: 0,
    yMax: Math.max(...yValues) * (1 + paddingPercent)
  }
}

/**
 * Calculate data range for stacked areas
 */
export function calculateStackedDataRange(
  areas: Array<{ points: ProcessedStats[] }>,
  paddingPercent = 0.1
): DataRange {
  const points = areas[0].points
  const xValues = points.map(p => new Date(p.x).getTime())

  let yMax = 0
  for (let i = 0; i < points.length; i++) {
    let stackedValue = 0
    for (const area of areas) {
      stackedValue += area.points[i].y
    }
    yMax = Math.max(yMax, stackedValue)
  }

  return {
    xMin: Math.min(...xValues),
    xMax: Math.max(...xValues),
    yMin: 0,
    yMax: yMax * (1 + paddingPercent)
  }
}

/**
 * Create scale functions for mapping data to pixel coordinates
 */
export function createScaleFunctions(
  dataRange: DataRange,
  dimensions: ChartDimensions
): ScaleFunctions {
  const { xMin, xMax, yMin, yMax } = dataRange
  const { chartWidth, chartHeight } = dimensions

  return {
    scaleX: (x: number) => ((x - xMin) / (xMax - xMin)) * chartWidth,
    scaleY: (y: number) =>
      chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight
  }
}

/**
 * Generate time axis ticks
 */
export function generateTimeTicks(
  dataRange: DataRange,
  chartWidth: number,
  numTicks = 5
): AxisTick[] {
  const { xMin, xMax } = dataRange
  const ticks: AxisTick[] = []

  for (let i = 0; i <= numTicks; i++) {
    const tickTime = xMin + (i * (xMax - xMin)) / numTicks
    const tickX = (i * chartWidth) / numTicks
    const date = new Date(tickTime)
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    ticks.push({ x: tickX, label: timeStr })
  }

  return ticks
}

/**
 * Generate Y-axis ticks
 */
export function generateYAxisTicks(
  dataRange: DataRange,
  chartHeight: number,
  numTicks = 5
): AxisTick[] {
  const { yMin, yMax } = dataRange
  const ticks: AxisTick[] = []

  for (let i = 0; i <= numTicks; i++) {
    const tickValue = yMin + (i * (yMax - yMin)) / numTicks
    const tickY = chartHeight - (i * chartHeight) / numTicks
    ticks.push({ y: tickY, label: tickValue.toFixed(1) })
  }

  return ticks
}

/**
 * Generate grid lines SVG
 */
export function generateGridLines(
  yTicks: AxisTick[],
  chartWidth: number
): string {
  return yTicks
    .map(
      tick =>
        `<line x1="0" y1="${tick.y}" x2="${chartWidth}" y2="${tick.y}" stroke="#e0e0e0" stroke-width="1"/>`
    )
    .join('\n    ')
}

/**
 * Generate axes SVG
 */
export function generateAxes(
  chartWidth: number,
  chartHeight: number,
  axisColor: string
): string {
  return `<line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}" stroke="${axisColor}" stroke-width="2"/>
    <line x1="0" y1="0" x2="0" y2="${chartHeight}" stroke="${axisColor}" stroke-width="2"/>`
}

/**
 * Generate X-axis ticks and labels SVG
 */
export function generateXAxisTicksAndLabels(
  timeTicks: AxisTick[],
  chartHeight: number,
  axisColor: string
): string {
  return timeTicks
    .map(
      tick => `
    <line x1="${tick.x}" y1="${chartHeight}" x2="${tick.x}" y2="${chartHeight + 5}" stroke="${axisColor}" stroke-width="1"/>
    <text x="${tick.x}" y="${chartHeight + 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${axisColor}">${tick.label}</text>
    `
    )
    .join('')
}

/**
 * Generate Y-axis ticks and labels SVG
 */
export function generateYAxisTicksAndLabels(
  yTicks: AxisTick[],
  axisColor: string
): string {
  return yTicks
    .map(
      tick => `
    <line x1="-5" y1="${tick.y ?? 0}" x2="0" y2="${tick.y ?? 0}" stroke="${axisColor}" stroke-width="1"/>
    <text x="-10" y="${(tick.y ?? 0) + 4}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="${axisColor}">${tick.label}</text>
    `
    )
    .join('')
}

/**
 * Generate axis labels SVG
 */
export function generateAxisLabels(
  chartWidth: number,
  chartHeight: number,
  axisColor: string
): string {
  return `<!-- X-axis label -->
    <text x="${chartWidth / 2}" y="${chartHeight + 45}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${axisColor}">Time</text>
    
    <!-- Y-axis label -->
    <text x="${-chartHeight / 2}" y="-50" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${axisColor}" transform="rotate(-90)">value</text>`
}

/**
 * Generate line graph path
 */
export function generateLinePath(
  points: ProcessedStats[],
  scaleFunctions: ScaleFunctions
): string {
  return points
    .map((p, i) => {
      const x = scaleFunctions.scaleX(new Date(p.x).getTime())
      const y = scaleFunctions.scaleY(p.y)
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`
    })
    .join(' ')
}

/**
 * Generate stacked area paths
 */
export function generateStackedAreaPaths(
  areas: Array<{ points: ProcessedStats[]; color: string }>,
  scaleFunctions: ScaleFunctions
): string[] {
  const areaPaths: string[] = []
  const points = areas[0].points
  let previousYValues = new Array(points.length).fill(0)

  for (const area of areas) {
    const pathPoints: Array<{ x: number; y: number }> = []

    // Top edge
    for (let i = 0; i < area.points.length; i++) {
      const x = scaleFunctions.scaleX(new Date(area.points[i].x).getTime())
      const y = scaleFunctions.scaleY(previousYValues[i] + area.points[i].y)
      pathPoints.push({ x, y })
    }

    // Bottom edge (reversed)
    for (let i = area.points.length - 1; i >= 0; i--) {
      const x = scaleFunctions.scaleX(new Date(area.points[i].x).getTime())
      const y = scaleFunctions.scaleY(previousYValues[i])
      pathPoints.push({ x, y })
    }

    const pathData =
      pathPoints
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
        .join(' ') + ' Z'

    areaPaths.push(`<path d="${pathData}" fill="${area.color}" stroke="none"/>`)

    // Update previous values for stacking
    for (let i = 0; i < area.points.length; i++) {
      previousYValues[i] += area.points[i].y
    }
  }

  return areaPaths
}

/**
 * Generate legend for stacked area graph
 */
export function generateLegend(
  areas: Array<{ label: string; color: string }>,
  width: number,
  axisColor: string
): string {
  const legendItemWidth = 120
  const legendStartX = (width - areas.length * legendItemWidth) / 2
  return areas
    .map((area, i) => {
      const x = legendStartX + i * legendItemWidth
      return `
    <rect x="${x}" y="15" width="15" height="15" fill="${area.color}"/>
    <text x="${x + 20}" y="27" font-family="Arial, sans-serif" font-size="12" fill="${axisColor}">${area.label}</text>
    `
    })
    .join('')
}

/**
 * Create complete SVG document
 */
export function createSVGDocument(
  dimensions: ChartDimensions,
  title: string,
  axisColor: string,
  chartContent: string,
  headerContent = ''
): string {
  const { width, height, padding } = dimensions

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="white"/>
  
  ${headerContent}
  
  <!-- Title -->
  <text x="${width / 2}" y="${padding.top > 50 ? 48 : 25}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${axisColor}">${title}</text>
  
  <!-- Chart area -->
  <g transform="translate(${padding.left},${padding.top})">
    ${chartContent}
  </g>
</svg>`
}

/**
 * Convert SVG string to base64 data URL
 */
export function svgToDataUrl(svg: string): string {
  const base64Svg = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64Svg}`
}
