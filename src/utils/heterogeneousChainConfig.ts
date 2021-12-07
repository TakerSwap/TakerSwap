import config from "@/config";

import NULSLogo from "@/assets/img/chainLogo/NULS.png";
import NERVELogo from "@/assets/img/chainLogo/NERVE.png";
import ETHLogo from "@/assets/img/chainLogo/ETH.png";
import BSCLogo from "@/assets/img/chainLogo/BSC.svg";
import HecoLogo from "@/assets/img/chainLogo/Heco.png";
import OECLogo from "@/assets/img/chainLogo/OEC.png";
import HarmonyLogo from "@/assets/img/chainLogo/Harmony.png";
import PolygonLogo from "@/assets/img/chainLogo/Polygon.png";
import KCCLogo from "@/assets/img/chainLogo/KCC.png";

const isBeta = config.isBeta;

const NERVEOrigin = isBeta
  ? "http://beta.scan.nerve.network"
  : "https://scan.nerve.network";
const NULSOrigin = isBeta ? "http://beta.nulscan.io" : "https://nulscan.io";
const ETHOrigin = isBeta
  ? "https://ropsten.etherscan.io"
  : "https://etherscan.io";
const BSCOrigin = isBeta
  ? "https://testnet.bscscan.com"
  : "https://bscscan.com";
const HecoOrigin = isBeta
  ? "https://testnet.hecoinfo.com"
  : "https://hecoinfo.com";
const OECOrigin = isBeta
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
    mainAsset: "NULS",
    logo: NULSLogo
  },
  NERVE: {
    name: "NERVE",
    chainId: isBeta ? 5 : 9,
    origin: NERVEOrigin,
    color: "#56bff3",
    mainAsset: "NERVE",
    logo: NERVELogo
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
    logo: ETHLogo
  },
  BSC: {
    name: "BSC",
    chainId: 102,
    origin: BSCOrigin,
    color: "#e7b941",
    mainAsset: "BNB",
    ropsten: "0x61",
    homestead: "0x38",
    supported: true,
    logo: BSCLogo,
    decimals: 18,
    rpcUrl: {
      ropsten: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      homestead: "https://bsc-dataseed.binance.org/"
    }
  },
  Heco: {
    name: "Heco",
    chainId: 103,
    origin: HecoOrigin,
    color: "#336adb",
    mainAsset: "HT",
    ropsten: "0x100",
    homestead: "0x80",
    supported: true,
    logo: HecoLogo,
    decimals: 18,
    rpcUrl: {
      ropsten: "https://http-testnet.hecochain.com",
      homestead: "https://http-mainnet.hecochain.com"
    }
  },
  OEC: {
    name: "OEC",
    chainId: 104,
    origin: OECOrigin,
    color: "#4883ed",
    mainAsset: "OKT",
    ropsten: "0x41",
    homestead: "0x42",
    supported: true,
    logo: OECLogo,
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
    supported: true,
    logo: HarmonyLogo,
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
    supported: true,
    logo: PolygonLogo,
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
    supported: true,
    logo: KCCLogo,
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
