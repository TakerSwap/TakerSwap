import { reactive, ref } from "vue";
import useStoreState from "@/hooks/useStoreState";
import { AssetItem } from "@/store";
import nerve from "nerve-sdk-js";
import config from "@/config";
import { userTradeHistoryPage } from "@/service/api";
import dayjs from "dayjs";
import { divisionDecimals } from "@/api/util";
import { SwapSymbol, OrderItem, Pager } from "../types";

export default function useSelectAsset() {
  const { talonAddress } = useStoreState();
  let selectedAsset = null;
  const swapSymbol = ref<SwapSymbol>({} as SwapSymbol);
  const orderList = ref<OrderItem[]>([] as OrderItem[]);
  const pager = reactive<Pager>({
    index: 1,
    size: 5,
    total: 0
  });
  async function selectAsset(fromAsset?: AssetItem, toAsset?: AssetItem) {
    if (!talonAddress.value || !fromAsset || !toAsset) return;
    selectedAsset = {
      from: fromAsset,
      to: toAsset
    };
    swapSymbol.value = {
      from: fromAsset.symbol,
      to: toAsset.symbol
    };
    const fromToken = nerve.swap.token(fromAsset.chainId, fromAsset.assetId);
    const toToken = nerve.swap.token(toAsset.chainId, toAsset.assetId);
    const pairAddress = nerve.swap.getStringPairAddress(
      config.chainId,
      fromToken,
      toToken
    );
    const data = {
      pairAddress,
      userAddress: talonAddress.value,
      pageIndex: pager.index,
      pageSize: pager.size
    };
    // state.orderLoading = true;
    const res: any = await userTradeHistoryPage(data);
    // state.orderLoading = false;
    if (res) {
      pager.total = res.total || 0;
      const list: OrderItem[] = [];
      res.list.map((v: any) => {
        const fromToken = v.paidTokenAmount.token;
        const fromAmount = v.paidTokenAmount.amount;
        const toToken = v.receivedTokenAmount.token;
        const toAmount = v.receivedTokenAmount.amount;
        list.push({
          time: dayjs(v.txTime * 1000).format("MM-DD HH:mm"),
          fromAmount: divisionDecimals(fromAmount, fromToken.decimals),
          fromSymbol: fromToken.symbol,
          toAmount: divisionDecimals(toAmount, toToken.decimals),
          toSymbol: toToken.symbol,
          status: true
        });
      });
      orderList.value = list;
    }
  }
  return {
    swapSymbol,
    orderList,
    pager,
    selectAsset,
    selectedAsset
  };
}
