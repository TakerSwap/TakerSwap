<template>
  <div
    class="cross-in"
    v-loading="loading"
    element-loading-background="rgba(24, 24, 55, 0.8)"
  >
    <div class="title">
      {{ "From " + $store.getters.chain }}
      <span class="click" @click="openUrl(father.address, father.network)">
        {{ superLong(father.address) }}
        <i class="iconfont icon-tiaozhuanlianjie"></i>
      </span>
    </div>
    <div class="transfer-content">
      <custom-input
        v-model:inputVal="amount"
        :label="$t('public.public11')"
        :icon="transferAsset.symbol"
        :assetList="assetsList"
        :balance="balance"
        :errorTip="amountErrorTip"
        :show-amount="false"
        @selectAsset="selectAsset"
        @max="max"
      ></custom-input>
    </div>
    <div class="confirm-wrap">
      <el-button
        type="primary"
        v-if="!needAuth"
        @click="sendTx"
        :disabled="disableTransfer"
      >
        {{
          noEnoughBalance ? $t("transfer.transfer15") : $t("transfer.transfer9")
        }}
      </el-button>
      <el-button
        type="primary"
        v-else
        @click="approveERC20"
        :disabled="father.disableTx"
      >
        {{ $t("transfer.transfer13") }}
      </el-button>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import CustomInput from "@/components/CustomInput.vue";
import { superLong, _networkInfo, Minus } from "@/api/util";
import { ETransfer } from "@/api/api";
export default defineComponent({
  name: "crossIn",
  components: {
    CustomInput
  },
  inject: ["father"],
  watch: {
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
    "father.crossInOutSymbol": {
      deep: true,
      handler() {
        // this.filterAssets();
      }
    }
  },
  data() {
    this.heterogeneousInfo = null; // 异构链信息
    return {
      loading: false,
      transferAsset: {},
      amount: "",
      balance: 0,
      fee: 0,
      needAuth: false, // token资产是否需要授权
      assetsList: [],
      amountErrorTip: "",
      timer: null
    };
  },
  computed: {
    disableTransfer() {
      return !!(
        !Number(this.fee) ||
        !Number(this.amount) ||
        !Number(this.balance) ||
        this.amountErrorTip ||
        this.father.disableTx
      );
    },
    // 余额不足
    noEnoughBalance() {
      if (!Number(this.balance) || !Number(this.amount)) return false;
      return Minus(this.balance, this.amount) < 0;
    }
  },
  mounted() {
    this.transfer = new ETransfer();
    this.filterAssets();
    this.selectAsset(this.father.transferAsset);
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  },
  methods: {
    filterAssets() {
      // console.log(123465,this.father);
      const chain = _networkInfo[this.father.network];
      const mainAsset = chain?.mainAsset;
      if (this.father.disableTx || !chain) return;
      this.assetsList = this.father.crossInOutSymbol
        .filter(v => {
          return v.heterogeneousList?.filter(item => {
            return item.heterogeneousChainId === chain.chainId;
          });
        })
        .map(item => {
          const tempAddress = item.heterogeneousList?.find(
            v => v.heterogeneousChainId === chain.chainId
          )?.contractAddress;
          return {
            ...item,
            contractAddress: tempAddress
          };
        });
      const tempIndex = this.assetsList.findIndex(
        item => item.symbol === mainAsset
      );
      const tempAsset = this.assetsList[tempIndex];
      // 将主资产排序到到第一个
      this.assetsList.splice(tempIndex, 1);
      this.assetsList.unshift(tempAsset);
    },
    async selectAsset(asset) {
      this.transferAsset = asset;
      // console.log(asset, 789654, this.father);
      if (this.timer) clearInterval(this.timer);
      if (this.father.disableTx) return;
      await this.checkAsset(asset);
      this.timer = setInterval(() => {
        this.checkAsset(asset);
      }, 5000);
    },
    // 检查资产是否支持从该异构链转入
    async checkAsset(asset) {
      // const asset = this.transferAsset;
      // this.fee = "";
      // this.amount = "";
      // this.balance = "";
      this.needAuth = false;
      const heterogeneousList = asset.heterogeneousList || [];
      const heterogeneousChainId = _networkInfo[this.father.network]?.chainId;
      if (!heterogeneousChainId) return;
      const heterogeneousInfo = heterogeneousList.find(
        v => v.heterogeneousChainId === heterogeneousChainId
      );
      this.heterogeneousInfo = heterogeneousInfo;
      // console.log(heterogeneousInfo, 123456);
      if (heterogeneousInfo) {
        this.transferAsset = asset;
        if (heterogeneousInfo.isToken) {
          this.getERC20Allowance();
        }
        await this.getGasPrice();
        this.getBalance();
      } else {
        this.transferAsset = {};
      }
    },
    // token资产查询授权额度
    async getERC20Allowance() {
      const { contractAddress, heterogeneousChainMultySignAddress } =
        this.heterogeneousInfo;
      this.needAuth = await this.transfer.getERC20Allowance(
        contractAddress,
        heterogeneousChainMultySignAddress,
        this.father.address
      );
      if (!this.needAuth) {
        this.refreshAuth = false;
      }
      if (this.refreshAuth) {
        setTimeout(() => {
          this.getERC20Allowance();
        }, 5000);
      }
    },
    async getGasPrice() {
      this.fee = await this.transfer.getGasPrice(
        this.heterogeneousInfo.isToken
      );
      // console.log(this.fee, 444);
    },
    async getBalance() {
      if (!this.heterogeneousInfo) return;
      const { contractAddress, isToken } = this.heterogeneousInfo;
      if (isToken) {
        this.balance = await this.transfer.getERC20Balance(
          contractAddress,
          this.transferAsset.decimals,
          this.father.address
        );
      } else {
        this.balance = await this.transfer.getEthBalance(this.father.address);
      }
      // console.log(this.balance, "===balance===");
    },
    superLong(str, len = 6) {
      return superLong(str, len);
    },
    max() {
      if (!this.balance || !Number(this.balance)) return;
      if (this.heterogeneousInfo.isToken) {
        this.amount = this.balance;
      } else {
        if (!this.fee) return;
        this.amount = Minus(this.balance, this.fee).toString();
      }
    },
    async approveERC20() {
      this.loading = true;
      const { contractAddress, heterogeneousChainMultySignAddress } =
        this.heterogeneousInfo;
      try {
        const res = await this.transfer.approveERC20(
          contractAddress,
          heterogeneousChainMultySignAddress,
          this.father.address
        );
        this.handleMsg(res);
        if (res.hash) {
          this.refreshAuth = true;
          this.getERC20Allowance();
        }
      } catch (e) {
        this.$toast(e.message || e, {
          type: "error"
        });
      }
      this.loading = false;
    },
    async sendTx() {
      this.loading = true;
      try {
        const { contractAddress, heterogeneousChainMultySignAddress } =
          this.heterogeneousInfo;
        const params = {
          multySignAddress: heterogeneousChainMultySignAddress,
          nerveAddress: this.father.takerAddress,
          numbers: this.amount,
          fromAddress: this.father.address,
          contractAddress,
          decimals: this.transferAsset.decimals
        };
        // console.log(params);
        const res = await this.transfer.crossIn(params);
        this.handleMsg(res);
      } catch (e) {
        console.log(e, "crossin-transfer-error");
        this.$toast(e.message || e, {
          type: "error"
        });
      }
      this.loading = false;
    },
    handleMsg(data) {
      // console.log(data, 555);
      if (data.hash) {
        this.amount = "";
        this.$toast(this.$t("transfer.transfer14"));
      } else {
        this.$toast(data.message || data, {
          type: "error"
        });
      }
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
.cross-in {
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
    .wrong-net {
      margin-top: 10px;
    }
  }
}
</style>
