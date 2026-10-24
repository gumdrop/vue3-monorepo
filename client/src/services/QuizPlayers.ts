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

// Category assignment in an individual round. When a team has at least as many
// players as categories the one-player-per-category rule applies; when it is
// short-handed (e.g. 3 players, 4 categories) a player may cover more than one
// category so every category can still be filled (FR-3.3).
export const availableCategoryPlayers = (
  selected: (string | null | undefined)[],
  index: number,
  all: string[],
): string[] => {
  if (all.length >= selected.length) {
    return availablePlayers(selected, index, all)
  }
  return all
}
