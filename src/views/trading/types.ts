import { AssetItem } from "@/store";

export { AssetItem };

export interface DefaultAsset {
  from: AssetItem;
  to?: AssetItem;
}

export interface SwapSymbol {
  from: string;
  to: string;
}

export interface OrderItem {
  fromAmount: string;
  fromSymbol: string;
  toAmount: string;
  toSymbol: string;
  status: boolean;
  time: string;
}

export interface Pager {
  index: number;
  size: number;
  total: number;
}

export interface SwapState {
  feeRate: string;
  fromAmount: string;
  toAmount: string;
  fromAsset: AssetItem | null;
  toAsset: AssetItem | null;
  fromAmountError: string;
  toAmountError: string;
  disableWatchFromAmount: boolean;
  disableWatchToAmount: boolean;
  insufficient: boolean;
  protectPercent: string;
  routesSymbol: unknown;
  fee: string;
  priceImpact: string;
  customerType: string;
  protectError: string;
  showLoading: boolean;
}

export interface TokenInfo {
  assetChainId: number;
  assetId: number;
  name: string;
  symbol: string;
  decimals: number;
}

export interface SwapPairInfo {
  token0: TokenInfo;
  token1: TokenInfo;
  reserve0: string;
  reserve1: string;
}
