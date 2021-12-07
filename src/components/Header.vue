<template>
  <div class="header">
    <div class="left">
      <div>
        <i
          :class="[
            'iconfont',
            'click',
            'toggle-menu',
            isCollapse ? 'icon-dieqi' : 'icon-zhankai'
          ]"
          @click="isCollapse = !isCollapse"
        ></i>
      </div>
      <div class="logo" @click="toUrl('home')">
        <!-- <img class="pc-mobile" src="./../assets/TakerSwap.svg" alt="" /> -->
        <img class="pc-mobile" src="./../assets/logo-beta.svg" alt="" />
        <img class="mobile-logo" src="./../assets/s-logo.png" alt="" />
      </div>
    </div>
    <div class="account-wrap">
      <div class="asset-icon" v-if="address">
        <img v-if="takerAddress" src="../assets/img/wallet.svg" alt="" @click="toAsset" />
        <auth-button ref="authRef" v-else>
          <img src="../assets/img/wallet.svg" alt="" @click="derivedAddress" />
        </auth-button>
      </div>
      <div class="account">
        <div
          class="connection"
          v-if="!address"
          @click="showConnectDialog(true)"
        >
          {{ $t("header.header3") }}
        </div>
        <div class="address-wrap" v-else>
          <SwitchChain
            v-model="showSwitchChain"
            :chainId="chainId"
          >
            <template v-if="wrongChain">
              <p class="wrong-chain" @click="showSwitchChain = true">{{ $t("public.public18") }}</p>
            </template>
            <template v-else>
              <div class="chain-wrap" @click="showSwitchChain = true">
                <img :src="chainLogo" alt="" />
                <el-icon style="margin-right: 5px"><caret-bottom /></el-icon>
                <span @click.stop="manageAccount = true">
                  {{ superLong(address, 5) }}
                </span>
              </div>
            </template>
          </SwitchChain>
        </div>
      </div>
    </div>
    <div class="custom-overlay">
      <el-dialog
        title="Connect to a wallet"
        custom-class="connect-dialog"
        :show-close="false"
        v-model="showConnect"
        @closed="showConnectDialog(false)"
      >
        <div class="list">
          <div
            class="connect-btn"
            v-for="(item, index) in providerList"
            :key="index"
            @click="connectProvider(item.provider)"
          >
            {{ item.name }}
            <img class="fr" :src="item.src" alt="" />
          </div>
        </div>
      </el-dialog>
    </div>
    <div class="custom-overlay">
      <el-dialog
        :title="$t('public.public6')"
        custom-class="account-manage"
        :show-close="false"
        v-model="manageAccount"
      >
        <div class="content">
          <div class="top">
            <p>
              <span class="pc">{{ superLong(address, 8) }}</span>
              <span class="mobile">{{ superLong(address, 7) }}</span>
            </p>
            <p>
              <span @click="$copy(address)">
                <i class="iconfont icon-fuzhi"></i>
              </span>
              <span @click="openUrl">
                <i class="iconfont icon-tiaozhuanlianjie"></i>
              </span>
            </p>
          </div>
          <div class="bottom tc">
            <el-button type="primary" @click="disconnectProvider">
              {{ $t("public.public7") }}
            </el-button>
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from "vue";
import {
  superLong,
  getCurrentAccount,
  isNULSOrNERVE
} from "@/utils/util";
import useEthereum, { providerList } from "@/hooks/useEthereum";
import { useRouter, useRoute } from "vue-router";
import { useStore } from "vuex";
import AuthButton from "./AuthButton.vue";
import SwitchChain from "./SwitchChain.vue";
import useStoreState from "@/hooks/useStoreState";
import { _networkInfo } from "@/utils/heterogeneousChainConfig";

export default defineComponent({
  name: "Header",
  components: {
    AuthButton,
    SwitchChain
  },
  props: {
    collapseMenu: Boolean
  },
  setup(props, context) {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    // console.log(store, 66);
    // const showConnect = store.state.showConnect;
    const { address, chainId, initProvider, connect, disconnect } =
      useEthereum();
    const { takerAddress, wrongChain: notL1Chain } = useStoreState();
    initProvider();
    watch(
      () => address.value,
      val => {
        if (val) {
          const currentAccount = getCurrentAccount(val);
          store.commit("setCurrentAddress", currentAccount || {});
        }
      },
      {
        immediate: true
      }
    );
    watch(
      () => chainId.value,
      val => {
        if (val) {
          store.commit("changeChainId", val);
        }
      },
      {
        immediate: true
      }
    );
    const isCollapse = computed({
      get() {
        return props.collapseMenu;
      },
      set(val: boolean) {
        context.emit("update:collapseMenu", val);
      }
    });
    // console.log(address, 456);
    const manageAccount = ref(false);
    const showConnect = computed(() => store.state.showConnect);
    function showConnectDialog(state: boolean) {
      store.commit("changeConnectShow", state);
    }
    async function connectProvider(provider: string) {
      try {
        await connect(provider);
      } catch (e) {
        //
      }
      store.commit("changeConnectShow", false);
    }
    function disconnectProvider() {
      disconnect();
      manageAccount.value = false;
      store.commit("setCurrentAddress", {});
    }

    const activeIndex = ref("");
    watch(
      () => route.path,
      val => {
        activeIndex.value = val?.split("/")[1];
      }
    );
    function toAsset() {
      router.push({
        name: "assets"
      });
    }
    function openUrl() {
      const network = store.getters.chain;
      const { origin } = _networkInfo[network];
      window.open(origin + "/address/" + address.value);
    }

    const wrongChain = computed(() => {
      const NULSOrNERVE = address.value && isNULSOrNERVE(address.value);
      if (NULSOrNERVE) {
        return false;
      } else {
        return notL1Chain.value;
      }
    });

    const authRef = ref<InstanceType<typeof AuthButton>>();
    async function derivedAddress() {
      // @ts-ignore
      const result = await authRef.value.derivedAddress();
      if (result) {
        toAsset();
      }
    }

    const chainLogo = computed(() => {
      const network = store.getters.chain;
      // console.log(network, 666)
      const { logo } = _networkInfo[network];
      return logo;
    });

    const showSwitchChain = ref(false);

    return {
      address,
      showConnect,
      showConnectDialog,
      providerList,
      connectProvider,
      disconnectProvider,
      manageAccount,
      activeIndex,
      toAsset,
      openUrl,
      takerAddress,
      isCollapse,
      wrongChain,
      authRef,
      derivedAddress,
      chainLogo,
      showSwitchChain,
      chainId
    };
  },
  data() {
    return {
      account: ""
      // activeIndex: "home",
    };
  },
  mounted() {},
  methods: {
    handleSelect(key: string) {
      this.toUrl(key);
    },

    superLong(str: string, len = 9) {
      return superLong(str, len);
    },

    toUrl(name: string, url = "") {
      if (url) {
        window.open(url);
      } else {
        this.$router.push({ name: name });
      }
    }
  }
});
</script>

<style lang="scss">
@import "../assets/css/style.scss";
.header {
  position: fixed;
  z-index: 20;
  width: 100%;
  top: 0;
  left: 0;
  height: 64px;
  padding: 0 16px 0 8px;
  //background: #4a5ff2;
  background: $BgColor;
  border-bottom: 2px solid $navBorder;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .left {
    flex: 1;
    display: flex;
    align-items: center;
    .toggle-menu {
      font-size: 20px;
      color: #fff;
      margin: 0 20px;
    }
  }
  .logo {
    // width: 160px;
    width: 240px;
    cursor: pointer;
    img {
      width: 100%;
    }
    .pc-mobile {
    }
    .mobile-logo {
      display: none;
    }
  }
  .account-wrap {
    display: flex;
    align-items: center;
    .asset-icon {
      height: 30px;
      width: 32.5px;
      img {
        cursor: pointer;
        height: 100%;
        width: 100%;
      }
    }
  }
  .account {
    width: 170px;
    height: 36px;
    margin-left: 30px;
    //background: #fff;
    background-color: $btnColor;
    border-radius: 18px;
    font-size: 15px;
    cursor: pointer;
    color: $txColor;
    line-height: 36px;
    text-align: center;
    .address-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 10px 0 5px;
      height: 100%;
      //line-height: 1;
      position: relative;
      .switch-chain-wrapper {
        width: 100%;
      }
      .wrong-chain {
        color: red;
        font-size: 14px;
      }
      .chain-wrap {
        display: flex;
        align-items: center;
        position: relative;
      }
      img {
        width: 28px;
        cursor: pointer;
      }
      span {
        cursor: pointer;
        font-size: 14px;
        height: 100%;
        &:hover {
          opacity: 0.6;
        }
      }
    }
  }
  .connect-dialog {
    max-width: 470px !important;
    .el-dialog__body {
      padding: 0;
      .list {
        padding: 0 25px 25px;
        .connect-btn {
          height: 50px;
          line-height: 50px;
          font-size: 14px;
          font-weight: 600;
          padding: 0 15px;
          margin-bottom: 15px;
          border-radius: 15px;
          //background: rgb(239, 244, 245);
          background: $btnColor;
          cursor: pointer;
          &:hover {
            opacity: 0.64;
          }
          img {
            margin-top: 7px;
            width: 35px;
            height: 35px;
          }
        }
      }
    }
  }
  .account-manage {
    max-width: 470px;
    .el-dialog__header {
      text-align: center;
    }
    .content {
      /* display: ; */
      .top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 10px;
        span {
          font-size: 24px;
          color: $txColor;
        }
        i {
          color: $linkColor;
          font-size: 32px;
          cursor: pointer;
          margin-left: 20px;
          &.icon-tiaozhuanlianjie {
            font-size: 30px;
          }
        }
      }
      .bottom {
        padding: 40px 0 20px;
        .el-button {
          width: 185px;
          height: 48px;
          border-radius: 15px;
          border: none;
        }
      }
    }
  }
  @media screen and (max-width: 500px) {
    .left {
      .toggle-menu {
        font-size: 18px;
        margin: 0 15px 0 10px;
      }
    }
    .logo {
      width: 28px;
      border-radius: 50%;
      .pc-mobile {
        display: none;
      }
      .mobile-logo {
        display: block;
      }
    }
    .account {
      margin-left: 15px;
    }
    .connect-dialog {
      //max-width: 470px !important;
      .el-dialog__body {
        .list {
          padding: 0 25px 20px;
          .connect-btn {
            height: 45px;
            line-height: 45px;
            margin-bottom: 10px;
            border-radius: 10px;
            img {
              width: 30px;
              height: 30px;
            }
          }
        }
      }
    }
    .account-manage {
      .content .top span {
        font-size: 22px;
        i {
          font-size: 24px;
          &.icon-tiaozhuanlianjie {
            font-size: 22px;
          }
        }
      }
      .content {
        .bottom {
          padding: 30px 0 0;
          .el-button {
            height: 36px;
          }
        }
      }
    }
  }
}

.el-popup-parent--hidden {
  padding: 0 !important;
}
@media screen and (max-width: 1200px) {
  /*.header .account-manage {
    max-width: 470px !important;
    min-width: 300px;
    .content .top span {
      font-size: 22px;
      i {
        font-size: 28px;
      }
    }
  }*/
  /*.w1300 {
    height: auto;
    margin: 0;
    width: 100%;
    padding: 20px 20px 30px 20px;
  }*/
}

@media screen and (max-width: 610px) {
  .header .account-wrap .asset-icon i {
    font-size: 20px;
  }
}
</style>
