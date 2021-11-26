import {
  _networkInfo,
  createRPCParams,
  divisionAndFix,
  Plus,
  Times
} from "@/utils/util";
import { listen } from "@/service/socket/promiseSocket";
import config from "@/config";
import store from "@/store";

const url = config.WS_URL;

//广播hex
export async function broadcastHex(txHex: string) {
  const channel = "broadcastTx";
  // const channel = "validateTx";
  const params = createRPCParams(channel);
  params.params = params.params.concat([txHex]);
  return await listen({
    url,
    channel,
    params: {
      cmd: true,
      channel: "psrpc:" + JSON.stringify(params)
    }
  });
}

// 获取区块信息
export async function getBlockInfo() {
  const channel = "getNodeInfo";
  const params = createRPCParams(channel);
  return await listen({
    url,
    channel,
    params: {
      cmd: true,
      channel: "psrpc:" + JSON.stringify(params)
    }
  });
}

/**
 * @desc 通过symbol获取资产价格
 * @param symbol 资产symbol
 */
export async function uniAssetPrice(symbol: string) {
  const channel = "uniAssetPrice";
  const params = {
    method: channel,
    params: {
      symbol
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

/**
 * @desc 查询资产价格
 * @param chainId 资产chainId
 * @param assetId 资产assetId
 */
export async function getAssetPrice(chainId: number, assetId: number) {
  const channel = "assetPrice";
  const params = {
    method: channel,
    params: {
      chainId: Number(chainId),
      assetId: Number(assetId)
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

/**
 * @desc 查询资产详情
 * @param chainId 资产chainId
 * @param assetId 资产assetId
 * @param address 账户nerve地址
 */
export async function getAssetBalance(
  chainId: number,
  assetId: number,
  address: string
) {
  const channel = "getAccountBalance";
  const params = createRPCParams(channel);
  params.params = params.params.concat([
    Number(chainId),
    Number(assetId),
    address
  ]);
  return await listen({
    url,
    channel,
    params: {
      cmd: true,
      channel: "psrpc:" + JSON.stringify(params)
    }
  });
}

/**
 * @desc 获取账户资产列表
 * @param address 账户nerve地址
 */
export async function getAssetList(address = store.state.destroyAddress) {
  const channel = "getAccountLedgerList";
  const params = createRPCParams(channel);
  params.params.push(address);
  const res: any = await listen({
    url,
    channel,
    params: {
      cmd: true,
      channel: "psrpc:" + JSON.stringify(params)
    }
  });
  if (!res) return [];
  res.map((item: any) => {
    const decimal = item.decimals;
    item.number = divisionAndFix(item.totalBalanceStr, decimal, decimal);
    item.locking = divisionAndFix(
      Plus(item.timeLock, item.consensusLockStr).toString(),
      decimal
    );
    // item.available = divisionAndFix(item.balanceStr, decimal, decimal);
    item.valuation = Times(item.number || 0, item.usdPrice).toFixed(2);
    item.available = divisionAndFix(item.balanceStr, decimal, decimal);
    item.listAvailable = divisionAndFix(item.balanceStr, decimal, 6);
    item.originNetwork = Object.values(_networkInfo).find(
      v => v.chainId === item.registerChainId
    )?.name;
  });
  // 返回按字母排序
  const sortDataBySymbol = [...res]
    .sort((a, b) => (a.symbol.toUpperCase() < b.symbol.toUpperCase() ? 1 : -1))
    .sort((a, b) => (Number(a.available) < Number(b.available) ? 1 : -1));
  // .sort((a, b) => (a.valuation < b.valuation ? 1 : -1));
  const mainSymbol = sortDataBySymbol.find(item => item.symbol === "NVT");
  const mainSymbolIndex = sortDataBySymbol.findIndex(
    item => item.symbol === "NVT"
  );
  sortDataBySymbol.splice(mainSymbolIndex, 1);
  sortDataBySymbol.unshift(mainSymbol);
  return sortDataBySymbol;
}
