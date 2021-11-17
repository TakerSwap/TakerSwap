import { listen } from "@/api/promiseSocket";
import config from "@/config";

const url = config.WS_URL;

/**
 * 查询添加swap流动性的最小资产数量
 * @param data
 */
interface MinAmountForAddLiquidityParam {
  amountA: string;
  amountB: string;
  tokenAStr: string;
  tokenBStr: string;
}
export async function calMinAmountOnSwapAddLiquidity(
  data: MinAmountForAddLiquidityParam
) {
  const channel = "calMinAmountOnSwapAddLiquidity";
  const params = {
    method: channel,
    params: data
  };
  return await listen({
    url,
    channel,
    params: {
      cmd: true,
      channel: "cmd:" + JSON.stringify(params)
    }
  });
}

/**
 * 查询用户参与流动性的列表
 * @param data
 */
interface UserLiquidityListParam {
  userAddress: string;
  pageIndex?: number;
  pageSize?: number;
}
export async function userLiquidityPage(data: UserLiquidityListParam) {
  const pageIndex = data.pageIndex || 1;
  const pageSize = data.pageSize || 5;
  const channel = "userLiquidityPage";
  const params = {
    method: channel,
    params: { ...data, pageIndex, pageSize }
  };
  return await listen({
    url,
    channel,
    params: {
      cmd: true,
      channel: "cmd:" + JSON.stringify(params)
    }
  });
}

/**
 * 查询移除swap流动性的最小资产数量
 * @param data
 */
interface MinAmountForRemoveLiquidityParam {
  amountLP: string;
  tokenAStr: string;
  tokenBStr: string;
}
export async function calMinAmountOnSwapRemoveLiquidity(
  data: MinAmountForRemoveLiquidityParam
) {
  const channel = "calMinAmountOnSwapRemoveLiquidity";
  const params = {
    method: channel,
    params: data
  };
  return await listen({
    url,
    channel,
    params: {
      cmd: true,
      channel: "cmd:" + JSON.stringify(params)
    }
  });
}
