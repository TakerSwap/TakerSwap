import { ref, watch } from "vue";
import useStoreState from "@/hooks/useStoreState";
import { AssetItemType } from "../types";
import { Minus } from "@/utils/util";
import { _networkInfo } from "@/utils/heterogeneousChainConfig";

export default function useAssetsList() {
  const loading = ref(false);
  let loaded = false;
  const allAssetsList = ref<AssetItemType[]>([]); // L2 所有资产
  const selectAssets = ref<AssetItemType[]>([]); // 勾选显示的资产
  const crossInOutSymbol = ref<AssetItemType[]>([]); // 支持的L1-L2间跨链的资产
  // const tableData = ref<AssetItemType[]>([]); // 支持的L1-L2间跨链的资产
  const {
    assetsList,
    addressInfo: currentAccount,
    chain: network
  } = useStoreState();

  watch(
    () => assetsList.value,
    val => {
      if (val && val.length) {
        getList(val);
      } else {
        getList([]);
      }
    },
    {
      immediate: true
    }
  );

  let sortDataByValue: AssetItemType[] = [];
  function getList(list: AssetItemType[]) {
    loading.value = !loaded;
    list.map(v => {
      const exist = allAssetsList.value.find(
        item => v.assetKey === item.assetKey
      );
      v.showDetail = exist ? exist.showDetail : false;
    });
    sortDataByValue = [...list].sort((a, b) => {
      return Minus(a.valuation, b.valuation).toNumber() > 0 ? -1 : 1;
    });
    crossInOutSymbol.value = [...list].filter(item => {
      if (!item.heterogeneousList) {
        return false;
      } else {
        let supportedChain = false;
        item.heterogeneousList.map(v => {
          Object.keys(_networkInfo).map(key => {
            if (
              _networkInfo[key].chainId === v.heterogeneousChainId &&
              key === network.value
            ) {
              supportedChain = true;
            }
          });
        });
        return supportedChain;
      }
    });
    allAssetsList.value = list;
    filterAssets();
    loaded = true;
    loading.value = false;
  }

  // 过滤出table展示的资产列表
  function filterAssets() {
    let result: AssetItemType[] = [];
    if (currentAccount.value.visiableAssets) {
      sortDataByValue.map(v =>
        currentAccount.value.visiableAssets?.map(item => {
          if (item === v.assetKey) {
            result.push(v);
          }
        })
      );
    } else {
      const defaultSymbol = ["ETH", "USDT", "USDC"];
      result = sortDataByValue.filter(
        v => defaultSymbol.indexOf(v.symbol) > -1
      );
    }
    selectAssets.value = result;
  }

  // 展开、收起资产详情
  function assetClick(item: AssetItemType) {
    for (let asset of selectAssets.value) {
      if (item.assetKey === asset.assetKey) {
        item.showDetail = !item.showDetail;
      } else {
        asset.showDetail = false;
      }
    }
  }

  return {
    loading,
    allAssetsList,
    selectAssets,
    crossInOutSymbol,
    filterAssets,
    assetClick
  };
}
