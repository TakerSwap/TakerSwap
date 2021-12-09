<template>
  <div>
    <div class="info-bar" v-if="showInfo">
      <div class="text-e3 size-20">{{ $t("liquidity.liquidity15") }}</div>
      <div class="detail-info">
        <div>
          <span>{{ info && info.token0.symbol }}</span>
          <span>{{ (!!expectedAmountA && expectedAmountA) || 0 }}</span>
        </div>
        <div>
          <span>{{ info && info.token1.symbol }}</span>
          <span>{{ (!!expectedAmountB && expectedAmountB) || 0 }}</span>
        </div>
      </div>
    </div>
    <div class="detail-bar">
      <!--:value="quitNumber"-->
      <el-input
        placeholder=""
        v-model="quitNumber"
        @input="handleInput"
      ></el-input>
      <div class="text-red" v-if="amountError">{{ amountError }}</div>
      <div class="rate">
        <span
          class="click"
          v-for="(item, index) in rates"
          :key="item"
          :class="{ active_click: currentIndex === index }"
          @click="getNumber(item, index)"
        >
          {{ item }}%
        </span>
      </div>
      <div class="confirm-wrap">
        <el-button
          :disabled="quitNumber === '' || !!amountError"
          @click="quit"
          type="primary"
        >
          {{ $t("liquidity.liquidity6") }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from "vue";
import { Times, timesDecimals, divisionDecimals, Minus } from "@/utils/util";
import nerve from "nerve-sdk-js";
import { useI18n } from "vue-i18n";
import {
  calMinAmountOnSwapRemoveLiquidity,
  getSwapPairInfo
} from "@/service/api";
import { useToast } from "vue-toastification";
import { LiquidityItem } from "./types";
import useBroadcastNerveHex from "@/hooks/useBroadcastNerveHex";

export default defineComponent({
  props: {
    info: {
      type: Object as PropType<LiquidityItem>,
      default: () => {}
    },
    takerAddress: String
  },
  setup(props, context) {
    const { t } = useI18n();
    const toast = useToast();
    const rates = ref([25, 50, 75, 100]);
    const quitNumber = ref("");
    const showInfo = ref(false);
    const expectedAmountA = ref("");
    const expectedAmountB = ref("");
    const currentIndex = ref(-1);
    const amountError = ref("");
    function handleInput(val: string) {
      if (!Number(val)) showInfo.value = false;
      const availableLiquidity = props.info.amount;
      currentIndex.value = -1;
      if (Minus(availableLiquidity, val).toNumber() < 0) {
        showInfo.value = false;
        // amountError.value = "超过最大撤出数量";
        amountError.value = t("liquidity.liquidity16");
        return;
      } else {
        amountError.value = "";
        Number(val) !== 0 && calRemoveLiquidity();
      }
    }

    async function getNumber(item: number, index: number) {
      amountError.value = "";
      currentIndex.value = index;
      showInfo.value = true;
      quitNumber.value = Times(props.info.amount, item / 100).toFixed();
      await calRemoveLiquidity();
    }
    // 计算撤出流动性将获得的资产
    async function calRemoveLiquidity() {
      const { token0, token1 } = props.info;
      const tokenAStr = `${token0["assetChainId"]}-${token0["assetId"]}`;
      const tokenBStr = `${token1["assetChainId"]}-${token1["assetId"]}`;
      const params = {
        tokenAStr,
        tokenBStr
      };
      const {
        token0: tempToken0,
        token1: tempToken1,
        reserve0,
        reserve1,
        tokenLP,
        totalLP
      }: any = await getSwapPairInfo(params);
      const tempNervePair = nerve.swap.pair(
        tempToken0,
        tempToken1,
        reserve0,
        reserve1
      );
      const nervePair = { ...tempNervePair, totalSupply: totalLP };
      // console.log(tempToken0, tempToken1, "tempToken0tempToken0tempToken0");
      const tokenA = nerve.swap.token(
        tempToken0.assetChainId,
        tempToken0.assetId
      );
      const tokenB = nerve.swap.token(
        tempToken1.assetChainId,
        tempToken1.assetId
      );
      const { amountA, amountB } = nerve.swap.calRemoveLiquidity(
        timesDecimals(quitNumber.value, tokenLP.decimals),
        tokenA,
        tokenB,
        nervePair
      );
      expectedAmountA.value = divisionDecimals(
        amountA.toString(),
        token0.decimals
      );
      expectedAmountB.value = divisionDecimals(
        amountB.toString(),
        token1.decimals
      );
    }

    const { handleHex } = useBroadcastNerveHex();
    async function quit() {
      if (!Number(quitNumber.value)) return;
      try {
        context.emit("loading", true);
        const fromAddress = props.takerAddress;
        const toAddress = props.takerAddress;
        const LP = props.info.lpTokenAmount;
        const tokenA = props.info.token0;
        const tokenB = props.info.token1;
        const removeAmount = timesDecimals(
          quitNumber.value,
          LP.token.decimals
        ).split(".")[0];
        // 移除的资产LP的数量
        const tokenAmountLP = nerve.swap.tokenAmount(
          LP.token.assetChainId,
          LP.token.assetId,
          removeAmount
        );
        const minRemove: any = await calMinAmountOnSwapRemoveLiquidity({
          amountLP: removeAmount, //LP.amount,
          tokenAStr: tokenA.assetChainId + "-" + tokenA.assetId,
          tokenBStr: tokenB.assetChainId + "-" + tokenB.assetId
        });
        if (!minRemove) {
          throw "Cal min removeAmount failed";
        }
        // 资产A最小移除值
        const tokenAmountAMin = nerve.swap.tokenAmount(
          tokenA.assetChainId,
          tokenA.assetId,
          minRemove.amountAMin
        );
        // 资产B最小移除值
        const tokenAmountBMin = nerve.swap.tokenAmount(
          tokenB.assetChainId,
          tokenB.assetId,
          minRemove.amountBMin
        );
        const deadline = nerve.swap.currentTime() + 300;
        const tx = await nerve.swap.swapRemoveLiquidity(
          fromAddress,
          tokenAmountLP,
          tokenAmountAMin,
          tokenAmountBMin,
          deadline,
          toAddress,
          ""
        );
        const res: any = await handleHex(tx.hex);
        if (res && res.hash) {
          quitNumber.value = "";
          setTimeout(() => {
            context.emit("updateList");
          }, 200);
          toast.success(t("transfer.transfer14"));
        } else {
          toast.error("Remove liquidity Failed");
        }
      } catch (e) {
        console.log(e, "Remove-liquidity-error");
        toast.error(e.message || e);
      }
      context.emit("loading", false);
    }

    return {
      rates,
      quitNumber,
      showInfo,
      expectedAmountA,
      expectedAmountB,
      currentIndex,
      amountError,
      handleInput,
      getNumber,
      quit
    };
  }
});
</script>

<style lang="scss" scoped>
@import "../../assets/css/style.scss";
.detail-bar {
  min-height: 174px;
  padding: 20px;
  border-radius: 20px;
  background-color: $detailBar;
  //border: 1px solid #e4efff;
  .rate {
    margin: 10px 0 20px;
    display: flex;
    span {
      width: 65px;
      height: 28px;
      background-color: #313161;
      color: $labelColor;
      text-align: center;
      line-height: 28px;
      border-radius: 6px;
      margin-right: 30px;
      &:last-child {
        margin-right: 0;
      }
    }
  }
  :deep(.el-input) {
    //border: 1px solid #e4efff;
    .el-input__inner {
      //border: 0;
    }
  }
  @media screen and (max-width: 500px) {
    padding: 16px;
    :deep(.el-input) {
      line-height: 36px;
      .el-input__inner {
        height: 36px;
        line-height: 36px;
      }
    }

    .rate {
      margin: 10px 0 20px;
      display: flex;
      flex-wrap: wrap;
      span {
        width: 22%;
        margin-right: 4%;
      }
    }
  }
}
.active_click {
  background-color: #004884 !important;
  color: #ffffff !important;
}
.info-bar {
  .text-e3 {
    color: $labelColor;
  }
  .size-20 {
    font-size: 14px;
  }
  .detail-info {
    font-size: 13px;
    div {
      display: flex;
      margin-top: 15px;
      align-items: center;
      justify-content: space-between;
      &:nth-child(2) {
        margin-bottom: 15px;
      }
    }
  }
  @media screen and (max-width: 500px) {
    .detail-info {
      div {
        margin-top: 8px;
      }
    }
  }
}
.text-red {
  color: #f56c6c;
  font-size: 12px;
}
</style>
