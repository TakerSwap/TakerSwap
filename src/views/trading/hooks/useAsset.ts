import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import useStoreState from "@/hooks/useStoreState";
import { _networkInfo } from "@/utils/util";
import { DefaultAsset, AssetItem } from "../types";

export default function useAsset() {
  const route = useRoute();
  const { assetsList, chain } = useStoreState();
  const defaultAsset = ref<DefaultAsset>({} as DefaultAsset);
  // url是否带有交易对查询信息
  const hasQuery = ref(false);
  let isLoaded = false;
  // 设置默认显示交易对
  watch(
    assetsList,
    val => {
      if (val && val.length) {
        if (!isLoaded) {
          const { fromAsset, toAsset } = route.params;
          const L1Info = _networkInfo[chain.value];
          let defaultSymbol = "ETH";
          if (L1Info?.supported) {
            // defaultSymbol = L1Info.mainAsset;
          }
          const default_eth = val.find(
            item => item.symbol === defaultSymbol
          ) as AssetItem;
          if (fromAsset || toAsset) {
            const from = val.find(item => item.assetKey === fromAsset);
            const to = val.find(item => item.assetKey === toAsset);
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
    assetsList,
    defaultAsset,
    hasQuery
  };
}
