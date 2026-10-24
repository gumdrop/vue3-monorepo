// Helpers for the question-master player-selection step.

// Returns the names that may be offered in one selection slot. The slot's own
// current value is kept (so it stays visible and clearable), while names
// already chosen in other slots are excluded to prevent duplicate selections.
export const availablePlayers = (
  selected: (string | null | undefined)[],
  index: number,
  all: string[],
): string[] => {
  const current = (selected[index] ?? '').trim()
  return all.filter(
    (name) =>
      name === current ||
      !selected.some(
        (value, selectedIndex) => selectedIndex !== index && (value ?? '').trim() === name,
      ),
  )
}
