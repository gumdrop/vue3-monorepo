<template>
  <SubTitle v-if="team" :title="team.name" icon="mdi-shield-outline" colour="amber-lighten-3">
    <template #actions>
      <v-btn
        variant="elevated"
        color="white"
        prepend-icon="mdi-email"
        class="text-primary font-weight-bold"
        @click="contact = true"
      >
        Contact Us
      </v-btn>
      <AliasContactDialog
        :open="contact"
        :team-id="id"
        :alias-text="team?.name"
        @close="contact = false"
      />
    </template>
  </SubTitle>
</template>
<script setup lang="ts">
import TeamDAO from '@/dao/TeamDAO';
import { ref } from 'vue';
import { useDocument } from 'vuefire';
import SubTitle from '../common/SubTitle.vue';
import AliasContactDialog from '../other/AliasContactDialog.vue';

const props = defineProps<{
  id: string
}>()

const contact = ref(false)
const team = useDocument(() => TeamDAO.getById(props.id))

</script>
