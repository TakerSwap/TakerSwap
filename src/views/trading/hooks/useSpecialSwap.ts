import { ref, onMounted } from "vue";
import { Minus, divisionDecimals } from "@/utils/util";
import config from "@/config";
import {
  getStablePairListForSwapTrade,
  getStableSwapPairInfo
} from "@/service/api";

const NVT_KEY = config.chainId + "-" + config.assetId;

// U换nvt、U换USDTN
export default function useSpecialSwap() {
  const isStableCoinForNVT = ref(false); // 是否是稳定币换NVT
  const isStableCoinSwap = ref(false); // 稳定币、稳定币N互换
  const stableCoins = ref({}); // {稳定币: 稳定币+'N'}
  const stablePairList = ref([]);
  const getStablePairList = async () => {
    const res: any = await getStablePairListForSwapTrade();
    if (res) {
      stablePairList.value = res;
      res.map((v: any) => {
        Object.keys(v.groupCoin).map((coin: any) => {
          stableCoins.value[coin] = v.lpToken;
        });
      });
    }
  };
  onMounted(getStablePairList);

  // 判读是否是稳定币换NVT
  function checkIsStableCoinForNVT(token1Key?: string, token2Key?: string) {
    if (!token1Key || !token2Key) {
      isStableCoinForNVT.value = false;
    } else {
      isStableCoinForNVT.value =
        !!stableCoins.value[token1Key] && token2Key === NVT_KEY;
    }
  }

  // 判断是否是稳定币、稳定币N互换
  function checkIsStableCoinSwap(fromKey?: string, toKey?: string) {
    if (!fromKey || !toKey) {
      isStableCoinSwap.value = false;
    } else {
      isStableCoinSwap.value =
        stableCoins.value[fromKey] === toKey ||
        stableCoins.value[toKey] === fromKey;
    }
  }

  async function getReceiveOrderIndex(
    pairAddress: string,
    assetKey: string,
    amount: string
  ) {
    const res: any = await getStableSwapPairInfo(pairAddress);
    if (res) {
      const index = res.coins.findIndex(
        (v: any) => v.assetChainId + "-" + v.assetId === assetKey
      );
      // console.log(index, res, amount);
      if (index !== -1) {
        const balance = divisionDecimals(
          res.balances[index],
          res.coins[index].decimals
        );
        if (Minus(amount, balance).toNumber() > 0) {
          throw "Insufficient pool balance";
        }
        const arr = new Array(res.coins.length).fill(1).map((v, i) => i);
        return arr.splice(index, 1).concat(arr);
      }
      return [];
    } else {
      return [];
    }
  }

  return {
    isStableCoinForNVT,
    isStableCoinSwap,
    stableCoins,
    stablePairList,
    checkIsStableCoinForNVT,
    checkIsStableCoinSwap,
    getReceiveOrderIndex
  };
}