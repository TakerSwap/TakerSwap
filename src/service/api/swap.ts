import { listen } from "@/service/socket/promiseSocket";
import config from "@/config";

const url = config.WS_URL;

/**
 * 查询交易对所有可兑换路径
 * @param data
 * 例:
 * {
 *   tokenInStr: "5-1",
 *   tokenInAmount: "100000000",
 *   tokenOutStr: "2-1",
 *   maxPairSize?: 3
 * }
 */

interface WholeTradeExactInParam {
  tokenInStr: string;
  tokenInAmount: string;
  tokenOutStr: string;
  maxPairSize?: number;
}
export async function getWholeTradeExactIn(data: WholeTradeExactInParam) {
  const maxPairSize = data.maxPairSize || 3;
  const channel = "getWholeTradeExactIn";
  const params = {
    method: channel,
    params: { ...data, maxPairSize }
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
 * 查询交易对信息
 * @param data
 * 例 {
 *  tokenAStr: "5-1"
 *  tokenBStr: "2-1"
 * }
 */
interface SwapPairInfoParam {
  tokenAStr: string;
  tokenBStr: string;
}
export async function getSwapPairInfo(data: SwapPairInfoParam) {
  const channel = "getSwapPairInfo";
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
 * 用户订单历史列表
 * @param data
 * 例 {
 *  pairAddress:
 *  userAddress: "TNVTdTSPJtghfXiRzmZwPujoBcychoPctzQH2"
 *  pageIndex: 1
 *  pageSize: 3
 * }
 */
interface UserTradeHistoryParam {
  pairAddress: string;
  userAddress: string;
  pageIndex?: number;
  pageSize?: number;
}
export async function userTradeHistoryPage(data: UserTradeHistoryParam) {
  const pageIndex = data.pageIndex || 1;
  const pageSize = data.pageSize || 5;
  const channel = "userTradeHistoryPage";
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

// 查询可用于Swap交易的稳定币交易对
export async function getStablePairListForSwapTrade() {
  const channel = "getAvailableStablePairList";
  const params = {
    method: channel
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

// 查询稳定币交易队信息
export async function getStableSwapPairInfo(pairAddress: string) {
  const channel = "getStableSwapPairInfo";
  const params = {
    method: channel,
    params: {
      pairAddress
    }
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
