import { scaleTime, scaleLinear } from 'd3-scale'

export function makeTimeScale(domain: [Date, Date], range: [number, number]) {
  return scaleTime().domain(domain).range(range)
}

export function makeLinearScale(
  domain: [number, number],
  range: [number, number],
) {
  return scaleLinear().domain(domain).range(range)
}
