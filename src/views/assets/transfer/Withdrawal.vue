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
        :errorTip="amountErrorTip"
        :selectedAsset="transferAsset"
        @selectAsset="selectAsset"
        @max="max"
      ></custom-input>
      <div class="fee">
        {{ $t("public.public15") }}
        <span class="el-icon-loading" v-if="!fee"></span>
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
        {{ $t("transfer.transfer11") }}
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

<script>
import { defineComponent } from "vue";
import CustomInput from "@/components/CustomInput.vue";
import AssetsDialog from "@/components/AssetsDialog";
import {
  superLong,
  Minus,
  timesDecimals,
  _networkInfo,
  divisionDecimals,
  Times,
  Plus,
  floatToCeil
} from "@/api/util";
import { NTransfer, ETransfer, getSymbolUSD } from "@/api/api";
import config from "@/config";
export default defineComponent({
  name: "withdrawal",
  inject: ["father"],
  components: {
    CustomInput,
    AssetsDialog
  },
  data() {
    this.timer = null;
    return {
      loading: false,
      assetsList: [],
      amount: "",
      balance: "",
      transferAsset: {},
      amountErrorTip: "",
      fee: 0,
      feeSymbol: "",
      showFeeDialog: false,
      selectedFeeAsset: {}, // 手续费资产信息--L1网络在nerve上的主资产
      supportedFeeAssets: [] // 可充当提现手续费的资产
    };
  },
  watch: {
    amount(val) {
      if (val) {
        this.validateAmount();
      }
    },
    "father.crossInOutSymbol": {
      deep: true,
      handler() {
        this.filterAssets();
        // this.selectAsset(this.father.transferAsset);
        this.balance = this.assetsList.find(
          v => v.assetKey === this.transferAsset.assetKey
        )?.available;
      }
    }
  },
  computed: {
    disableTransfer() {
      return !!(
        !Number(this.amount) ||
        !Number(this.balance) ||
        !Number(this.fee) ||
        this.amountErrorTip ||
        this.father.disableTx
      );
    }
  },
  mounted() {
    // console.log(this.father, "===commontransfer===");
    // console.log(this.$store.state.addressInfo, "===addressInfo===");
    this.filterAssets();
    const { transferAsset, network } = this.father;
    const supportedFeeAssets = [];
    const htgMainAsset = Object.values(config.htgMainAsset);
    this.father.allAssetsList.map(v => {
      htgMainAsset.map(item => {
        if (item.chainId === v.chainId && item.assetId === v.assetId) {
          supportedFeeAssets.push(v);
        }
      });
    });
    this.selectedFeeAsset = config.htgMainAsset[network];
    this.feeSymbol = _networkInfo[network].mainAsset;
    this.supportedFeeAssets = supportedFeeAssets;
    this.selectAsset(transferAsset);
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer);
  },
  methods: {
    filterAssets() {
      // console.log(123465,this.father);
      const chain = _networkInfo[this.father.network];
      if (this.father.disableTx || !chain) return;
      this.assetsList = this.father.crossInOutSymbol.filter(v => {
        return v.heterogeneousList?.filter(item => {
          return item.heterogeneousChainId === chain.chainId;
        });
      });
    },
    selectAsset(asset) {
      if (this.father.disableTx) return;
      this.fee = 0;
      this.amount = "";
      this.balance = "";
      this.heterogeneousInfo = {}; // 异构链信息
      const heterogeneousList = asset.heterogeneousList || [];
      // 目标异构链ID
      const heterogeneousChainId = _networkInfo[this.father.network]?.chainId;
      if (!heterogeneousChainId) return;
      const heterogeneousInfo = heterogeneousList.find(
        v => v.heterogeneousChainId === heterogeneousChainId
      );
      this.heterogeneousInfo = heterogeneousInfo;
      // console.log(heterogeneousInfo, 123456);
      if (heterogeneousInfo) {
        this.transferAsset = asset;
        this.balance = this.transferAsset.available;
        this.heterogeneousInfo = heterogeneousInfo;
        if (this.timer) clearInterval(this.timer);
        this.getCrossOutFee();
        /*this.timer = setInterval(() => {
          this.getCrossOutFee();
        }, 10000);*/
      } else {
        this.transferAsset = {};
      }
    },
    validateAmount() {
      const { chainId, assetId } = this.selectedFeeAsset;
      const L1MainAssetBalance = this.father.allAssetsList.find(v => {
        return v.chainId === chainId && v.assetId === assetId;
      }).available;
      const isL1MainAsset =
        this.transferAsset.chainId === chainId &&
        this.transferAsset.assetId === assetId;
      if (
        !Number(this.balance) ||
        Minus(this.balance, this.amount) < 0 ||
        (isL1MainAsset && Minus(this.balance, Plus(this.amount, this.fee)) < 0)
      ) {
        this.amountErrorTip = this.$t("transfer.transfer15");
      } else if (Minus(L1MainAssetBalance, this.fee) < 0) {
        this.amountErrorTip = this.$t("transfer.transfer18");
      } else {
        this.amountErrorTip = "";
      }
    },
    async changeFeeAsset(asset) {
      this.showFeeDialog = false;
      this.selectedFeeAsset = asset;
      this.feeSymbol = this.selectedFeeAsset.symbol;
      this.fee = 0;
      await this.getCrossOutFee();
      this.validateAmount();
    },
    async getCrossOutFee() {
      const withdrawalChain = this.father.network;
      const feeChain = this.selectedFeeAsset.originNetwork;
      // console.log(feeChain, 465465)
      const { chainId, assetId, decimals } = this.selectedFeeAsset;
      const { isToken } = this.heterogeneousInfo;
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
        const mainAsset = this.supportedFeeAssets.find(
          v => v.symbol === this.heterogeneousInfo.chainName
        );
        const L1MainAssetUSD = await getSymbolUSD({
          chaiId: mainAsset.chaiId,
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
      this.fee = floatToCeil(res, 6);
    },
    max() {
      if (!this.balance || !Number(this.balance)) return;
      const isL1MainAsset =
        this.transferAsset.chainId === this.selectedFeeAsset.chainId &&
        this.transferAsset.assetId === this.selectedFeeAsset.assetId;
      if (isL1MainAsset) {
        if (!this.fee) return;
        if (Minus(this.balance, this.fee).toString() > 0) {
          this.amount = Minus(this.balance, this.fee).toString();
        } else {
          this.amount = this.balance;
        }
      } else {
        this.amount = this.balance;
      }
    },
    async sendTx() {
      this.loading = true;
      try {
        const { chainId, assetId, decimals } = this.transferAsset;
        const { takerAddress, address } = this.father;
        const withdrawalFee = timesDecimals(this.fee, this.selectedFeeAsset.decimals);
        const transferInfo = {
          from: takerAddress,
          assetsChainId: chainId,
          assetsId: assetId,
          amount: timesDecimals(this.amount, decimals),
          fee: 0,
          withdrawalFee,
          fee_asset: {
            chainId: this.selectedFeeAsset.chainId,
            assetId: this.selectedFeeAsset.assetId
          }
        };

        console.log(transferInfo);
        const transfer = new NTransfer({
          chain: "NERVE",
          type: 43
        });
        const inputOuput = await transfer.WithdrawalTransaction(transferInfo);
        // console.log(inputOuput, 456456465)
        const addressInfo = this.$store.state.addressInfo;
        const txData = {
          heterogeneousAddress: address,
          heterogeneousChainId: this.heterogeneousInfo.heterogeneousChainId
        };
        const data = {
          inputs: inputOuput.inputs,
          outputs: inputOuput.outputs,
          txData,
          pub: addressInfo.pub,
          signAddress: address
        };
        const txHex = await transfer.getTxHex(data);
        console.log(txHex, 9999);
        const result = await transfer.broadcastHex(txHex);
        if (result && result.hash) {
          this.amount = "";
          this.$toast(this.$t("transfer.transfer14"));
        } else {
          this.$toast("Broadcast tx failed", {
            type: "error"
          });
        }
      } catch (e) {
        console.log(e, "common-transfer-error");
        this.$toast(e.message || e, {
          type: "error"
        });
      }
      this.loading = false;
    },
    superLong(str, len = 6) {
      return superLong(str, len);
    },
    openUrl(address, network) {
      const { origin } = _networkInfo[network];
      window.open(origin + "/address/" + address);
    }
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
