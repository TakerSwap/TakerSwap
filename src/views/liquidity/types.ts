import { AssetItem, TokenInfo } from "@/views/trading/types";

export { AssetItem };

interface LpTokenInfo {
  token: TokenInfo;
  amount: string;
}
export interface LiquidityItem {
  amount: string;
  amountSlice: string;
  pairAddress: string;
  showDetail: boolean;
  token0: TokenInfo;
  token1: TokenInfo;
  lpTokenAmount: LpTokenInfo;
}

export interface AddLiquidityState {
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
  loading: boolean;
  disableCreate: boolean;
}
