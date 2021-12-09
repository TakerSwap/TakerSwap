<template>
  <div
    :class="[
      'left-nav',
      isCollapse && !isMobile ? 'collapse-nav' : '',
      isCollapse && isMobile ? 'hide-nav' : ''
    ]"
  >
    <el-menu
      :class="['menu', isCollapse ? 'collapse' : '']"
      @select="handleSelect"
      :default-active="activeIndex"
      background-color="#181837"
      text-color="#fff"
      active-text-color="#8dc8d6"
    >
<!--      <el-menu-item index="home">
        <i class="iconfont icon-Home"></i>
        <template #title>
          <span class="title">{{ $t("header.header4") }}</span>
        </template>
      </el-menu-item>-->
      <el-menu-item index="trading">
        <i class="iconfont icon-Swap"></i>
        <template #title>
          <span class="title">{{ $t("header.header1") }}</span>
        </template>
      </el-menu-item>
      <el-menu-item index="liquidity">
        <i class="iconfont icon-Liquidity"></i>
        <template #title>
          <span class="title">{{ $t("header.header2") }}</span>
        </template>
      </el-menu-item>
      <el-menu-item index="pool">
        <i class="iconfont icon-Pool"></i>
        <template #title>
          <span class="title">{{ $t("header.header7") }}</span>
        </template>
      </el-menu-item>
      <el-menu-item index="farm">
        <i class="iconfont icon-Farm"></i>
        <template #title>
          <span class="title">{{ $t("header.header8") }}</span>
        </template>
      </el-menu-item>
      <el-menu-item index="createFarm">
        <i class="iconfont icon-a-CreateFarm"></i>
        <template #title>
          <span class="title">{{ $t("header.header5") }}</span>
        </template>
      </el-menu-item>
<!--      <el-menu-item index="none" disabled>
        <i class="iconfont icon-liulanqi2"></i>
        <template #title>
          <span class="title">{{ $t("header.header9") }}</span>
        </template>
      </el-menu-item>-->
      <div class="custom-item">
        <i class="iconfont icon-Docs"></i>
        <span class="title" style="word-break: keep-all;">
          <a href="https://docs.takerswap.com/" target="_blank">
            {{ $t("header.header6") }}
          </a>
        </span>
      </div>
    </el-menu>
    <div class="nav-bottom">
      <template v-if="!isCollapse">
        <div class="wrap" v-if="false">
          <div class="left flex-center">
            <img src="../assets/s-logo-w.svg" alt="" />
            ${{ usdValue }}
          </div>
        </div>
        <div class="icon-wrap">
          <div class="icon">
            <a href="https://t.me/takerswap" target="_blank">
              <i class="iconfont icon-Telegram"></i>
            </a>
            <a href="https://twitter.com/Takerswap" target="_blank">
              <i class="iconfont icon-Twitter"></i>
            </a>
          </div>

          <div class="lang" @click="switchLang">
            <img src="../assets/img/lang.svg" alt="" />
            <span>{{ lang }}</span>
          </div>
        </div>
      </template>
      <div v-else>
        <i class="iconfont icon-shezhi" @click="isCollapse = !isCollapse"></i>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import useLang from "@/hooks/useLang";
import { listen } from "@/service/socket/websocket";
import config from "@/config";

const url = config.WS_URL;

export default defineComponent({
  name: "LeftNav",
  props: {
    collapseMenu: Boolean
  },
  setup(props, context) {
    const router = useRouter();
    const route = useRoute();
    const activeIndex = ref("home");
    const isMobile = ref(false);

    const isCollapse = computed({
      get() {
        return props.collapseMenu;
      },
      set(val) {
        context.emit("update:collapseMenu", val);
      }
    });
    onMounted(() => {
      isMobile.value = document.documentElement.clientWidth < 1200;
      if (isMobile.value) {
        context.emit("update:collapseMenu", true);
      }
      window.addEventListener("resize", function () {
        isMobile.value = document.documentElement.clientWidth < 1200;
      });
    });
    watch(
      () => route.path,
      val => {
        // console.log(val, 666);
        const path = val?.split("/")[1];
        if (path === "create-farm") {
          activeIndex.value = "createFarm";
        } else {
          activeIndex.value = path || "trading";
        }
        // console.log(activeIndex, 45646);
      },
      {
        immediate: true
      }
    );

    function handleSelect(key: string) {
      toUrl(key);
    }

    function toUrl(name: string, url = "") {
      if (url) {
        window.open(url);
      } else {
        router.push({ name: name });
      }
      if (isMobile.value) {
        context.emit("update:collapseMenu", true);
      }
    }
    const { lang, switchLang } = useLang();

    const usdValue = ref("0.00");
    /*function getOverview() {
      const channel = "mainAssetInfo";
      const params = {
        method: channel
      };
      listen({
        url,
        channel,
        params: {
          cmd: true,
          channel: "cmd:" + JSON.stringify(params)
        },
        success: data => {
          usdValue.value = data.priceUSD;
        }
      });
    }
    onMounted(() => {
      getOverview();
      setInterval(getOverview, 10000);
    });*/

    return {
      activeIndex,
      isCollapse,
      isMobile,
      handleSelect,
      lang,
      switchLang,
      usdValue
    };
  }
});
</script>

<style lang="scss">
@import "../assets/css/style.scss";
.left-nav {
  position: fixed;
  left: 0;
  top: 0;
  padding-top: 80px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: $BgColor;
  border-right: 2px solid $navBorder;
  z-index: 11;
  .menu {
    border-right: none;
    flex: 1;
    .el-menu-item,
    .custom-item {
      display: flex;
      align-items: center;
      font-size: 16px;
      .iconfont {
        color: #fff;
        font-size: 22px;
        margin-right: 10px;
      }
      &.is-active {
        .iconfont {
          color: #8dc8d6;
        }
      }
      .title a {
        color: #fff;
      }
    }
    .custom-item {
      padding: 0 20px;
      height: 56px;
      line-height: 56px;
      cursor: pointer;
      &:hover {
        background-color: #13132c;
      }
    }
    .iconfont {
      color: #fff;
      font-size: 22px;
      margin-right: 10px;
    }
  }
  .menu:not(.el-menu--collapse) {
    //width: 198px;
    //transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s;
    &.collapse {
      //width: 64px;
      .title {
        opacity: 0;
      }
    }
  }
  .nav-bottom {
    height: 110px;
    border-top: 2px solid $navBorder;
    color: #fff;
    padding: 20px 20px 0;
    //transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s;
    .wrap {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      overflow: hidden;
    }
    .icon-wrap {
      //padding-top: 15px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .iconfont {
        font-size: 24px;
        margin-right: 15px;
        &:hover {
          opacity: 0.7;
        }
      }
      img {
        width: 24px;
        margin-right: 5px;
      }
      .lang {
        display: flex;
        align-items: center;
        cursor: pointer;
        &:hover {
          opacity: 0.7;
        }
      }
    }
    .left {
      overflow: hidden;
      word-break: keep-all;
      img {
        width: 25px;
        height: 25px;
        margin-right: 5px;
        //border-radius: 50%;
      }
    }
    .right {
      i {
        margin-left: 10px;
        &:hover {
          opacity: 0.7;
        }
      }
    }
    .iconfont {
      font-size: 20px;
      color: #fff;
      cursor: pointer;
    }
    .language {
      text-align: right;
      color: #fff;
      font-size: 14px;
      padding-top: 5px;
      &:hover {
        opacity: 0.7;
      }
    }
  }
}
.left-nav {
  overflow: hidden;
  transition: padding-top 0.2s ease 0s,
    width 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0s;
  width: 208px;
  &.collapse-nav {
    width: 64px;
  }
  &.hide-nav {
    width: 0;
  }
}
@media screen and (max-width: 1200px) {
  .left-nav {
    width: 208px;
  }
  .inner_content {
    margin-left: 0;
    &.expand {
      margin-left: 0;
    }
  }
  .nav-mask {
    display: block;
  }
}
</style>
