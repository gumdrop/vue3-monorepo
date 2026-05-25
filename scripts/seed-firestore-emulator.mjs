const projectId = process.env.FIREBASE_PROJECT_ID ?? 'chiltern-ql-firestore'
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:18080'
const baseUrl = `http://${emulatorHost}/v1/projects/${projectId}/databases/(default)/documents`
const clearUrl = `http://${emulatorHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`

const appContextId = '5659313586569216'
const seasonId = 'season-2025-2026'

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

function competitionRef(id) {
  return ref('competition', id, `season/${seasonId}`)
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

function team(id, name, shortName, venueId, textId, handle, userIds = []) {
  return {
    path: `team/${id}`,
    data: {
      id,
      name,
      shortName,
      venue: venueRef(venueId),
      text: textRef(textId),
      users: userIds.map(userRef),
      handle,
      retired: false,
      publicSafe: true,
    },
  }
}

function competition(id, type, name, textId, textName, extra = {}) {
  return {
    path: `season/${seasonId}/competition/${id}`,
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

function fixtureSet(competitionId, id, description, date, start = '20:00:00') {
  return {
    path: `season/${seasonId}/competition/${competitionId}/fixtures/${id}`,
    data: {
      id,
      description,
      date,
      start,
    },
  }
}

function fixture(competitionId, fixturesId, id, homeId, awayId, venueId, result) {
  return {
    path: `season/${seasonId}/competition/${competitionId}/fixtures/${fixturesId}/fixture/${id}`,
    data: {
      id,
      home: teamRef(homeId),
      away: teamRef(awayId),
      venue: venueRef(venueId),
      ...(result ? { result } : {}),
    },
  }
}

function leagueTable(competitionId, id, description, rows) {
  return {
    path: `season/${seasonId}/competition/${competitionId}/leaguetable/${id}`,
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

const documents = [
  text('text-front-page', 'Welcome to the Chiltern Quiz League local development data set.'),
  text(
    'text-season-2025-2026',
    'The 2025-2026 season includes league, cup, subsidiary, and singleton competitions.',
  ),
  text('text-competitions-header', 'Current season competitions.'),
  text('text-league-description', 'League fixtures and current standings.'),
  text('text-league-note', 'The main league competition is played home and away.'),
  text('text-cup-note', 'The cup competition is a knockout team competition.'),
  text('text-subsidiary-note', 'The subsidiary league tracks additional standings.'),
  text('text-singleton-note', 'The individual quiz is represented as a single scheduled event.'),
  text('text-teams-header', 'Active public teams in the league.'),
  text('text-venues-front-page', 'Venues used by active teams and fixtures.'),
  text('text-team-ashridge', 'Ashridge Arms team profile.'),
  text('text-team-beaconsfield', 'Beaconsfield Bees team profile.'),
  text('text-team-chesham', 'Chesham Comets team profile.'),
  text('text-team-drayton', 'Drayton Dynamos team profile.'),
  user('user-alice-ashridge', 'Alice Ashridge', 'alice.ashridge@example.test'),
  user('user-ben-beaconsfield', 'Ben Beaconsfield', 'ben.beaconsfield@example.test'),
  user('user-chloe-chesham', 'Chloe Chesham', 'chloe.chesham@example.test'),
  user('user-dan-drayton', 'Dan Drayton', 'dan.drayton@example.test'),
  user('user-ella-secretary', 'Ella Secretary', 'ella.secretary@example.test'),
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
    ['user-alice-ashridge', 'user-ella-secretary'],
  ),
  team(
    'team-beaconsfield-bees',
    'Beaconsfield Bees',
    'Beaconsfield',
    'venue-beaconsfield-hall',
    'text-team-beaconsfield',
    'beaconsfield',
    ['user-ben-beaconsfield'],
  ),
  team(
    'team-chesham-comets',
    'Chesham Comets',
    'Chesham',
    'venue-chesham-club',
    'text-team-chesham',
    'chesham',
    ['user-chloe-chesham'],
  ),
  team(
    'team-drayton-dynamos',
    'Drayton Dynamos',
    'Drayton',
    'venue-ashridge-arms',
    'text-team-drayton',
    'drayton',
    ['user-dan-drayton'],
  ),
  {
    path: 'globaltext/site',
    data: {
      id: 'site',
      name: 'site',
      text: {
        'front-page': textRef('text-front-page'),
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
  fixtureSet('league-main', 'league-round-1', 'Round 1', '2026-05-07'),
  fixtureSet('league-main', 'league-round-2', 'Round 2', '2026-06-04'),
  fixture(
    'league-main',
    'league-round-1',
    'fixture-league-1',
    'team-ashridge-arms',
    'team-beaconsfield-bees',
    'venue-ashridge-arms',
    {
      homeScore: 42,
      awayScore: 38,
    },
  ),
  fixture(
    'league-main',
    'league-round-2',
    'fixture-league-2',
    'team-chesham-comets',
    'team-drayton-dynamos',
    'venue-chesham-club',
  ),
  leagueTable('league-main', 'league-table-main', 'League Championship Table', [
    tableRow('team-ashridge-arms', '1', 1, 1, 0, 0, 2, 42, 38),
    tableRow('team-beaconsfield-bees', '2', 1, 0, 0, 1, 0, 38, 42),
    tableRow('team-chesham-comets', '3', 0, 0, 0, 0, 0, 0, 0),
    tableRow('team-drayton-dynamos', '4', 0, 0, 0, 0, 0, 0, 0),
  ]),
  fixtureSet('cup-main', 'cup-quarter-final', 'Quarter-final', '2026-06-11'),
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
  `Seeded ${documents.length} Firestore documents into ${projectId} at ${emulatorHost}. Current season ${seasonId} has league, cup, subsidiary, and singleton competitions.`,
)
