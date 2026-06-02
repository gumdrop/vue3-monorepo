<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>Team Members</v-card-title>
          <v-card-text>
            <v-alert v-if="successMessage" type="success" class="mt-4">
              {{ successMessage }}
            </v-alert>
            <v-alert v-if="errorMessage" type="error" class="mt-4">
              {{ errorMessage }}
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" :disabled="migrating" @click="migrate">
              Migrate Team Members
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'

interface TeamMembershipMigrationResult {
  teamsScanned: number
  teamsMigrated: number
  teamsSkipped: number
  usersMigrated: number
  legacyUserArraysDeleted: number
}

const migrating = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const migrate = async () => {
  migrating.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await axios.post<TeamMembershipMigrationResult>(
      '/rest/maintain/team-members/migrate',
    )
    const result = response.data
    successMessage.value = `Migrated ${result.teamsMigrated} teams and ${result.usersMigrated} users`
  } catch {
    errorMessage.value = 'Team member migration failed'
  } finally {
    migrating.value = false
  }
}
</script>
