import { describe, expect, it } from 'vitest'
import { getActiveTimelineYear } from '../components/gallery/timelineActiveYear'

describe('getActiveTimelineYear', () => {
  it('keeps the current year active while it still covers the viewport anchor', () => {
    expect(getActiveTimelineYear([
      { year: 2025, top: -4719, bottom: 686 },
      { year: 2024, top: 686, bottom: 5888 },
    ], 140)).toBe(2025)
  })

  it('switches when the next year crosses the viewport anchor', () => {
    expect(getActiveTimelineYear([
      { year: 2025, top: -5374, bottom: 31 },
      { year: 2024, top: 31, bottom: 5233 },
    ], 140)).toBe(2024)
  })
})
