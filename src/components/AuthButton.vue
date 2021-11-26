<template>
  <div class="auth-button">
    <slot>
      <el-button
        type="primary"
        v-if="!address"
        @click="showConnectDialog(true)"
      >
        {{ $t("header.header3") }}
      </el-button>
      <el-button v-else type="primary" @click="derivedAddress">
        {{ $t("login.login2") }}
      </el-button>
    </slot>
  </div>
</template>

<script>
import { useStore } from "vuex";
import { useToast } from "vue-toastification";
import useEthereum from "@/hooks/useEthereum";
import { useI18n } from "vue-i18n";
import config from "@/config";
import { watch } from "vue";
import { getCurrentAccount } from "@/utils/util";
import storage from "@/utils/storage";

export default {
  props: {
    label: String
  },
  setup(_, { emit }) {
    const store = useStore();
    const { t } = useI18n();
    const toast = useToast();
    const { address, initProvider, generateAddress } = useEthereum();
    initProvider();
    function showConnectDialog(state) {
      store.commit("changeConnectShow", state);
    }
    watch(
      () => address.value,
      val => {
        if (val) {
          const currentAccount = getCurrentAccount(val);
          store.commit("setCurrentAddress", currentAccount || {});
        }
      },
      {
        deep: true
      }
    );
    async function derivedAddress() {
      let result = false;
      emit("loading", true);
      try {
        if (!address.value) {
          showConnect();
          return;
        }
        const { chainId, assetId, prefix, NULSConfig } = config;
        const account = await generateAddress(
          address.value,
          {
            chainId,
            assetId,
            prefix
          },
          NULSConfig
        );
        const accountList = storage.get("local", "accountList") || [];
        const existIndex = accountList.findIndex(v => v.pub === account.pub);
        // 原来存在就替换，找不到就push
        if (existIndex > -1) {
          accountList[existIndex] = account;
        } else {
          accountList.push(account);
        }
        storage.set("local", "accountList", accountList);
        store.commit("setCurrentAddress", account);
        result = true;
      } catch (e) {
        // console.log(e, 4444)
        toast.error(t("login.login3"));
      }
      emit("loading", false);
      return result;
    }
    function showConnect() {
      store.commit("changeConnectShow", true);
    }
    return {
      showConnectDialog,
      derivedAddress,
      showConnect,
      address
    };
  }
};
</script>

<style lang="scss"></style>
