<template>
  <div
    class="add-liquidity"
    v-loading="loading"
    element-loading-background="rgba(24, 24, 55, 0.8)"
  >
    <div class="head">
      <el-icon class="back" @click="back">
        <back style="font-weight: 600" />
      </el-icon>
      <h3>
        {{
          insufficient
            ? $t("liquidity.liquidity12")
            : $t("liquidity.liquidity7")
        }}
      </h3>
    </div>
    <div class="create-liquidity-tip" v-show="insufficient">
      {{ $t("liquidity.liquidity10") }}
    </div>
    <custom-input
      v-model:inputVal="fromAmount"
      :icon="fromAsset && fromAsset.symbol"
      :assetList="assetsList"
      :balance="fromAsset && fromAsset.available"
      :selectedAsset="fromAsset || null"
      @selectAsset="selectAsset($event, 'from')"
      @max="max('from')"
    ></custom-input>
    <div class="add">
      <img src="../../assets/img/add-liquid.svg" alt="" />
    </div>
    <custom-input
      v-model:inputVal="toAmount"
      :icon="toAsset && toAsset.symbol"
      :assetList="assetsList"
      :balance="toAsset && toAsset.available"
      :selectedAsset="toAsset || null"
      @selectAsset="asset => selectAsset(asset, 'to')"
      @max="max('to')"
    ></custom-input>
    <div class="liquidity-info" v-if="priceInfo">
      <div class="name">{{ $t("liquidity.liquidity8") }}</div>
      <div class="content">
        <div class="flex1">
          <div>{{ priceInfo.from_to }}</div>
          <p>{{ toAsset && toAsset.symbol }} Per {{ fromAsset && fromAsset.symbol }}</p>
        </div>
        <div class="flex1">
          <div>{{ priceInfo.to_from }}</div>
          <p>{{ fromAsset && fromAsset.symbol }} Per {{ toAsset && toAsset.symbol }}</p>
        </div>
        <div class="flex1">
          <div>{{ priceInfo.share }}%</div>
          <p>{{ $t("liquidity.liquidity11") }}</p>
        </div>
      </div>
    </div>
    <div class="confirm-wrap">
      <template v-if="takerAddress">
        <el-button
          type="primary"
          v-if="insufficient"
          @click="createPair"
          :disabled="disableCreate || !!fromAmountError || !!toAmountError"
        >
          {{ fromAmountError || toAmountError || $t("liquidity.liquidity13") }}
        </el-button>
        <el-button
          type="primary"
          v-else
          @click="addLiquidity"
          :disabled="disableAdd || !!fromAmountError || !!toAmountError"
        >
          {{ fromAmountError || toAmountError || $t("liquidity.liquidity9") }}
        </el-button>
      </template>
      <template v-else>
        <AuthButton @loading="handleLoading" />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  reactive,
  toRefs,
  watch,
  nextTick,
  computed,
  onBeforeUnmount,
  onMounted,
  PropType
} from "vue";
import AuthButton from "@/components/AuthButton.vue";
import CustomInput from "@/components/CustomInput.vue";
import {
  Minus,
  Division,
  fixNumber,
  timesDecimals,
  divisionAndFix,
  Times,
  divisionDecimals,
  Plus
} from "@/utils/util";
import { useI18n } from "vue-i18n";
import { useStore } from "vuex";
import { getSwapPairInfo, calMinAmountOnSwapAddLiquidity } from "@/service/api";
import nerve from "nerve-sdk-js";
// @ts-ignore
import { NTransfer } from "@/utils/api";
import { useToast } from "vue-toastification";

import { AssetItem, AddLiquidityState } from "./types";
import { DefaultAsset, SwapPairInfo } from "@/views/trading/types";
import useBroadcastNerveHex from "@/hooks/useBroadcastNerveHex";

export default defineComponent({
  name: "addLiquidity",
  props: {
    assetsList: {
      type: Array as PropType<AssetItem[]>,
      default: () => []
    },
    takerAddress: String,
    defaultAsset: {
      type: Object as PropType<DefaultAsset>,
      default: () => {}
    }
  },
  components: {
    CustomInput,
    AuthButton
  },
  setup(props, context) {
    const { t } = useI18n();
    const toast = useToast();
    let storedSwapPairInfo = {}; // 缓存的swapPairInfo
    const state = reactive<AddLiquidityState>({
      feeRate: "0.3", // 千三的手续费
      fromAmount: "",
      toAmount: "",
      fromAsset: null,
      toAsset: null,
      fromAmountError: "",
      toAmountError: "",
      disableWatchFromAmount: false, // 停止监听fromAmount
      disableWatchToAmount: false, // 停止监听toAmount
      insufficient: false, // 流动性不足
      loading: false,
      disableCreate: false
    });
    let customType = "from"; // 输入的input是from还是to， 默认from

    function handleLoading(status: boolean) {
      state.loading = status;
    }

    function selectAsset(asset: AssetItem, type: string) {
      // console.log(asset, type, 9999);
      state.fromAmount = "";
      state.toAmount = "";
      if (type === "from") {
        if (state.toAsset && state.toAsset.assetKey === asset.assetKey) {
          state.toAsset = { ...state.fromAsset } as AssetItem;
          state.fromAsset = asset;
        } else {
          state.fromAsset = asset;
          if (state.toAsset) {
            if (
              state.fromAsset &&
              state.fromAsset.assetKey === state.toAsset.assetKey
            ) {
              state.toAsset = null;
            }
          }
        }
      } else {
        if (state.fromAsset && asset.assetKey === state.fromAsset.assetKey) {
          state.fromAsset = { ...state.toAsset } as AssetItem;
          state.toAsset = asset;
        } else {
          state.toAsset = asset;
          if (
            state.fromAsset &&
            state.fromAsset.assetKey === state.toAsset.assetKey
          ) {
            state.fromAsset = null;
          }
        }
      }

      state.insufficient = false;

      storeSwapPairInfo();
    }

    async function storeSwapPairInfo(refresh = false) {
      const fromAssetKey = state.fromAsset?.assetKey;
      const toAssetKey = state.toAsset?.assetKey;
      const key = fromAssetKey + "_" + toAssetKey;
      if (fromAssetKey && toAssetKey) {
        if (storedSwapPairInfo[key] && !refresh) {
          // 如果存在切不需要刷新 则跳过
        } else {
          const result = (await getSwapPairInfo({
            tokenAStr: fromAssetKey,
            tokenBStr: toAssetKey
          })) as SwapPairInfo;
          if (result) {
            const token0Key =
              result.token0.assetChainId + "-" + result.token0.assetId;
            storedSwapPairInfo[key] = {
              reserveFrom:
                token0Key === fromAssetKey ? result.reserve0 : result.reserve1, // fromAsset的池子余额
              reserveTo:
                token0Key === fromAssetKey ? result.reserve1 : result.reserve0 // // toAsset的池子余额
            };
            state.insufficient = false;
            if (state.fromAmount && state.toAmount) {
              refreshRate();
            }
          } else {
            state.insufficient = true;
          }
        }
      }
    }

    function max(type: string) {
      if (type === "from") {
        state.fromAmount = state.fromAsset?.available || "";
      } else {
        state.toAmount = state.toAsset?.available || "";
      }
    }
    // 默认选择的资产
    watch(
      () => props.defaultAsset,
      val => {
        if (val) {
          state.fromAsset = val.from;
          state.toAsset = val.to || null;
          storeSwapPairInfo();
        }
      },
      {
        deep: true,
        immediate: true
      }
    );

    // 监听fromAmount变化
    watch(
      () => state.fromAmount,
      async val => {
        if (!state.disableWatchFromAmount) {
          customType = "from";
        }
        if (val && state.fromAsset) {
          if (
            !Number(state.fromAsset.available) ||
            Minus(state.fromAsset.available, val).toNumber() < 0
          ) {
            state.fromAmountError = `${state.fromAsset.symbol || ""}${t(
              "transfer.transfer15"
            )}`;
          } else {
            state.fromAmountError = "";
          }
          if (state.insufficient) return;
          if (!state.disableWatchFromAmount) {
            const res = getLiquidAmount(val, "to"); // 通过from计算to
            if (res) {
              state.disableWatchToAmount = true; // 避免进入无限循环计算
              state.toAmount = res;
              // getSwapRate();
              await nextTick();
              state.disableWatchToAmount = false;
            } else {
              // getSwapRate(true);
            }
          }
        } else {
          state.toAmount = "";
          state.toAmountError = "";
          state.fromAmountError = "";
          // getSwapRate(true);
        }
      }
    );
    watch(
      () => state.toAmount,
      async val => {
        if (!state.disableWatchToAmount) {
          customType = "to";
        }
        if (val && state.toAsset) {
          if (
            !Number(state.toAsset.available) ||
            Minus(state.toAsset.available, val).toNumber() < 0
          ) {
            state.toAmountError = `${state.toAsset.symbol || ""}${t(
              "transfer.transfer15"
            )}`;
          } else {
            state.toAmountError = "";
          }
          if (state.insufficient) return;
          if (!state.disableWatchToAmount) {
            const res = getLiquidAmount(val, "from"); // 通过to计算from
            if (res) {
              state.disableWatchFromAmount = true;
              state.fromAmount = res;
              // getSwapRate();
              await nextTick();
              state.disableWatchFromAmount = false;
            } else {
              // getSwapRate(true);
            }
          }
        } else {
          state.fromAmount = "";
          state.fromAmountError = "";
          state.toAmountError = "";
          // getSwapRate(true);
        }
      }
    );
    watch(
      () => props.assetsList,
      val => {
        if (val) {
          if (state.fromAsset) {
            const asset = val.find(
              asset => asset.assetKey === state.fromAsset?.assetKey
            );
            if (asset) {
              state.fromAsset = asset;
            }
          }
          if (state.toAsset) {
            const asset = val.find(
              asset => asset.assetKey === state.toAsset?.assetKey
            );
            if (asset) {
              state.toAsset = asset;
            }
          }
        }
      },
      {
        deep: true
      }
    );

    // 计算需添加的数量 type- 计算from/to的数量
    function getLiquidAmount(amount: string, type: string) {
      const amount_number = Number(amount);
      if (
        state.fromAsset &&
        state.toAsset &&
        !isNaN(amount_number) &&
        amount_number > 0
      ) {
        const fromAssetKey = state.fromAsset.assetKey;
        const toAssetKey = state.toAsset.assetKey;
        const fromDecimal =
          type === "from" ? state.toAsset.decimals : state.fromAsset.decimals;
        const toDecimal =
          type === "from" ? state.fromAsset.decimals : state.toAsset.decimals;
        amount = timesDecimals(amount, fromDecimal);
        const key = fromAssetKey + "_" + toAssetKey;
        const info = storedSwapPairInfo[key];
        if (!info) {
          // setTimeout(() => {
          //   getLiquidAmount(amount, type);
          // }, 200);
          return "";
        } else {
          const reserveA = type === "from" ? info.reserveTo : info.reserveFrom;
          const reserveB = type === "from" ? info.reserveFrom : info.reserveTo;
          const res = nerve.swap.quote(amount, reserveA, reserveB); // from,reverseFrom,reverseTo / to,reverseTo,reverseFrom
          return divisionAndFix(res.toString(), toDecimal, toDecimal);
        }
      } else {
        return "";
      }
    }

    async function refreshRate() {
      if (!state.fromAmount && !state.toAmount) return;
      let res;
      if (customType === "from") {
        res = getLiquidAmount(state.fromAmount, "to"); // 通过from计算to
      } else if (customType === "to") {
        res = getLiquidAmount(state.toAmount, "from"); // 通过from计算to
      }
      if (res) {
        state.disableWatchFromAmount = true;
        state.disableWatchToAmount = true; // 避免进入无限循环计算
        if (customType === "from") {
          state.toAmount = res;
        } else {
          state.fromAmount = res;
        }
        // getSwapRate();
        await nextTick();
        state.disableWatchFromAmount = false;
        state.disableWatchToAmount = false;
      } else {
        // getSwapRate(true);
      }
    }

    const priceInfo = computed(() => {
      const { fromAmount, toAmount, fromAsset, toAsset } = state;
      if (!fromAsset || !toAsset) {
        return null;
      } else {
        const fromKey = fromAsset.assetKey;
        const toKey = toAsset.assetKey;
        const info = storedSwapPairInfo[fromKey + "_" + toKey];
        // console.log(info, 666);
        if (!info || info.reserveFrom == 0 || info.reserveTo == 0) {
          // 创建交易对
          let from_to = "-";
          let to_from = "-";
          let share = "0";
          console.log(Division(fromAmount, toAmount), 798798);
          if (fromAmount && toAmount) {
            from_to = fixNumber(Division(toAmount, fromAmount).toFixed(), 6);
            to_from = fixNumber(Division(fromAmount, toAmount).toFixed(), 6);
            share = "100";
          }
          return {
            from_to,
            to_from,
            share
          };
        } else {
          // 添加流动性
          const from_to = fixNumber(
            Division(
              divisionDecimals(info.reserveTo, toAsset.decimals),
              divisionDecimals(info.reserveFrom, fromAsset.decimals)
            ).toFixed(),
            6
          );
          const to_from = fixNumber(
            Division(
              divisionDecimals(info.reserveFrom, fromAsset.decimals),
              divisionDecimals(info.reserveTo, toAsset.decimals)
            ).toFixed(),
            6
          );
          let share = "0";
          if (fromAmount && toAmount) {
            const allReserveFrom = Plus(
              timesDecimals(fromAmount, fromAsset.decimals),
              info.reserveFrom
            );
            share = fixNumber(
              Division(
                timesDecimals(fromAmount, fromAsset.decimals),
                allReserveFrom
              ).toFixed(),
              4
            );
            share =
              Minus(share, 0.0001).toNumber() > 0
                ? fixNumber(Times(share, 100).toFixed(), 2)
                : "<0.01";
          }
          return {
            from_to,
            to_from,
            share
          };
        }
      }
    });

    const disableCreate = computed(() => {
      return (
        !state.fromAmount ||
        !state.fromAsset?.symbol ||
        !state.toAmount ||
        !state.toAsset?.symbol ||
        !props.takerAddress ||
        state.disableCreate
      );
    });

    const disableAdd = computed(() => {
      return (
        !state.fromAmount ||
        !state.fromAsset?.symbol ||
        !state.toAmount ||
        !state.toAsset?.symbol ||
        state.insufficient ||
        !props.takerAddress
      );
    });

    const { handleHex } = useBroadcastNerveHex();
    async function createPair() {
      const { fromAsset, toAsset } = state;
      if (fromAsset && toAsset) {
        state.loading = true;
        try {
          const tokenA = nerve.swap.token(fromAsset.chainId, fromAsset.assetId); // 资产A的类型
          const tokenB = nerve.swap.token(toAsset.chainId, toAsset.assetId); // 资产B的类型
          const tx = await nerve.swap.swapCreatePair(
            props.takerAddress,
            tokenA,
            tokenB,
            ""
          );
          const res: any = await handleHex(tx.hex);
          if (res && res.hash) {
            toast.success(t("liquidity.liquidity14"));
            refreshNewPair(fromAsset.assetKey, toAsset.assetKey);
          } else {
            toast.error("Create Pair Failed");
          }
        } catch (e) {
          console.log(e, "Create Pair-error");
          toast.error(e.message || e);
        }
        state.loading = false;
      }
    }

    let refreshPairTimer: number;
    // 创建流动性后刷新缓存的交易对信息，直到新创建的交易对生效
    function refreshNewPair(fromKey: string, toKey: string) {
      const key = fromKey + "_" + toKey;
      state.disableCreate = true;
      refreshPairTimer = window.setInterval(() => {
        if (storedSwapPairInfo[key]) {
          state.disableCreate = false;
          clearInterval(refreshPairTimer);
        } else {
          storeSwapPairInfo(true);
        }
      }, 2000);
    }
    onBeforeUnmount(() => {
      clearInterval(refreshPairTimer);
    });

    async function addLiquidity() {
      const { fromAsset, toAsset, fromAmount, toAmount } = state;
      if (fromAsset && toAsset) {
        state.loading = true;
        try {
          const amountA = timesDecimals(fromAmount, fromAsset.decimals);
          const amountB = timesDecimals(toAmount, toAsset.decimals);
          let { amountAMin, amountBMin }: any =
            await calMinAmountOnSwapAddLiquidity({
              amountA,
              amountB,
              tokenAStr: fromAsset.assetKey,
              tokenBStr: toAsset.assetKey
            });
          if (amountAMin == 0 || amountBMin == 0) {
            amountAMin = amountA;
            amountBMin = amountB;
          }
          const tokenAmountA = nerve.swap.tokenAmount(
            fromAsset.chainId,
            fromAsset.assetId,
            amountA
          );
          const tokenAmountB = nerve.swap.tokenAmount(
            toAsset.chainId,
            toAsset.assetId,
            amountB
          );
          const deadline = nerve.swap.currentTime() + 300; // 过期时间
          const fromAddress = props.takerAddress;
          const toAddress = props.takerAddress;
          const tx = await nerve.swap.swapAddLiquidity(
            fromAddress,
            tokenAmountA,
            tokenAmountB,
            amountAMin,
            amountBMin,
            deadline,
            toAddress,
            ""
          );
          const res: any = await handleHex(tx.hex);
          if (res && res.hash) {
            toast.success(t("transfer.transfer14"));
            state.fromAmount = "";
            state.toAmount = "";
            setTimeout(() => {
              context.emit("updateList");
            }, 200);
          } else {
            toast.error("Create Pair Failed");
          }
        } catch (e) {
          console.log(e, "Create Pair-error");
          toast.error(e.message || e);
        }
        state.loading = false;
      }
    }

    function back() {
      context.emit("update:show", false);
    }

    let timer: number; // 5s刷新一次流动性兑换比例
    onMounted(() => {
      timer = window.setInterval(async () => {
        await storeSwapPairInfo(true);
      }, 5000);
    });
    onBeforeUnmount(() => {
      clearInterval(timer);
    });
    return {
      back,
      ...toRefs(state),
      selectAsset,
      max,
      priceInfo,
      createPair,
      addLiquidity,
      disableCreate,
      disableAdd,
      handleLoading
    };
  }
});
</script>

<style lang="scss" scoped>
@import "../../assets/css/style.scss";
.add-liquidity {
  overflow: hidden;
  padding: 30px;
  .head {
    position: relative;
    margin-bottom: 40px;
    h3 {
      text-align: center;
      font-size: 24px;
      line-height: 1;
    }
    .back {
      position: absolute;
      top: 0;
      left: 0;
      cursor: pointer;
      font-weight: 600;
      font-size: 30px;
    }
  }
  .create-liquidity-tip {
    padding: 16px 20px;
    font-size: 14px;
    text-align: center;
    background-color: #004884;
    margin: -20px 0 20px;
    border-radius: 10px;
    color: #91bfff;
  }
  .add {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 12px 0;
  }
  .liquidity-info {
    margin-top: 30px;
    .name {
      color: $labelColor;
      margin-bottom: 8px;
    }
    .content {
      //border: 1px solid #e4efff;
      background-color: #242449;
      border-radius: 15px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      /* height: 94px; */
      padding: 15px;
      .flex1 {
        /* height: 100%; */
        /* flex: 1; */
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        div {
          font-size: 18px;
        }
        p {
          font-size: 14px;
          color: $labelColor;
        }
      }
    }
  }
  .confirm-wrap {
    margin: 40px 0 20px;
  }
  @media screen and (max-width: 1200px) {
    padding: 15px;
  }
  @media screen and (max-width: 500px) {
    .head {
      margin-bottom: 30px;
      h3 {
        font-size: 20px;
      }
      .back {
        font-size: 24px;
      }
    }
    .liquidity-info {
      margin-top: 20px;
      .name {
        font-size: 15px;
      }
      .content {
        padding: 8px;
        .flex1 {
          padding: 0 5px;
          div {
            font-size: 16px;
          }
          p {
            font-size: 14px;
            color: #7e87c2;
          }
        }
      }
    }
    .confirm-wrap {
      margin: 30px 0 20px;
    }
  }
}
</style>
