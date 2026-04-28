export interface TimelineSectionBounds {
  year: number
  top: number
  bottom: number
}

export function getActiveTimelineYear(sections: TimelineSectionBounds[], anchorY: number): number | null {
  if (sections.length === 0) return null

  const containing = sections.find((section) =>
    section.top <= anchorY && section.bottom > anchorY
  )
  if (containing) return containing.year

  const passed = sections
    .filter((section) => section.top <= anchorY)
    .sort((a, b) => b.top - a.top)

  return passed[0]?.year ?? sections[0]?.year ?? null
}
