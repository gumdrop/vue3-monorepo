import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref } from 'vue'
import LoginTitle from '../auth/LoginTitle.vue'
import LoggedOnMenu from '../auth/LoggedOnMenu.vue'
import SubTitle from '../common/SubTitle.vue'
import CompetitionLink from '../competition/CompetitionLink.vue'
import CompetitionTitle from '../competition/CompetitionTitle.vue'
import CompetitionsMain from '../competition/CompetitionsMain.vue'
import CompetitionsMenu from '../competition/CompetitionsMenu.vue'
import CompetitionsTitle from '../competition/CompetitionsTitle.vue'
import CupCompetiton from '../competition/CupCompetiton.vue'
import CompetitionFixturesCard from '../competition/FixturesCard.vue'
import CompetitionFixturesSet from '../competition/FixturesSet.vue'
import CompetitionLatestResults from '../competition/LatestResults.vue'
import LeagueCompetiton from '../competition/LeagueCompetiton.vue'
import CompetitionLeagueTables from '../competition/LeagueTables.vue'
import CompetitionNextFixtures from '../competition/NextFixtures.vue'
import SingletonCompetition from '../competition/SingletonCompetition.vue'
import SubsidiaryCompetition from '../competition/SubsidiaryCompetition.vue'
import CompetitionStatisticsResultSeason from '../competition/statistics/CompetitionStatisticsResultSeason.vue'
import CompetitionStatisticsResultTeam from '../competition/statistics/CompetitionStatisticsResultTeam.vue'
import AllFixtures from '../fixtures/AllFixtures.vue'
import AllFixturesPage from '../fixtures/AllFixturesPage.vue'
import AllFixturesTitle from '../fixtures/AllFixturesTitle.vue'
import FixtureLine from '../fixtures/FixtureLine.vue'
import FixtureLineWrapper from '../fixtures/FixtureLineWrapper.vue'
import FixturesCard from '../fixtures/FixturesCard.vue'
import MatchReportItem from '../fixtures/MatchReportItem.vue'
import MatchReports from '../fixtures/MatchReports.vue'
import SimpleFixtures from '../fixtures/SimpleFixtures.vue'
import HomeFixturesCard from '../home/FixturesCard.vue'
import HomeFixturesSet from '../home/FixturesSet.vue'
import HomeMain from '../home/HomeMain.vue'
import HomeTabs from '../home/HomeTabs.vue'
import HomeTitle from '../home/HomeTitle.vue'
import HomeLatestResults from '../home/LatestResults.vue'
import LatestResultsSummary from '../home/LatestResultsSummary.vue'
import HomeLeagueTables from '../home/LeagueTables.vue'
import HomeNextFixtures from '../home/NextFixtures.vue'
import LeagueTable from '../leaguetable/LeagueTable.vue'
import AliasContactDialog from '../other/AliasContactDialog.vue'
import ContactUsMain from '../other/ContactUsMain.vue'
import ContactUsTitle from '../other/ContactUsTitle.vue'
import HelpMain from '../other/HelpMain.vue'
import HelpMenu from '../other/HelpMenu.vue'
import HelpTitle from '../other/HelpTitle.vue'
import LinksMain from '../other/LinksMain.vue'
import LinksTitle from '../other/LinksTitle.vue'
import RulesMain from '../other/RulesMain.vue'
import RulesTitle from '../other/RulesTitle.vue'
import AllResults from '../results/AllResults.vue'
import ResultsMenu from '../results/ResultsMenu.vue'
import ResultsTitle from '../results/ResultsTitle.vue'
import SubmitResult from '../results/SubmitResult.vue'
import SubmitResults from '../results/SubmitResults.vue'
import SubmitResultsInstructions from '../results/SubmitResultsInstructions.vue'
import SubmitResultsTitle from '../results/SubmitResultsTitle.vue'
import TeamFixturesSet from '../team/FixturesSet.vue'
import StartTeam from '../team/StartTeam.vue'
import StartTeamTitle from '../team/StartTeamTitle.vue'
import TeamEdit from '../team/TeamEdit.vue'
import TeamEditTitle from '../team/TeamEditTitle.vue'
import TeamFixtures from '../team/TeamFixtures.vue'
import TeamInfo from '../team/TeamInfo.vue'
import TeamMain from '../team/TeamMain.vue'
import TeamResults from '../team/TeamResults.vue'
import TeamStandingLine from '../team/TeamStandingLine.vue'
import TeamStandings from '../team/TeamStandings.vue'
import TeamTitle from '../team/TeamTitle.vue'
import TeamsMain from '../team/TeamsMain.vue'
import TeamsMenu from '../team/TeamsMenu.vue'
import TeamsTitle from '../team/TeamsTitle.vue'
import AllSeasonsAverage from '../team/stats/AllSeasonsAverage.vue'
import AllSeasonsLeaguePosition from '../team/stats/AllSeasonsLeaguePosition.vue'
import AllSeasonsLineChart from '../team/stats/AllSeasonsLineChart.vue'
import AllSeasonsResultTypes from '../team/stats/AllSeasonsResultTypes.vue'
import AllSeasonsStats from '../team/stats/AllSeasonsStats.vue'
import HeadToHead from '../team/stats/HeadToHead.vue'
import HeadToHeadAverageScore from '../team/stats/HeadToHeadAverageScore.vue'
import HeadToHeadLeaguePosition from '../team/stats/HeadToHeadLeaguePosition.vue'
import HeadToHeadLineChart from '../team/stats/HeadToHeadLineChart.vue'
import HeadToHeadResults from '../team/stats/HeadToHeadResults.vue'
import LineChart from '../team/stats/LineChart.vue'
import ResultTypes from '../team/stats/ResultTypes.vue'
import SeasonCumulativePointsDiff from '../team/stats/SeasonCumulativePointsDiff.vue'
import SeasonCumulativeScores from '../team/stats/SeasonCumulativeScores.vue'
import SeasonMatchScores from '../team/stats/SeasonMatchScores.vue'
import StatisticsTeamTitle from '../team/stats/StatisticsTeamTitle.vue'
import TeamStats from '../team/stats/TeamStats.vue'
import QlTextBox from '../text/QlTextBox.vue'
import VenueLink from '../venue/VenueLink.vue'
import VenueMain from '../venue/VenueMain.vue'
import VenueTitle from '../venue/VenueTitle.vue'
import VenuesMain from '../venue/VenuesMain.vue'
import VenuesMenu from '../venue/VenuesMenu.vue'
import VenuesTitle from '../venue/VenuesTitle.vue'
import { siteComponentStubs } from './componentStubs'

const mocks = vi.hoisted(() => ({
  activeFixtures: vi.fn(),
  allSeasonsAverageData: vi.fn(),
  allSeasonsMultipleTeamStats: vi.fn(),
  allSeasonsPositionData: vi.fn(),
  allSeasonsResultTypes: vi.fn(),
  competitionOfType: vi.fn(),
  competitions: vi.fn(),
  cumulativePointsDifferenceData: vi.fn(),
  cumulativeScoresData: vi.fn(),
  fixtureRefs: [] as unknown[],
  fixtureSets: [] as unknown[],
  fixturesForResultSubmission: vi.fn(),
  getNamedTextId: vi.fn(),
  goTo: vi.fn(),
  headToHeadResultsData: vi.fn(),
  latestResults: vi.fn(),
  logoff: vi.fn(),
  matchScoresData: vi.fn(),
  multipleTeamsAllSeasonsAverageData: vi.fn(),
  multipleTeamsAllSeasonsPositionData: vi.fn(),
  nextFixtures: vi.fn(),
  positionData: vi.fn(),
  route: { query: {} as Record<string, unknown> },
  routerPush: vi.fn(),
  saveSiteUser: vi.fn(),
  setCompetitionSeason: vi.fn(),
  setResultsSeason: vi.fn(),
  setSidemenu: vi.fn(),
  setTeamSeason: vi.fn(),
  setTitle: vi.fn(),
  singleSeasonResultTypes: vi.fn(),
  spentFixtures: vi.fn(),
  standings: vi.fn(),
  submitResult: vi.fn(),
  teamCount: vi.fn(),
  teamCountAllSeasons: vi.fn(),
  teamFixtures: vi.fn(),
  teamResults: vi.fn(),
  teamStats: vi.fn(),
  teamUpdate: vi.fn(),
  textSave: vi.fn(),
  userEntityList: vi.fn(),
  userNewInstance: vi.fn(),
  userSave: vi.fn(),
  collections: new Map<string, unknown[]>(),
  competitionsByPath: new Map<string, unknown>(),
  fixturesByPath: new Map<string, unknown>(),
  leagueTablesByPath: new Map<string, unknown>(),
  seasonsById: new Map<string, unknown>(),
  seasonsByPath: new Map<string, unknown>(),
  teamsById: new Map<string, unknown>(),
  teamsByPath: new Map<string, unknown>(),
  textsByPath: new Map<string, unknown>(),
  venuesById: new Map<string, unknown>(),
  seasonId: 'season-2025',
  smAndDown: false,
  user: undefined as
    | {
        siteUser: {
          id: string
          path: string
          handle: string
          avatar: string
          user?: { id: string; path: string }
        }
        team: { id: string; name: string }
        email: string
      }
    | undefined,
}))

const docRef = <T>(pathish: string | { path?: string } | undefined, data?: T) => {
  const path = typeof pathish === 'string' ? pathish : (pathish?.path ?? '')
  return {
    id: path.split('/').pop() ?? path,
    path,
    __data: data,
    withConverter: vi.fn(),
  }
}

const dataForDocument = (source: unknown) => {
  const resolved = typeof source === 'function' ? source() : source
  const unwrapped =
    resolved && typeof resolved === 'object' && 'value' in resolved
      ? (resolved as { value: unknown }).value
      : resolved
  return (unwrapped as { __data?: unknown } | undefined)?.__data
}

vi.mock('@/dao/ApplicationContextDAO', () => ({
  default: {
    get: () =>
      docRef('applicationcontext/default', {
        id: 'default',
        currentSeason: { id: mocks.seasonId, path: `season/${mocks.seasonId}` },
      }),
  },
}))

vi.mock('@/dao/CompetitionDAO', () => ({
  default: {
    getByPath: (path: string) => docRef(path, mocks.competitionsByPath.get(path)),
  },
}))

vi.mock('@/dao/FixturesDAO', () => ({
  default: {
    entityList: vi.fn(async () => mocks.fixtureSets),
    getByPath: (path: string) => docRef(path, mocks.fixturesByPath.get(path)),
  },
  fixtureDAO: {
    collectionToDocuments: vi.fn(async () => mocks.fixtureRefs),
    getByPath: (path: string) => docRef(path, mocks.fixturesByPath.get(path)),
    subCollection: (path: string) => ({ path: `${path}/fixture`, __data: mocks.fixtureRefs }),
  },
  reportDAO: {
    subCollection: (path: string) => ({
      path: `${path}/report`,
      __data: mocks.collections.get(`${path}/report`) ?? [],
    }),
  },
}))

vi.mock('@/dao/LeagueTableDAO', () => ({
  default: {
    getByPath: (path: string) => docRef(path, mocks.leagueTablesByPath.get(path)),
  },
}))

vi.mock('@/dao/SeasonDAO', () => ({
  default: {
    collection: () => ({ __data: mocks.collections.get('season') ?? [] }),
    getById: (id: string) => docRef(`season/${id}`, mocks.seasonsById.get(id)),
    getByPath: (path: string) => docRef(path, mocks.seasonsByPath.get(path)),
  },
}))

vi.mock('@/dao/SiteUserDAO', () => ({
  default: {
    save: mocks.saveSiteUser,
  },
}))

vi.mock('@/dao/StatisticsDAO', () => ({
  default: {
    allTeamStats: (teamId: string) => ({
      __data: mocks.collections.get(`statistics/all/${teamId}`) ?? [],
    }),
    teamStats: (teamId: string, seasonId: string) => ({
      __data: mocks.collections.get(`statistics/${teamId}/${seasonId}`) ?? [],
    }),
  },
}))

vi.mock('@/dao/TeamDAO', () => ({
  default: {
    getById: (id: string | undefined) =>
      docRef(`team/${id}`, id ? mocks.teamsById.get(id) : undefined),
    getByPath: (path: string) => docRef(path, mocks.teamsByPath.get(path)),
    sortedActive: () => ({ __data: mocks.collections.get('team') ?? [] }),
    update: mocks.teamUpdate,
  },
}))

vi.mock('@/dao/TextDAO', () => ({
  default: {
    getByPath: (pathish: string | { path?: string }) => {
      const path = typeof pathish === 'string' ? pathish : (pathish.path ?? '')
      return docRef(path, mocks.textsByPath.get(path))
    },
    getData: vi.fn(async (textRef: { path: string }) => mocks.textsByPath.get(textRef.path)),
    save: mocks.textSave,
  },
}))

vi.mock('@/dao/UserDAO', () => ({
  default: {
    entityList: mocks.userEntityList,
    newInstance: mocks.userNewInstance,
    save: mocks.userSave,
  },
}))

vi.mock('@/dao/VenueDAO', () => ({
  default: {
    getById: (id: string) => docRef(`venue/${id}`, mocks.venuesById.get(id)),
    sortedActive: () => ({ __data: mocks.collections.get('venue') ?? [] }),
  },
}))

vi.mock('@/services/AuthService', () => ({
  default: () => ({
    logout: mocks.logoff,
  }),
}))

vi.mock('@/services/CompetitionService', () => ({
  useCompetitions: () => ({
    competitionOfType: mocks.competitionOfType,
    competitions: mocks.competitions,
    latestResults: mocks.latestResults,
    leagueTables: (path: string) => ({
      __data: mocks.collections.get(`${path}/leaguetable`) ?? [],
    }),
    nextFixtures: mocks.nextFixtures,
  }),
}))

vi.mock('@/services/DateService', () => ({
  useDateTime: () => ({
    date: (value: string | undefined) => value?.replaceAll('-', '/'),
  }),
}))

vi.mock('@/services/DialogService', () => ({
  useDialog: () => ({
    dialogSize: {},
  }),
}))

vi.mock('@/services/FixtureService', () => ({
  useFixture: () => ({
    fixturesForResultSubmission: mocks.fixturesForResultSubmission,
    submitResult: mocks.submitResult,
    teamFixtures: mocks.teamFixtures,
    teamResults: mocks.teamResults,
  }),
}))

vi.mock('@/services/FixturesService', () => ({
  useFixtures: () => ({
    activeFixtures: mocks.activeFixtures,
    spentFixtures: mocks.spentFixtures,
  }),
}))

vi.mock('@/services/KeyService', () => ({
  useKey: () => ({
    decode: (value?: string) => value?.replaceAll('|', '/') ?? '',
    encode: (value?: string) => value?.replaceAll('/', '|') ?? '',
    parseParent: (value?: string) => {
      const parts = value ? value.replace(/\/$/, '').split('/') : []
      return parts.length > 2 ? parts.slice(0, parts.length - 2).join('/') : ''
    },
  }),
}))

vi.mock('@/services/LayoutService', () => ({
  useLayout: () => ({
    gridSize: 'grid-test',
  }),
}))

vi.mock('@/services/SeasonService', () => ({
  useSeason: () => ({
    formatSeason: (season: { startYear: number; endYear: number }) =>
      `${season.startYear}/${season.endYear}`,
  }),
}))

vi.mock('@/services/TeamService', () => ({
  useTeams: () => ({
    allSeasonsAverageData: mocks.allSeasonsAverageData,
    allSeasonsMultipleTeamStats: mocks.allSeasonsMultipleTeamStats,
    allSeasonsPositionData: mocks.allSeasonsPositionData,
    allSeasonsResultTypes: mocks.allSeasonsResultTypes,
    cumulativePointsDifferenceData: mocks.cumulativePointsDifferenceData,
    cumulativeScoresData: mocks.cumulativeScoresData,
    headToHeadResultsData: mocks.headToHeadResultsData,
    matchScoresData: mocks.matchScoresData,
    multipleTeamsAllSeasonsAverageData: mocks.multipleTeamsAllSeasonsAverageData,
    multipleTeamsAllSeasonsPositionData: mocks.multipleTeamsAllSeasonsPositionData,
    positionData: mocks.positionData,
    singleSeasonResultTypes: mocks.singleSeasonResultTypes,
    standings: mocks.standings,
    teamCount: mocks.teamCount,
    teamCountAllSeasons: mocks.teamCountAllSeasons,
  }),
}))

vi.mock('@/services/TextService', () => ({
  useText: () => ({
    getNamedTextId: mocks.getNamedTextId,
  }),
}))

vi.mock('@/services/TitleService', () => ({
  default: () => ({
    setTitle: mocks.setTitle,
  }),
}))

vi.mock('@/stores/app', () => ({
  useAppContextStore: () => ({
    seasonId: ref(mocks.seasonId),
  }),
  useSideMenuStore: () => ({
    sidemenu: true,
    setSidemenu: mocks.setSidemenu,
  }),
  useUserStore: () => ({
    user: mocks.user,
  }),
}))

vi.mock('@/stores/competiton', () => ({
  useCompetition: () => ({
    seasonId: ref(mocks.seasonId),
    setSeason: mocks.setCompetitionSeason,
  }),
}))

vi.mock('@/stores/results', () => ({
  useResultsStore: () => ({
    seasonId: ref(mocks.seasonId),
    setSeason: mocks.setResultsSeason,
  }),
}))

vi.mock('@/stores/teams', () => ({
  useTeamStore: () => ({
    seasonId: ref(mocks.seasonId),
    setSeason: mocks.setTeamSeason,
  }),
}))

vi.mock('pinia', () => ({
  storeToRefs: (store: { user?: unknown }) => ({
    user: computed(() => store.user),
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({
    push: mocks.routerPush,
  }),
}))

vi.mock('vuetify', () => ({
  useDisplay: () => ({
    lgAndUp: ref(true),
    mdAndDown: ref(false),
    mdAndUp: ref(true),
    smAndDown: ref(mocks.smAndDown),
    smAndUp: ref(!mocks.smAndDown),
    xs: ref(false),
  }),
  useGoTo: () => mocks.goTo,
}))

vi.mock('vuefire', () => ({
  useCollection: (source: unknown) => ref(dataForDocument(source) ?? []),
  useDocument: (source: unknown) =>
    Object.assign(ref(dataForDocument(source)), {
      error: undefined,
      pending: false,
    }),
}))

vi.mock('vue-chartjs', () => ({
  Line: defineComponent({
    props: {
      data: Object,
      options: Object,
      width: String,
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'line-chart',
          'data-width': props.width,
          'data-options': JSON.stringify(props.options ?? {}),
        })
    },
  }),
  Pie: defineComponent({
    props: {
      data: Object,
    },
    setup() {
      return () => h('div', { 'data-test': 'pie-chart' })
    },
  }),
}))

vi.mock('@vueup/vue-quill', () => ({
  QuillEditor: defineComponent({
    props: {
      content: String,
    },
    emits: ['update:content'],
    setup(props, { emit }) {
      return () =>
        h('textarea', {
          'aria-label': 'HTML',
          value: props.content ?? '',
          onInput: (event: Event) =>
            emit('update:content', (event.target as HTMLTextAreaElement).value),
        })
    },
  }),
}))

vi.mock('chart.js/auto', () => ({}))

const namedTextStub = defineComponent({
  props: {
    textName: String,
  },
  setup(props) {
    return () => h('span', { 'data-test': 'named-text' }, props.textName)
  },
})

const qlTextStub = defineComponent({
  props: {
    id: String,
  },
  setup(props) {
    return () => h('span', { 'data-test': 'ql-text' }, props.id)
  },
})

const subTitleStub = defineComponent({
  props: {
    colour: String,
    icon: String,
    title: String,
  },
  setup(props, { slots }) {
    return () =>
      h('section', { 'data-test': 'sub-title', 'data-icon': props.icon }, [
        props.title,
        slots.subtitle?.(),
        slots.actions?.(),
      ])
  },
})

const simpleStub = (name: string) =>
  defineComponent({
    name,
    props: {
      fetchFunction: Function,
      fixtureDoc: Object,
      fixtures: [Array, Object],
      id: String,
      inlineDetails: Boolean,
      path: String,
      report: Object,
      row: Object,
      seasonId: String,
      stats: [Array, Object],
      teamId: String,
      text: String,
      title: String,
    },
    emits: ['season'],
    setup(props, { slots }) {
      return () =>
        h('div', { 'data-test': name }, [
          props.title,
          props.id,
          props.path,
          props.teamId,
          props.seasonId,
          props.text,
          slots.default?.(),
        ])
    },
  })

const mountSite = (
  component: Parameters<typeof mount>[0],
  options: Parameters<typeof mount>[1] = {},
) =>
  mount(component, {
    ...options,
    global: {
      stubs: {
        ...siteComponentStubs,
        AllSeasonsAverage: simpleStub('all-seasons-average'),
        AllSeasonsLeaguePosition: simpleStub('all-seasons-league-position'),
        AllSeasonsLineChart: simpleStub('all-seasons-line-chart'),
        AllSeasonsResultTypes: simpleStub('all-seasons-result-types'),
        AllSeasonsStats: simpleStub('all-seasons-stats'),
        CompetitionLink: simpleStub('competition-link'),
        CompetitionStatisticsMenu: simpleStub('competition-statistics-menu'),
        EventsTab: simpleStub('events-tab'),
        FetchActions: simpleStub('fetch-actions'),
        FixtureLine: simpleStub('fixture-line'),
        FixtureLineWrapper: simpleStub('fixture-line-wrapper'),
        FixturesCard: simpleStub('fixtures-card'),
        FixturesSet: simpleStub('fixtures-set'),
        HeadToHead: simpleStub('head-to-head'),
        HeadToHeadAverageScore: simpleStub('head-to-head-average-score'),
        HeadToHeadLeaguePosition: simpleStub('head-to-head-league-position'),
        HeadToHeadLineChart: simpleStub('head-to-head-line-chart'),
        HeadToHeadResults: simpleStub('head-to-head-results'),
        HomeTabs: simpleStub('home-tabs'),
        LatestResults: simpleStub('latest-results'),
        LatestResultsSummary: simpleStub('latest-results-summary'),
        LeagueTable: simpleStub('league-table'),
        LineChart: simpleStub('line-chart-wrapper'),
        MatchReportItem: simpleStub('match-report-item'),
        MatchReports: simpleStub('match-reports'),
        NextFixtures: simpleStub('next-fixtures'),
        PageTitle: simpleStub('page-title'),
        QlMarkdown: simpleStub('ql-markdown'),
        QlNamedText: namedTextStub,
        QlText: qlTextStub,
        QlTextBox,
        ResultTypes: simpleStub('result-types'),
        SeasonCumulativePointsDiff: simpleStub('season-cumulative-points-diff'),
        SeasonCumulativeScores: simpleStub('season-cumulative-scores'),
        SeasonMatchScores: simpleStub('season-match-scores'),
        SeasonSelect: simpleStub('season-select'),
        SideMenu: simpleStub('side-menu'),
        SideMenuItem: simpleStub('side-menu-item'),
        SimpleFixtures: simpleStub('simple-fixtures'),
        StatisticsTeamTitle: simpleStub('statistics-team-title'),
        SubTitle: subTitleStub,
        TeamFixtures: simpleStub('team-fixtures'),
        TeamInfo: simpleStub('team-info'),
        TeamResults: simpleStub('team-results'),
        TeamStandings: simpleStub('team-standings'),
        VenueLink: simpleStub('venue-link'),
      },
      mocks: {
        $route: mocks.route,
        $vuetify: {
          display: {
            mdAndUp: true,
            smAndDown: false,
            smAndUp: true,
          },
        },
      },
      ...options.global,
    },
  })

const season = {
  id: mocks.seasonId,
  path: `season/${mocks.seasonId}`,
  startYear: 2025,
  endYear: 2026,
  text: { id: 'season-text', path: 'text/season-text' },
}

const leagueCompetition = {
  id: 'league',
  path: `season/${mocks.seasonId}/competition/league`,
  _name: 'league',
  name: 'League',
  icon: 'mdi-trophy',
  text: { id: 'league-text', path: 'text/league-text' },
}

const cupCompetition = {
  id: 'cup',
  path: `season/${mocks.seasonId}/competition/cup`,
  _name: 'cup',
  name: 'Cup',
  icon: 'mdi-cup',
  textName: 'cup-info',
  text: { id: 'cup-text', path: 'text/cup-text' },
}

const singletonCompetition = {
  id: 'finals',
  path: `season/${mocks.seasonId}/competition/finals`,
  _name: 'singleton',
  name: 'Finals',
  textName: 'finals-info',
  text: { id: 'finals-text', path: 'text/finals-text' },
  event: {
    date: '2026-05-31',
    time: '19:30',
    venue: { id: 'town-hall', path: 'venue/town-hall' },
  },
}

const team = {
  id: 'alpha',
  path: 'team/alpha',
  name: 'Alpha Quiz Team',
  shortName: 'Alpha',
  handle: 'alpha',
  venue: { id: 'town-hall', path: 'venue/town-hall' },
  text: { id: 'team-text', path: 'text/team-text' },
  users: [{ id: 'user-1', path: 'user/user-1' }],
}

const opponent = {
  id: 'bravo',
  path: 'team/bravo',
  name: 'Bravo Quiz Team',
  shortName: 'Bravo',
  handle: 'bravo',
  users: [],
}

const venue = {
  id: 'town-hall',
  path: 'venue/town-hall',
  name: 'Town Hall',
  address: '1 High Street\nTown',
  email: 'venue@example.com',
  website: 'https://venue.example.com',
  phone: '01234 567890',
  imageURL: '/venue.jpg',
}

const fixtureSet = {
  id: 'week-1',
  path: `${leagueCompetition.path}/fixtures/week-1`,
  date: '2026-05-31',
  start: '19:30',
  description: 'Week 1',
  resultsSummary: { id: 'summary', path: 'text/summary' },
}

const fixture = {
  id: 'fixture-1',
  key: `${fixtureSet.path}/fixture/fixture-1`,
  path: `${fixtureSet.path}/fixture/fixture-1`,
  home: { id: 'alpha', path: 'team/alpha' },
  away: { id: 'bravo', path: 'team/bravo' },
  venue: { id: 'town-hall', path: 'venue/town-hall' },
  result: { homeScore: 44, awayScore: 41 },
}

const fixtureDoc = docRef(fixture.path, fixture)
const fixtureSetDoc = docRef(fixtureSet.path, fixtureSet)

const stats = {
  id: 'stats-alpha',
  path: 'statistics/stats-alpha',
  team: { id: 'alpha', path: 'team/alpha' },
  season: { id: mocks.seasonId, path: `season/${mocks.seasonId}` },
  seasonStats: {
    currentLeaguePosition: 1,
    headToHead: [],
    runningPointsAgainst: 40,
    runningPointsDifference: 4,
    runningPointsFor: 44,
  },
  weekStats: {},
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.activeFixtures.mockResolvedValue([fixtureSetDoc])
  mocks.allSeasonsAverageData.mockResolvedValue({ labels: [], datasets: [] })
  mocks.allSeasonsMultipleTeamStats.mockResolvedValue([[stats], [{ ...stats, id: 'stats-bravo' }]])
  mocks.allSeasonsPositionData.mockResolvedValue({ labels: [], datasets: [] })
  mocks.allSeasonsResultTypes.mockReturnValue({ labels: ['Won'], datasets: [{ data: [1] }] })
  mocks.competitionOfType.mockResolvedValue(leagueCompetition)
  mocks.competitions.mockResolvedValue([cupCompetition, leagueCompetition])
  mocks.cumulativePointsDifferenceData.mockReturnValue({ labels: [], datasets: [] })
  mocks.cumulativeScoresData.mockReturnValue({ labels: [], datasets: [] })
  mocks.fixtureRefs = [fixtureDoc]
  mocks.fixtureSets = [fixtureSet]
  mocks.fixturesForResultSubmission.mockResolvedValue([fixtureDoc])
  mocks.getNamedTextId.mockResolvedValue('named-text')
  mocks.headToHeadResultsData.mockResolvedValue([{ team: 'Alpha', win: 1, lose: 0, draw: 0 }])
  mocks.latestResults.mockResolvedValue([fixtureSetDoc])
  mocks.matchScoresData.mockReturnValue({ labels: [], datasets: [] })
  mocks.multipleTeamsAllSeasonsAverageData.mockResolvedValue({ labels: [], datasets: [] })
  mocks.multipleTeamsAllSeasonsPositionData.mockResolvedValue({ labels: [], datasets: [] })
  mocks.nextFixtures.mockResolvedValue([fixtureSetDoc])
  mocks.positionData.mockReturnValue({ labels: [], datasets: [] })
  mocks.saveSiteUser.mockResolvedValue(undefined)
  mocks.singleSeasonResultTypes.mockReturnValue({ labels: ['Won'], datasets: [{ data: [1] }] })
  mocks.spentFixtures.mockResolvedValue([fixtureSetDoc])
  mocks.standings.mockResolvedValue([{ name: 'League', standing: '1st' }])
  mocks.submitResult.mockResolvedValue(undefined)
  mocks.teamCount.mockResolvedValue(4)
  mocks.teamCountAllSeasons.mockResolvedValue(4)
  mocks.teamFixtures.mockResolvedValue([fixtureDoc])
  mocks.teamResults.mockResolvedValue([fixtureDoc])
  mocks.teamStats.mockReturnValue({ __data: [stats] })
  mocks.teamUpdate.mockResolvedValue(undefined)
  mocks.userEntityList.mockResolvedValue([{ id: 'user-1', path: 'user/user-1', name: 'Alice' }])
  mocks.userNewInstance.mockReturnValue({
    id: 'user-new',
    path: 'user/user-new',
    name: '',
    email: '',
  })
  mocks.userSave.mockResolvedValue(undefined)
  mocks.route.query = {}
  mocks.smAndDown = false
  mocks.collections.clear()
  mocks.competitionsByPath.clear()
  mocks.fixturesByPath.clear()
  mocks.leagueTablesByPath.clear()
  mocks.seasonsById.clear()
  mocks.seasonsByPath.clear()
  mocks.teamsById.clear()
  mocks.teamsByPath.clear()
  mocks.textsByPath.clear()
  mocks.venuesById.clear()
  mocks.user = {
    siteUser: {
      id: 'site-user-1',
      path: 'siteuser/site-user-1',
      handle: 'Alice',
      avatar: '/avatar.png',
      user: { id: 'user-1', path: 'user/user-1' },
    },
    team: { id: 'alpha', name: 'Alpha Quiz Team' },
    email: 'alice@example.com',
  }

  mocks.collections.set('season', [season])
  mocks.collections.set('team', [team, opponent])
  mocks.collections.set('venue', [venue])
  mocks.collections.set(`${leagueCompetition.path}/leaguetable`, [
    {
      id: 'table-1',
      path: `${leagueCompetition.path}/leaguetable/table-1`,
      rows: [{ team: { id: 'alpha', path: 'team/alpha' }, position: 1 }],
    },
  ])
  mocks.collections.set(`statistics/all/${team.id}`, [stats, { ...stats, id: 'stats-alpha-2' }])
  mocks.collections.set(`statistics/${team.id}/${mocks.seasonId}`, [stats])
  mocks.collections.set(`${fixture.path}/report`, [
    {
      id: 'report-1',
      path: `${fixture.path}/report/report-1`,
      team: { id: 'alpha', path: 'team/alpha' },
      text: { id: 'report-text', path: 'text/report-text' },
    },
  ])
  mocks.competitionsByPath.set(leagueCompetition.path, leagueCompetition)
  mocks.competitionsByPath.set(cupCompetition.path, cupCompetition)
  mocks.competitionsByPath.set(singletonCompetition.path, singletonCompetition)
  mocks.fixturesByPath.set(fixture.path, fixture)
  mocks.fixturesByPath.set(fixtureSet.path, fixtureSet)
  mocks.leagueTablesByPath.set(`${leagueCompetition.path}/leaguetable/table-1`, {
    id: 'table-1',
    path: `${leagueCompetition.path}/leaguetable/table-1`,
    description: 'Main League',
    rows: [{ team: { id: 'alpha', path: 'team/alpha' }, position: 1 }],
  })
  mocks.seasonsById.set(mocks.seasonId, season)
  mocks.seasonsByPath.set(`season/${mocks.seasonId}`, season)
  mocks.teamsById.set(team.id, team)
  mocks.teamsById.set(opponent.id, opponent)
  mocks.teamsByPath.set(team.path, team)
  mocks.teamsByPath.set(opponent.path, opponent)
  mocks.textsByPath.set('text/summary', {
    id: 'summary',
    path: 'text/summary',
    text: 'Alpha opened the season with a win.',
    mimeType: 'text/markdown',
  })
  mocks.venuesById.set(venue.id, venue)
})

describe('remaining site title and navigation components', () => {
  it('renders static title components through SubTitle', () => {
    const cases: Array<[unknown, string]> = [
      [LoginTitle, 'Login'],
      [AllFixturesTitle, 'All Fixtures'],
      [ContactUsTitle, 'Contact Us'],
      [HelpTitle, 'Help'],
      [LinksTitle, 'Links'],
      [RulesTitle, 'Rules'],
      [SubmitResultsTitle, 'Submit Results'],
      [StartTeamTitle, 'Start a Team'],
      [TeamsTitle, 'Teams'],
      [VenuesTitle, 'Venues'],
    ]

    for (const [component, title] of cases) {
      expect(mountSite(component).text()).toContain(title)
    }
  })

  it('renders SubTitle gradients, subtitle slots, action slots, and updates the page title', () => {
    const wrapper = mountSite(SubTitle, {
      props: {
        title: 'Custom Title',
        icon: 'mdi-star',
        gradient: 'linear-gradient(red, blue)',
      },
      slots: {
        subtitle: '<span data-test="subtitle">Subtitle slot</span>',
        actions: '<button data-test="action">Action slot</button>',
      },
      global: {
        stubs: {
          ...siteComponentStubs,
        },
      },
    })

    expect(mocks.setTitle).toHaveBeenCalledWith('Custom Title')
    expect(wrapper.text()).toContain('Custom Title')
    expect(wrapper.get('[data-test="subtitle"]').text()).toBe('Subtitle slot')
    expect(wrapper.get('[data-test="action"]').text()).toBe('Action slot')
    expect(wrapper.get('.hero-header').exists()).toBe(true)
  })

  it('renders dynamic entity links and titles', () => {
    expect(
      mountSite(CompetitionLink, {
        props: { path: leagueCompetition.path },
        global: { stubs: { ...siteComponentStubs } },
      })
        .get('a')
        .attributes('href'),
    ).toBe(`/season|${mocks.seasonId}|competition|league/league`)

    expect(
      mountSite(CompetitionTitle, {
        props: { path: `season|${mocks.seasonId}|competition|league` },
        global: { stubs: { ...siteComponentStubs, PageTitle: simpleStub('page-title') } },
      }).text(),
    ).toContain('League')

    expect(mountSite(TeamTitle, { props: { id: team.id } }).text()).toContain(team.name)
    expect(mountSite(TeamEditTitle, { props: { id: team.id } }).text()).toContain('Edit Details')
    expect(mountSite(StatisticsTeamTitle, { props: { id: team.id } }).text()).toContain(
      'Graphs and Statistics',
    )
    expect(mountSite(VenueTitle, { props: { id: venue.id } }).text()).toContain(venue.name)
    expect(
      mountSite(VenueLink, {
        props: { id: venue.id },
        global: { stubs: { ...siteComponentStubs } },
      })
        .get('a')
        .attributes('href'),
    ).toBe(`/venue/${venue.id}`)
  })

  it('renders season-aware page titles with season selectors', () => {
    expect(mountSite(HomeTitle).text()).toContain('Current Season: 2025/2026')

    const competitions = mountSite(CompetitionsTitle)
    expect(competitions.text()).toContain('Competitions')
    expect(competitions.text()).toContain('2025/2026')

    const results = mountSite(ResultsTitle)
    expect(results.text()).toContain('All Results')
    expect(results.text()).toContain('2025/2026')
  })

  it('renders menus from loaded collections and user state', async () => {
    const resultsMenu = mountSite(ResultsMenu)
    expect(resultsMenu.text()).toContain('All Results')
    expect(resultsMenu.text()).toContain('Submit Results')

    const teamsMenu = mountSite(TeamsMenu)
    expect(teamsMenu.text()).toContain('Start a team')
    expect(teamsMenu.text()).toContain('Edit Team Details')
    expect(teamsMenu.text()).toContain(team.name)

    const venuesMenu = mountSite(VenuesMenu)
    expect(venuesMenu.text()).toContain(venue.name)

    const competitionsMenu = mountSite(CompetitionsMenu)
    await flushPromises()
    expect(competitionsMenu.text()).toContain('Cup')
    expect(competitionsMenu.text()).toContain('League')

    expect(mocks.setSidemenu).toHaveBeenCalledWith(true)
  })

  it('renders help menu entries and scrolls to selected sections', async () => {
    const wrapper = mountSite(HelpMenu, {
      global: {
        stubs: {
          ...siteComponentStubs,
        },
      },
    })

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Login'))
      ?.trigger('click')

    expect(wrapper.text()).toContain('Overview')
    expect(wrapper.text()).toContain('Team Details')
    expect(mocks.goTo).toHaveBeenCalledWith('#help-content-login')
  })
})

describe('remaining site content and competition components', () => {
  it('renders static content pages with their configured named text ids', () => {
    const cases: Array<[unknown, string]> = [
      [CompetitionsMain, 'competitions-header'],
      [SubmitResultsInstructions, 'submit-results-instructions'],
      [StartTeam, 'start-team'],
      [LinksMain, 'links-content'],
      [RulesMain, 'rules-content'],
    ]

    for (const [component, textName] of cases) {
      expect(mountSite(component).text()).toContain(textName)
    }

    expect(mocks.setSidemenu).toHaveBeenCalledWith(false)
  })

  it('renders help and contact pages with user-only content and contact dialog triggers', async () => {
    const help = mountSite(HelpMain)
    expect(help.text()).toContain('help-content-main')
    expect(help.text()).toContain('help-content-chat')
    expect(help.text()).toContain('help-content-team')

    const contact = mountSite(ContactUsMain, {
      global: {
        stubs: {
          ...siteComponentStubs,
          AliasContactDialog,
          QlNamedText: namedTextStub,
          QlTextBox,
        },
      },
    })

    await contact
      .findAll('button')
      .find((button) => button.text().includes('Webmaster'))
      ?.trigger('click')

    expect(contact.text()).toContain('Team Mobile Numbers')
    expect(contact.text()).toContain('Contact the Webmaster')
  })

  it('renders alias contact dialog fields and emits close', async () => {
    const wrapper = mountSite(AliasContactDialog, {
      props: {
        alias: 'secretary',
        aliasText: 'League Secretary',
        open: true,
      },
    })

    await wrapper.get('button').trigger('click')

    expect(wrapper.text()).toContain('Contact League Secretary')
    expect(wrapper.get('input[aria-label="Your email address"]').exists()).toBe(true)
    expect(wrapper.get('textarea[aria-label="Message"]').exists()).toBe(true)
    expect(wrapper.emitted('close')).toEqual([[]])
  })

  it('renders competition type pages with text, tables, fixtures, and event details', () => {
    expect(
      mountSite(CupCompetiton, {
        props: { path: cupCompetition.path.replaceAll('/', '|') },
      }).text(),
    ).toContain('cup-info')
    expect(
      mountSite(LeagueCompetiton, {
        props: { path: leagueCompetition.path.replaceAll('/', '|') },
      }).text(),
    ).toContain('league-text')
    expect(
      mountSite(SubsidiaryCompetition, {
        props: { path: leagueCompetition.path.replaceAll('/', '|') },
      }).text(),
    ).toContain('league-text')

    const singleton = mountSite(SingletonCompetition, {
      props: { path: singletonCompetition.path.replaceAll('/', '|') },
    })
    expect(singleton.text()).toContain('finals-info')
    expect(singleton.text()).toContain('2026/05/31 starting at 19:30')
    expect(singleton.text()).toContain('town-hall')
  })

  it('renders competition fixture wrappers and passes through fetch functions', async () => {
    const fetchFunction = vi.fn().mockResolvedValue([fixtureSetDoc])
    const wrapper = mountSite(CompetitionFixturesSet, {
      props: {
        path: leagueCompetition.path,
        title: 'Latest Results',
        fetchFunction,
      },
      global: {
        stubs: {
          ...siteComponentStubs,
          FetchActions: simpleStub('fetch-actions'),
          FixturesCard: simpleStub('fixtures-card'),
        },
      },
    })
    await flushPromises()

    expect(fetchFunction).toHaveBeenCalledWith(leagueCompetition.path, 1)
    expect(wrapper.text()).toContain('Latest Results')
    expect(
      mountSite(CompetitionLatestResults, { props: { path: leagueCompetition.path } }).text(),
    ).toContain('Latest Results')
    expect(
      mountSite(CompetitionNextFixtures, { props: { path: leagueCompetition.path } }).text(),
    ).toContain('Next Fixtures')
  })

  it('renders competition and home league tables from service collections', () => {
    expect(
      mountSite(CompetitionLeagueTables, {
        props: { path: leagueCompetition.path },
        global: { stubs: { ...siteComponentStubs, LeagueTable: simpleStub('league-table') } },
      }).text(),
    ).toContain('League Table')

    expect(
      mountSite(HomeLeagueTables, {
        props: { seasonId: mocks.seasonId },
        global: { stubs: { ...siteComponentStubs, LeagueTable: simpleStub('league-table') } },
      }).text(),
    ).toContain('League Tables')
  })
})

describe('remaining fixture, home, and result components', () => {
  it('renders fixture set and fixture line components from document refs', async () => {
    const simple = mountSite(SimpleFixtures, {
      props: {
        fixtures: [fixtureDoc],
        inlineDetails: true,
      },
      global: {
        stubs: {
          ...siteComponentStubs,
          FixtureLineWrapper: simpleStub('fixture-line-wrapper'),
        },
      },
    })
    expect(simple.get('[data-test="fixture-line-wrapper"]').exists()).toBe(true)

    const fixtureLineWrapper = mountSite(FixtureLineWrapper, {
      props: {
        fixtureDoc,
        inlineDetails: true,
      },
      global: {
        stubs: {
          ...siteComponentStubs,
          FixtureLine: simpleStub('fixture-line'),
        },
      },
    })
    expect(fixtureLineWrapper.get('[data-test="fixture-line"]').exists()).toBe(true)

    const line = mountSite(FixtureLine, {
      props: {
        fixture,
        inlineDetails: true,
      },
      global: {
        stubs: {
          ...siteComponentStubs,
          MatchReports: simpleStub('match-reports'),
          ResponsiveTeamName: defineComponent({
            props: { team: Object },
            setup(props) {
              return () => h('span', (props.team as { name?: string })?.name)
            },
          }),
        },
      },
    })
    expect(line.text()).toContain(team.name)
    expect(line.text()).toContain('44')
    expect(line.text()).toContain('41')
  })

  it('renders fixture cards and fixture pages', async () => {
    const card = mountSite(FixturesCard, {
      props: { fixtures: fixtureSetDoc },
      global: { stubs: { ...siteComponentStubs, SimpleFixtures: simpleStub('simple-fixtures') } },
    })
    await flushPromises()
    expect(card.text()).toContain('2026/05/31')
    expect(card.text()).toContain('League')

    const competitionCard = mountSite(CompetitionFixturesCard, {
      props: { fixtures: fixtureSetDoc },
      global: { stubs: { ...siteComponentStubs, SimpleFixtures: simpleStub('simple-fixtures') } },
    })
    await flushPromises()
    expect(competitionCard.text()).toContain('Week 1')

    const allFixtures = mountSite(AllFixtures, {
      props: { seasonId: mocks.seasonId },
      global: { stubs: { ...siteComponentStubs, FixturesCard: simpleStub('fixtures-card') } },
    })
    await flushPromises()
    expect(allFixtures.get('[data-test="fixtures-card"]').exists()).toBe(true)

    const allFixturesPage = mountSite(AllFixturesPage, {
      global: { stubs: { ...siteComponentStubs, AllFixtures: simpleStub('all-fixtures') } },
    })
    expect(allFixturesPage.get('[data-test="all-fixtures"]').exists()).toBe(true)
  })

  it('renders match reports and report items', () => {
    const reports = mountSite(MatchReports, {
      props: { keyval: fixture.path },
      global: {
        stubs: { ...siteComponentStubs, MatchReportItem: simpleStub('match-report-item') },
      },
    })
    expect(reports.get('[data-test="match-report-item"]').exists()).toBe(true)

    const reportItem = mountSite(MatchReportItem, {
      props: {
        report: {
          id: 'report-1',
          path: `${fixture.path}/report/report-1`,
          team: { id: 'alpha', path: 'team/alpha' },
          text: { id: 'report-text', path: 'text/report-text' },
        },
      },
    })
    expect(reportItem.text()).toContain('Report by')
    expect(reportItem.text()).toContain('Alpha Quiz Team')
    expect(reportItem.text()).toContain('report-text')
  })

  it('renders home tabs, fixture wrappers, and the latest results summary', async () => {
    expect(
      mountSite(HomeMain, {
        global: {
          stubs: {
            ...siteComponentStubs,
            HomeTabs: simpleStub('home-tabs'),
            LatestResultsSummary: simpleStub('latest-results-summary'),
            QlNamedText: namedTextStub,
            QlText: qlTextStub,
            QlTextBox,
          },
        },
      }).text(),
    ).toContain('front-page')

    expect(mountSite(HomeTabs).text()).toContain('Tables')
    expect(mountSite(HomeLatestResults, { props: { seasonId: mocks.seasonId } }).text()).toContain(
      'Latest Results',
    )
    expect(mountSite(HomeNextFixtures, { props: { seasonId: mocks.seasonId } }).text()).toContain(
      'Next Fixtures',
    )

    const homeFixtureSet = mountSite(HomeFixturesSet, {
      props: {
        title: 'Latest Results',
        fetchFunction: vi.fn().mockResolvedValue([fixtureSetDoc]),
      },
      global: { stubs: { ...siteComponentStubs, FixturesCard: simpleStub('fixtures-card') } },
    })
    await flushPromises()
    expect(homeFixtureSet.get('[data-test="fixtures-card"]').exists()).toBe(true)

    const homeFixtureCard = mountSite(HomeFixturesCard, {
      props: { fixtures: fixtureSetDoc, title: 'Latest Result' },
      global: { stubs: { ...siteComponentStubs, SimpleFixtures: simpleStub('simple-fixtures') } },
    })
    await flushPromises()
    expect(homeFixtureCard.text()).toContain('Latest Result')

    const summary = mountSite(LatestResultsSummary, {
      props: {
        seasonId: mocks.seasonId,
      },
    })
    await flushPromises()
    expect(summary.text()).toContain('Latest Results Summary')
    expect(summary.text()).toContain('Alpha opened the season with a win.')
  })

  it('renders all results and result submission states', async () => {
    const allResults = mountSite(AllResults, {
      global: { stubs: { ...siteComponentStubs, FixturesCard: simpleStub('fixtures-card') } },
    })
    await flushPromises()
    expect(allResults.get('[data-test="fixtures-card"]').exists()).toBe(true)

    const submitResults = mountSite(SubmitResults, {
      global: { stubs: { ...siteComponentStubs, SubmitResult: simpleStub('submit-result') } },
    })
    await flushPromises()
    expect(submitResults.get('[data-test="submit-result"]').exists()).toBe(true)

    const submitResult = mountSite(SubmitResult, {
      props: { fixtureDoc },
      global: {
        stubs: {
          ...siteComponentStubs,
          FixtureLine: simpleStub('fixture-line'),
          QlMarkdown: simpleStub('ql-markdown'),
          SimpleFixtures: simpleStub('simple-fixtures'),
        },
      },
    })
    await flushPromises()
    await submitResult.get('textarea[aria-label="Match Report"]').setValue('Report text')
    await submitResult
      .findAll('button')
      .find((button) => button.text().includes('Submit Result'))
      ?.trigger('click')
    await flushPromises()

    expect(mocks.submitResult).toHaveBeenCalledWith(
      fixture.path,
      'user-1',
      fixture.result,
      'Report text',
    )
  })
})

describe('remaining team, venue, and statistics components', () => {
  it('renders team fixture wrappers and standings', async () => {
    const wrapper = mountSite(TeamFixturesSet, {
      props: {
        teamId: team.id,
        title: 'Fixtures',
        initialFetch: 5,
        fetchFunction: mocks.teamFixtures,
      },
      global: {
        stubs: {
          ...siteComponentStubs,
          FetchActions: simpleStub('fetch-actions'),
          SimpleFixtures: simpleStub('simple-fixtures'),
        },
      },
    })
    await flushPromises()
    expect(mocks.teamFixtures).toHaveBeenCalledWith(team.id, 5)
    expect(wrapper.text()).toContain('Team Fixtures')

    expect(mountSite(TeamFixtures, { props: { teamId: team.id } }).text()).toContain('Fixtures')
    expect(mountSite(TeamResults, { props: { teamId: team.id } }).text()).toContain('Results')
    expect(
      mountSite(TeamStandingLine, {
        props: { standing: { name: 'League', standing: '1st' } },
      }).text(),
    ).toContain('League')

    const standings = mountSite(TeamStandings, {
      props: { teamId: team.id },
      global: { stubs: { ...siteComponentStubs, TeamStandingLine } },
    })
    await flushPromises()
    expect(standings.text()).toContain('1st')
  })

  it('renders team and venue main pages plus editable team details', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    })

    const info = mountSite(TeamInfo, {
      props: { teamId: team.id },
      global: {
        stubs: {
          ...siteComponentStubs,
          TeamStandings: simpleStub('team-standings'),
          VenueLink: simpleStub('venue-link'),
        },
      },
    })
    await info
      .findAll('button')
      .find((button) => button.text().includes('Copy Calendar URL'))
      ?.trigger('click')
    expect(info.text()).toContain('Team Information')
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${document.location.origin}/calendar/team/${team.id}`,
    )

    expect(
      mountSite(TeamMain, {
        props: { id: team.id },
        global: {
          stubs: {
            ...siteComponentStubs,
            TeamFixtures: simpleStub('team-fixtures'),
            TeamResults: simpleStub('team-results'),
            TeamStandings: simpleStub('team-info'),
            QlText: qlTextStub,
            QlTextBox,
          },
        },
      }).text(),
    ).toContain('team-text')

    const edit = mountSite(TeamEdit, {
      global: {
        stubs: {
          ...siteComponentStubs,
        },
      },
    })
    await flushPromises()
    await edit.get('input[aria-label="Name"]').setValue('Alpha Updated')
    await edit
      .findAll('button')
      .find((button) => button.text().includes('Save'))
      ?.trigger('click')
    await flushPromises()
    expect(mocks.teamUpdate).toHaveBeenCalledWith(
      team.path,
      expect.objectContaining({ name: 'Alpha Updated' }),
    )

    expect(mountSite(VenueMain, { props: { id: venue.id } }).html()).toContain(
      '1 High Street<br>Town',
    )
    expect(mountSite(VenuesMain).text()).toContain('venues-front-page')
    expect(mountSite(TeamsMain).text()).toContain('teams-header')
  })

  it('renders venue and team mobile lists when compact display is active', () => {
    mocks.smAndDown = true
    const compactGlobal = {
      stubs: {
        ...siteComponentStubs,
        QlNamedText: namedTextStub,
        QlTextBox,
      },
      mocks: {
        $vuetify: {
          display: {
            mdAndUp: false,
            smAndDown: true,
            smAndUp: false,
          },
        },
      },
    }

    expect(mount(TeamsMain, { global: compactGlobal }).text()).toContain(team.name)
    expect(mount(VenuesMain, { global: compactGlobal }).text()).toContain(venue.name)
  })

  it('renders direct chart wrappers and chart datasets', async () => {
    const lineData = vi.fn().mockReturnValue({ labels: ['W1'], datasets: [{ data: [1] }] })
    const asyncLineData = vi.fn().mockResolvedValue({ labels: ['S1'], datasets: [{ data: [1] }] })
    const wrapper = mountSite(LineChart, {
      props: {
        stats,
        title: 'Match Scores',
        dataFn: lineData,
      },
      global: {
        stubs: {
          ...siteComponentStubs,
        },
      },
    })
    expect(wrapper.text()).toContain('Match Scores')
    expect(lineData).toHaveBeenCalledWith(stats)

    const allSeasons = mountSite(AllSeasonsLineChart, {
      props: {
        stats: [stats],
        title: 'Average Scores',
        dataFn: asyncLineData,
      },
      global: {
        stubs: {
          ...siteComponentStubs,
        },
      },
    })
    await flushPromises()
    expect(allSeasons.text()).toContain('Average Scores')
    expect(asyncLineData).toHaveBeenCalledWith([stats])

    const headToHead = mountSite(HeadToHeadLineChart, {
      props: {
        stats: [[stats]],
        title: 'League Position',
        dataFn: asyncLineData,
      },
      global: {
        stubs: {
          ...siteComponentStubs,
        },
      },
    })
    await flushPromises()
    expect(headToHead.text()).toContain('League Position')
    expect(asyncLineData).toHaveBeenCalledWith([[stats]])
  })

  it('renders statistics wrapper components with service-provided data functions', async () => {
    const props = { stats }
    const allSeasonProps = { stats: [stats, { ...stats, id: 'stats-alpha-2' }] }
    const headToHeadProps = { stats: [[stats], [{ ...stats, id: 'stats-bravo' }]] }

    expect(mountSite(SeasonMatchScores, { props }).text()).toContain('Match Scores')
    expect(mountSite(SeasonCumulativeScores, { props }).text()).toContain('Cumulative Match Scores')
    expect(mountSite(SeasonCumulativePointsDiff, { props }).text()).toContain(
      'Cumulative Points Difference',
    )
    expect(mountSite(ResultTypes, { props }).text()).toContain('Results')
    expect(mountSite(AllSeasonsAverage, { props: allSeasonProps }).text()).toContain(
      'Average Scores',
    )
    const allSeasonsLeaguePosition = mountSite(AllSeasonsLeaguePosition, { props: allSeasonProps })
    await flushPromises()
    expect(allSeasonsLeaguePosition.text()).toContain('League Position')
    expect(mountSite(AllSeasonsResultTypes, { props: allSeasonProps }).text()).toContain('Results')
    expect(mountSite(HeadToHeadAverageScore, { props: headToHeadProps }).text()).toContain(
      'Average Scores',
    )
    const headToHeadLeaguePosition = mountSite(HeadToHeadLeaguePosition, {
      props: headToHeadProps,
    })
    await flushPromises()
    expect(headToHeadLeaguePosition.text()).toContain('League Position')
    expect(mountSite(HeadToHeadResults, { props: headToHeadProps }).text()).toContain('Results')

    const allSeasonsStats = mountSite(AllSeasonsStats, {
      props: { teamId: team.id },
      global: {
        stubs: {
          ...siteComponentStubs,
          AllSeasonsAverage: simpleStub('all-seasons-average'),
          AllSeasonsLeaguePosition: simpleStub('all-seasons-league-position'),
          AllSeasonsResultTypes: simpleStub('all-seasons-result-types'),
        },
      },
    })
    expect(allSeasonsStats.get('[data-test="all-seasons-average"]').exists()).toBe(true)

    const headToHead = mountSite(HeadToHead, {
      props: { teamId: team.id },
      global: {
        stubs: {
          ...siteComponentStubs,
          HeadToHeadAverageScore: simpleStub('head-to-head-average-score'),
          HeadToHeadLeaguePosition: simpleStub('head-to-head-league-position'),
          HeadToHeadResults: simpleStub('head-to-head-results'),
        },
      },
    })
    await flushPromises()
    expect(headToHead.get('[data-test="head-to-head-average-score"]').exists()).toBe(true)

    expect(mountSite(TeamStats, { props: { id: team.id } }).text()).toContain('Single Season')
  })

  it('renders competition statistics linked result cells', () => {
    const result = {
      seasonText: '2025/2026',
      competition: { path: leagueCompetition.path, withConverter: vi.fn() },
      teamText: 'Alpha fallback',
      team: { path: team.path, withConverter: vi.fn() },
    }

    expect(
      mountSite(CompetitionStatisticsResultSeason, {
        props: { result },
        global: { stubs: { ...siteComponentStubs } },
      })
        .get('a')
        .attributes('href'),
    ).toBe(`/competition/season|${mocks.seasonId}|competition|league/league`)
    expect(
      mountSite(CompetitionStatisticsResultTeam, {
        props: { result },
        global: { stubs: { ...siteComponentStubs } },
      })
        .get('a')
        .attributes('href'),
    ).toBe('/team/alpha')
  })
})
