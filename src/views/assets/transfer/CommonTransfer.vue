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
        :errorTip="amountErrorTip"
        @selectAsset="selectAsset"
        @max="max"
      ></custom-input>
    </div>
    <div class="confirm-wrap">
      <el-button type="primary" @click="sendTx" :disabled="disableTransfer">
        {{ $t("transfer.transfer10") }}
      </el-button>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import CustomInput from "@/components/CustomInput.vue";
import { Minus, timesDecimals } from "@/utils/util";
import { NTransfer } from "@/utils/api";
export default defineComponent({
  name: "commonTransfer",
  inject: ["father"],
  components: {
    CustomInput
  },
  data() {
    return {
      loading: false,
      assetsList: [],
      amount: "",
      balance: "",
      transferAsset: {},
      toAddress: "",
      addressError: false,
      amountErrorTip: ""
    };
  },
  watch: {
    toAddress(val) {
      if (val) {
        const valid = this.transfer.validateAddress(val);
        this.addressError = !valid;
      }
    },
    amount(val) {
      if (val) {
        /* let decimals = this.transferAsset.decimals || 0;
        let patrn = "";
        if (!decimals) {
          patrn = new RegExp("^([1-9][\\d]{0,20}|0)(\\.[\\d])?$");
        } else {
          patrn = new RegExp(
            "^([1-9][\\d]{0,20}|0)(\\.[\\d]{0," + decimals + "})?$"
          );
        }
        if (!patrn.exec(val)) {
          this.amountErrorTip = this.$t("transfer.transfer17") + decimals;
        } else  */
        if (!Number(this.balance) || Minus(this.balance, this.amount) < 0) {
          this.amountErrorTip = this.$t("transfer.transfer15");
        } else {
          this.amountErrorTip = "";
        }
      }
    },
    "father.allAssetsList": {
      deep: true,
      handler(val) {
        // console.log()
        if (val.length) {
          this.assetsList = [...val];
          this.balance = this.assetsList.find(
            v => v.assetKey === this.transferAsset.assetKey
          )?.available;
        }
      }
    }
  },
  computed: {
    disableTransfer() {
      return !!(
        !this.toAddress ||
        !Number(this.amount) ||
        !Number(this.balance) ||
        this.addressError ||
        this.amountErrorTip
      );
    }
  },
  mounted() {
    this.assetsList = [...this.father.allAssetsList];
    this.selectAsset(this.father.transferAsset);
    /*this.balance = this.assetsList.find(
      v => v.assetKey === this.transferAsset.assetKey
    )?.available;*/
    this.transfer = new NTransfer({
      chain: "NERVE",
      type: 2
    });
  },
  methods: {
    selectAsset(asset) {
      this.transferAsset = asset;
      this.balance = asset.available;
    },
    max() {
      this.amount = this.balance;
    },
    async sendTx() {
      try {
        this.loading = true;
        const { chainId, assetId, decimals } = this.transferAsset;
        const transferInfo = {
          from: this.father.takerAddress,
          to: this.toAddress,
          assetsChainId: chainId,
          assetsId: assetId,
          amount: timesDecimals(this.amount, decimals),
          fee: 0
        };

        console.log(transferInfo);
        const inputOuput = await this.transfer.transferTransaction(
          transferInfo
        );
        // console.log(inputOuput, 456456465)
        const addressInfo = this.$store.state.addressInfo;
        const data = {
          inputs: inputOuput.inputs,
          outputs: inputOuput.outputs,
          txData: {},
          pub: addressInfo.pub,
          signAddress: addressInfo.address.Ethereum
        };
        const txHex = await this.transfer.getTxHex(data);

        const result = await this.transfer.broadcastHex(txHex);
        if (result && result.hash) {
          this.amount = "";
          this.toAddress = "";
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
    }
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
