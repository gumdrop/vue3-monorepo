import {
  DateTimeFormatter,
  Duration,
  LocalDate,
  LocalDateTime,
  LocalTime,
  ZonedDateTime,
  ZoneId,
  ZoneOffset,
} from '@js-joda/core'
import '@js-joda/timezone'
import {
  Competition,
  Entity,
  Event,
  Fixture,
  Fixtures,
  Season,
  SingletonCompetition,
  Team,
  Venue
} from '@quizleague/shared'
import { randomUUID } from 'crypto'
import { collection, list, load, runQuery, save } from '../storage/Storage'
import { applicationContext, currentSeason as currS } from './util'

const utc = ZoneOffset.UTC
const local = ZoneId.of('Europe/London')
const dateFormat = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'")

interface CalendarCache extends Entity {
  ical: string
  updated: string
}

export async function teamCalendar(id: string) {
  async function saveNewIcal() {
    const ical = await makeICal(await load<Team>(`team/${id}`))
    const cacheEntry: CalendarCache = {
      id,
      path: `calendarcache/${id}`,
      ical,
      updated: LocalDateTime.now().toString(),
    }
    await save(cacheEntry)
    return cacheEntry.ical
  }

  const dateTime = LocalDateTime.now().minusDays(1).toString()
  const results = await runQuery(
    collection<CalendarCache>('calendarcache')
      .where('id', '==', id)
      .where('updated', '>', dateTime),
  )

  return results.length > 0 ? results[0].ical : saveNewIcal()
}

const toUtc = (dateTime: LocalDateTime) =>
  ZonedDateTime.of(dateTime, local).withZoneSameInstant(utc).format(dateFormat)

async function makeICal(team: Team) {
  const header = 'BEGIN:VCALENDAR\nVERSION:2.0\n'
  let builder = header
  const t = team
  const gap = await applicationContext()
  const currentSeason = await currS()
  builder += `X-WR-CALNAME:${gap.leagueName} calendar for ${t.name}\n`

  const teamFixtures = await teamFixtureList(team, currentSeason)

  let entries = ''

  for (const fixture of teamFixtures) {
    const { competition, fixtures, fixtureList } = fixture
    for (const fix of fixtureList) {
      entries += await formatFixture(
        fix,
        fixtures,
        competition,
        `${competition.name} ${fixtures.description}`,
      )
    }
  }

  builder += entries

  const singletonComps = await singletonCompetitions(currentSeason)

  for (const c of singletonComps) {
    if (c.event) {
      builder += await formatEvent(c.event as Event, `${gap.leagueName} ${c.name}`)
    }
  }

  for (const fixture of teamFixtures) {
    const { competition, fixtures, fixtureList } = fixture
    if (!fixtureList || fixtureList.length < 1) {
      builder += formatBlankFixtures(fixtures, competition, competition.name)
    }
  }

  for (const event of currentSeason.calendar) {
    builder += await formatEvent(event, event.description)
  }

  return builder + 'END:VCALENDAR\n'
}

async function formatEvent(event: Event, text: string) {
  const now = toUtc(LocalDateTime.now())
  const uidPart = text.replace(/\s/g, '')
  const venue = event.venue ? await load<Venue>(event.venue) : undefined
  const address = venue
    ? venue.address.replace(/\n\r/g, ',').replace(/\n/g, ',').replace(/\r/g, ',')
    : ''
  const time = LocalTime.parse(event.time, DateTimeFormatter.ISO_LOCAL_TIME)
  const date = LocalDate.parse(event.date, DateTimeFormatter.ISO_DATE)
  const duration = Duration.ofSeconds(event.duration)
  return `
BEGIN:VEVENT
DTSTAMP:${now}
UID:${event.date}.${uidPart}.chilternquizleague.uk
DESCRIPTION:${text}
SUMMARY:${text}
DTSTART:${toUtc(date.atTime(time))}
DTEND:${toUtc(date.atTime(time.plus(duration)))}
${venue ? `LOCATION:${venue.name}, ${address}` : ''}
END:VEVENT\n`
}
async function formatFixture(
  fixture: Fixture,
  fixtures: Fixtures,
  competition: Competition,
  description: string,
) {
  const home = await load<Team>(fixture.home)
  const away = await load<Team>(fixture.away)
  const venue = fixture.venue ? await load<Venue>(fixture.venue) : undefined
  const uidPart = home.shortName.replace(/\s/g, '')
  const text = `${home.shortName} - ${away.shortName} : ${description}`
  const now = toUtc(LocalDateTime.now())
  const address = venue
    ? venue.address.replace(/\n\r/g, ',').replace(/\n/g, ',').replace(/\r/g, ',')
    : ''

  const time = LocalTime.parse(fixtures.start, DateTimeFormatter.ISO_LOCAL_TIME)
  const date = LocalDate.parse(fixtures.date, DateTimeFormatter.ISO_DATE)

  return `
BEGIN:VEVENT
DTSTAMP:${now}
UID:${fixtures.date}.${uidPart}.chilternquizleague.uk
DESCRIPTION:${text}
SUMMARY:${text}
DTSTART:${toUtc(date.atTime(time))}
DTEND:${toUtc(date.atTime(time.plus(Duration.ofSeconds(competition.duration))))}
${venue ? `LOCATION:${venue.name}, ${address}` : ''}
END:VEVENT\n`
}

function formatBlankFixtures(fixtures: Fixtures, competition: Competition, description: string) {
  const uidPart = (description + fixtures.description).replace(/\s/g, '')
  const now = toUtc(LocalDateTime.now())
  const time = LocalTime.parse(fixtures.start, DateTimeFormatter.ISO_LOCAL_TIME)
  const date = LocalDate.parse(fixtures.date, DateTimeFormatter.ISO_DATE)

  return `
BEGIN:VEVENT
DTSTAMP:${now}
UID:${fixtures.date}.${uidPart}.chilternquizleague.uk
DESCRIPTION:${description} ${fixtures.description}
SUMMARY:${description} ${fixtures.description}
DTSTART:${toUtc(date.atTime(time))}
DTEND:${toUtc(date.atTime(time.plus(Duration.ofSeconds(competition.duration))))}
END:VEVENT
`
}

async function singletonCompetitions(season: Season) {
  const competitions = await list<Competition>('competition', season.path)
  return competitions.filter((c) => c._name === 'singleton') as SingletonCompetition[]
}

async function teamCompetitions(season: Season) {
  const competitions = await list<Competition>('competition', season.path)
  return competitions.filter((c) => c._name === 'league' || c._name === 'cup')
}

function matchesTeam(ref: unknown, team: Team): boolean {
  if (!ref) return false
  if (typeof ref === 'string') {
    return ref === team.id || ref === team.path || ref.endsWith(`/${team.id}`)
  }
  if (typeof ref === 'object') {
    if ('id' in ref && (ref as { id: string }).id === team.id) return true
    if ('path' in ref && (ref as { path: string }).path === team.path) return true
  }
  return false
}

function fixtureInvolvesTeam(fixture: Fixture, team: Team): boolean {
  return matchesTeam(fixture.home, team) || matchesTeam(fixture.away, team)
}

async function teamFixtureList(team: Team, currentSeason: Season) {
  const teamFixtures: { competition: Competition; fixtures: Fixtures; fixtureList: Fixture[] }[] =
    []
  const teamComps = await teamCompetitions(currentSeason)

  for (const competition of teamComps) {
    const fixtures = await list<Fixtures>('fixtures', competition.path)
    for (const fixs of fixtures) {
      const fixtureList = await list<Fixture>('fixture', fixs.path)
      const matchingFixtures = fixtureList.filter((f) => fixtureInvolvesTeam(f, team))
      teamFixtures.push({ competition, fixtures: fixs, fixtureList: matchingFixtures })
    }
  }

  return teamFixtures
}
