<template>
  <div
    class="common-transfer"
    v-loading="loading"
    element-loading-background="rgba(24, 24, 55, 0.8)"
  >
    <div class="to-input">
      <el-input
        :placeholder="$t('transfer.transfer6')"
        v-model.trim="toAddress"
      ></el-input>
      <span class="address-error" v-if="addressError">
        {{ $t("transfer.transfer16") }}
      </span>
    </div>
    <div class="transfer-content">
      <custom-input
        v-model:inputVal="amount"
        :label="$t('transfer.transfer19')"
        :icon="transferAsset.symbol"
        :assetList="assetsList"
        :balance="balance"
        :selectedAsset="transferAsset"
        @selectAsset="selectAsset"
        @max="max"
      ></custom-input>
    </div>
    <div class="confirm-wrap">
      <el-button type="primary" @click="sendTx" :disabled="disableTransfer">
        {{ amountErrorTip || $t("transfer.transfer10") }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, inject } from "vue";
import CustomInput from "@/components/CustomInput.vue";
import { Minus, timesDecimals } from "@/utils/util";
import { NTransfer } from "@/utils/api";

import { rootCmpKey, RootComponent, AssetItemType } from "../types";
import { useI18n } from "vue-i18n";
import { useToast } from "vue-toastification";
import useBroadcastNerveHex from "@/hooks/useBroadcastNerveHex";

export default defineComponent({
  name: "commonTransfer",
  inject: ["father"],
  components: {
    CustomInput
  },
  setup() {
    const father = inject(rootCmpKey, {} as RootComponent);
    const { t } = useI18n();
    const toast = useToast();
    const transfer = new NTransfer({
      chain: "NERVE",
      type: 2
    });

    const loading = ref(false);
    const amount = ref("");
    const assetsList = computed(() => father.allAssetsList);

    const transferAsset = ref(father.transferAsset);
    const balance = computed(() => {
      const asset = assetsList.value.find(asset => {
        return asset.assetKey === transferAsset.value.assetKey;
      });
      return asset ? asset.available : "";
    });

    const amountErrorTip = ref("");
    watch(
      () => amount.value,
      val => {
        if (
          !Number(balance.value) ||
          Minus(balance.value, val).toNumber() < 0
        ) {
          amountErrorTip.value = t("transfer.transfer15");
        } else {
          amountErrorTip.value = "";
        }
      }
    );

    const disableTransfer = computed(() => {
      return !!(
        !toAddress.value ||
        !amount.value ||
        !balance.value ||
        addressError.value ||
        amountErrorTip.value
      );
    });

    const toAddress = ref("");
    const addressError = ref(false);
    watch(
      () => toAddress.value,
      val => {
        if (val) {
          addressError.value = !transfer.validateAddress(val);
        }
      }
    );

    function selectAsset(asset: AssetItemType) {
      transferAsset.value = asset;
    }

    function max() {
      amount.value = balance.value;
    }

    const { handleTxInfo } = useBroadcastNerveHex();
    async function sendTx() {
      try {
        loading.value = true;
        const { chainId, assetId, decimals } = transferAsset.value;
        const transferInfo = {
          from: father.takerAddress,
          to: toAddress.value,
          assetsChainId: chainId,
          assetsId: assetId,
          amount: timesDecimals(amount.value, decimals),
          fee: 0
        };
        const result: any = await handleTxInfo(transferInfo, 2, {});
        if (result && result.hash) {
          amount.value = "";
          toAddress.value = "";
          toast.success(t("transfer.transfer14"));
        } else {
          toast.error(t("transfer.transfer23"));
        }
      } catch (e) {
        console.log(e, "common-transfer-error");
        toast.error(e.message || e);
      }
      loading.value = false;
    }

    return {
      loading,
      amount,
      balance,
      amountErrorTip,
      assetsList,
      transferAsset,
      disableTransfer,
      toAddress,
      addressError,
      selectAsset,
      max,
      sendTx
    };
  }
});
</script>

<style lang="scss">
.common-transfer {
  .to-input {
    position: relative;
    .el-input {
      border-color: #e3eeff;
    }
    .el-input__inner {
      border-color: #e3eeff;
      height: 58px;
      line-height: 58px;
    }
    .address-error {
      position: absolute;
      left: 0;
      top: 65px;
      font-size: 13px;
      color: #f56c6c;
    }
  }
  .transfer-content {
    margin: 40px 0 60px;
  }
}
</style>
