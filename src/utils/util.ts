import { BigNumber } from "bignumber.js";
import copy from "copy-to-clipboard";
import config from "@/config";
import storage from "@/utils/storage";
import { AssetItem, HeterogeneousInfo } from "@/store/types";
import { _networkInfo } from "@/utils/heterogeneousChainConfig";
import { getProvider } from "@/hooks/useEthereum";

interface Obj {
  [key: string]: unknown;
}

type Big = BigNumber | string | number;

export function isValidKey(
  key: string | number | symbol,
  object: Obj
): key is keyof typeof object {
  return key in object;
}

// 10的N 次方
export const Power = (arg: Big) => {
  const newPower = new BigNumber(10);
  return newPower.pow(arg);
};

// 加法
export const Plus = (nu: Big, arg: Big) => {
  const newPlus = new BigNumber(nu);
  return newPlus.plus(arg);
};

// 减法
export const Minus = (nu: Big, arg: Big) => {
  const newMinus = new BigNumber(nu);
  return newMinus.minus(arg);
};

// 乘法
export const Times = (nu: Big, arg: Big) => {
  const newTimes = new BigNumber(nu);
  return newTimes.times(arg);
};

// 除法
export const Division = (nu: Big, arg: Big) => {
  const newDiv = new BigNumber(nu);
  return newDiv.div(arg);
};

// 数字乘以精度系数
export const timesDecimals = (nu: Big, decimals = 8) => {
  return new BigNumber(Times(nu, Power(decimals.toString()).toString()))
    .toFormat()
    .replace(/[,]/g, "");
};

/**
 * 数字除以精度系数
 */
export const divisionDecimals = (nu: Big, decimals = 8) => {
  return new BigNumber(Division(nu, Power(decimals.toString()).toString()))
    .toFormat()
    .replace(/[,]/g, "");
};

export function divisionAndFix(nu: Big, decimals = 8, fix = 6) {
  const newFix = fix ? fix : Number(decimals);
  const str = new BigNumber(Division(nu, Power(decimals))).toFixed(newFix);
  const pointIndex = str.indexOf(".");
  let lastStr = str.substr(str.length - 1);
  let lastIndex = str.length;
  while (lastStr === "0" && lastIndex >= pointIndex) {
    lastStr = str.substr(lastIndex - 1, 1);
    if (lastStr === "0") {
      lastIndex = lastIndex - 1;
    }
  }
  lastIndex = str.substr(lastIndex - 1, 1) === "." ? lastIndex - 1 : lastIndex;
  return str.substring(0, lastIndex);
}

export function fixNumber(str: string, fix = 8) {
  str = "" + str;
  const int = str.split(".")[0];
  let float = str.split(".")[1];
  if (!float || !Number(float)) return int;
  float = float.slice(0, fix).replace(/(0+)$/g, "");
  return Number(float) ? int + "." + float : int;
}

/**
 * 保留指定小数位数
 * @param val 要处理的数据，Number | String
 * @param len 保留小数位数，位数不足时，以0填充
 * @param side 1|-1 对应 入|舍
 * @returns {string|number}
 */
export const tofix = (val: string, len: number, side: number) => {
  const numval = Number(val);
  if (isNaN(numval)) return 0;
  const str = val.toString();
  if (str.indexOf(".") > -1) {
    const numArr = str.split(".");
    if (numArr[1].length > len) {
      const tempnum = numval * Math.pow(10, len);
      if (!side) {
        return Number(val).toFixed(len);
      } else if (side === 1) {
        if (tempnum < 1) return 1 / Math.pow(10, len);
        return (Math.ceil(tempnum) / Math.pow(10, len)).toFixed(len);
      } else if (side === -1) {
        return (Math.floor(tempnum) / Math.pow(10, len)).toFixed(len);
      } else {
        return Number(Number(val).toFixed(len));
      }
    } else {
      return Number(str).toFixed(len);
    }
  } else {
    return Number(val).toFixed(len);
  }
};

/**
 * @disc: 复制
 * @params:
 * @date: 2021-05-21 14:19
 * @author: Wave
 */
export const copys = (val: string) => {
  return copy(val);
};

/**
 * @disc: 字符串中间显示...
 * @params:
 * @date: 2021-05-18 16:33
 * @author: Wave
 */
export const superLong = (str: string, len: number) => {
  if (str && str.length > 10) {
    return (
      str.substr(0, len) + "...." + str.substr(str.length - len, str.length)
    );
  } else {
    return str;
  }
};

export function getIconSrc(icon: string) {
  if (!icon) return "";
  if (icon.startsWith("http") || icon.startsWith("https")) return icon;
  return "https://nuls-cf.oss-us-west-1.aliyuncs.com/icon/" + icon + ".png";
}

export function genId() {
  return Math.floor(Math.random() * 1000);
}

export function getCurrentAccount(address: string | null): any {
  if (!address) return null;
  const accountList = storage.get("local", "accountList") || [];
  return accountList.find((item: any) => {
    return Object.keys(item.address).find(
      v => item.address[v].toLowerCase() === address.toLowerCase()
    );
  });
}

export function getTakerAddress(address: string): string {
  const account = getCurrentAccount(address);
  return account?.address.Taker;
}

export function createRPCParams(method: string): any {
  return {
    jsonrpc: "2.0",
    id: genId(),
    method,
    params: [config.chainId]
  };
}

export function debounce(fn: any, delay: number) {
  let timer: number;
  return function () {
    const args = arguments;
    if (timer) {
      clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      // @ts-ignore
      fn.apply(this, args);
    }, delay);
  };
}

export const isBeta = config.ETHNET === "ropsten";

// assetKey -> [chainId, assetId]
export function parseChainInfo(key: string) {
  const arr = key.split("-");
  return arr.map(v => Number(v));
}

//转千分位
export function toThousands(num: string | number) {
  if (!num) return num;
  const N = num.toString().split(".");
  const int = N[0];
  const float = N[1] ? "." + N[1] : "";
  return int.toString().replace(/(\d)(?=(?:\d{3})+$)/g, "$1,") + float;
}

// 格式化科学记数法
export function toNumberStr(num: number, digits: number) {
  // 正则匹配小数科学记数法
  if (/^(\d+(?:\.\d+)?)(e)([-]?\d+)$/.test(String(num))) {
    // 正则匹配小数点最末尾的0
    let temp = /^(\d{1,}(?:,\d{3})*\.(?:0*[1-9]+)?)(0*)?$/.exec(
      num.toFixed(digits)
    );
    if (temp) {
      return temp[1];
    } else {
      return num.toFixed(digits);
    }
  } else {
    return "" + num;
  }
}

// 小数保留有效小数位数
export function formatFloat(num: string, digit: number) {
  if (!num) return false;
  const int = num.toString().split(".")[0];
  const float = num.toString().split(".")[1];
  if (!float) return int;
  const floatArr = float.split("");
  const tempIndex = floatArr.findIndex(item => item !== "0");
  if (tempIndex > 5) {
    if (tempIndex > digit) {
      return `${int}.${float.substr(0, tempIndex + digit)}`;
    } else {
      return `${int}.${float.substr(0, digit + 1)}`;
    }
  } else {
    if (floatArr.length > 6) {
      return tofix(`${int}.${float}`, 6, 1);
    }
    return `${int}.${float}`;
  }
}

// 保留有效小数位数&小数末位进1
export function floatToCeil(num: string, decimal = 6) {
  // @ts-ignore
  return Math.ceil(num * Math.pow(10, decimal)) / Math.pow(10, decimal) + "";
}

export function isNULSOrNERVE(address: string | null) {
  if (!address) return false;
  const nulsReg = /^tNULS|NULS/;
  const nerveReg = /^TNVT|NERVE/;
  if (nulsReg.test(address)) {
    return "NULS";
  } else if (nerveReg.test(address)) {
    return "NERVE";
  } else {
    return false;
  }
}

// 检查资产是否能在L1-L2间跨链
export function checkCanToL1(asset: AssetItem): boolean {
  if (!asset.heterogeneousList) return false;
  const allowedSource = [4, 5, 6, 7, 8, 9, 11, 12];
  if (allowedSource.indexOf(asset.source) < 0) return false;
  return !!asset.heterogeneousList.find((v: HeterogeneousInfo) => {
    return Object.keys(_networkInfo).find(key => {
      if (
        _networkInfo[key].chainId === v.heterogeneousChainId &&
        _networkInfo[key].supported
      ) {
        return true;
      }
    });
  });
}

export function getChain() {
  const provider = getProvider();
  const chainId = provider?.chainId;
  if (!chainId) return null;
  let chain = '';
  Object.keys(_networkInfo).map(v => {
    if (_networkInfo[v][config.ETHNET] === chainId) {
      chain = _networkInfo[v].name;
    }
  });
  return chain;
}

// 检查资产是否能在当前L1-L2间跨链
export function checkCanToL1OnCurrent(asset: AssetItem): boolean {
  const canToL1 = checkCanToL1(asset);
  if (!canToL1) return false;
  const currentChain = getChain() as string;
  return !!asset.heterogeneousList?.find((v: HeterogeneousInfo) => {
    return _networkInfo[currentChain].chainId === v.heterogeneousChainId;
  });
}
