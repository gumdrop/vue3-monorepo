import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults, coverageConfigDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      server: {
        deps: {
          inline: ['vuetify'],
        },
      },
      coverage: {
        exclude: [
          ...coverageConfigDefaults.exclude,
          'src/entity/ApplicationContext.ts',
          'src/entity/Chat.ts',
          'src/entity/Competition.ts',
          'src/entity/CompetitionStatistics.ts',
          'src/entity/Entity.ts',
          'src/entity/Event.ts',
          'src/entity/GlobalText.ts',
          'src/entity/LeagueTable.ts',
          'src/entity/Season.ts',
          'src/entity/SiteUser.ts',
          'src/entity/Statisitics.ts',
          'src/entity/Team.ts',
          'src/entity/TeamMember.ts',
          'src/entity/Text.ts',
          'src/entity/Venue.ts',
        ],
        thresholds: {
          perFile: true,
          statements: 80,
          lines: 80,
        },
      },
    },
  }),
)
