import { TokenInfo } from "@/views/trading/types";

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

