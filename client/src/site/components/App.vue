<template>
  <v-app class="ql-app">
    <v-app-bar color="primary" dark fixed app clipped-left scroll-behavior="hide" class="app-header"
      :extended="lgAndUp">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" v-show="mdAndDown"></v-app-bar-nav-icon>
      <v-toolbar-title class="app-title">
        <div v-if="appData" class="app-title-content d-flex align-center">
          <TopTitle :title="appData.leagueName" />
          <PageTitle :title="appData.leagueName"></PageTitle>
        </div>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <div v-if="mdAndUp" class="d-flex align-center ga-2 mr-4">
        <v-btn variant="text" icon="mdi-facebook" target="_blank"
          href="https://www.facebook.com/ChilternQuizLeague/" title="Facebook"></v-btn>

        <LoggedOnMenu :user="user" v-if="user" />
        <v-btn to="/login" variant="elevated" color="white" class="text-primary px-4" v-if="!user">
          <v-icon start>mdi-login</v-icon>
          Login
        </v-btn>
      </div>
      <template v-slot:extension v-if="lgAndUp">
        <div class="nav-container w-100 px-4">
          <v-toolbar color="transparent" dark dense flat class="nav-toolbar">
            <v-toolbar-items>
              <v-btn variant="text" v-for="item in items" :to="item.to" :key="item.name"
                :active="$route.path.includes(item.to)" class="nav-btn">
                <v-icon start size="18">{{ item.icon }}</v-icon>
                <span>{{ item.name }}</span>
              </v-btn>
            </v-toolbar-items>
          </v-toolbar>
        </div>
      </template>
    </v-app-bar>

    <v-navigation-drawer clipped width="280" app :disable-resize-watcher="true" v-model="drawer" class="side-drawer">
      <div class="drawer-header pa-4" v-if="mdAndDown">
        <div class="text-h6 font-weight-bold primary--text">Menu</div>
      </div>
      <v-list density="comfortable" nav v-if="mdAndDown">
        <v-list-item v-for="item in items" :key="item.name" :to="item.to" :prepend-icon="item.icon" :title="item.name"
          class="drawer-item" />
      </v-list>
      <v-divider v-if="mdAndDown"></v-divider>
      <router-view name="sidenav"></router-view>
    </v-navigation-drawer>

    <v-main class="app-content">
      <v-container fluid class="px-0 px-sm-6 py-6">
        <v-row justify="start">
          <v-col cols="12">
            <div class="title-view-container mb-4">
              <router-view name="title" v-slot="{ Component }">
                <component :is="Component" />
              </router-view>
            </div>
            <div class="main-view-container">
              <router-view v-slot="{ Component }">
                <v-fade-transition mode="out-in">
                  <component :is="Component" />
                </v-fade-transition>
              </router-view>
            </div>
          </v-col>
        </v-row>

        <notifications></notifications>
      </v-container>
    </v-main>

    <v-bottom-navigation fixed app hide-on-scroll v-if="smAndDown" color="primary" class="mobile-nav">
      <v-btn to="/home" value="home">
        <v-icon>mdi-home</v-icon>
        <span>Home</span>
      </v-btn>
      <v-btn to="/results" value="results">
        <v-icon>mdi-check</v-icon>
        <span>Results</span>
      </v-btn>
      <v-btn to="/team" value="teams">
        <v-icon>mdi-account-multiple</v-icon>
        <span>Teams</span>
      </v-btn>
      <LoggedOnMenu :user="user" v-if="user">
        <span class="text-caption">{{ user.siteUser.handle }}</span>
      </LoggedOnMenu>
      <v-btn to="/login" v-if="!user">
        <v-icon>mdi-login</v-icon>
        <span>Login</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script lang="ts" setup>
import ApplicationContextDAO from "@/dao/ApplicationContextDAO";
import { useSideMenuStore, useUserStore } from "@/stores/app";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useDocument } from "vuefire";
import { useDisplay } from "vuetify";
import PageTitle from "./common/PageTitle.vue";
import TopTitle from "./common/TopTitle.vue";
import LoggedOnMenu from "./auth/LoggedOnMenu.vue";


const appData = useDocument(ApplicationContextDAO.get())

const { mdAndDown, smAndDown, smAndUp, mdAndUp, lgAndUp } = useDisplay()

const { user } = storeToRefs(useUserStore())

const sideMenu = useSideMenuStore()
const showMenu = ref(false)

const drawer = defineModel(
  {
    set(value: boolean) {
      return showMenu.value = mdAndDown.value ? value : showMenu.value
    }, get() {
      return (sideMenu.sidemenu && lgAndUp.value) || (showMenu.value && mdAndDown.value)
    }
  })

const items = [
  { name: "Home", to: "/home", icon: "mdi-home" },
  { name: "Teams", to: "/team", icon: "mdi-account-multiple" },
  { name: "Competitions", to: "/competition", icon: "mdi-trophy" },
  { name: "Results", to: "/results", icon: "mdi-check" },
  { name: "Seasons", to: "/analytics", icon: "mdi-chart-timeline-variant" },
  { name: "Venues", to: "/venue", icon: "mdi-map-marker" },
  { name: "Rules", to: "/rules", icon: "mdi-book-open-page-variant" },
  { name: "Links", to: "/links", icon: "mdi-link" },
  { name: "Contact", to: "/contact", icon: "mdi-contacts" },
  { name: "Help", to: "/help", icon: "mdi-help" }]
</script>

<style lang="css" scoped>
.ql-app {
  background-color: #f8fafc !important;
}

.app-header {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
}

.app-title {
  flex: 0 1 auto !important;
  min-width: 0;
}

.app-title-content {
  max-width: 100%;
  min-width: 0;
}

.app-title :deep(.v-toolbar-title__placeholder) {
  display: flex;
  align-items: center;
  overflow: visible;
  text-overflow: clip;
}

.nav-toolbar {
  height: 48px !important;
}

.nav-btn {
  font-size: 0.875rem !important;
  font-weight: 500 !important;
  opacity: 0.9;
  transition: opacity 0.2s, background-color 0.2s;
}

.nav-btn:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-btn.v-btn--active {
  background-color: rgba(255, 255, 255, 0.15);
  font-weight: 700 !important;
  opacity: 1;
}

.side-drawer {
  background-color: #ffffff !important;
  border-right: 1px solid #e2e8f0 !important;
}

.drawer-header {
  border-bottom: 1px solid #f1f5f9;
}

.drawer-item {
  border-radius: 8px !important;
  margin-bottom: 4px !important;
}

.app-content {
  background-color: #f8fafc;
  min-height: 100vh;
}

.title-view-container {
  min-height: 48px;
}

.mobile-nav {
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05) !important;
  border-top: 1px solid #e2e8f0;
}
</style>
