const projectId = process.env.FIREBASE_PROJECT_ID ?? 'chiltern-ql-firestore'
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:18080'
const baseUrl = `http://${emulatorHost}/v1/projects/${projectId}/databases/(default)/documents`
const clearUrl = `http://${emulatorHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`
const cupFinalQuestionsUrl =
  'https://storage.googleapis.com/public.chilternquizleague.uk/questions/2025-26/cup%20final.pdf'

const appContextId = '5659313586569216'
const teamMemberDocumentId = 'members'
const currentSeasonId = 'season-2025-2026'
const previousSeasonId = 'season-2024-2025'
const seasonId = currentSeasonId

function ref(typeName, id, parentKey = '') {
  const parent = parentKey ? `${parentKey}/` : ''
  return {
    __referencePath: `${parent}${typeName}/${id}`,
  }
}

function textRef(id) {
  return ref('text', id)
}

function venueRef(id) {
  return ref('venue', id)
}

function teamRef(id) {
  return ref('team', id)
}

function userRef(id) {
  return ref('user', id)
}

function competitionRef(id, targetSeasonId = seasonId) {
  return ref('competition', id, `season/${targetSeasonId}`)
}

function text(id, body, mimeType = 'text/plain') {
  return {
    path: `text/${id}`,
    data: {
      id,
      mimeType,
      text: body,
    },
  }
}

function venue(id, name, address, extra = {}) {
  return {
    path: `venue/${id}`,
    data: {
      id,
      name,
      address,
      streetAddress: address,
      retired: false,
      publicSafe: true,
      ...extra,
    },
  }
}

function user(id, name, email) {
  return {
    path: `user/${id}`,
    data: {
      id,
      name,
      email,
      retired: false,
    },
  }
}

function siteUser(id, handle, email, userId, uid = '') {
  return {
    path: `siteuser/${id}`,
    data: {
      id,
      handle,
      email,
      uid,
      avatar: '',
      user: userRef(userId),
    },
  }
}

function team(id, name, shortName, venueId, textId, handle) {
  return {
    path: `team/${id}`,
    data: {
      id,
      name,
      shortName,
      venue: venueRef(venueId),
      text: textRef(textId),
      handle,
      retired: false,
      publicSafe: true,
    },
  }
}

function teamMembers(teamId, userIds = []) {
  return {
    path: `team/${teamId}/member/${teamMemberDocumentId}`,
    data: {
      id: teamMemberDocumentId,
      users: userIds.map(userRef),
    },
  }
}

function competition(id, type, name, textId, textName, extra = {}, targetSeasonId = seasonId) {
  return {
    path: `season/${targetSeasonId}/competition/${id}`,
    data: {
      id,
      type,
      _name: type,
      _type: `${type[0].toUpperCase()}${type.slice(1)}Competition`,
      name,
      text: textRef(textId),
      textName,
      startTime: '20:00:00',
      duration: 7200,
      icon: extra.icon ?? 'mdi-trophy',
      ...extra,
    },
  }
}

function competitionStatistics(id, competitionName, results = []) {
  return {
    path: `competitionstatistics/${id}`,
    data: {
      id,
      competitionName,
      results,
    },
  }
}

function competitionStatisticsResult(
  seasonText,
  teamText,
  teamId,
  competitionId = leagueCompetitionId,
  targetSeasonId = seasonId,
) {
  return {
    competition: competitionRef(competitionId, targetSeasonId),
    season: ref('season', targetSeasonId),
    seasonText,
    team: teamRef(teamId),
    teamText,
  }
}

function fixtureSet(
  competitionId,
  id,
  description,
  date,
  start = '20:00:00',
  targetSeasonId = seasonId,
  extra = {},
) {
  return {
    path: `season/${targetSeasonId}/competition/${competitionId}/fixtures/${id}`,
    data: {
      id,
      description,
      date,
      start,
      ...extra,
    },
  }
}

function fixture(
  competitionId,
  fixturesId,
  id,
  homeId,
  awayId,
  venueId,
  result,
  targetSeasonId = seasonId,
) {
  return {
    path: `season/${targetSeasonId}/competition/${competitionId}/fixtures/${fixturesId}/fixture/${id}`,
    data: {
      id,
      home: teamRef(homeId),
      away: teamRef(awayId),
      venue: venueRef(venueId),
      ...(result ? { result } : {}),
    },
  }
}

function leagueTable(competitionId, id, description, rows, targetSeasonId = seasonId) {
  return {
    path: `season/${targetSeasonId}/competition/${competitionId}/leaguetable/${id}`,
    data: {
      id,
      description,
      rows,
    },
  }
}

function tableRow(
  teamId,
  position,
  played,
  won,
  drawn,
  lost,
  leaguePoints,
  forScore,
  againstScore,
) {
  return {
    team: teamRef(teamId),
    position,
    played,
    won,
    drawn,
    lost,
    leaguePoints,
    matchPointsFor: forScore,
    matchPointsAgainst: againstScore,
    matchesPlayed: played,
    pointsScored: forScore,
  }
}

const leagueCompetitionId = 'league-main'
const leagueTableId = 'league-table-main'
const leagueTeamIds = [
  'team-ashridge-arms',
  'team-beaconsfield-bees',
  'team-chesham-comets',
  'team-drayton-dynamos',
]

const leagueFixtureSets = [
  {
    id: 'league-round-1',
    description: 'Round 1',
    date: '2026-05-07',
    resultsSummary: 'text-league-round-1-summary',
    fixtures: [
      {
        id: 'fixture-league-1',
        homeId: 'team-ashridge-arms',
        awayId: 'team-beaconsfield-bees',
        venueId: 'venue-ashridge-arms',
        result: {
          homeScore: 42,
          awayScore: 38,
        },
      },
    ],
  },
  {
    id: 'league-round-2',
    description: 'Round 2',
    date: '2026-06-04',
    fixtures: [
      {
        id: 'fixture-league-2',
        homeId: 'team-chesham-comets',
        awayId: 'team-drayton-dynamos',
        venueId: 'venue-chesham-club',
      },
    ],
  },
]

const leagueTableRows = [
  tableRow('team-ashridge-arms', '1', 1, 1, 0, 0, 2, 42, 38),
  tableRow('team-beaconsfield-bees', '2', 1, 0, 0, 1, 0, 38, 42),
  tableRow('team-chesham-comets', '3', 0, 0, 0, 0, 0, 0, 0),
  tableRow('team-drayton-dynamos', '4', 0, 0, 0, 0, 0, 0, 0),
]

const previousLeagueFixtureSets = [
  {
    id: 'league-2024-round-1',
    description: 'Round 1',
    date: '2024-09-05',
    fixtures: [
      {
        id: 'fixture-2024-league-1',
        homeId: 'team-ashridge-arms',
        awayId: 'team-beaconsfield-bees',
        venueId: 'venue-ashridge-arms',
        result: {
          homeScore: 44,
          awayScore: 36,
        },
      },
      {
        id: 'fixture-2024-league-2',
        homeId: 'team-chesham-comets',
        awayId: 'team-drayton-dynamos',
        venueId: 'venue-chesham-club',
        result: {
          homeScore: 39,
          awayScore: 41,
        },
      },
    ],
  },
  {
    id: 'league-2024-round-2',
    description: 'Round 2',
    date: '2024-09-19',
    fixtures: [
      {
        id: 'fixture-2024-league-3',
        homeId: 'team-beaconsfield-bees',
        awayId: 'team-chesham-comets',
        venueId: 'venue-beaconsfield-hall',
        result: {
          homeScore: 40,
          awayScore: 40,
        },
      },
      {
        id: 'fixture-2024-league-4',
        homeId: 'team-drayton-dynamos',
        awayId: 'team-ashridge-arms',
        venueId: 'venue-ashridge-arms',
        result: {
          homeScore: 35,
          awayScore: 45,
        },
      },
    ],
  },
  {
    id: 'league-2024-round-3',
    description: 'Round 3',
    date: '2024-10-03',
    fixtures: [
      {
        id: 'fixture-2024-league-5',
        homeId: 'team-ashridge-arms',
        awayId: 'team-chesham-comets',
        venueId: 'venue-ashridge-arms',
        result: {
          homeScore: 38,
          awayScore: 42,
        },
      },
      {
        id: 'fixture-2024-league-6',
        homeId: 'team-drayton-dynamos',
        awayId: 'team-beaconsfield-bees',
        venueId: 'venue-ashridge-arms',
        result: {
          homeScore: 43,
          awayScore: 37,
        },
      },
    ],
  },
  {
    id: 'league-2024-round-4',
    description: 'Round 4',
    date: '2024-10-17',
    fixtures: [
      {
        id: 'fixture-2024-league-7',
        homeId: 'team-beaconsfield-bees',
        awayId: 'team-ashridge-arms',
        venueId: 'venue-beaconsfield-hall',
        result: {
          homeScore: 41,
          awayScore: 39,
        },
      },
      {
        id: 'fixture-2024-league-8',
        homeId: 'team-drayton-dynamos',
        awayId: 'team-chesham-comets',
        venueId: 'venue-ashridge-arms',
        result: {
          homeScore: 40,
          awayScore: 40,
        },
      },
    ],
  },
  {
    id: 'league-2024-round-5',
    description: 'Round 5',
    date: '2024-10-31',
    fixtures: [
      {
        id: 'fixture-2024-league-9',
        homeId: 'team-chesham-comets',
        awayId: 'team-beaconsfield-bees',
        venueId: 'venue-chesham-club',
        result: {
          homeScore: 36,
          awayScore: 44,
        },
      },
      {
        id: 'fixture-2024-league-10',
        homeId: 'team-ashridge-arms',
        awayId: 'team-drayton-dynamos',
        venueId: 'venue-ashridge-arms',
        result: {
          homeScore: 46,
          awayScore: 34,
        },
      },
    ],
  },
  {
    id: 'league-2024-round-6',
    description: 'Round 6',
    date: '2024-11-14',
    fixtures: [
      {
        id: 'fixture-2024-league-11',
        homeId: 'team-chesham-comets',
        awayId: 'team-ashridge-arms',
        venueId: 'venue-chesham-club',
        result: {
          homeScore: 37,
          awayScore: 43,
        },
      },
      {
        id: 'fixture-2024-league-12',
        homeId: 'team-beaconsfield-bees',
        awayId: 'team-drayton-dynamos',
        venueId: 'venue-beaconsfield-hall',
        result: {
          homeScore: 39,
          awayScore: 41,
        },
      },
    ],
  },
]

function referenceId(reference) {
  return reference.__referencePath.split('/').pop()
}

function blankLeagueTableRows(rows) {
  return rows.map((row) => ({
    ...row,
    position: '',
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    leaguePoints: 0,
    matchPointsFor: 0,
    matchPointsAgainst: 0,
    matchesPlayed: 0,
    pointsScored: 0,
  }))
}

function emptyLeagueTableRows(teamIds) {
  return teamIds.map((teamId) => tableRow(teamId, '', 0, 0, 0, 0, 0, 0, 0))
}

function resultRows(fixtureData) {
  if (!fixtureData.result) return []

  const { homeScore, awayScore } = fixtureData.result
  const homeWin = homeScore > awayScore ? 1 : 0
  const awayWin = homeScore < awayScore ? 1 : 0
  const draw = homeScore === awayScore ? 1 : 0

  return [
    {
      teamId: fixtureData.homeId,
      played: 1,
      won: homeWin,
      drawn: draw,
      lost: awayWin,
      leaguePoints: homeWin * 2 + draw,
      matchPointsFor: homeScore,
      matchPointsAgainst: awayScore,
    },
    {
      teamId: fixtureData.awayId,
      played: 1,
      won: awayWin,
      drawn: draw,
      lost: homeWin,
      leaguePoints: awayWin * 2 + draw,
      matchPointsFor: awayScore,
      matchPointsAgainst: homeScore,
    },
  ]
}

function applyFixtureToTableRows(rows, fixtureData) {
  const rowsByTeam = new Map(resultRows(fixtureData).map((row) => [row.teamId, row]))

  return rows
    .map((row) => {
      const teamId = referenceId(row.team)
      const resultRow = rowsByTeam.get(teamId)
      if (!resultRow) return row

      const played = row.played + resultRow.played
      const matchPointsFor = row.matchPointsFor + resultRow.matchPointsFor

      return {
        ...row,
        played,
        won: row.won + resultRow.won,
        drawn: row.drawn + resultRow.drawn,
        lost: row.lost + resultRow.lost,
        leaguePoints: row.leaguePoints + resultRow.leaguePoints,
        matchPointsFor,
        matchPointsAgainst: row.matchPointsAgainst + resultRow.matchPointsAgainst,
        matchesPlayed: played,
        pointsScored: matchPointsFor,
      }
    })
    .sort(
      (a, b) =>
        b.leaguePoints - a.leaguePoints ||
        b.matchPointsFor - a.matchPointsFor ||
        a.matchPointsAgainst - b.matchPointsAgainst ||
        b.won - a.won ||
        b.drawn - a.drawn,
    )
    .map((row, index) => ({ ...row, position: `${index + 1}` }))
}

function emptySeasonStats() {
  return {
    currentLeaguePosition: 0,
    runningPointsFor: 0,
    runningPointsAgainst: 0,
    runningPointsDifference: 0,
    headToHead: [],
  }
}

function ensureTeamStatistics(statsByTeam, leagueConfig, teamId) {
  if (!statsByTeam.has(teamId)) {
    const id = `${teamId}-${leagueConfig.seasonId}`
    statsByTeam.set(teamId, {
      id,
      path: `statistics/${id}`,
      team: teamRef(teamId),
      season: ref('season', leagueConfig.seasonId),
      table: ref(
        'leaguetable',
        leagueConfig.tableId,
        `season/${leagueConfig.seasonId}/competition/${leagueConfig.competitionId}`,
      ),
      seasonStats: emptySeasonStats(),
      weekStats: {},
    })
  }

  return statsByTeam.get(teamId)
}

function leaguePosition(tableRows, teamId) {
  return parseInt(tableRows.find((row) => referenceId(row.team) === teamId)?.position ?? '0', 10)
}

function addHeadToHead(statistics, opponentId, pointsFor, pointsAgainst) {
  const win = pointsFor > pointsAgainst ? 1 : 0
  const draw = pointsFor === pointsAgainst ? 1 : 0
  const lose = pointsFor < pointsAgainst ? 1 : 0
  const existing = statistics.seasonStats.headToHead.find(
    (row) => referenceId(row.team) === opponentId,
  )
  const updated = {
    team: teamRef(opponentId),
    win: win + (existing?.win ?? 0),
    draw: draw + (existing?.draw ?? 0),
    lose: lose + (existing?.lose ?? 0),
  }

  statistics.seasonStats.headToHead = [
    ...statistics.seasonStats.headToHead.filter((row) => referenceId(row.team) !== opponentId),
    updated,
  ]
}

function addWeekStats(statistics, date, pointsFor, pointsAgainst, position) {
  const pointsDifference = pointsFor - pointsAgainst
  const week = {
    date,
    leaguePosition: position,
    pointsFor,
    pointsAgainst,
    pointsDifference,
    cumuPointsFor: statistics.seasonStats.runningPointsFor + pointsFor,
    cumuPointsAgainst: statistics.seasonStats.runningPointsAgainst + pointsAgainst,
    cumuPointsDifference: statistics.seasonStats.runningPointsDifference + pointsDifference,
    ignorable: false,
  }

  statistics.weekStats = {
    ...statistics.weekStats,
    [date]: week,
  }
  statistics.seasonStats = {
    ...statistics.seasonStats,
    currentLeaguePosition: position,
    runningPointsFor: week.cumuPointsFor,
    runningPointsAgainst: week.cumuPointsAgainst,
    runningPointsDifference: week.cumuPointsDifference,
  }
}

function updateCurrentPositions(statsByTeam, leagueConfig, tableRows) {
  for (const row of tableRows) {
    const teamId = referenceId(row.team)
    ensureTeamStatistics(statsByTeam, leagueConfig, teamId).seasonStats.currentLeaguePosition =
      leaguePosition(tableRows, teamId)
  }
}

function generateSeasonStatisticsAggregation(leagueConfig) {
  let tableRows = blankLeagueTableRows(leagueConfig.tableRows)
  const snapshots = []

  for (const fixtureSetData of [...leagueConfig.fixtureSets].sort((a, b) =>
    a.date.localeCompare(b.date),
  )) {
    for (const fixtureData of fixtureSetData.fixtures) {
      tableRows = applyFixtureToTableRows(tableRows, fixtureData)
    }

    snapshots.push({
      fixtures: ref(
        'fixtures',
        fixtureSetData.id,
        `season/${leagueConfig.seasonId}/competition/${leagueConfig.competitionId}`,
      ),
      fixtureSetDescription: fixtureSetData.description,
      fixtureSetDate: fixtureSetData.date,
      tables: [
        {
          table: ref(
            'leaguetable',
            leagueConfig.tableId,
            `season/${leagueConfig.seasonId}/competition/${leagueConfig.competitionId}`,
          ),
          description: 'League Championship Table',
          rows: JSON.parse(JSON.stringify(tableRows)), // Deep copy rows
        },
      ],
    })
  }

  return {
    path: `seasonstatisticsaggregation/${leagueConfig.seasonId}`,
    data: {
      id: leagueConfig.seasonId,
      season: ref('season', leagueConfig.seasonId),
      generatedAt: new Date().toISOString(),
      competitions: [
        {
          competition: competitionRef(leagueConfig.competitionId, leagueConfig.seasonId),
          competitionName: 'League Championship',
          fixtureSetCount: leagueConfig.fixtureSets.length,
          completedFixtureSetCount: leagueConfig.fixtureSets.length,
          fixtureCount: leagueConfig.fixtureSets.reduce((acc, fs) => acc + fs.fixtures.length, 0),
          complete: true,
          averageScore: 40,
          averageWinningScore: 42,
          averageLosingScore: 38,
          tableSnapshots: snapshots,
        },
      ],
    },
  }
}

function buildLeagueTableRows(leagueConfig) {
  let tableRows = emptyLeagueTableRows(leagueConfig.teamIds)

  for (const fixtureSetData of [...leagueConfig.fixtureSets].sort((a, b) =>
    a.date.localeCompare(b.date),
  )) {
    for (const fixtureData of fixtureSetData.fixtures) {
      tableRows = applyFixtureToTableRows(tableRows, fixtureData)
    }
  }

  return tableRows
}

function seasonStatistics(leagueConfig) {
  const statsByTeam = new Map()
  let tableRows = blankLeagueTableRows(leagueConfig.tableRows)

  for (const fixtureSetData of [...leagueConfig.fixtureSets].sort((a, b) =>
    a.date.localeCompare(b.date),
  )) {
    const completedFixtures = []

    for (const fixtureData of fixtureSetData.fixtures) {
      tableRows = applyFixtureToTableRows(tableRows, fixtureData)

      if (fixtureData.result) {
        completedFixtures.push(fixtureData)
      }
    }

    updateCurrentPositions(statsByTeam, leagueConfig, tableRows)

    for (const fixtureData of completedFixtures) {
      const homeStats = ensureTeamStatistics(statsByTeam, leagueConfig, fixtureData.homeId)
      const awayStats = ensureTeamStatistics(statsByTeam, leagueConfig, fixtureData.awayId)

      const { homeScore, awayScore } = fixtureData.result

      addWeekStats(
        homeStats,
        fixtureSetData.date,
        homeScore,
        awayScore,
        leaguePosition(tableRows, fixtureData.homeId),
      )
      addHeadToHead(homeStats, fixtureData.awayId, homeScore, awayScore)

      addWeekStats(
        awayStats,
        fixtureSetData.date,
        awayScore,
        homeScore,
        leaguePosition(tableRows, fixtureData.awayId),
      )
      addHeadToHead(awayStats, fixtureData.homeId, awayScore, homeScore)
    }
  }

  return [...statsByTeam.values()]
}

function firestoreValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null }
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(firestoreValue),
      },
    }
  }

  switch (typeof value) {
    case 'boolean':
      return { booleanValue: value }
    case 'number':
      return Number.isInteger(value) ? { integerValue: `${value}` } : { doubleValue: value }
    case 'string':
      return { stringValue: value }
    case 'object':
      if (typeof value.__referencePath === 'string') {
        return {
          referenceValue: `projects/${projectId}/databases/(default)/documents/${value.__referencePath}`,
        }
      }

      return {
        mapValue: {
          fields: Object.fromEntries(
            Object.entries(value).map(([key, childValue]) => [key, firestoreValue(childValue)]),
          ),
        },
      }
    default:
      throw new Error(`Unsupported Firestore seed value: ${String(value)}`)
  }
}

function firestoreDocument(data) {
  return {
    fields: Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, firestoreValue(value)]),
    ),
  }
}

async function request(url, options) {
  const response = await fetch(url, options)
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`${options.method ?? 'GET'} ${url} failed: ${response.status} ${body}`)
  }
  return response
}

async function clearFirestore() {
  await request(clearUrl, { method: 'DELETE' })
}

async function saveDocument(path, data) {
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  await request(`${baseUrl}/${encodedPath}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(firestoreDocument(data)),
  })
}

const currentLeagueConfig = {
  seasonId,
  competitionId: leagueCompetitionId,
  tableId: leagueTableId,
  teamIds: leagueTeamIds,
  fixtureSets: leagueFixtureSets,
  tableRows: leagueTableRows,
}

const previousLeagueTableRows = buildLeagueTableRows({
  teamIds: leagueTeamIds,
  fixtureSets: previousLeagueFixtureSets,
})

const previousLeagueConfig = {
  seasonId: previousSeasonId,
  competitionId: leagueCompetitionId,
  tableId: leagueTableId,
  teamIds: leagueTeamIds,
  fixtureSets: previousLeagueFixtureSets,
  tableRows: previousLeagueTableRows,
}

const generatedCurrentSeasonStatistics = seasonStatistics(currentLeagueConfig)
const generatedPreviousSeasonStatistics = seasonStatistics(previousLeagueConfig)
const generatedSeasonStatistics = [
  ...generatedCurrentSeasonStatistics,
  ...generatedPreviousSeasonStatistics,
]
const generatedSeasonStatisticsAggregations = [
  generateSeasonStatisticsAggregation(currentLeagueConfig),
  generateSeasonStatisticsAggregation(previousLeagueConfig),
]
const previousLeagueResultCount = previousLeagueFixtureSets.reduce(
  (total, fixtureSetData) => total + fixtureSetData.fixtures.length,
  0,
)

const documents = [
  text('text-front-page', 'Welcome to the Chiltern Quiz League local development data set.'),
  text(
    'text-rules-content',
    `# League rules

- Matches are played between two teams, with each fixture hosted at the named home venue unless otherwise agreed.
- Teams should arrive in time for an 8:00pm start and appoint a captain before the first question.
- The question master's decision is final for the purposes of the match night.
- Results should be submitted promptly after the match, including the final score and any match report notes.
- League tables are calculated from submitted results and may be corrected by the league secretary if an error is found.`,
    'text/markdown',
  ),
  text(
    'text-season-2025-2026',
    'The 2025-2026 season includes league, cup, subsidiary, and singleton competitions.',
  ),
  text(
    'text-season-2024-2025',
    'The 2024-2025 season contains a completed home-and-away league schedule.',
  ),
  text('text-competitions-header', 'Current season competitions.'),
  text('text-league-description', 'League fixtures and current standings.'),
  text('text-league-note', 'The main league competition is played home and away.'),
  text(
    'text-league-round-1-summary',
    'Summary for the match: Ashridge Arms edged Beaconsfield Bees 42-38 in a close league opener.',
    'text/markdown',
  ),
  text('text-cup-note', 'The cup competition is a knockout team competition.'),
  text('text-subsidiary-note', 'The subsidiary league tracks additional standings.'),
  text('text-singleton-note', 'The individual quiz is represented as a single scheduled event.'),
  text('text-teams-header', 'Active public teams in the league.'),
  text('text-venues-front-page', 'Venues used by active teams and fixtures.'),
  text('text-links-content', 'Useful league links and resources for local quiz teams.'),
  text('text-help-main', 'Use this help page to find guidance for using the QuizLeague website.'),
  text(
    'text-help-login',
    'Registered users can sign in to manage team details and submit results.',
  ),
  text('text-help-submit', 'Team members can submit results once they are signed in.'),
  text('text-team-ashridge', 'Ashridge Arms team profile.'),
  text('text-team-beaconsfield', 'Beaconsfield Bees team profile.'),
  text('text-team-chesham', 'Chesham Comets team profile.'),
  text('text-team-drayton', 'Drayton Dynamos team profile.'),
  user('user-alice-ashridge', 'Alice Ashridge', 'alice.ashridge@example.test'),
  user('user-ben-beaconsfield', 'Ben Beaconsfield', 'ben.beaconsfield@example.test'),
  user('user-chloe-chesham', 'Chloe Chesham', 'chloe.chesham@example.test'),
  user('user-dan-drayton', 'Dan Drayton', 'dan.drayton@example.test'),
  user('user-ella-secretary', 'Ella Secretary', 'ella.secretary@example.test'),
  siteUser(
    'siteuser-alice-ashridge',
    'alice-ashridge',
    'alice.ashridge@example.test',
    'user-alice-ashridge',
    'firebase-alice-ashridge',
  ),
  siteUser(
    'siteuser-ella-secretary',
    'ella-secretary',
    'ella.secretary@example.test',
    'user-ella-secretary',
    'firebase-ella-secretary',
  ),
  venue('venue-ashridge-arms', 'Ashridge Arms', '1 High Street, Ashridge HP1 1AA', {
    phone: '01494 010101',
    phoneNumber: '01494 010101',
    email: 'quiz@ashridge.example',
    emailAddress: 'quiz@ashridge.example',
    website: 'https://example.com/ashridge-arms',
  }),
  venue('venue-beaconsfield-hall', 'Beaconsfield Hall', '2 Station Road, Beaconsfield HP9 1BB', {
    phone: '01494 020202',
    phoneNumber: '01494 020202',
    email: 'quiz@beaconsfield.example',
    emailAddress: 'quiz@beaconsfield.example',
    website: 'https://example.com/beaconsfield-hall',
  }),
  venue('venue-chesham-club', 'Chesham Club', '3 Market Square, Chesham HP5 1CC', {
    phone: '01494 030303',
    phoneNumber: '01494 030303',
    email: 'quiz@chesham.example',
    emailAddress: 'quiz@chesham.example',
    website: 'https://example.com/chesham-club',
  }),
  team(
    'team-ashridge-arms',
    'Ashridge Arms',
    'Ashridge',
    'venue-ashridge-arms',
    'text-team-ashridge',
    'ashridge',
  ),
  teamMembers('team-ashridge-arms', ['user-alice-ashridge', 'user-ella-secretary']),
  team(
    'team-beaconsfield-bees',
    'Beaconsfield Bees',
    'Beaconsfield',
    'venue-beaconsfield-hall',
    'text-team-beaconsfield',
    'beaconsfield',
  ),
  teamMembers('team-beaconsfield-bees', ['user-ben-beaconsfield']),
  team(
    'team-chesham-comets',
    'Chesham Comets',
    'Chesham',
    'venue-chesham-club',
    'text-team-chesham',
    'chesham',
  ),
  teamMembers('team-chesham-comets', ['user-chloe-chesham']),
  team(
    'team-drayton-dynamos',
    'Drayton Dynamos',
    'Drayton',
    'venue-ashridge-arms',
    'text-team-drayton',
    'drayton',
  ),
  teamMembers('team-drayton-dynamos', ['user-dan-drayton']),
  competitionStatistics('competition-statistics-league', 'League Roll Of Honour', [
    competitionStatisticsResult('2025/2026', 'Ashridge Arms', 'team-ashridge-arms'),
  ]),
  {
    path: 'globaltext/site',
    data: {
      id: 'site',
      name: 'site',
      text: {
        'front-page': textRef('text-front-page'),
        'rules-content': textRef('text-rules-content'),
        'league-description': textRef('text-front-page'),
        'competition-note': textRef('text-competitions-header'),
        'competitions-header': textRef('text-competitions-header'),
        'league-competition-note': textRef('text-league-note'),
        'cup-competition-note': textRef('text-cup-note'),
        'subsidiary-competition-note': textRef('text-subsidiary-note'),
        'singleton-competition-note': textRef('text-singleton-note'),
        'teams-header': textRef('text-teams-header'),
        'teams-front-page': textRef('text-teams-header'),
        'venues-front-page': textRef('text-venues-front-page'),
        'links-content': textRef('text-links-content'),
        'help-content-main': textRef('text-help-main'),
        'help-content-login': textRef('text-help-login'),
        'help-content-submit': textRef('text-help-submit'),
      },
    },
  },
  {
    path: `applicationcontext/${appContextId}`,
    data: {
      id: appContextId,
      leagueName: 'Chiltern Quiz League',
      textSet: ref('globaltext', 'site'),
      currentSeason: ref('season', seasonId),
      senderEmail: 'secretary@chilternquizleague.example',
      emailAliases: [],
      cloudStoreBucket: 'chiltern-ql-firestore-local',
      bucketName: 'chiltern-ql-firestore-local',
      emailAliasMap: {},
    },
  },
  {
    path: `season/${seasonId}`,
    data: {
      id: seasonId,
      startYear: 2025,
      endYear: 2026,
      text: textRef('text-season-2025-2026'),
      calendar: [
        {
          description: 'League AGM',
          date: '2026-06-18',
          time: '19:30:00',
          duration: 5400,
          venue: venueRef('venue-beaconsfield-hall'),
        },
      ],
      events: [
        {
          description: 'League AGM',
          date: '2026-06-18',
          time: '19:30:00',
          duration: 5400,
          venue: venueRef('venue-beaconsfield-hall'),
        },
      ],
    },
  },
  {
    path: `season/${previousSeasonId}`,
    data: {
      id: previousSeasonId,
      startYear: 2024,
      endYear: 2025,
      text: textRef('text-season-2024-2025'),
      calendar: [
        {
          description: 'Presentation evening',
          date: '2025-05-15',
          time: '19:30:00',
          duration: 5400,
          venue: venueRef('venue-ashridge-arms'),
        },
      ],
      events: [
        {
          description: 'Presentation evening',
          date: '2025-05-15',
          time: '19:30:00',
          duration: 5400,
          venue: venueRef('venue-ashridge-arms'),
        },
      ],
    },
  },
  competition(
    'league-main',
    'league',
    'League Championship',
    'text-league-description',
    'league-competition-note',
    {
      icon: 'mdi-table',
      win: 2,
      draw: 1,
      loss: 0,
    },
  ),
  competition(
    'league-main',
    'league',
    'League Championship',
    'text-league-description',
    'league-competition-note',
    {
      icon: 'mdi-table',
      win: 2,
      draw: 1,
      loss: 0,
    },
    previousSeasonId,
  ),
  competition('cup-main', 'cup', 'Challenge Cup', 'text-cup-note', 'cup-competition-note', {
    icon: 'mdi-trophy',
  }),
  competition(
    'subsidiary-main',
    'subsidiary',
    'Plate League',
    'text-subsidiary-note',
    'subsidiary-competition-note',
    {
      icon: 'mdi-table-plus',
      win: 2,
      draw: 1,
      loss: 0,
    },
  ),
  competition(
    'individual-quiz',
    'singleton',
    'Individual Quiz Night',
    'text-singleton-note',
    'singleton-competition-note',
    {
      icon: 'mdi-account-star',
      event: {
        date: '2026-07-02',
        time: '20:00:00',
        duration: 7200,
        venue: venueRef('venue-chesham-club'),
      },
    },
  ),
  ...leagueFixtureSets.map((fixtureSetData) =>
    fixtureSet(
      leagueCompetitionId,
      fixtureSetData.id,
      fixtureSetData.description,
      fixtureSetData.date,
      fixtureSetData.start,
      seasonId,
      fixtureSetData.resultsSummary
        ? {
            resultsSummary: textRef(fixtureSetData.resultsSummary),
            resultsSummaryGeneratedAt: '2026-05-07T22:00:00.000Z',
            resultsSummaryModel: 'seed-data',
          }
        : {},
    ),
  ),
  ...leagueFixtureSets.flatMap((fixtureSetData) =>
    fixtureSetData.fixtures.map((fixtureData) =>
      fixture(
        leagueCompetitionId,
        fixtureSetData.id,
        fixtureData.id,
        fixtureData.homeId,
        fixtureData.awayId,
        fixtureData.venueId,
        fixtureData.result,
      ),
    ),
  ),
  leagueTable(leagueCompetitionId, leagueTableId, 'League Championship Table', leagueTableRows),
  ...previousLeagueFixtureSets.map((fixtureSetData) =>
    fixtureSet(
      leagueCompetitionId,
      fixtureSetData.id,
      fixtureSetData.description,
      fixtureSetData.date,
      fixtureSetData.start,
      previousSeasonId,
    ),
  ),
  ...previousLeagueFixtureSets.flatMap((fixtureSetData) =>
    fixtureSetData.fixtures.map((fixtureData) =>
      fixture(
        leagueCompetitionId,
        fixtureSetData.id,
        fixtureData.id,
        fixtureData.homeId,
        fixtureData.awayId,
        fixtureData.venueId,
        fixtureData.result,
        previousSeasonId,
      ),
    ),
  ),
  leagueTable(
    leagueCompetitionId,
    leagueTableId,
    'League Championship Table',
    previousLeagueTableRows,
    previousSeasonId,
  ),
  ...generatedSeasonStatistics.map(({ path, ...data }) => ({
    path,
    data,
  })),
  ...generatedSeasonStatisticsAggregations,
  fixtureSet('cup-main', 'cup-quarter-final', 'Quarter-final', '2026-06-11', '20:00:00', seasonId, {
    questionsUrl: cupFinalQuestionsUrl,
  }),
  fixture(
    'cup-main',
    'cup-quarter-final',
    'fixture-cup-1',
    'team-ashridge-arms',
    'team-chesham-comets',
    'venue-ashridge-arms',
  ),
  leagueTable('subsidiary-main', 'subsidiary-table-main', 'Plate League Table', [
    tableRow('team-drayton-dynamos', '1', 1, 1, 0, 0, 2, 41, 35),
    tableRow('team-chesham-comets', '2', 1, 0, 0, 1, 0, 35, 41),
  ]),
]

await clearFirestore()

for (const document of documents) {
  await saveDocument(document.path, document.data)
}

console.log(
  `Seeded ${documents.length} Firestore documents into ${projectId} at ${emulatorHost}. ` +
    `Current season ${seasonId} has ${generatedCurrentSeasonStatistics.length} generated statistics documents; ` +
    `${previousSeasonId} has ${previousLeagueResultCount} league results and ` +
    `${generatedPreviousSeasonStatistics.length} generated statistics documents.`,
)
