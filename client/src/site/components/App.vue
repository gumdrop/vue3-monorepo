<template>
  <v-app style="font-size:16px;">
    <v-app-bar color="blue-darken-3" dark fixed app clipped-left scroll-behavior="hide" :image="topImage">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" v-show="mdAndDown"></v-app-bar-nav-icon>
      <v-toolbar-title class="white--text">
        <span v-if="appData">
          <TopTitle :title="appData.leagueName" />
          <QlTitle :title="appData.leagueName"></QlTitle>
        </span>

      </v-toolbar-title>
      <v-spacer></v-spacer>
      <div v-if="mdAndUp">
        <v-btn variant="text" icon="mdi-facebook" fab target="_blank"
          href="https://www.facebook.com/ChilternQuizLeague/" title="Facebook"></v-btn>

        <LoggedOnMenu :user="user" v-if="user" />
        <v-btn to="/login" variant="text" fab v-if="!user" title="Login" icon="mdi-login" />
      </div>
      <template v-slot:extension v-if="lgAndUp">
        <v-toolbar color="transparent" dark dense flat>
          <v-toolbar-items>
            <v-btn variant="text" v-for="item in items" :to="item.to" :key="item.name"
              :active="$route.path.includes(item.to)"><v-icon start>{{
                item.icon
              }}</v-icon><span>{{ item.name }}</span></v-btn>
          </v-toolbar-items>
        </v-toolbar>
      </template>
      <template v-slot:image>
        <v-img v-if="smAndUp" gradient="to top right, rgba(19,84,122,.5), rgba(128,208,199,.8)"></v-img>
      </template>
    </v-app-bar>
    <v-navigation-drawer clipped width="280" app :disable-resize-watcher="true" v-model="drawer">

      <QlSideMenu title="Main Menu" icon="mdi-menu" v-if="mdAndDown">
        <SideMenuItem v-for="item in items" :to="item.to" :key="item.name" :icon="item.icon" :title="item.name" />
      </QlSideMenu>
      <router-view name="sidenav"></router-view>

    </v-navigation-drawer>
    <v-main>
      <div class="frame-background" v-if="smAndUp">&nbsp;</div>
      <v-container fluid class="px-0 py-0">
        <v-row justify-left align-top>
          <v-col width="12">
            <router-view name="title" v-slot="{ Component }">
              <component :is="Component" />
            </router-view>
            <v-spacer></v-spacer>
            <div style="position: relative">
              <router-view fill-height v-slot="{ Component }">
                <component :is="Component" />
              </router-view>
            </div>
          </v-col>
        </v-row>

        <notifications></notifications>
        <chat-notifications></chat-notifications>
      </v-container>
    </v-main>

    <v-bottom-navigation fixed app hide-on-scroll :active="true" v-if="smAndDown">
      <div>Footer</div>
      <v-btn variant="text" target="_blank" href="https://www.facebook.com/ChilternQuizLeague/"
        title="Facebook"><span>Facebook</span><v-icon>mdi-facebook-box</v-icon></v-btn>
      <LoggedOnMenu :user="user" v-if="user"><span style="position:relative;top:2px;">{{ user.siteUser.handle
      }}</span></LoggedOnMenu>
      <v-btn to="/login" variant="text" v-if="!user" title="Login"><span>Login</span><v-icon>mdi-login</v-icon></v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script lang="ts" setup>
import topImage from "@/assets/chiltern-hills.jpg";
import ApplicationContextDAO from "@/dao/ApplicationContextDAO";
import { useSideMenuStore, useUserStore } from "@/stores/app";
import { ref } from "vue";
import { useDocument } from "vuefire";
import { useDisplay } from "vuetify";
import QlTitle from "./common/PageTitle.vue";
import QlSideMenu from "./common/SideMenu.vue";
import TopTitle from "./common/TopTitle.vue";
import SideMenuItem from "./common/SideMenuItem.vue";
import LoggedOnMenu from "./auth/LoggedOnMenu.vue";


const appData = useDocument(ApplicationContextDAO.get())

const { mdAndDown, smAndDown, smAndUp, mdAndUp, lgAndUp } = useDisplay()

const { user } = useUserStore()

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
  { name: "Venues", to: "/venue", icon: "mdi-map-marker" },
  { name: "Rules", to: "/rules", icon: "mdi-book-open-page-variant" },
  { name: "Links", to: "/links", icon: "mdi-link" },
  { name: "Contact Us", to: "/contact", icon: "mdi-contacts" },
  { name: "Help", to: "/help", icon: "mdi-help" }]
</script>
<style lang="css" scoped>
.frame-background {
  background-image: linear-gradient(to top right,
      rgba(255, 255, 255, 0.7),
      rgba(255, 255, 255, 0.7)),
    url('./assets/old-amersham.png');
  background-size: 100% 100%;
  width: 100vw;
  height: 100vh;
  position: fixed;
  z-index: 0;
}
</style>
