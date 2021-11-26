<template>
  <div class="farm-details">
    <div class="pc-cont">
      <div class="getLp">
        <p
          class="click"
          @click="toAddLiquidity"
          v-if="isTaker && tokenInfo.name"
        >
          {{ $t("farm.farm7") + " " + tokenInfo.name }}
          {{ !isPool ? " LP" : "" }}
          <i class=""></i>
        </p>
        <!--        <p class="click">
          {{ $t("farm.farm8") }}
          <i class=""></i>
        </p>-->
      </div>
      <div class="biaoge">
        <div class="gain">
          <div class="left">
            <div class="info-title">
              {{ tokenInfo.syrupTokenSymbol }}{{ $t("farm.farm2") }}
            </div>
            <el-tooltip placement="top">
              <template #content>
                {{ $thousands(tokenInfo.pendingReward) }}
              </template>
              <p class="ellipsis">{{ $thousands(tokenInfo.pendingReward) }}</p>
            </el-tooltip>
            <!--            <p class="ellipsis">{{ $thousands(tokenInfo.pendingReward) }}</p>-->
            <span>≈${{ $thousands(tokenInfo.pendingRewardUSD) }}</span>
          </div>
          <div class="right">
            <el-button
              class="btns"
              type="primary"
              size="small"
              @click="gether"
              :disabled="!Number(tokenInfo.pendingReward) || !takerAddress"
            >
              {{ $t("farm.farm21") }}
            </el-button>
          </div>
        </div>
        <div class="alter">
          <div class="left">
            <div class="info-title">{{ $t("farm.farm9") }}LP</div>
            <el-tooltip placement="top">
              <template #content>
                {{ $thousands(tokenInfo.stakeAmount) }}
              </template>
              <p class="ellipsis">{{ $thousands(tokenInfo.stakeAmount) }}</p>
            </el-tooltip>
            <!--            <p class="ellipsis">{{ $thousands(tokenInfo.stakeAmount) }}</p>-->
            <span>≈${{ $thousands(tokenInfo.stakeUSD) }}</span>
          </div>
          <div class="right">
            <template v-if="needAuth">
              <el-button
                class="btns auth-btn"
                type="primary"
                size="small"
                @click="authToken"
              >
                {{ $t("transfer.transfer13") }}
              </el-button>
            </template>
            <template v-else>
              <el-button
                class="btns"
                type="primary"
                size="small"
                :disabled="
                  !Number(tokenInfo.stakeAmount) ||
                  !Number(tokenInfo.pendingReward) ||
                  !takerAddress ||
                  (!tokenInfo.isLocked && isTaker)
                "
                @click="handleLP(LpDialogType.Minus)"
              >
                <el-icon><minus /></el-icon>
              </el-button>
              <el-button
                class="btns"
                type="primary"
                size="small"
                :disabled="
                  !!!Number(tokenInfo.syrupTokenBalance) || !takerAddress
                "
                @click="handleLP(LpDialogType.Add)"
              >
                <el-icon><plus /></el-icon>
              </el-button>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div class="mobile-cont">
      <div class="option-cont">
        <div class="text-90">
          {{ $t("farm.farm23") }}{{ tokenInfo.syrupTokenSymbol }}
        </div>
        <div class="d-flex align-items-center space-between">
          <div class="count-cont">
            {{ $thousands(tokenInfo.pendingReward) }}
            <br />
            <span>≈${{ $thousands(tokenInfo.pendingRewardUSD) }}</span>
          </div>
          <div
            class="btn"
            @click="gether"
            :class="{
              btn_disabled: !!!Number(tokenInfo.pendingReward) || !takerAddress
            }"
          >
            {{ $t("farm.farm21") }}
          </div>
        </div>
      </div>
      <div class="option-cont mt-15">
        <div class="text-90">{{ $t("farm.farm9") }} LP</div>
        <div class="d-flex align-items-center space-between mt-15">
          <div class="count-cont">{{ $thousands(tokenInfo.stakeAmount) }}</div>
          <div class="btn-group">
            <template v-if="needAuth">
              <el-button
                class="btns auth-btn"
                type="primary"
                size="small"
                @click="authToken"
              >
                {{ $t("transfer.transfer13") }}
              </el-button>
            </template>
            <template v-else>
              <el-button
                class="btns"
                type="primary"
                size="small"
                :disabled="
                  !Number(tokenInfo.stakeAmount) ||
                  !Number(tokenInfo.pendingReward) ||
                  !takerAddress ||
                  (!tokenInfo.isLocked && isTaker)
                "
                @click="handleLP(LpDialogType.Minus)"
              >
                <el-icon><minus /></el-icon>
              </el-button>
              <el-button
                class="btns"
                type="primary"
                size="small"
                :disabled="
                  !!!Number(tokenInfo.syrupTokenBalance) || !takerAddress
                "
                @click="handleLP(LpDialogType.Add)"
              >
                <el-icon><plus /></el-icon>
              </el-button>
            </template>
          </div>
        </div>
      </div>
      <div class="d-flex align-items-center space-between mt-8 size-14">
        <span class="text-7e">{{ $t("farm.farm4") }}</span>
        <span>
          {{
            Number(tokenInfo.tatalStakeTokenUSD)
              ? $thousands(tokenInfo.tatalStakeTokenUSD)
              : "--"
          }}
        </span>
      </div>
      <div class="d-flex align-items-center space-between mt-8 size-14">
        <span class="text-7e">{{ $t("farm.farm5") }}</span>
        <span>
          {{ $thousands(tokenInfo.syrupTokenBalance) }}
          {{ tokenInfo.syrupTokenSymbol }}
        </span>
      </div>
      <div
        class="text-4a mt-8"
        @click="toAddLiquidity"
        v-if="isTaker && tokenInfo.name"
      >
        {{ $t("farm.farm7") + " " + tokenInfo.name + " Lp" }}
      </div>
      <!--      <div class="text-4a mt-8">{{ $t("farm.farm8") }}</div>-->
    </div>
    <lp-dialog
      v-model:showLPDialog="dialogAddOrMinus"
      :loading="loading"
      :balance="balance"
      :addOrMinus="addOrMinus"
      :lpName="tokenInfo.name"
      :decimal="tokenInfo.stakeTokenDecimals"
      @confirm="confirmAddOrMinus"
    ></lp-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, PropType } from "vue";
import { useToast } from "vue-toastification";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import LpDialog from "@/components/LpDialog.vue";
import { txAbi } from "@/contractConfig/contractConfig";
import useContractAddress from "@/views/farm/hooks/useContractAddress";
import useStoreState from "@/hooks/useStoreState";
import useBroadcastNerveHex from "@/hooks/useBroadcastNerveHex";
import { ethers } from "ethers";
import { getAssetBalance } from "@/service/api";
import nerve from "nerve-sdk-js";
// @ts-ignore
import { ETransfer } from "@/utils/api";
import { timesDecimals, divisionDecimals, isBeta } from "@/utils/util";
import config from "@/config";

import { UniFarmItem, TakerFarmItem, LpOperate, LpDialogType } from "./types";

export default defineComponent({
  name: "details-bar",
  components: {
    LpDialog
  },
  props: {
    tokenInfo: {
      type: Object as PropType<TakerFarmItem | UniFarmItem>,
      default: () => {}
    },
    showId: {
      type: Boolean,
      default: false
    },
    isTaker: Boolean,
    takerAddress: String,
    isPool: Boolean
  },
  emits: ["loading"],
  setup(props, { emit }) {
    const router = useRouter();
    const route = useRoute();
    const { t } = useI18n();
    const toast = useToast();
    const dialogAddOrMinus = ref(false);
    const addOrMinus = ref<LpDialogType>(LpDialogType.Add);
    const loading = ref(false);
    const needAuth = ref(true);
    const refreshAuth = ref(false);
    const { addressInfo } = useStoreState();
    const balance = ref("0");
    const contractAddress = useContractAddress().value;
    onMounted(() => {
      // console.log(props.tokenInfo, 9696);
      getERC20Allowance();
    });
    async function getERC20Allowance() {
      if (props.isTaker) {
        needAuth.value = false;
      } else {
        const transfer = new ETransfer();
        const tokenInfo = props.tokenInfo as UniFarmItem;
        needAuth.value = await transfer.getERC20Allowance(
          tokenInfo.lpToken,
          contractAddress,
          addressInfo.value?.address?.Ethereum
        );
        if (!needAuth.value) {
          refreshAuth.value = false;
        }
        if (refreshAuth.value) {
          setTimeout(() => {
            getERC20Allowance();
          }, 5000);
        }
      }
    }

    // 授权token
    async function authToken() {
      emit("loading", true);
      try {
        const transfer = new ETransfer();
        const tokenInfo = props.tokenInfo as UniFarmItem;
        const res = await transfer.approveERC20(
          tokenInfo.lpToken,
          contractAddress,
          addressInfo.value?.address?.Ethereum
        );
        if (res.hash) {
          toast.success(t("transfer.transfer14"));
          refreshAuth.value = true;
          getERC20Allowance();
        } else {
          toast.error(res.message || res);
        }
      } catch (e) {
        toast.error(e.message || e);
      }
      emit("loading", false);
    }

    // claim
    async function gether() {
      emit("loading", true);
      if (props.isTaker) {
        await farmStake("0");
      } else {
        await LPOperation(LpOperate.Claim, "0");
      }
      emit("loading", false);
    }

    // 收取收益(number = 0) / 增加LP
    async function farmStake(number: string) {
      try {
        const tokenInfo = props.tokenInfo as TakerFarmItem;
        const { stakeTokenChainId, stakeTokenAssetId, stakeTokenDecimals } =
          tokenInfo;
        const farmHash = props.tokenInfo.farmHash || route.params?.hash;
        const amount = timesDecimals(number, stakeTokenDecimals);
        const tx = await nerve.swap.farmStake(
          addressInfo.value?.address?.Taker,
          nerve.swap.token(stakeTokenChainId, stakeTokenAssetId),
          config.chainId,
          config.prefix,
          amount,
          farmHash,
          ""
        );
        await handleHex(tx.hex);
      } catch (e) {
        // console.log(e, "gain-profit-error");
        toast.error(e.message || e);
      }
    }

    // 添加/退出lp弹窗
    async function handleLP(type: string) {
      console.log(type, 9966333, props.tokenInfo);
      if (type === LpDialogType.Add) {
        dialogAddOrMinus.value = true;
        addOrMinus.value = LpDialogType.Add;
        getBalance();
      } else {
        dialogAddOrMinus.value = true;
        addOrMinus.value = LpDialogType.Minus;
        balance.value = props.tokenInfo.stakeAmount;
      }
    }

    async function getBalance() {
      balance.value = "";
      if (props.isTaker) {
        const tokenInfo = props.tokenInfo as TakerFarmItem;
        const { stakeTokenChainId, stakeTokenAssetId, stakeTokenDecimals } =
          tokenInfo;
        const res: any = await getAssetBalance(
          stakeTokenChainId,
          stakeTokenAssetId,
          addressInfo.value?.address?.Taker
        );
        balance.value = divisionDecimals(res.balance, stakeTokenDecimals);
      } else {
        const transfer = new ETransfer();
        const tokenInfo = props.tokenInfo as UniFarmItem;
        const contractAddress = tokenInfo.lpToken;
        const address = addressInfo.value?.address?.Ethereum;
        if (contractAddress) {
          const decimal = tokenInfo.stakeTokenDecimals;
          balance.value = await transfer.getERC20Balance(
            contractAddress,
            Number(decimal),
            address
          );
        } else {
          balance.value = await transfer.getEthBalance(address);
        }
      }
    }

    // 添加 / 退出farm
    async function confirmAddOrMinus(amount: string) {
      if (addOrMinus.value === LpDialogType.Add) {
        loading.value = true;
        if (props.isTaker) {
          await farmStake(amount);
        } else {
          await LPOperation(LpOperate.Add, amount);
        }
        loading.value = false;
      } else {
        // farmWithdraw
        loading.value = true;
        if (props.isTaker) {
          await farmWithdrawal(amount);
        } else {
          await LPOperation(LpOperate.Remove, amount);
        }
        loading.value = false;
      }
    }

    // 退出质押
    async function farmWithdrawal(number: string) {
      const tokenInfo = props.tokenInfo as TakerFarmItem;
      try {
        const {
          stakeTokenChainId,
          stakeTokenAssetId,
          stakeTokenDecimals,
          farmHash
        } = tokenInfo;
        const amount = timesDecimals(number, stakeTokenDecimals);
        const tx = await nerve.swap.farmWithdraw(
          addressInfo.value?.address?.Taker,
          nerve.swap.token(stakeTokenChainId, stakeTokenAssetId),
          // config.chainId,
          // config.prefix,
          amount,
          farmHash,
          ""
        );
        await handleHex(tx.hex);
      } catch (e) {
        // console.log(e, "gain-profit-error");
        toast.error(e.message || e);
      }
    }

    // 添加 - Add、减少 - Remove lp, 领取收益 -Claim
    async function LPOperation(type: string, value: string) {
      try {
        const transfer = new ETransfer();
        const { stakeTokenDecimals } = props.tokenInfo;
        const wallet = transfer.provider.getSigner();
        const contracts = new ethers.Contract(contractAddress, txAbi, wallet);
        let res;
        const amount = timesDecimals(value, stakeTokenDecimals);
        // console.log(amount, 9595);
        const pid = props.tokenInfo.farmHash;
        if (type === LpOperate.Add) {
          // console.log(props.tokenInfo.farmHash, 999888)
          res = await contracts.deposit(pid, amount);
        } else if (type === LpOperate.Remove) {
          res = await contracts.withdraw(pid, amount);
        } else {
          res = await contracts.deposit(pid, amount);
        }
        if (res.hash) {
          toast.success(t("transfer.transfer14"));
          dialogAddOrMinus.value = false;
        } else {
          toast.error(res.message || res);
        }
      } catch (e) {
        // console.error(e, 6666)
        toast.error(e.message || e);
      }
    }

    const { handleHex: handleNerveHex } = useBroadcastNerveHex();
    // taker 签名hash&广播hex
    async function handleHex(hex: string) {
      const result: any = await handleNerveHex(hex);
      if (result && result.hash) {
        dialogAddOrMinus.value = false;
        toast.success(t("transfer.transfer14"));
      } else {
        toast.error("Failed");
      }
    }

    function toAddLiquidity() {
      const {
        lpPairAssetAAssetId,
        lpPairAssetAChainId,
        lpPairAssetBAssetId,
        lpPairAssetBChainId,
        stakeTokenChainId,
        stakeTokenAssetId
      } = props.tokenInfo as TakerFarmItem;
      let url;
      if (!props.isPool) {
        url = `/liquidity/${lpPairAssetAChainId}-${lpPairAssetAAssetId}/${lpPairAssetBChainId}-${lpPairAssetBAssetId}`;
      } else {
        const USDT = isBeta ? "5-7" : "9-3";
        url = `/trading/${USDT}/${stakeTokenChainId}-${stakeTokenAssetId}`;
      }
      router.push(url);
    }
    return {
      needAuth,
      authToken,
      dialogAddOrMinus,
      addOrMinus,
      loading,
      balance,
      gether,
      handleLP,
      confirmAddOrMinus,
      toAddLiquidity,
      LpDialogType
    };
  }
});
</script>

<style lang="scss">
@import "../../assets/css/style.scss";
.mobile-cont {
  display: none;
  width: 100%;
  .option-cont {
    padding: 20px 20px 18px 18px;
    //border: 1px solid #aab2c9;
    border-radius: 10px;
    background-color: #313161;
    .count-cont {
      //font-weight: bold;
      font-size: 20px;
      width: 160px;
      span {
        font-size: 14px;
        //font-weight: bold;
        color: #858fb1;
      }
    }
    .btn {
      height: 36px;
      width: 80px;
      background-color: $btnColor;
      line-height: 36px;
      text-align: center;
      font-size: 15px;
      color: $txColor;
      border-radius: 10px;
      &.btn_disabled {
        opacity: 0.2;
        background-color: $btnColor !important;
      }
    }
  }
  .mt-8 {
    margin-top: 8px;
  }
}
.farm-details {
  /* height: 148px; */
  background-color: #21214d;
  .pc-cont {
    padding: 20px 40px 20px 30px;
    //border-bottom: 1px solid #e4efff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .getLp {
      width: 200px;
      p {
        font-size: 16px;
        font-weight: 500;
        color: #fcfcfc;
        line-height: 24px;
        margin-top: 8px;
        //cursor: not-allowed;
        &:first-child {
          margin: 0;
        }
      }
    }
    .biaoge {
      flex: 1;
      display: flex;
      .gain,
      .alter {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-left: 60px;
        height: 108px;
        padding: 20px;
        background: #313161;
        //border: 1px solid #e4efff;
        border-radius: 10px;
        .left {
          max-width: 200px;
          .info-title {
            font-size: 14px;
            margin-bottom: 5px;
            color: $labelColor;
          }
          p {
            font-size: 20px;
            //font-weight: bold;
          }
          span {
            font-size: 14px;
            //font-weight: bold;
            color: #858fb1;
          }
        }
        .btns {
          width: 90px;
          height: 38px;
          background: #4a5ef2;
          border-radius: 6px;
        }
      }
      .alter {
        .right {
          min-width: 145px;
        }
        .btns {
          width: 65px;
          margin-left: 15px;
          &:first-child {
            margin-left: 0;
          }
          &.auth-btn {
            width: 100px;
          }
          i {
            font-size: 20px;
          }
        }
      }
    }
  }
  .el-overlay {
    z-index: 1888 !important;
  }
}
.btn_disabled {
  background-color: #a0cfff !important;
  cursor: not-allowed;
}

@media screen and (max-width: 1200px) {
  .farm-details {
    padding: 20px 15px;
  }
  .gain {
    margin-left: 0;
    margin-top: 20px;
    width: 264px;
  }
  .alter {
    margin-left: 0;
    margin-top: 20px;
    width: 264px;
  }
  .info-title {
    width: 120px;
  }
}
@media screen and (max-width: 1100px) {
  .farm-details .pc-cont .biaoge .gain .left,
  .farm-details .pc-cont .biaoge .alter .left {
    max-width: 170px;
  }
}
@media screen and (max-width: 850px) {
  .farm-details {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: space-between;
    .biaoge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-direction: column;
      .gain {
        margin-left: 0;
        margin-top: 20px;
        width: 280px;
      }
      .alter {
        margin-left: 0;
        margin-top: 20px;
        width: 280px;
        //.right {
        //  width: 180px !important;
        //}
        .btns {
          margin-bottom: 10px;
        }
      }
    }
  }
  .farm-item .more {
    margin-top: 15px;
  }
}
@media screen and (max-width: 800px) {
  .pc-cont {
    display: none !important;
  }
  .mobile-cont {
    display: block;
  }
}
.text-90 {
  color: $labelColor;
  font-size: 14px;
}
</style>
