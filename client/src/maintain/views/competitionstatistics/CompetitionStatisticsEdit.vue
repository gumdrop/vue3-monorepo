<template>
  <v-container v-if="competitionStatistics">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title>
          {{ isNew ? 'Add' : 'Edit' }} Competition Statistics
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="competitionStatistics.competitionName"
            label="Competition Name"
            :rules="[rules.required('Competition Name')]"
          ></v-text-field>

          <v-card variant="outlined" class="pa-2 mt-4">
            <v-card-title>
              Results
              <v-spacer></v-spacer>
              <v-btn color="primary" @click="addResult">Add Result</v-btn>
            </v-card-title>
            <v-card-text>
              <div v-if="!resultRows.length">No results</div>
              <v-row v-for="(row, index) in resultRows" :key="row.uid" align="center">
                <v-col cols="12" md="3">
                  <v-autocomplete
                    v-model="row.season"
                    :items="seasonOptions"
                    item-title="name"
                    item-value="path"
                    label="Season"
                    return-object
                    clearable
                    :data-test="`result-season-${index}`"
                    @update:model-value="selectSeason(row, $event)"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="row.seasonText"
                    label="Season Text"
                    :data-test="`result-season-text-${index}`"
                    :rules="[rules.required('Season Text')]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-autocomplete
                    v-model="row.competition"
                    :items="row.competitionOptions"
                    :disabled="!row.season"
                    item-title="name"
                    item-value="path"
                    label="Competition"
                    return-object
                    clearable
                    :data-test="`result-competition-${index}`"
                    @update:model-value="selectCompetition(row, $event)"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" md="3">
                  <v-autocomplete
                    v-model="row.team"
                    :items="teamOptions"
                    item-title="name"
                    item-value="path"
                    label="Team"
                    return-object
                    clearable
                    :data-test="`result-team-${index}`"
                    @update:model-value="selectTeam(row, $event)"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="row.teamText"
                    label="Team Text"
                    :data-test="`result-team-text-${index}`"
                    :rules="[rules.required('Team Text')]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="1">
                  <v-btn
                    color="secondary"
                    icon="mdi-delete"
                    variant="text"
                    :data-test="`remove-result-${index}`"
                    @click="removeResult(row)"
                  ></v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" to="/competitionstatistics">Cancel</v-btn>
          <v-btn color="primary" @click="save" :disabled="!valid">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { DocumentReference } from 'firebase/firestore'
import { toPath, type DocRef, type LegacyRef } from '@quizleague/shared'
import CompetitionDAO from '@/dao/CompetitionDAO'
import CompetitionStatisticsDAO from '@/dao/CompetitionStatisticsDAO'
import SeasonDAO from '@/dao/SeasonDAO'
import TeamDAO from '@/dao/TeamDAO'
import type Competition from '@/entity/Competition'
import type CompetitionStatistics from '@/entity/CompetitionStatistics'
import type { CompetitionStatisticsResult } from '@/entity/CompetitionStatistics'
import type Season from '@/entity/Season'
import type Team from '@/entity/Team'
import { newEntityIdentity } from '@/maintain/utils/entityIds'
import { useValidations } from '@/site/components/Validation'

type PathReference = {
  path: string
}

type EditableReference = DocRef | LegacyRef | PathReference | DocumentReference

type ReferenceOption = {
  id: string
  path: string
  name: string
}

type ResultRow = {
  uid: string
  competition?: ReferenceOption
  competitionOptions: ReferenceOption[]
  season?: ReferenceOption
  seasonText: string
  team?: ReferenceOption
  teamText: string
}

type EditableCompetitionStatistics = Omit<CompetitionStatistics, 'id' | 'path' | 'results'> & {
  id: string
  path: string
  results: CompetitionStatisticsResult[]
}

type FirestoreCompetitionStatisticsResult = Omit<
  CompetitionStatisticsResult,
  'competition' | 'season' | 'team'
> & {
  competition?: DocumentReference
  season?: DocumentReference
  team?: DocumentReference
}

type FirestoreCompetitionStatistics = Omit<EditableCompetitionStatistics, 'results'> & {
  results: FirestoreCompetitionStatisticsResult[]
}

const route = useRoute()
const router = useRouter()
const rules = useValidations()

const competitionStatistics = ref<EditableCompetitionStatistics | null>(null)
const resultRows = ref<ResultRow[]>([])
const seasonOptions = ref<ReferenceOption[]>([])
const teamOptions = ref<ReferenceOption[]>([])
const valid = ref(false)
let nextRowUid = 0

const isNew = computed(() => route.params.id === 'new')

const referencePath = (reference: EditableReference | undefined) => {
  if (!reference) return ''
  if ('path' in reference && typeof reference.path === 'string') return reference.path
  return toPath(reference)
}

const documentReference = <T>(
  option: ReferenceOption | undefined,
  dao: {
    getByPath: (path: string) => DocumentReference<T>
  },
): DocumentReference<T> | undefined => {
  return option?.path ? dao.getByPath(option.path) : undefined
}

const optionFromPath = (path: string): ReferenceOption | undefined => {
  const trimmedPath = path.trim()
  const pathParts = trimmedPath.split('/').filter(Boolean)
  const id = pathParts[pathParts.length - 1]
  return id ? { id, path: trimmedPath, name: trimmedPath } : undefined
}

const findOption = (options: ReferenceOption[], path: string) => {
  return options.find((option) => option.path === path) ?? optionFromPath(path)
}

const seasonName = (season: Season) => {
  return season.startYear && season.endYear ? `${season.startYear}/${season.endYear}` : season.id
}

const toSeasonOption = (season: Season): ReferenceOption => ({
  id: season.id,
  path: season.path,
  name: seasonName(season),
})

const toTeamOption = (team: Team): ReferenceOption => ({
  id: team.id,
  path: team.path,
  name: team.name,
})

const toCompetitionOption = (competition: Competition): ReferenceOption => ({
  id: competition.id,
  path: competition.path,
  name: competition.name,
})

const makeRow = (result?: CompetitionStatisticsResult): ResultRow => {
  const seasonPath = referencePath(result?.season)
  return {
    uid: `competition-statistics-result-${nextRowUid++}`,
    competition: optionFromPath(referencePath(result?.competition)),
    competitionOptions: [],
    season: findOption(seasonOptions.value, seasonPath),
    seasonText: result?.seasonText ?? '',
    team: findOption(teamOptions.value, referencePath(result?.team)),
    teamText: result?.teamText ?? '',
  }
}

const loadCompetitionOptions = async (row: ResultRow, selectedCompetitionPath = '') => {
  if (!row.season) {
    row.competitionOptions = []
    row.competition = undefined
    return
  }

  const competitions = await CompetitionDAO.entities(
    CompetitionDAO.nestedCollection(SeasonDAO.getByPath(row.season.path)),
  )
  row.competitionOptions = competitions
    .map(toCompetitionOption)
    .sort((left, right) => left.name.localeCompare(right.name))
  row.competition = findOption(row.competitionOptions, selectedCompetitionPath)
}

const loadRows = async (results: CompetitionStatisticsResult[] = []) => {
  resultRows.value = results.map((result) => makeRow(result))
  await Promise.all(
    resultRows.value.map((row, index) =>
      loadCompetitionOptions(row, referencePath(results[index]?.competition)),
    ),
  )
}

const buildResult = (row: ResultRow): FirestoreCompetitionStatisticsResult => {
  const result: FirestoreCompetitionStatisticsResult = {
    seasonText: row.seasonText.trim(),
    teamText: row.teamText.trim(),
  }
  const competition = documentReference(row.competition, CompetitionDAO)
  const season = documentReference(row.season, SeasonDAO)
  const team = documentReference(row.team, TeamDAO)

  if (competition) result.competition = competition
  if (season) result.season = season
  if (team) result.team = team

  return result
}

onMounted(async () => {
  const [seasons, teams] = await Promise.all([SeasonDAO.list(), TeamDAO.list()])
  seasonOptions.value = seasons
    .map(toSeasonOption)
    .sort((left, right) => right.name.localeCompare(left.name))
  teamOptions.value = teams
    .map(toTeamOption)
    .sort((left, right) => left.name.localeCompare(right.name))

  if (isNew.value) {
    competitionStatistics.value = {
      id: '',
      path: 'competitionstatistics',
      competitionName: '',
      results: [],
    }
    await loadRows()
  } else {
    const id = route.params.id as string
    competitionStatistics.value =
      ((await CompetitionStatisticsDAO.getDataById(id)) as
        | EditableCompetitionStatistics
        | undefined) ?? null
    await loadRows(competitionStatistics.value?.results)
  }
})

const addResult = () => {
  resultRows.value = [...resultRows.value, makeRow()]
}

const removeResult = (rowToRemove: ResultRow) => {
  resultRows.value = resultRows.value.filter((row) => row.uid !== rowToRemove.uid)
}

const selectSeason = async (row: ResultRow, season: ReferenceOption | undefined) => {
  row.season = season
  row.seasonText = season?.name ?? ''
  row.competition = undefined
  await loadCompetitionOptions(row)
}

const selectCompetition = (row: ResultRow, competition: ReferenceOption | undefined) => {
  row.competition = competition
}

const selectTeam = (row: ResultRow, team: ReferenceOption | undefined) => {
  row.team = team
  row.teamText = team?.name ?? ''
}

const save = async () => {
  if (!competitionStatistics.value) return

  if (isNew.value) {
    Object.assign(competitionStatistics.value, newEntityIdentity('competitionstatistics'))
  }
  const statisticsToSave: FirestoreCompetitionStatistics = {
    ...competitionStatistics.value,
    results: resultRows.value.map(buildResult),
  }
  await CompetitionStatisticsDAO.save(statisticsToSave)
  router.push('/competitionstatistics')
}
</script>
