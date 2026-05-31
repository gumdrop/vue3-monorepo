import { coverageConfigDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        ...coverageConfigDefaults.exclude,
        'src/command/ResultsSubmitCommand.ts',
        'src/entity/Chat.ts',
        'src/entity/CompetitionStatistics.ts',
        'src/entity/Entity.ts',
        'src/entity/EntityType.ts',
        'src/entity/Event.ts',
        'src/entity/Fixtures.ts',
        'src/entity/GlobalText.ts',
        'src/entity/LeagueTable.ts',
        'src/entity/Season.ts',
        'src/entity/SiteUser.ts',
        'src/entity/Statisitics.ts',
        'src/entity/Team.ts',
        'src/entity/Text.ts',
        'src/entity/User.ts',
        'src/entity/Venue.ts',
      ],
    },
  },
})
