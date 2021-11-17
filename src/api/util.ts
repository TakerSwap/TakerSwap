import { BigNumber } from "bignumber.js";
import copy from "copy-to-clipboard";
import config from "@/config";

import ethLogo from "@/assets/img/eth-logo.png";
import bscLogo from "@/assets/img/BSC.svg";

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
export const timesDecimals = (nu: string, decimals = 8) => {
  if (decimals === 0) {
    return nu;
  }
  return new BigNumber(Times(nu, Power(decimals.toString()).toString()))
    .toFormat()
    .replace(/[,]/g, "");
};

/**
 * 数字除以精度系数
 */
export const divisionDecimals = (nu: string, decimals = 8) => {
  if (decimals === 0) {
    return nu;
  }
  return new BigNumber(Division(nu, Power(decimals.toString()).toString()))
    .toFormat()
    .replace(/[,]/g, "");
};

export function divisionAndFix(nu: string, decimals = 8, fix = 6) {
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

export const chainToSymbol = {
  NULS: "NULS",
  NERVE: "NVT",
  Ethereum: "ETH",
  BSC: "BNB",
  Heco: "HT",
  OKExChain: "OKT"
};

export function getIconSrc(icon: string) {
  return "https://nuls-cf.oss-us-west-1.aliyuncs.com/icon/" + icon + ".png";
}

export function genId() {
  return Math.floor(Math.random() * 1000);
}

export function getCurrentAccount(address: string | null): any {
  if (!address) return null;
  const accountList =
    JSON.parse(localStorage.getItem("accountList") || "null") || [];
  const currentAccount = accountList.find((item: any) => {
    return Object.keys(item.address).find(
      v => item.address[v].toLowerCase() === address.toLowerCase()
    );
  });
  return currentAccount;
}

export function getTalonAddress(address: string): string {
  const account = getCurrentAccount(address);
  return account?.address.Talon;
}

export const supportChainList = [
  // { label: "NERVE", value: "NERVE", symbol: "NVT", chainId: config.chainId, assetId: 1 },
  {
    label: "Ethereum",
    value: "Ethereum",
    symbol: "ETH",
    ropsten: "0x3",
    homestead: "0x1",
    chainId: 101,
    assetId: 1
  },
  {
    label: "BSC",
    value: "BSC",
    symbol: "BNB",
    ropsten: "0x61",
    homestead: "0x38",
    chainId: 102,
    assetId: 1
  },
  {
    label: "Heco",
    value: "Heco",
    symbol: "HT",
    ropsten: "0x100",
    homestead: "0x80",
    chainId: 103,
    assetId: 1
  },
  {
    label: "OKExChain",
    value: "OKExChain",
    symbol: "OKT",
    ropsten: "0x41",
    homestead: "0x42",
    chainId: 104,
    assetId: 1
  }
];

export function createRPCParams(method: string): any {
  return {
    jsonrpc: "2.0",
    id: genId(),
    method,
    params: [config.chainId]
  };
}

export function debounce(fn: any, delay: number) {
  let timer: any;
  return function () {
    const args = arguments;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      // @ts-ignore
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

export const isBeta = config.ETHNET === "ropsten";

const NERVEOrigin = isBeta
  ? "http://beta.scan.nerve.network"
  : "https://scan.nerve.network";
const NULSOrigin = isBeta ? "http://beta.nulscan.io" : "https://nulscan.io";
const ETHOrigin = isBeta
  ? "https://ropsten.etherscan.io"
  : "https://etherscan.io";
const BNBOrigin = isBeta
  ? "https://testnet.bscscan.com"
  : "https://bscscan.com";
const HTOrigin = isBeta
  ? "https://testnet.hecoinfo.com"
  : "https://hecoinfo.com";
const OKOrigin = isBeta
  ? "https://www.oklink.com/okexchain-test"
  : "https://www.oklink.com/okexchain";
const HarmonyOrigin = isBeta
  ? "https://explorer.pops.one"
  : "https://explorer.harmony.one";
const PolygonOrigin = isBeta
  ? "https://mumbai.polygonscan.com"
  : "https://polygonscan.com";
const KCCOrigin = isBeta
  ? "https://scan-testnet.kcc.network"
  : "https://explorer.kcc.io";
const TRXOrigin = isBeta
  ? "https://shasta.tronscan.org/#"
  : "https://tronscan.org/#";

export const _networkInfo = {
 NULS: {
    name: "NULS",
    chainId: isBeta ? 2 : 1,
    origin: NULSOrigin,
    color: "#00da9d",
    mainAsset: "NULS"
  },
  NERVE: {
    name: "NERVE",
    chainId: isBeta ? 5 : 9,
    origin: NERVEOrigin,
    color: "#56bff3",
    mainAsset: "NERVE"
  },
  Ethereum: {
    name: "Ethereum",
    chainId: 101,
    origin: ETHOrigin,
    color: "#5e5e5e",
    mainAsset: "ETH",
    ropsten: "0x3",
    homestead: "0x1",
    supported: true,
    logo: ethLogo
  },
  BSC: {
    name: "BSC",
    chainId: 102,
    origin: BNBOrigin,
    color: "#e7b941",
    mainAsset: "BNB",
    ropsten: "0x61",
    homestead: "0x38",
    supported: true,
    logo: bscLogo,
    decimals: 18,
    rpcUrl: {
      ropsten: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      homestead: "https://bsc-dataseed.binance.org/"
    }
  },
  Heco: {
    name: "Heco",
    chainId: 103,
    origin: HTOrigin,
    color: "#336adb",
    mainAsset: "HT",
    ropsten: "0x100",
    homestead: "0x80",
    decimals: 18,
    rpcUrl: {
      ropsten: "https://http-testnet.hecochain.com",
      homestead: "https://http-mainnet.hecochain.com"
    }
  },
  OKExChain: {
    name: "OKExChain",
    chainId: 104,
    origin: OKOrigin,
    color: "#4883ed",
    mainAsset: "OKT",
    ropsten: "0x41",
    homestead: "0x42",
    decimals: 18,
    rpcUrl: {
      ropsten: "https://exchaintestrpc.okex.org",
      homestead: "https://exchainrpc.okex.org"
    }
  },
  Harmony: {
    name: "Harmony",
    chainId: 105,
    origin: HarmonyOrigin,
    color: "#5cc9c0",
    mainAsset: "ONE",
    ropsten: "0x6357d2e0",
    homestead: "0x63564c40",
    decimals: 18,
    rpcUrl: {
      ropsten: "https://api.s0.b.hmny.io",
      homestead: "https://api.harmony.one"
    }
  },
  Polygon: {
    name: "Polygon",
    chainId: 106,
    origin: PolygonOrigin,
    color: "#7449df",
    mainAsset: "MATIC",
    ropsten: "0x13881",
    homestead: "0x89",
    decimals: 18,
    rpcUrl: {
      ropsten: "https://rpc-mumbai.maticvigil.com",
      homestead: "https://rpc-mainnet.maticvigil.com"
    }
  },
  KCC: {
    name: "KCC",
    chainId: 107,
    origin: KCCOrigin,
    color: "#66ac90",
    mainAsset: "KCS",
    ropsten: "0x142",
    homestead: "0x141",
    decimals: 18,
    rpcUrl: {
      ropsten: "https://rpc-testnet.kcc.network",
      homestead: "https://rpc-mainnet.kcc.network"
    }
  },
  TRON: {
    name: "TRON",
    chainId: 108,
    origin: TRXOrigin,
    color: "#c23631",
    mainAsset: "TRX",
    ropsten: "",
    homestead: "",
    decimals: 6
  }
};

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
  return Math.ceil(num * Math.pow(10, decimal)) / Math.pow(10, decimal);
}
