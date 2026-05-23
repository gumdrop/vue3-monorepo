<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            Global Text
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="add">Add Global Text</v-btn>
          </v-card-title>
          <v-list>
            <v-list-item v-for="text in texts" :key="text.id" :to="'/globaltext/' + text.id">
              <v-list-item-title>{{ text.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import GlobalTextDAO from '@/dao/GlobalTextDAO'
import type GlobalText from '@/entity/GlobalText'
import { useRouter } from 'vue-router'

const texts = ref<GlobalText[]>([])
const router = useRouter()

onMounted(async () => {
  texts.value = await GlobalTextDAO.list()
})

const add = () => {
  router.push('/globaltext/new')
}
</script>
