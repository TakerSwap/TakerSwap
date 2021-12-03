<template>
  <div
    class="cross-out"
    v-loading="loading"
    element-loading-background="rgba(24, 24, 55, 0.8)"
  >
    <div class="title">
      {{ "To " + $store.getters.chain }}
      <span class="click" @click="openUrl(father.address, father.network)">
        {{ superLong(father.address) }}
        <i class="iconfont icon-tiaozhuanlianjie"></i>
      </span>
    </div>
    <div class="transfer-content">
      <custom-input
        v-model:inputVal="amount"
        :label="$t('transfer.transfer20')"
        :icon="transferAsset.symbol"
        :assetList="assetsList"
        :balance="balance"
        :selectedAsset="transferAsset"
        @selectAsset="selectAsset"
        @max="max"
      ></custom-input>
      <div class="fee">
        {{ $t("public.public15") }}
        <el-icon class="is-loading" v-if="!fee">
          <loading />
        </el-icon>
        <span v-else>{{ fee + " " + feeSymbol }}</span>
        <span
          class="link"
          style="margin-left: 10px"
          @click="showFeeDialog = true"
        >
          {{ $t("transfer.transfer22") }}
        </span>
      </div>
    </div>
    <div class="confirm-wrap">
      <el-button type="primary" @click="sendTx" :disabled="disableTransfer">
        {{ amountErrorTip || $t("transfer.transfer11") }}
      </el-button>
    </div>
    <AssetsDialog
      v-model:showDialog="showFeeDialog"
      hideSearchInput
      :assetList="supportedFeeAssets"
      :showBalance="true"
      :showAmount="true"
      :selectedAsset="selectedFeeAsset"
      @changeSelect="changeFeeAsset"
    ></AssetsDialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, inject, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useToast } from "vue-toastification";
import CustomInput from "@/components/CustomInput.vue";
import AssetsDialog from "@/components/AssetsDialog.vue";
import {
  superLong,
  Minus,
  timesDecimals,
  _networkInfo,
  Plus,
  floatToCeil
} from "@/utils/util";
// @ts-ignore
import { NTransfer, ETransfer, getSymbolUSD } from "@/utils/api";
import config from "@/config";
import useBroadcastNerveHex from "@/hooks/useBroadcastNerveHex";

import { rootCmpKey, RootComponent, AssetItemType } from "../types";
import {HeterogeneousInfo} from "@/store/types";

export default defineComponent({
  name: "withdrawal",
  components: {
    CustomInput,
    AssetsDialog
  },
  setup() {
    const father = inject(rootCmpKey, {} as RootComponent);
    const { t } = useI18n();
    const toast = useToast();

    const loading = ref(false);
    const amount = ref("");

    const assetsList = computed<AssetItemType[]>(() => {
      const chain = _networkInfo[father.network];
      return father.crossInOutSymbol.filter(v => {
        return v.heterogeneousList?.filter(item => {
          return item.heterogeneousChainId === chain.chainId;
        });
      });
    });

    const transferAsset = ref(father.transferAsset);
    const balance = computed(() => {
      const asset = assetsList.value.find(asset => {
        return asset.assetKey === transferAsset.value.assetKey;
      });
      return asset ? asset.available : "";
    });

    const fee = ref("");
    const amountErrorTip = ref("");
    const disableTransfer = computed(() => {
      return !!(
        !fee.value ||
        !amount.value ||
        !balance.value ||
        amountErrorTip.value ||
        father.disableTx
      );
    });
    const feeSymbol = ref("");
    const showFeeDialog = ref(false);

    const selectedFeeAsset = ref<AssetItemType>({} as AssetItemType); // 手续费资产信息--L1网络在nerve上的主资产
    const supportedFeeAssets = ref<AssetItemType[]>([]); // 可充当提现手续费的资产

    onMounted(() => {
      if (father.disableTx) return;
      getFeeAssetInfo();
      selectAsset(transferAsset.value);
    });

    function getFeeAssetInfo() {
      const { network } = father;
      const feeAssets: AssetItemType[] = [];
      const htgMainAsset = Object.values(config.htgMainAsset);
      father.allAssetsList.map(v => {
        htgMainAsset.map(item => {
          if (item.chainId === v.chainId && item.assetId === v.assetId) {
            feeAssets.push(v);
          }
        });
      });
      const defaultFeeAsset = config.htgMainAsset[network];
      selectedFeeAsset.value = father.allAssetsList.find(asset => {
        return (
          asset.chainId === defaultFeeAsset.chainId &&
          asset.assetId === defaultFeeAsset.assetId
        );
      }) as AssetItemType;
      feeSymbol.value = _networkInfo[network].mainAsset;
      supportedFeeAssets.value = feeAssets;
    }

    // 手续费与交易资产是否是同一个资产
    const FeeAsset_TransferAsset_IsSame = computed(() => {
      // if (!selectedFeeAsset.value || !transferAsset.value) return false;
      return (
        selectedFeeAsset.value.chainId === transferAsset.value.chainId &&
        selectedFeeAsset.value.assetId === transferAsset.value.assetId
      );
    });

    let heterogeneousInfo: HeterogeneousInfo; // 异构链信息
    // 选择交易资产
    function selectAsset(asset: AssetItemType) {
      fee.value = "";
      amount.value = "";
      const heterogeneousList = asset.heterogeneousList || [];
      // 目标异构链ID
      const heterogeneousChainId = _networkInfo[father.network]?.chainId;
      if (!heterogeneousChainId) return;
      heterogeneousInfo = heterogeneousList.find(
        v => v.heterogeneousChainId === heterogeneousChainId
      ) as HeterogeneousInfo;

      if (heterogeneousInfo) {
        transferAsset.value = asset;
        getCrossOutFee();
      } else {
        transferAsset.value = {} as AssetItemType;
      }
    }

    async function getCrossOutFee() {
      const withdrawalChain = father.network;
      const {
        chainId,
        assetId,
        decimals,
        originNetwork: feeChain
      } = selectedFeeAsset.value;
      const { isToken } = heterogeneousInfo;
      const feeIsNVT = chainId === config.chainId && assetId === config.assetId;
      const transfer = new ETransfer(withdrawalChain);
      let res = "";
      if (feeChain === withdrawalChain) {
        // 手续费资产为L1网络主资产
        if (withdrawalChain === "TRON") {
          res = transfer.calWithdrawalFeeForTRON("", "", decimals, true);
        } else {
          res = await transfer.calWithdrawalFee(
            "",
            "",
            isToken,
            decimals,
            true
          );
        }
      } else {
        const feeAssetUSD = await getSymbolUSD({
          chainId,
          assetId
        });
        const mainAsset = supportedFeeAssets.value.find(
          v => v.symbol === heterogeneousInfo.chainName
        ) as AssetItemType;
        const L1MainAssetUSD = await getSymbolUSD({
          chainId: mainAsset.chainId,
          assetId: mainAsset.assetId
        });
        if (withdrawalChain === "TRON") {
          res = transfer.calWithdrawalFeeForTRON(
            L1MainAssetUSD,
            feeAssetUSD,
            decimals,
            false,
            feeIsNVT
          );
        } else {
          res = await transfer.calWithdrawalFee(
            L1MainAssetUSD,
            feeAssetUSD,
            isToken,
            decimals,
            false,
            feeIsNVT,
            feeChain === "TRON"
          );
        }
      }
      fee.value = floatToCeil(res, 6);
    }
    async function changeFeeAsset(asset: AssetItemType) {
      showFeeDialog.value = false;
      selectedFeeAsset.value = asset;
      feeSymbol.value = asset.symbol;
      fee.value = "";
      await getCrossOutFee();
      validateAmount();
    }

    function validateAmount() {
      const { available } = selectedFeeAsset.value;
      if (
        !Number(balance.value) ||
        Minus(balance.value, amount.value).toNumber() < 0 ||
        (FeeAsset_TransferAsset_IsSame.value &&
          Minus(balance.value, Plus(amount.value, fee.value)).toNumber() < 0)
      ) {
        amountErrorTip.value = t("transfer.transfer15");
      } else if (Minus(available, fee.value).toNumber() < 0) {
        amountErrorTip.value = t("transfer.transfer18");
      } else {
        amountErrorTip.value = "";
      }
    }

    watch(
      () => amount.value,
      val => {
        if (val) {
          validateAmount();
        }
      }
    );

    function max() {
      if (!balance.value || !Number(balance.value)) return;
      if (FeeAsset_TransferAsset_IsSame.value) {
        if (!fee.value) return;
        if (Minus(balance.value, fee.value).toNumber() > 0) {
          amount.value = Minus(balance.value, fee.value).toString();
        } else {
          amount.value = balance.value;
        }
      } else {
        amount.value = balance.value;
      }
    }

    const { handleTxInfo } = useBroadcastNerveHex();
    async function sendTx() {
      loading.value = true;
      try {
        const { chainId, assetId, decimals } = transferAsset.value;
        const { takerAddress, address } = father;
        const {
          chainId: feeChainId,
          assetId: feeAssetId,
          decimals: feeDecimals
        } = selectedFeeAsset.value;
        const transferInfo = {
          from: takerAddress,
          assetsChainId: chainId,
          assetsId: assetId,
          amount: timesDecimals(amount.value, decimals),
          fee: 0,
          withdrawalFee: timesDecimals(fee.value, feeDecimals),
          fee_asset: {
            chainId: feeChainId,
            assetId: feeAssetId
          }
        };
        console.log(transferInfo, "===transferInfo===");
        const txData = {
          heterogeneousAddress: address,
          heterogeneousChainId: heterogeneousInfo.heterogeneousChainId
        };
        const result: any = await handleTxInfo(transferInfo, 43, txData);
        if (result && result.hash) {
          amount.value = "";
          toast.success(t("transfer.transfer14"));
        } else {
          toast.error(t("transfer.transfer23"));
        }
      } catch (e) {
        console.log(e, "withdrawal-error");
        toast.error(e.message || e);
      }
      loading.value = false;
    }
    function openUrl(address: string, network: string) {
      const { origin } = _networkInfo[network];
      window.open(origin + "/address/" + address);
    }

    return {
      father,
      loading,
      amount,
      balance,
      fee,
      amountErrorTip,
      disableTransfer,
      assetsList,
      transferAsset,
      feeSymbol,
      showFeeDialog,
      selectedFeeAsset,
      supportedFeeAssets,
      selectAsset,
      changeFeeAsset,
      max,
      sendTx,
      superLong: (str: string, len = 6) => superLong(str, len),
      openUrl
    };
  }
});
</script>

<style lang="scss" scoped>
@import "../../../assets/css/style.scss";
.cross-out {
  .title {
    font-size: 18px;
    color: $labelColor;
    span {
      color: $linkColor;
    }
  }
  .transfer-content {
    margin: 35px 0 60px;
  }
  .fee {
    color: #7e87c2;
    font-size: 14px;
    margin-top: 20px;
  }
  .wrong-net {
    margin-top: 10px;
  }
  @media screen and (max-width: 500px) {
    .title {
      font-size: 16px;
    }
    .transfer-content {
      margin: 35px 0 50px;
    }
  }
}
</style>
