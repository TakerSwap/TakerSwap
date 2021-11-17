<template>
  <div class="w1300">
    <div
      class="login"
      v-loading="loading"
      element-loading-background="transparent"
    >
      <div class="content">
        <div class="confirm-wrap" v-if="!address">
          <el-button type="primary" @click="showConnect">
            {{ $t("login.login4") }}
          </el-button>
        </div>
        <template v-else>
          <h3>{{ $t("login.login1") }}</h3>
          <div class="confirm-wrap">
            <el-button type="primary" @click="derivedAddress">
              {{ $t("login.login2") }}
            </el-button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import nerve from "nerve-sdk-js";
import useEthereum, { getProvider } from "@/hooks/useEthereum";
import config from "@/config";
import { useStore } from "vuex";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { useToast } from "vue-toastification";

const ethers = require("ethers");

export default defineComponent({
  setup() {
    const loading = ref(false);
    const { address, initProvider } = useEthereum();
    initProvider();
    const store = useStore();
    const { t } = useI18n();
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    // console.log(444, route, route.redirectedFrom, route.fullPath);
    async function derivedAddress() {
      loading.value = true;
      try {
        if (!address.value) {
          showConnect();
          loading.value = false;
          return;
        }
        const provider = getProvider();
        const EProvider = new ethers.providers.Web3Provider(provider);
        const jsonRpcSigner = EProvider.getSigner();
        let message = "Generate Taker address";
        const signature = await jsonRpcSigner.signMessage(message);
        const msgHash = ethers.utils.hashMessage(message);
        const msgHashBytes = ethers.utils.arrayify(msgHash);
        const recoveredPubKey = ethers.utils.recoverPublicKey(
          msgHashBytes,
          signature
        );

        const account = {
          address: {
            Ethereum: address.value,
            BSC: address.value,
            Heco: address.value,
            OKExChain: address.value
          }
        };
        if (recoveredPubKey.startsWith("0x04")) {
          const compressPub = ethers.utils.computePublicKey(
            recoveredPubKey,
            true
          );
          const pub = compressPub.slice(2);
          account.pub = pub;
          // account.selected = true;
          const { chainId, assetId = 1, prefix } = config;
          account.address.Taker = nerve.getAddressByPub(
            chainId,
            assetId,
            pub,
            prefix
          );
          const accountList =
            JSON.parse(localStorage.getItem("accountList")) || [];
          const existIndex = accountList.findIndex(v => v.pub === account.pub);
          // 原来存在就替换，找不到就push
          if (existIndex > -1) {
            accountList[existIndex] = account;
          } else {
            accountList.push(account);
          }
          localStorage.setItem("accountList", JSON.stringify(accountList));
          store.commit("setCurrentAddress", account);
          const fromPath = route.redirectedFrom?.fullPath || "/";
          router.push(fromPath);
        }
      } catch (e) {
        toast.error(t("login.login3"));
      }
      loading.value = false;
    }
    function showConnect() {
      store.commit("changeConnectShow", true);
    }
    return {
      address,
      showConnect,
      derivedAddress
    };
  }
});
</script>

<style lang="scss" scoped>
.login {
  max-width: 450px;
  margin: 0 auto 0;
  background: #fff;
  height: 500px;
  border-radius: 20px;
  padding-top: 100px;
  .content {
    max-width: 300px;
    margin: 0 auto;
    text-align: center;
    h3 {
      margin: 50px 0;
    }
  }
  @media screen and (max-width: 375px) {
    .confirm-wrap {
      .el-button {
        max-width: 200px;
      }
    }
  }
}
</style>
