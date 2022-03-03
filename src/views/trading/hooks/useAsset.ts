import { ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import useStoreState from "@/hooks/useStoreState";
import { DefaultAsset, AssetItem } from "../types";
import { _networkInfo } from "@/utils/heterogeneousChainConfig";
import { getStablePairListForSwapTrade } from "@/service/api";

export default function useAsset(isLiquidity = false) {
  const route = useRoute();
  const { assetsList, chain } = useStoreState();
  const defaultAsset = ref<DefaultAsset>({} as DefaultAsset);
  // url是否带有交易对查询信息
  const hasQuery = ref(false);
  let isLoaded = false;
  // 设置默认显示交易对

  const liquidityAssets = ref<AssetItem[]>([]);
  // 不能添加流动性的稳定币资产
  const stableCoins = ref({});
  onMounted(async () => {
    const res: any = await getStablePairListForSwapTrade();
    if (res) {
      res.map((v: any) => {
        Object.keys(v.groupCoin).map((coin: any) => {
          stableCoins.value[coin] = v.lpToken;
        });
      });
    }
  });
  watch(
    [assetsList, stableCoins],
    ([val, sCoins]) => {
      // 添加流动性页面资产列表不展示可swap稳定币资产
      if (val && val.length && (!isLiquidity || Object.keys(sCoins).length)) {
        if (!isLiquidity) {
          liquidityAssets.value = val.filter(v => v);
        } else {
          liquidityAssets.value = val.filter(v => {
            return !sCoins[v.assetKey];
          });
        }
        if (!isLoaded) {
          const { fromAsset, toAsset } = route.params;
          const L1Info = _networkInfo[chain.value];
          let defaultSymbol = 'NVT';
          if (L1Info?.supported) {
            // defaultSymbol = L1Info.mainAsset;
          }
          const default_eth = val.find(
            item => item.symbol === defaultSymbol
          ) as AssetItem;
          if (fromAsset || toAsset) {
            const from = val.find(item => item.assetKey === fromAsset && !sCoins[fromAsset]);
            const to = val.find(item => item.assetKey === toAsset && !sCoins[toAsset]);
            if (from || to) {
              hasQuery.value = true;
              defaultAsset.value = {
                from: from || default_eth,
                to
              };
            }
          } else {
            defaultAsset.value = {
              from: default_eth
            };
          }
          isLoaded = true;
        }
      }
    },
    {
      immediate: true,
      deep: true
    }
  );
  return {
    assetsList: liquidityAssets,
    defaultAsset,
    hasQuery
  };
}
