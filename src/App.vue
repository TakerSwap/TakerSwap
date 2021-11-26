<template>
  <ElConfigProvider :locale="locale">
    <Header v-model:collapseMenu="collapseMenu"></Header>
    <div class="flex">
      <left-nav v-model:collapseMenu="collapseMenu"></left-nav>
      <div
        id="inner_content"
        :class="['inner_content', collapseMenu ? 'expand' : '']"
      >
        <router-view></router-view>
      </div>
    </div>
    <div
      :class="['nav-mask', collapseMenu ? '' : 'show']"
      @click="collapseMenu = true"
    ></div>
  </ElConfigProvider>
  <div class="cover-bg"></div>
</template>

<script lang="ts">
import { watch, ref, computed } from "vue";
import { useStore } from "vuex";
import Header from "@/components/Header.vue";
import LeftNav from "@/components/LeftNav.vue";
import { ElConfigProvider } from "element-plus";
import zhCn from "element-plus/lib/locale/lang/zh-cn";
import enLocale from "element-plus/lib/locale/lang/en";
import storage from "@/utils/storage";
import nerve from "nerve-sdk-js";
import config from "@/config";
nerve.customnet(config.chainId, config.API_URL, config.timeout); // sdk设置测试网chainId

// const navigatorLang = window.navigator.language === "zh-CN" ? "zh-cn" : "en";
const navigatorLang = "en";
const lang = storage.get("local", "lang") || navigatorLang;

export default {
  name: "App",
  components: {
    Header,
    LeftNav,
    ElConfigProvider
  },
  setup() {
    const store = useStore();
    const locale = ref(zhCn);
    locale.value = lang === "zh-cn" ? zhCn : enLocale;
    watch(
      () => store.state.lang,
      val => {
        locale.value = val === "zh-cn" ? zhCn : enLocale;
      }
    );
    let timer: number;
    const takerAddress = computed(() => store.getters.takerAddress);
    watch(takerAddress, val => {
      if (val) {
        store.dispatch("getAssetList", val);
        if (timer) clearInterval(timer);
        timer = window.setInterval(() => {
          store.dispatch("getAssetList", val);
        }, 5000);
      } else {
        store.commit("setAssetList", []);
      }
    });
    const collapseMenu = ref(false);
    return {
      locale,
      collapseMenu
    };
  }
};
</script>

<style lang="scss">
@import "assets/css/base.scss";

#app {
  width: 100%;
  min-height: 100%;
  padding-bottom: 30px;
  word-break: break-all;
}
.inner_content {
  position: relative;
  z-index: 10;
  padding-top: 50px;
  margin-left: 208px;
  margin-top: 80px;
  flex: 1;
  transition: padding-top 0.2s ease 0s,
    margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s;
  &.expand {
    margin-left: 64px;
  }
  @media screen and (max-width: 1440px) {
    margin-top: 50px;
  }
  @media screen and (max-width: 1200px) {
    margin-left: 0;
    &.expand {
      margin-left: 0;
    }
  }
  //@media screen and (max-width: 500px) {
  //  margin-top: 50px;
  //}
}
.nav-mask {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: $BgColor;
  transition: opacity 0.4s ease 0s;
  opacity: 0;
  z-index: 10;
  pointer-events: none;
  &.show {
    opacity: 0.65;
    pointer-events: initial;
  }
}
@media screen and (max-width: 1200px) {
  .inner_content {
    margin-left: 0;
    &.expand {
      margin-left: 0;
    }
  }
  .nav-mask {
    display: block;
  }
  /*.pc_nav {
    display: none;
  }
  .mobile_nav {
    display: flex;
  }*/
}
body {
  background-color: #141228;
}
.cover-bg {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover;
  background-image: url("assets/img/bg.jpg");
  //background-image: linear-gradient(to bottom right, #2D1D57, #1D1539);
  //opacity: 0.26;
  z-index: -1;
}
.Vue-Toastification__container.top-right {
  top: 80px!important;
  @media only screen and (max-width: 600px){
    top: 60px!important;
    width: 96%;
    left: 2%;
    .Vue-Toastification__toast {
      padding: 0 24px;
      align-items: center;
      min-height: 54px;
    }
  }
}
</style>
