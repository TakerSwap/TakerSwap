<template>
  <div
    class="swap pd_40_rd_20 mobile-p"
    v-loading="loading"
    element-loading-background="rgba(24, 24, 55, 0.8)"
  >
    <div class="icon-wrap flex-between">
      <div class="left">
        <i
          class="iconfont icon-zhankai click"
          @click="toggleExpand"
          v-if="fromAsset && toAsset"
        ></i>
      </div>
      <div class="right flex-center">
        <span
          @click="forceRefresh"
          :class="{ refreshing: !canRefresh }"
          :style="{ cursor: canRefresh ? 'pointer' : 'not-allowed' }"
        >
          <i class="iconfont icon-shuaxin"></i>
        </span>
        <span><i class="iconfont icon-fenxiang" @click="copyPair"></i></span>
        <span @click="toggleSettingDialog">
          <i class="iconfont icon-shezhi"></i>
        </span>
      </div>
    </div>
    <div class="swap-area">
      <div class="from-symbol">
        <custom-input
          v-model:inputVal="fromAmount"
          ref="customInput"
          :label="$t('trading.trading4')"
          :icon="fromAsset && fromAsset.symbol"
          :assetList="assetsList"
          :balance="fromAsset && fromAsset.available"
          :selectedAsset="fromAsset || null"
          @selectAsset="selectAsset($event, 'from')"
          @max="max('from')"
        ></custom-input>
      </div>
      <div class="change-direction">
        <img
          @click="changeDirection"
          class="click"
          src="../../assets/img/swap-to.svg"
          alt=""
        />
      </div>
      <div class="to-symbol">
        <custom-input
          v-model:inputVal="toAmount"
          :label="$t('trading.trading3')"
          :icon="toAsset && toAsset.symbol"
          :assetList="assetsList"
          :balance="toAsset && toAsset.available"
          :selectedAsset="toAsset || null"
          @selectAsset="asset => selectAsset(asset, 'to')"
          @max="max('to')"
        ></custom-input>
      </div>
      <div class="exchange-rate" v-if="swapRate">
        {{ swapRate }}
        <span class="change-icon" @click="toggleDirection">
          <img src="@/assets/img/exchange.svg" alt="" />
        </span>
      </div>
      <div class="confirm-wrap">
        <el-button
          type="primary"
          v-if="takerAddress"
          :class="{
            deep_color:
              !toAmountError &&
              !fromAmountError &&
              !insufficient &&
              priceImpactColor === 'red'
          }"
          :disabled="
            disableTx ||
            !!fromAmountError ||
            !!toAmountError ||
            impactButton === 2 ||
            isStableCoinForStableCoin
          "
          @click="swapTrade"
        >
          {{
            confirmText
            /* insufficient
              ? $t("trading.trading17")
              : impactButton === 1
              ? $t("trading.trading19")
              : fromAmountError || $t("public.public10")*/
          }}
        </el-button>
        <template v-else>
          <AuthButton @loading="handleLoading" />
        </template>
      </div>
    </div>
    <div class="stable-coin-swap-tip" v-if="isStableCoinForStableCoin">
      {{ $t("trading.trading22") }}
    </div>
    <div
      v-show="swapRate"
      :class="['setting-and-route', swapRate ? 'show' : '']"
    >
      <div class="swap-setting-info">
        <div class="info-item flex-between">
          <div class="left">{{ $t("trading.trading6") }}</div>
          <div class="right">{{ protectPercent || "0.5" }}%</div>
        </div>
        <div class="info-item flex-between">
          <div class="left">{{ $t("trading.trading7") }}</div>
          <div
            class="right"
            :style="{
              color:
                (priceImpactFloat === '<0.01%' && 'green') || priceImpactColor
            }"
          >
            {{ priceImpactFloat }}
          </div>
        </div>
        <div class="info-item flex-between" v-if="customerType === 'from'">
          <div class="left">{{ $t("trading.trading8") }}</div>
          <div class="right">
            {{ minReceive }} {{ toAsset && toAsset.symbol }}
          </div>
        </div>
        <div class="info-item flex-between" v-if="customerType === 'to'">
          <div class="left">{{ $t("trading.trading15") }}</div>
          <div class="right">
            {{ maxSale }} {{ fromAsset && fromAsset.symbol }}
          </div>
        </div>
        <div class="info-item flex-between">
          <div class="left">{{ $t("trading.trading9") }}</div>
          <div class="right">{{ fee }} {{ fromAsset && fromAsset.symbol }}</div>
        </div>
      </div>
      <div class="swap-route">
        <div class="name">{{ $t("trading.trading10") }}</div>
        <div class="route-network flex-center">
          <div
            class="route-item"
            v-for="(item, index) in routesSymbol"
            :key="item"
          >
            <div class="flex-center">
              <symbol-icon :icon="item"></symbol-icon>
              <span>{{ item }}</span>
            </div>
            <el-icon
              class="icon-arrow-right"
              v-if="index !== routesSymbol.length - 1"
            >
              <arrow-right />
            </el-icon>
          </div>
        </div>
      </div>
    </div>
    <el-dialog
      :title="$t('trading.trading11')"
      custom-class="swap-setting"
      :show-close="false"
      width="470px"
      v-model="settingDialog"
    >
      <div class="content">
        <div class="set-item">
          <div class="name">{{ $t("trading.trading12") }}</div>
          <div class="protect flex-center">
            <span
              :class="[
                'number',
                'click',
                protectPercent === item ? 'active' : ''
              ]"
              v-for="item in protectSets"
              :key="item"
              @click="protectPercent = item"
            >
              {{ item }}%
            </span>
            <el-input
              :model-value="protectPercent"
              @input="protectPercentInput"
            />
            %
          </div>
          <div class="text-error" v-if="protectError">{{ protectError }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import {
  PropType,
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toRefs,
  watch,
  getCurrentInstance
} from "vue";
import CustomInput from "@/components/CustomInput.vue";
import AuthButton from "@/components/AuthButton.vue";
import SymbolIcon from "@/components/SymbolIcon.vue";
import {
  Division,
  divisionAndFix,
  divisionDecimals,
  fixNumber,
  Minus,
  Times,
  timesDecimals,
  tofix,
  formatFloat
} from "@/utils/util";
import { useI18n } from "vue-i18n";
import { getWholeTradeExactIn } from "@/service/api";
import nerve from "nerve-sdk-js";
import { useToast } from "vue-toastification";
import config from "@/config";
import useSpecialSwap from "./hooks/useSpecialSwap";
import useStoreState from "@/hooks/useStoreState";
import useBroadcastNerveHex from "@/hooks/useBroadcastNerveHex";
import { ComponentInternalInstance } from "@vue/runtime-core";
import { AssetItem, DefaultAsset, SwapState, SwapPairInfo } from "./types";

export default defineComponent({
  name: "swap",
  components: {
    CustomInput,
    SymbolIcon,
    AuthButton
  },
  props: {
    assetsList: {
      type: Array as PropType<AssetItem[]>,
      default: () => []
    },
    defaultAsset: {
      type: Object as PropType<DefaultAsset>,
      default: () => {}
    }
  },
  setup(props, context) {
    const { proxy } = getCurrentInstance() as ComponentInternalInstance;
    let storedSwapPairInfo = {}; // 缓存的交易对全量的兑换路径
    const { t } = useI18n();
    const toast = useToast();
    const { takerAddress } = useStoreState();
    const {
      isStableCoinForStableCoin,
      isStableCoinForOthers,
      isStableCoinSwap,
      checkIsStableCoinForStableCoin,
      checkIsStableCoinForNVT,
      checkIsStableCoinSwap,
      stableCoins,
      stablePairList,
      getReceiveOrderIndex
    } = useSpecialSwap();
    const state = reactive<SwapState>({
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
      protectPercent: "0.5", // 划点保护
      // protectSets: ["0.5", "1", "3"],
      routesSymbol: [],
      fee: "",
      priceImpact: "", // 价格影响
      customerType: "",
      protectError: "",
      showLoading: false
    });

    const loading = ref(false);

    function handleLoading(status: boolean) {
      loading.value = status;
    }

    // 选择swap资产 asset-选择的资产, type-from/to
    async function selectAsset(asset: AssetItem, type: string) {
      // console.log(asset, type, 9999);
      if (!asset) return false;
      state.fromAmount = "";
      state.toAmount = "";
      state.priceImpact = "";
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

      getSwapRate(true);
      context.emit("updateRate", "");

      checkIsStableCoinForStableCoin(
        state?.fromAsset?.assetKey,
        state?.toAsset?.assetKey
      );

      if (isStableCoinForStableCoin.value) {
        return;
      }

      checkIsStableCoinForNVT(
        state?.fromAsset?.assetKey,
        state?.toAsset?.assetKey
      );
      checkIsStableCoinSwap(
        state?.fromAsset?.assetKey,
        state?.toAsset?.assetKey
      );
      if (
        state.toAsset &&
        state.fromAsset &&
        state.fromAsset.assetKey &&
        state.toAsset.assetKey
      ) {
        if (!isStableCoinSwap.value) {
          if (isStableCoinForOthers.value) {
            // 稳定币换NVT，缓存稳定币N兑换NVT交易对信息
            const routeCoin = getStableRouteCoin();
            await storeSwapPairInfo(false, false, routeCoin);
          }
          // canRefresh.value = false;
          // 缓存交易对信息
          await storeSwapPairInfo();
          // 反向缓存交易对信息
          await storeSwapPairInfo(false, true);
          // canRefresh.value = true;
        }
        context.emit("selectAsset", state.fromAsset, state.toAsset);
      } else {
        context.emit("updateRate", "");
      }
    }

    // 获取稳定币换NVT中间路由资产
    function getStableRouteCoin() {
      const fromKey = state.fromAsset?.assetKey;
      const routeCoinKey = stableCoins.value[fromKey as string];
      return props.assetsList.find(asset => asset.assetKey === routeCoinKey)!;
    }

    function customerFocus(type: string) {
      state.customerType = type;
    }

    // 缓存交易对的兑换信息 refresh-刷新, isTemp-反向计算
    async function storeSwapPairInfo(
      refresh = false,
      isTemp = false,
      stableCoin?: AssetItem
    ) {
      let fromAssetKey, toAssetKey, tokenInAmount, tokenInDecimal;
      if (!isTemp) {
        fromAssetKey = stableCoin?.assetKey || state.fromAsset?.assetKey;
        toAssetKey = state.toAsset?.assetKey;
        tokenInAmount = state.fromAmount || "1";
        tokenInDecimal = stableCoin?.decimals || state.fromAsset?.decimals;
      } else {
        fromAssetKey = state.toAsset?.assetKey;
        toAssetKey = state.fromAsset?.assetKey;
        tokenInAmount = state.toAmount || "1";
        tokenInDecimal = state.toAsset?.decimals;
      }
      const key = fromAssetKey + "_" + toAssetKey;
      if (fromAssetKey && toAssetKey) {
        // console.log(fromAssetKey, toAssetKey, "---===---");
        if (storedSwapPairInfo[key] && !refresh && !isTemp) {
          // 如果存在切不需要刷新 则跳过
          // context.emit("updateRate", storedSwapPairInfo[key].swapRate);
        } else {
          const res = (await getWholeTradeExactIn({
            tokenInStr: fromAssetKey,
            tokenOutStr: toAssetKey,
            tokenInAmount: timesDecimals(tokenInAmount, tokenInDecimal)
          })) as SwapPairInfo[];
          const pairsInfo = {};
          if (res.length) {
            for (let i = 0; i < res.length; i++) {
              const token0 = res[i].token0;
              const token1 = res[i].token1;
              pairsInfo[
                `${token0.assetChainId}-${token0.assetId}_${token1.assetChainId}-${token1.assetId}`
              ] = nerve.swap.pair(
                {
                  chainId: token0.assetChainId,
                  assetId: token0.assetId
                },
                {
                  chainId: token1.assetChainId,
                  assetId: token1.assetId
                },
                res[i].reserve0,
                res[i].reserve1
              );
            }
            if (
              state.customerType &&
              state.fromAmount &&
              state.toAmount &&
              !isTemp
            ) {
              refreshRate();
            }
            if (!isTemp) {
              getSwapAmount("1", "to", true);
            }
          }
          storedSwapPairInfo[key] = pairsInfo;
        }
      }
    }

    async function changeDirection() {
      if (!state.fromAsset || !state.toAsset) {
        return false;
      }
      const tempToAsset = { ...state.toAsset };
      const tempFromAsset = { ...state.fromAsset };
      state.fromAsset = tempToAsset;
      state.toAsset = tempFromAsset;
      checkIsStableCoinForNVT(
        state?.fromAsset?.assetKey,
        state?.toAsset?.assetKey
      );
      checkIsStableCoinSwap(
        state?.fromAsset?.assetKey,
        state?.toAsset?.assetKey
      );
      if (isStableCoinForOthers.value && !isStableCoinSwap.value) {
        const routeCoin = getStableRouteCoin();
        await storeSwapPairInfo(false, false, routeCoin);
      }
      getSwapAmount("1", "to", true);
      context.emit("selectAsset", state.fromAsset, state.toAsset);
      await getAmountByToggleSwap();
    }

    // 通过from计算to
    async function getToByFrom(val: string) {
      if (state.disableWatchFromAmount) return;
      customerFocus("from");
      if (val) {
        if (!state.fromAsset || !state.toAsset) return false;
        if (
          !Number(state.fromAsset.available) ||
          // @ts-ignore
          Minus(state.fromAsset.available, val) < 0
        ) {
          state.fromAmountError =
            ((state.fromAsset && state.fromAsset.symbol) || "") +
            t("transfer.transfer15");
        } else {
          state.fromAmountError = "";
        }

        const [res, priceImpact] = getSwapAmount(val, "to"); // 通过from计算to
        state.priceImpact = priceImpact || 0;
        state.insufficient = res === 0;
        if (res) {
          state.disableWatchToAmount = true; // 避免进入无限循环计算
          state.toAmount = res;
          getSwapRate(false);
          await nextTick();
          state.disableWatchToAmount = false;
        } else {
          getSwapRate(true);
        }
      } else {
        state.priceImpact = "";
        if (!state.fromAmountError) {
          state.toAmount = "";
        }
        getSwapRate(true);
      }
    }

    // 通过to计算from
    async function getFromByTo(val: string) {
      if (state.disableWatchToAmount) return;
      customerFocus("to");
      if (val) {
        if (!state.fromAsset || !state.toAsset) return false;
        const [res, priceImpact] = getSwapAmount(val, "from"); // 通过to计算from
        // console.log(res, priceImpact, 666);
        state.priceImpact = priceImpact || 0;
        state.insufficient = res === 0;
        if (res) {
          state.disableWatchFromAmount = true;
          state.fromAmount = res;
          getSwapRate(false);
          await nextTick();
          state.disableWatchFromAmount = false;
        } else {
          getSwapRate(true);
        }
      } else {
        state.priceImpact = "";
        state.fromAmount = "";
        getSwapRate(true);
      }
    }

    async function getAmountByToggleSwap() {
      state.disableWatchToAmount = true;
      state.disableWatchFromAmount = true;
      const fromAmount = state.fromAmount;
      const toAmount = state.toAmount;
      state.fromAmount = "";
      state.toAmount = "";
      await nextTick();
      //console.log(state.customerType, fromAmount, toAmount);
      if (state.customerType === "from") {
        state.disableWatchToAmount = false;
        state.toAmount = fromAmount;
      } else if (state.customerType === "to") {
        state.disableWatchFromAmount = false;
        state.fromAmount = toAmount;
      }
      await nextTick();
      state.disableWatchToAmount = false;
      state.disableWatchFromAmount = false;
    }

    // 监听fromAmount变化
    watch(
      () => state.fromAmount,
      async val => {
        await getToByFrom(val);
      }
    );
    watch(
      () => state.toAmount,
      async val => {
        await getFromByTo(val);
      },
      {
        deep: true
      }
    );

    watch(
      () => props.defaultAsset,
      val => {
        if (val) {
          state.fromAsset = val.from;
          state.toAsset = val.to || null;
          storeSwapPairInfo();
        }
      },
      { immediate: true, deep: true }
    );
    watch(
      () => props.assetsList,
      val => {
        if (val) {
          if (state.fromAsset) {
            const fromAsset = val.find(
              asset =>
                state.fromAsset && asset.assetKey === state.fromAsset.assetKey
            );
            state.fromAsset = fromAsset || null;
          }
          if (state.toAsset) {
            const toAsset = val.find(
              asset =>
                state.toAsset && asset.assetKey === state.toAsset.assetKey
            );
            state.toAsset = toAsset || null;
          }
        }
      },
      {
        deep: true
      }
    );
    const canRefresh = ref(true);

    async function refresh() {
      const startTime = new Date().getTime();
      try {
        canRefresh.value = false;
        await storeSwapPairInfo(true);
        await storeSwapPairInfo(true, true);
      } catch (e) {
        //
      }
      const endTime = new Date().getTime();
      const diff = endTime - startTime;
      // console.log(diff, 666)
      if (diff < 1500) {
        setTimeout(() => {
          canRefresh.value = true;
        }, 1500 - diff);
      } else {
        canRefresh.value = true;
      }
    }

    async function forceRefresh() {
      if (timer) clearInterval(timer);
      await refresh();
      timer = window.setInterval(async () => {
        await refresh();
      }, 5000);
    }

    async function refreshRate() {
      if (!state.fromAmount && !state.toAmount) return;
      // const [res, priceImpact] = getSwapAmount(state.fromAmount, "to"); // 通过from计算to
      let res, priceImpact;
      if (state.customerType === "from") {
        [res, priceImpact] = getSwapAmount(state.fromAmount, "to"); // 通过from计算to
      } else if (state.customerType === "to") {
        [res, priceImpact] = getSwapAmount(state.toAmount, "from"); // 通过from计算to
      }
      state.priceImpact = priceImpact || "0";
      // console.log(res, "fff");
      state.insufficient = res === 0;
      if (res) {
        state.disableWatchFromAmount = true;
        state.disableWatchToAmount = true; // 避免进入无限循环计算
        if (state.customerType === "from") {
          state.toAmount = res;
        } else {
          state.fromAmount = res;
        }
        getSwapRate(false);
        await nextTick();
        state.disableWatchFromAmount = false;
        state.disableWatchToAmount = false;
      } else {
        getSwapRate(true);
      }
    }

    let timer: number; // 5s刷新一次交易对信息&兑换比例
    onMounted(() => {
      timer = window.setInterval(async () => {
        await refresh();
      }, 5000);
    });
    onBeforeUnmount(() => {
      clearInterval(timer);
    });

    // 计算能兑换的数量 type- 计算from/to的数量, getInitialRate- 计算兑换比例1/n
    function getSwapAmount(
      amount: string,
      type: string,
      getInitialRate = false
    ) {
      const fromAssetKey = state.fromAsset?.assetKey;
      const toAssetKey = state.toAsset?.assetKey;
      if (
        fromAssetKey &&
        toAssetKey &&
        !isNaN(Number(amount)) &&
        Number(amount) > 0
      ) {
        // 稳定币、稳定币N互换
        if (isStableCoinSwap.value) {
          state.routesSymbol = [state.fromAsset?.symbol, state.toAsset?.symbol];
          return [amount, 0];
        }

        let key = fromAssetKey + "_" + toAssetKey;
        let fromAsset = state.fromAsset;
        if (isStableCoinForOthers.value) {
          const routeCoinKey = stableCoins.value[fromAssetKey];
          const routeCoin = getStableRouteCoin();
          key = routeCoinKey + "_" + toAssetKey;
          fromAsset = routeCoin;
        }
        const pairsInfo = storedSwapPairInfo[key];

        if (!pairsInfo) {
          // setTimeout(() => {
          //   getSwapAmount(amount, type);
          // }, 500);
          return [0, 0];
        }
        const fromDecimal =
          type === "from" ? state.toAsset?.decimals : fromAsset?.decimals;
        const toDecimal =
          type === "from" ? fromAsset?.decimals : state.toAsset?.decimals;
        amount = timesDecimals(amount, fromDecimal);
        // console.log(pairsInfo, 66, amount, fromDecimal);
        const pairs = Object.values(pairsInfo);
        if (pairs.length) {
          const pairs = Object.values(pairsInfo);
          if (getInitialRate) {
            const bestExactInForOne = bestTradeExactIn(
              timesDecimals("1", fromDecimal),
              pairs,
              fromAsset
            );
            const toAmount = divisionDecimals(
              bestExactInForOne.tokenAmountOut.amount,
              toDecimal
            );
            context.emit("updateRate", toAmount + state.toAsset?.symbol);
          }
          const bestExact =
            type === "to"
              ? bestTradeExactIn(amount, pairs, fromAsset)
              : bestTradeExactOut(amount, pairs, fromAsset);
          // console.log(bestExact, "---bestExact---", pairs, 999);
          if (bestExact) {
            const inAmount = bestExact.tokenAmountIn.amount.toString();
            const outAmount = bestExact.tokenAmountOut.amount.toFixed();
            // console.log(inAmount, outAmount, "===---===", amount, type, state.customerType);
            const tokenPathArray = bestExact.path;
            const routesSymbol: string[] = [];
            bestExact.path.map((v: any) => {
              const asset = props.assetsList.find(
                asset => asset.assetKey === v.chainId + '-' + v.assetId
              );
              asset && routesSymbol.push(asset.symbol);
            });
            if (isStableCoinForOthers.value) {
              const fromSymbol = state.fromAsset?.symbol as string;
              routesSymbol.unshift(fromSymbol);
            }
            state.routesSymbol = routesSymbol;
            const pairsArray = [];
            for (let i = 0; i < tokenPathArray.length - 1; i++) {
              const token0 = tokenPathArray[i];
              const token1 = tokenPathArray[i + 1];
              const key = `${token0.chainId}-${token0.assetId}_${token1.chainId}-${token1.assetId}`;
              const reverseKey = `${token1.chainId}-${token1.assetId}_${token0.chainId}-${token0.assetId}`;
              if (pairsInfo[key]) {
                pairsArray.push(pairsInfo[key]);
              } else if (pairsInfo[reverseKey]) {
                pairsArray.push(pairsInfo[reverseKey]);
              }
            }
            const fromAmount = type === "to" ? inAmount : outAmount;
            const toAmount = type === "to" ? outAmount : inAmount;
            const priceImpact = nerve.swap.getPriceImpact(
              [fromAmount, toAmount],
              tokenPathArray,
              pairsArray
            );
            return [
              divisionAndFix(outAmount, toDecimal, toDecimal),
              priceImpact.toFixed()
            ];
          } else {
            return [0, 0];
          }
        }
      }
      return [0, 0];
    }

    // 通过输入from获取最佳兑换信息
    function bestTradeExactIn(
      amount: string,
      pairs: any,
      fromAsset = state.fromAsset
    ) {
      const tokenAmountIn = nerve.swap.tokenAmount(
        fromAsset?.chainId,
        fromAsset?.assetId,
        amount
      );
      const tokenOut = nerve.swap.token(
        state.toAsset?.chainId,
        state.toAsset?.assetId
      );
      const maxPairSize = 3;
      const res = nerve.swap.bestTradeExactIn(
        config.chainId,
        pairs,
        tokenAmountIn,
        tokenOut,
        maxPairSize
      );
      if (res && Object.values(res).length) {
        return res;
      } else {
        return null;
      }
    }

    // 通过输入to 获取最佳兑换信息
    function bestTradeExactOut(
      amount: string,
      pairs: any,
      fromAsset = state.fromAsset
    ) {
      const tokenIn = nerve.swap.token(fromAsset?.chainId, fromAsset?.assetId);
      const tokenAmountOut = nerve.swap.tokenAmount(
        state.toAsset?.chainId,
        state.toAsset?.assetId,
        amount
      );
      const maxPairSize = 3;
      const res = nerve.swap.bestTradeExactOut(
        config.chainId,
        pairs,
        tokenIn,
        tokenAmountOut,
        maxPairSize
      );
      if (res && Object.values(res).length) {
        return {
          path: res.path,
          tokenAmountIn: res.tokenAmountOut,
          tokenAmountOut: res.tokenAmountIn
        };
      } else {
        return null;
      }
    }

    function getSwapRate(clear = false) {
      if (clear) {
        swapRate.value = "";
        // console.log(state.toAsset.symbol, 9888);
        return;
      }
      const fromAmount = state.fromAmount;
      const toAmount = state.toAmount;
      if (swapDirection.value === "to-from") {
        swapRate.value = `1 ${state.fromAsset?.symbol} ≈ ${formatFloat(
          Division(toAmount, fromAmount).toFixed(),
          1
        )} ${state.toAsset?.symbol}`;
      } else {
        swapRate.value = `1 ${state.toAsset?.symbol} ≈ ${formatFloat(
          Division(fromAmount, toAmount).toFixed(),
          1
        )} ${state.fromAsset?.symbol}`;
      }
    }

    const minReceive = computed(() => {
      if (!state.toAmount) return "";
      // if (!state.protectPercent) {
      //   state.protectPercent = 0.5;
      // }
      if (isStableCoinSwap.value) return state.toAmount;
      return fixNumber(
        Times(state.toAmount, 1 - Number(state.protectPercent) / 100).toFixed(),
        state.toAsset?.decimals
      );
    });

    const maxSale = computed(() => {
      // 最多卖出
      if (!state.fromAmount) return "";
      if (isStableCoinSwap.value) return state.fromAmount;
      return fixNumber(
        Times(
          state.fromAmount,
          1 + Number(state.protectPercent) / 100
        ).toFixed(),
        state.fromAsset?.decimals
      );
    });

    const fee = computed(() => {
      if (!state.fromAsset) return "";
      if (isStableCoinSwap.value) return "0";
      return fixNumber(
        Times(state.fromAmount, divisionDecimals("0.3", 2)).toFixed(),
        state.fromAsset?.decimals
      );
    });

    const swapRate = ref(""); // swap兑换比例
    const swapDirection = ref("from-to"); // 比例方向

    function toggleDirection() {
      swapDirection.value =
        swapDirection.value === "from-to" ? "to-from" : "from-to";
      getSwapRate(false);
    }

    function max(type: string) {
      if (type === "from") {
        state.fromAmount = (state.fromAsset && state.fromAsset.available) || "";
      } else {
        state.toAmount = (state.toAsset && state.toAsset.available) || "";
      }
    }

    const disableTx = computed(() => {
      return (
        !state.fromAmount ||
        !state.fromAsset?.symbol ||
        !state.toAmount ||
        !state.toAsset?.symbol ||
        state.insufficient ||
        !takerAddress.value
      );
    });
    const impactButton = ref(0);
    const priceImpactFloat = computed(() => {
      const tempPriceImpact = state.priceImpact.toString().slice(0, 6);
      let str = tofix(Times(tempPriceImpact, 100).toFixed(), 2, -1);
      // @ts-ignore
      if (Minus(str, 0.01) < 0) {
        return `<${0.01}%`;
      }
      str += "%";
      return str + "";
    });

    watch(
      () => state.priceImpact,
      val => {
        impactButton.value = 0;
        if (!val) return;
        const tempPriceImpact = state.priceImpact.toString().slice(0, 6);
        let str = tofix(Times(tempPriceImpact, 100).toFixed(), 2, -1);
        // @ts-ignore
        if (Minus(str, 10) > 0) {
          impactButton.value = 1;
        }
        // @ts-ignore
        if (Minus(str, 20) > 0) {
          impactButton.value = 2;
        }
      }
    );

    const confirmText = computed(() => {
      if (state.insufficient) {
        return t("trading.trading17");
      } else if (impactButton.value === 1) {
        return t("trading.trading19");
      } else if (impactButton.value === 2) {
        return t("trading.trading20");
      } else {
        return state.fromAmountError || t("public.public10");
      }
      // insufficient
      //     ? $t("trading.trading17")
      //     : impactButton === 1
      //         ? $t("trading.trading19")
      //         : fromAmountError || $t("public.public10")
    });

    const priceImpactColor = computed(() => {
      let { value } = priceImpactFloat;
      if (!value) return "";
      const floatNum = Division(value.split("%")[0], 100);
      // @ts-ignore
      if (Minus(floatNum, 0.003) < 0) {
        return "green";
        // @ts-ignore
      } else if (Minus(floatNum, 0.003) > 0 && Minus(floatNum, 0.03) < 0) {
        return "";
        // @ts-ignore
      } else if (Minus(floatNum, 0.03) > 0) {
        return "#c33030";
      } else {
        return "";
      }
    });

    const settingDialog = ref(false);

    function toggleExpand() {
      // if (!state.fromAsset.symbol || !state.toAsset.symbol) return;
      context.emit("toggleExpand");
    }

    function toggleSettingDialog() {
      settingDialog.value = !settingDialog.value;
    }

    function protectPercentInput(val: string) {
      let decimals = 2;
      const patrn = new RegExp(
        "^([1-9][\\d]{0,20}|0)(\\.[\\d]{0," + decimals + "})?$"
      );
      if (patrn.exec(val) || val === "") {
        if (Number(val) > 100) {
          state.protectPercent = "100";
        } else {
          state.protectPercent = val;
        }
      }
    }

    const { handleHex } = useBroadcastNerveHex();

    async function swapTrade() {
      loading.value = true;
      const fromAssetKey = state.fromAsset?.assetKey as string;
      const toAssetKey = state.toAsset?.assetKey as string;
      const fromDecimal = state.fromAsset?.decimals;
      const toDecimal = state.toAsset?.decimals;
      try {
        const fromAddress = takerAddress.value;
        const toAddress = fromAddress;
        const deadline = nerve.swap.currentTime() + 300;
        const remark = "";
        let tx;
        if (isStableCoinSwap.value) {
          // 稳定币、稳定币N互换
          const [chainId, assetId] = fromAssetKey.split("-");
          const amountIn = timesDecimals(state.fromAmount, fromDecimal);
          if (stableCoins.value[fromAssetKey] === toAssetKey) {
            // 稳定币换稳定币N
            const stableN: any = stablePairList.value.find(
              (v: any) => v.lpToken === toAssetKey
            );
            const stablePairAddress = stableN.address;
            const tokenAmounts = [
              nerve.swap.tokenAmount(+chainId, +assetId, amountIn)
            ];
            tx = await nerve.swap.stableSwapAddLiquidity(
              fromAddress,
              stablePairAddress,
              tokenAmounts,
              deadline,
              toAddress,
              remark
            );
          } else {
            // 稳定币N换稳定币
            const stableN: any = stablePairList.value.find(
              (v: any) => v.lpToken === fromAssetKey
            );
            const stablePairAddress = stableN.address;
            const tokenAmountLP = nerve.swap.tokenAmount(
              +chainId,
              +assetId,
              amountIn
            );
            const receiveOrderIndexs = await getReceiveOrderIndex(
              stablePairAddress,
              toAssetKey,
              state.fromAmount
            );
            tx = await nerve.swap.stableSwapRemoveLiquidity(
              fromAddress,
              stablePairAddress,
              tokenAmountLP,
              receiveOrderIndexs,
              deadline,
              toAddress,
              remark
            );
          }
        } else {
          const amountIn = timesDecimals(state.fromAmount, fromDecimal); // 卖出的资产数量
          const amountOutMin = timesDecimals(minReceive.value, toDecimal).split(
            "."
          )[0]; // 最小买进的资产数量
          const feeTo = null; // 交易手续费取出一部分给指定的接收地址
          if (isStableCoinForOthers.value) {
            // 稳定币换NVT
            const tokenIn = nerve.swap.token(
              state.fromAsset?.chainId,
              state.fromAsset?.assetId
            );
            const check = nerve.swap.checkStableToken(tokenIn, stablePairList.value);
            const stablePairAddress = check.address; // 稳定币交易对地址
            const lpToken = check.lpToken;
            const key = lpToken.chainId + '-' + lpToken.assetId + '_' + toAssetKey;
            const pairsInfo = storedSwapPairInfo[key];
            const pairs = Object.values(pairsInfo);
            const tokenPath = bestTradeExactIn(amountIn, pairs, lpToken).path;
            tokenPath.unshift(tokenIn);
            tx = await nerve.swap.stableLpSwapTrade(
              fromAddress,
              stablePairAddress,
              amountIn,
              tokenPath,
              amountOutMin,
              feeTo,
              deadline,
              toAddress,
              remark
            );
          } else {
            // 币币交换资产路径，路径中最后一个资产，是用户要买进的资产
            const key = fromAssetKey + "_" + toAssetKey;
            const pairsInfo = storedSwapPairInfo[key];
            const pairs = Object.values(pairsInfo);
            const bestExactIn = bestTradeExactIn(amountIn, pairs);
            const tokenPath = bestExactIn.path;
            tx = await nerve.swap.swapTrade(
              fromAddress,
              amountIn,
              tokenPath,
              amountOutMin,
              feeTo,
              deadline,
              toAddress,
              remark
            );
          }
        }
        const res: any = await handleHex(tx.hex);
        if (res && res.hash) {
          context.emit("selectAsset", state.fromAsset, state.toAsset);
          toast.success(t("transfer.transfer14"));
          state.fromAmount = "";
          state.toAmount = "";
          state.priceImpact = "";
        } else {
          toast.error("Swap Failed");
        }
      } catch (e) {
        console.log(e, "Swap-error");
        toast.error(e.message || e);
      }
      loading.value = false;
    }

    /*async function handleHex(hex) {
      const tAssemble = nerve.deserializationTx(hex);
      const transfer = new NTransfer({ chain: "NERVE" });
      const txHex = await transfer.getTxHex({
        tAssemble,
        pub: addressInfo.value?.pub,
        signAddress: addressInfo.value?.address?.Ethereum
      });
      console.log(txHex, "===txHex===");
      return await transfer.broadcastHex(txHex);
    }*/

    // 复制交易对url
    function copyPair() {
      const { fromAsset, toAsset } = state;
      const fromKey = fromAsset?.assetKey;
      const toKey = toAsset?.assetKey;
      if (!fromKey || !toKey) return;
      const defaultUrl = window.location.origin;
      const routeName = "trading"; //route.name;
      // @ts-ignore
      proxy.$copy(`${defaultUrl}/${routeName}/${fromKey}/${toKey}`);
    }

    return {
      loading,
      protectSets: ["0.5", "1", "3"],
      ...toRefs(state),
      minReceive,
      fee,
      priceImpactColor,
      selectAsset,
      max,
      disableTx,
      swapRate,
      swapDirection,
      toggleDirection,
      settingDialog,
      toggleExpand,
      toggleSettingDialog,
      swapTrade,
      forceRefresh,
      priceImpactFloat,
      changeDirection,
      customerFocus,
      maxSale,
      protectPercentInput,
      takerAddress,
      handleLoading,
      canRefresh,
      copyPair,
      impactButton,
      confirmText,
      isStableCoinForOthers,
      isStableCoinForStableCoin
    };
  }
});
</script>

<style lang="scss" scoped>
@import "../../assets/css/style.scss";

.swap {
  //width: 470px;
  width: 37%;
  min-width: 400px;
  /* height: 752px; */
  padding-bottom: 12px;
  overflow: hidden;

  .icon-wrap {
    .left {
      width: 27px;
      height: 25px;

      i {
        font-size: 22px;
        color: $labelColor;
      }
    }

    .right {
      span {
        margin-left: 15px;
        cursor: pointer;

        &:first-child {
          margin-left: 0;
          width: 22px;
          height: 22px;
          overflow: hidden;
        }

        i {
          font-size: 22px;
          color: $labelColor;
        }
      }

      .refreshing {
        transform-origin: center center;
        animation: beRotate 1.5s linear infinite;
      }
    }
  }

  .from-symbol {
    margin-top: 18px;
  }

  .change-direction {
    margin: 12px 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .exchange-rate {
    margin-top: 20px;
    margin-bottom: -5px;
    display: flex;
    justify-content: center;
    color: $labelColor;

    i {
      font-size: 16px;
      margin: 3px 0 0 5px;
      cursor: pointer;
      color: #4a5ef2;
    }

    .change-icon {
      width: 25px;
      height: 22px;
      margin-left: 10px;
      cursor: pointer;

      img {
        width: 100%;
        height: 100%;
      }
    }
  }

  .swap-area {
    .confirm-wrap {
      margin: 25px 0 30px;
    }
  }
  .stable-coin-swap-tip {
    font-size: 13px;
    text-align: center;
    margin-top: -15px;
    color: #f3a83c;
  }

  .swap-setting-info {
    border-top: 1px solid $borderColor;
    border-bottom: 1px solid $borderColor;
    padding: 18px 0;

    .info-item {
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      * {
        line-height: 1;
      }

      .left,
      .right {
        color: $labelColor;
      }

      .left,
      .right {
        font-size: 14px;
      }
    }
  }

  .setting-and-route {
    overflow: hidden;
    /* &.show {
      animation: expand 0.3s;
    } */
  }

  .swap-route {
    .name {
      padding: 12px 0;
      color: $labelColor;
    }

    .route-network {
      flex-wrap: wrap;
    }

    .route-item {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      //width: 35%;
      &:last-child {
        //width: 20%;
      }

      img {
        width: 25px;
        height: 25px;
        border-radius: 50%;
        margin-right: 5px;
      }

      span {
        font-size: 14px;
        //font-weight: 600;
        color: $labelColor;
      }

      .icon-arrow-right {
        margin: 0 10px;
        font-size: 16px;
        color: $labelColor;
      }
    }
  }

  .swap-setting {
    .content {
      .set-item {
        //margin-bottom: 40px;
      }

      .name {
        margin-bottom: 10px;
        color: $labelColor;
      }

      .protect {
        .number {
          width: 70px;
          height: 44px;
          line-height: 44px;
          text-align: center;
          color: $txColor2;
          background-color: $borderColor;
          margin-right: 20px;
          border-radius: 15px;

          &.active {
            color: #fff;
            background-color: #004884;
          }
        }
      }

      :deep(.el-input) {
        width: 100px;
        margin-right: 3px;

        .el-input__inner {
          border-radius: 10px;
          border: none;
        }
      }

      .bottom {
        padding: 0 0 20px;

        :deep(.el-button) {
          width: 185px;
          height: 48px;
          border-radius: 15px;

          &:first-child {
            margin-right: 10px;
          }
        }
      }
    }
  }

  @media screen and (max-width: 1200px) {
    padding: 20px !important;
  }
  @media screen and (max-width: 500px) {
    width: 100%;
    min-width: 100%;
    .icon-wrap .left {
      height: 23px;

      i {
        font-size: 18px;
      }
    }
    .change-direction {
      img {
        width: 28px;
        height: 28px;
      }
    }
    .swap-area .confirm-wrap {
      margin-bottom: 10px;
    }
    .stable-coin-swap-tip {
      margin-top: 0;
    }
    .swap-route {
      .route-item {
        margin-bottom: 10px;

        .icon-arrow-right {
          margin: 0 8px;
        }
      }
    }
    .swap-setting {
      .content {
        .protect {
          .number {
            height: 36px;
            line-height: 36px;
            margin-right: 10px;
          }
        }

        :deep(.el-input) {
          .el-input__inner {
            height: 36px;
            line-height: 36px;
          }
        }

        .bottom {
          padding: 0 0 20px;

          :deep(.el-button) {
            width: 185px;
            height: 48px;
            border-radius: 15px;

            &:first-child {
              margin-right: 10px;
            }
          }
        }
      }
    }
  }
}

.text-error {
  font-size: 13px;
  color: #f56c6c;
  margin-top: 10px;
}

@keyframes expand {
  0% {
    height: 0;
  }
  100% {
    height: 245px;
  }
}

//@media screen and (max-width: 1200px) {
//  .mobile-p {
//    padding: 20px !important;
//  }
//}
.deep_color {
  background-color: #c33030 !important;
  color: #ffffff;
  border: none;
}

@keyframes beRotate {
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(90deg);
  }
  50% {
    transform: rotate(180deg);
  }
  75% {
    transform: rotate(270deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
