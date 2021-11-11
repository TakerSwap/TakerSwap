import nerve from "nerve-sdk-js";
import { ethers } from "ethers";
import sdk from "nerve-sdk-js/lib/api/sdk";
import { Plus, timesDecimals, Minus, createRPCParams } from "./util";
// import { request } from "./http";
const Signature = require("elliptic/lib/elliptic/ec/signature");
const txsignatures = require("nerve-sdk-js/lib/model/txsignatures");
import BufferReader from "nerve-sdk-js/lib/utils/bufferreader";
import txs from "nerve-sdk-js/lib/model/txs";
import config from "@/config";
import { getProvider } from "@/hooks/useEthereum";
import { listen, unListen } from "@/api/promiseSocket";
import { broadcastHex } from "@/model";

const url = config.WS_URL;

export class NTransfer {
  constructor(props) {
    if (!props.chain) {
      throw "未获取到交易网络，组装交易失败";
    }
    this.chain = props.chain; //链网络
    this.type = props.type; //交易类型
    this.sdk = nerve;
    this.provider = getProvider();
  }

  validateAddress(address) {
    try {
      const res = this.sdk.verifyAddress(address);
      return res.right;
    } catch (e) {
      return false;
    }
  }

  async getTxHex(data) {
    const { inputs, outputs, txData, remarks = "", pub, signAddress } = data;
    let tAssemble = data.tAssemble;
    let hash;
    if (!tAssemble) {
      // 组装交易
      tAssemble = this.sdk.transactionAssemble(
        inputs,
        outputs,
        "",
        this.type,
        txData
      );
      // 调用metamask签名hash，然后拼接公钥完成交易签名
    }
    hash = "0x" + tAssemble.getHash().toString("hex");
    let flat = await this.provider.request({
      method: "eth_sign",
      params: [signAddress, hash]
    });
    // console.log(flat, 66, signAddress)
    flat = flat.slice(2); // 去掉0x
    const r = flat.slice(0, 64);
    const s = flat.slice(64, 128);
    // const recoveryParam = flat.slice(128)
    let signature = new Signature({ r, s }).toDER("hex");
    // signature = signature.slice(2)

    const signData = this.sdk.appSplicingPub(signature, pub);
    tAssemble.signatures = signData;
    const txHex = tAssemble.txSerialize().toString("hex");
    return txHex;
  }

  async appendSignature(data) {
    const { pub, signAddress, txHexForSign } = data;
    const bufferReader = new BufferReader(Buffer.from(txHexForSign, "hex"), 0);
    // 反序列回交易对象
    const tAssemble = new txs.Transaction();
    tAssemble.parse(bufferReader);
    const hash = "0x" + tAssemble.getHash().toString("hex");

    let flat = await this.provider.request({
      method: "eth_sign",
      params: [signAddress, hash]
    });
    // console.log(flat, 66, signAddress)
    flat = flat.slice(2); // 去掉0x
    const r = flat.slice(0, 64);
    const s = flat.slice(64, 128);
    // const recoveryParam = flat.slice(128)
    let signature = new Signature({ r, s }).toDER("hex");
    // signature = signature.slice(2)
    // const signData = this.sdk.appSplicingPub(signature, pub);

    //初始化签名对象
    const txSignData = new txsignatures.TransactionSignatures();
    // // 反序列化签名对象
    const reader = new BufferReader(tAssemble.signatures, 0);
    txSignData.parse(reader);
    // 追加签名到对象中
    txSignData.addSign(Buffer.from(pub, "hex"), Buffer.from(signature, "hex"));

    tAssemble.signatures = txSignData.serialize();
    // tAssemble.signatures = signData;
    const txHex = tAssemble.txSerialize().toString("hex");
    return txHex;
  }

  async inputsOrOutputs(data) {
    if (!this.type) {
      throw "获取交易类型失败";
    }
    if (this.type === 2) {
      //链内交易
      return this.transferTransaction(data);
    } else if (this.type === 10) {
      //跨链交易
    } else if (this.type === 16) {
      //调用合约
    } else if (this.type === 43) {
      // nerve 网络提现到eth bsc
      return this.WithdrawalTransaction(data);
    }
  }

  //nuls nerve普通转账input output
  async transferTransaction(transferInfo) {
    const inputs = [],
      outputs = [];
    //转账资产nonce
    const nonce = await this.getNonce(transferInfo);
    if (!nonce) throw "获取nonce值失败";
    if (
      config.chainId === transferInfo.assetsChainId &&
      config.assetId === transferInfo.assetsId
    ) {
      // 转账资产为本链主资产, 将手续费和转账金额合成一个input
      const newAmount = Plus(transferInfo.amount, transferInfo.fee).toFixed();
      inputs.push({
        address: transferInfo.from,
        assetsChainId: transferInfo.assetsChainId,
        assetsId: transferInfo.assetsId,
        amount: newAmount,
        locked: 0,
        nonce: nonce
      });
    } else {
      const mainAssetNonce = await this.getNonce({
        from: transferInfo.from,
        assetsChainId: config.chainId,
        assetsId: config.assetId
      });
      inputs.push({
        address: transferInfo.from,
        assetsChainId: transferInfo.assetsChainId,
        assetsId: transferInfo.assetsId,
        amount: transferInfo.amount,
        locked: 0,
        nonce: transferInfo.nonce || nonce // 闪兑资产和跨链资产一样，闪兑后nonce值使用hash后16位
      });
      inputs.push({
        address: transferInfo.from,
        assetsChainId: config.chainId,
        assetsId: config.assetId,
        amount: transferInfo.fee,
        locked: 0,
        nonce: mainAssetNonce
      });
    }
    outputs.push({
      address: transferInfo.to,
      assetsChainId: transferInfo.assetsChainId,
      assetsId: transferInfo.assetsId,
      amount: transferInfo.amount,
      lockTime: 0
    });
    return { inputs, outputs };
  }

  // nerve 提现
  async WithdrawalTransaction(transferInfo) {
    let nonce;
    if (transferInfo.nonce) {
      nonce = transferInfo.nonce;
    } else {
      nonce = await this.getNonce(transferInfo);
    }
    // const nonce = await this.getNonce(transferInfo);
    const {
      from,
      assetsChainId,
      assetsId,
      amount,
      withdrawalFee,
      fee_asset,
      fee
    } = transferInfo;
    let inputs = [];
    const totalFee = Plus(withdrawalFee, fee).toFixed();
    if (fee_asset.chainId === assetsChainId && fee_asset.assetId === assetsId) {
      const newAmount = Plus(amount, totalFee).toFixed();
      inputs.push({
        address: transferInfo.from,
        amount: newAmount,
        assetsChainId,
        assetsId,
        nonce,
        locked: 0
      });
    } else {
      const mainAssetNonce = await this.getNonce({
        from: from,
        assetsChainId: fee_asset.chainId,
        assetsId: fee_asset.assetId
      });
      inputs = [
        {
          address: from,
          amount: amount,
          assetsChainId,
          assetsId,
          nonce,
          locked: 0
        },
        {
          address: from,
          amount: totalFee,
          assetsChainId: fee_asset.chainId,
          assetsId: fee_asset.assetId,
          nonce: mainAssetNonce,
          locked: 0
        }
      ];
    }
    // 系统补贴手续费地址
    const feeAddress = config.feeAddress;
    const blockHoleAddress = config.destroyAddress;
    let outputs = [
      {
        address: blockHoleAddress, //黑洞地址
        amount: amount,
        assetsChainId,
        assetsId,
        locked: 0
      },
      {
        address: feeAddress, //提现费用地址
        amount: withdrawalFee,
        assetsChainId: fee_asset.chainId,
        assetsId: fee_asset.assetId,
        locked: 0
      }
    ];
    return { inputs, outputs };
  }

  async getNonce(info) {
    const channel = "getAccountBalance";
    const params = createRPCParams(channel);
    params.params = params.params.concat([
      info.assetsChainId,
      info.assetsId,
      info.from
    ]);
    const res = await listen({
      url,
      channel,
      params: {
        cmd: true,
        channel: "psrpc:" + JSON.stringify(params)
      }
    });
    return res.nonce;
  }

  async broadcastHex(txHex) {
    return await broadcastHex(txHex);
  }
}

const RPC_URL = {
  BSC: {
    ropsten: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    homestead: "https://bsc-dataseed.binance.org/"
  },
  Heco: {
    ropsten: "https://http-testnet.hecochain.com",
    homestead: "https://http-mainnet.hecochain.com"
  },
  OKExChain: {
    ropsten: "https://exchaintestrpc.okex.org",
    homestead: "https://exchainrpc.okex.org"
  },
  Harmony: {
    ropsten: "https://api.s0.b.hmny.io",
    homestead: "https://api.harmony.one"
  },
  Polygon: {
    ropsten: "https://rpc-mumbai.maticvigil.com",
    homestead: "https://rpc-mainnet.maticvigil.com"
  },
  KCC: {
    ropsten: "https://rpc-testnet.kcc.network",
    homestead: "https://rpc-mainnet.kcc.network"
  }
};

const CROSS_OUT_ABI = [
  "function crossOut(string to, uint256 amount, address ERC20) public payable returns (bool)"
];
// token授权
const ERC20_ABI = [
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

// 查询余额
const erc20BalanceAbiFragment = [
  {
    constant: true,
    inputs: [{ name: "", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  }
];

// token转账
const erc20TransferAbiFragment = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "_to", type: "address" },
      { type: "uint256", name: "_tokens" }
    ],
    constant: false,
    outputs: [],
    payable: false
  }
];

const tokenGaslimit = 150000;
const defaultGaslimit = 35000;

export function getGasLimit(isToken) {
  return isToken ? tokenGaslimit : defaultGaslimit;
}

export class ETransfer {
  constructor(chain) {
    this.getProvider(chain);
  }

  getProvider(chain) {
    if (!chain) {
      const provider = getProvider();
      this.provider = new ethers.providers.Web3Provider(provider);
    } else {
      if (chain === "Ethereum") {
        this.provider = ethers.getDefaultProvider(config.ETHNET);
      } else {
        this.provider = new ethers.providers.JsonRpcProvider(
          RPC_URL[chain][config.ETHNET]
        );
      }
    }
  }

  decodeData(data) {
    /* const commonTransferABI = ["function transfer(address recipient, uint256 amount)"] // eth等链发起的交易
    // CROSS_OUT_ABI nerve链发起的跨链转入交易
    const ABI = fromNerve ? CROSS_OUT_ABI : commonTransferABI
    const iface = new ethers.utils.Interface(ABI);  */
    const iface = new ethers.utils.Interface([
      "function transfer(address recipient, uint256 amount)"
    ]);
    const txInfo = iface.parseTransaction({ data });
    //const decode = iface.functions["transfer(address,uint256)"].decode(data);
    // const decode = iface.decodeFunctionData("transfer(address,uint)", data);
    if (txInfo) {
      return { to: txInfo.args[0], amount: txInfo.args[1].toString() };
    }
    return null;
  }

  formatEther(value) {
    return ethers.utils.formatEther(value);
  }

  /**
   * metamask 跨链转入nerve
   * @param multySignAddress 多签地址
   * @param nerveAddress nerve地址
   * @param numbers 交易数量
   * @param fromAddress metamask地址
   * @param contractAddress ERC20合约地址
   * @param decimals token精度
   *
   */
  async crossIn(params) {
    const {
      multySignAddress,
      nerveAddress,
      numbers,
      fromAddress,
      contractAddress,
      decimals
    } = params;
    let transactionParameters;
    await this.validateAddress(multySignAddress);
    await this.validateAddress(fromAddress);
    if (contractAddress) {
      await this.validateAddress(contractAddress);
      // token 转入
      const numberOfTokens = ethers.utils.parseUnits(numbers, decimals);
      const iface = new ethers.utils.Interface(CROSS_OUT_ABI);
      const data = iface.functions.crossOut.encode([
        nerveAddress,
        numberOfTokens,
        contractAddress
      ]);
      transactionParameters = {
        gasLimit: tokenGaslimit,
        to: multySignAddress,
        from: fromAddress, //验证合约调用需要from,必传
        value: "0x00",
        data: data
      };
    } else {
      const amount = ethers.utils.parseEther(numbers);
      const iface = new ethers.utils.Interface(CROSS_OUT_ABI);
      const data = iface.functions.crossOut.encode([
        nerveAddress,
        amount,
        "0x0000000000000000000000000000000000000000"
      ]);
      transactionParameters = {
        gasLimit: defaultGaslimit,
        to: multySignAddress,
        value: amount,
        data: data
      };
    }
    const failed = await this.validate(transactionParameters);
    if (failed) {
      console.error("failed approveERC20" + failed);
      return { success: false, message: "failed crossIn" + failed };
    }
    if (transactionParameters.from) {
      delete transactionParameters.from;
    }
    return await this.sendTransaction(transactionParameters);
  }

  // 普通链内转账
  async commonTransfer(params) {
    const wallet = await this.provider.getSigner();
    const nonce = await wallet.getTransactionCount();
    if (params.contractAddress) {
      const contract = new ethers.Contract(
        params.contractAddress,
        erc20TransferAbiFragment,
        wallet
      );
      const numberOfTokens = ethers.utils.parseUnits(
        params.value,
        params.decimals
      );
      const transaction = { nonce };
      /* console.log("to: ", params.to)
      console.log("numberOfTokens: ", numberOfTokens)
      console.log("transaction: ", transaction) */
      return await contract.transfer(params.to, numberOfTokens, transaction);
    } else {
      // 非token转账
      const value = ethers.utils.parseEther(params.value);
      const transaction = { nonce, to: params.to, value };
      /* if (params.upSpeed) {
        transaction.gasPrice = await this.getSpeedUpGasPrice();
      } */
      // console.log("transaction: ", transaction)
      return await wallet.sendTransaction(transaction);
    }
  }

  getEthBalance(address) {
    let balancePromise = this.provider.getBalance(address);
    return balancePromise
      .then(balance => {
        return ethers.utils.formatEther(balance);
      })
      .catch(e => {
        // console.error('获取余额失败' + e)
        throw new Error("获取余额失败" + e);
      });
  }

  /**
   * ERC20合约余额
   * @param contractAddress ERC20合约地址
   * @param tokenDecimals token小数位数
   * @param address 账户地址
   */
  getERC20Balance(contractAddress, tokenDecimals, address) {
    let contract = new ethers.Contract(
      contractAddress,
      erc20BalanceAbiFragment,
      this.provider
    );
    let balancePromise = contract.balanceOf(address);
    return balancePromise
      .then(balance => {
        console.log(balance, 123456);
        return ethers.utils.formatUnits(balance, tokenDecimals);
      })
      .catch(e => {
        // console.error('获取ERC20余额失败' + e)
        throw new Error("获取余额失败" + e);
      });
  }

  // 地址验证
  validateAddress(account) {
    try {
      ethers.utils.getAddress(account);
      return true;
    } catch (error) {
      throw "地址校验失败";
    }
  }

  //验证交易参数
  async validate(tx) {
    try {
      const result = await this.provider.call(tx);
      return ethers.utils.toUtf8String("0x" + result.substr(138));
    } catch (e) {
      return false;
    }
  }

  async sendTransaction(transactionParameters) {
    console.log(this.provider, 99888);
    const wallet = this.provider.getSigner();
    return await wallet.sendTransaction(transactionParameters);
  }

  /**
   * 查询erc20资产授权额度
   * @param contractAddress ERC20合约地址
   * @param multySignAddress 多签地址
   * @param address 账户eth地址
   */
  async getERC20Allowance(contractAddress, multySignAddress, address) {
    const contract = new ethers.Contract(
      contractAddress,
      ERC20_ABI,
      this.provider
    );
    const allowancePromise = contract.allowance(address, multySignAddress);
    // console.log(contractAddress, multySignAddress, address, 66333)
    return allowancePromise
      .then(allowance => {
        const baseAllowance = "39600000000000000000000000000";
        //已授权额度小于baseAllowance，则需要授权
        return Minus(baseAllowance, allowance) >= 0;
      })
      .catch(e => {
        console.error("获取erc20资产授权额度失败" + e);
        return true;
      });
  }

  async approveERC20(contractAddress, multySignAddress, address) {
    await this.validateAddress(contractAddress);
    await this.validateAddress(multySignAddress);
    await this.validateAddress(address);
    const iface = new ethers.utils.Interface(ERC20_ABI);
    const data = iface.functions.approve.encode([
      multySignAddress,
      new ethers.utils.BigNumber(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ]);
    const transactionParameters = {
      to: contractAddress,
      // gasLimit: tokenGaslimit,
      from: address,
      value: "0x00",
      data: data
    };
    const failed = await this.validate(transactionParameters);
    if (failed) {
      console.error("failed approveERC20" + failed);
      return { success: false, message: "failed approveERC20" + failed };
    }
    delete transactionParameters.from; //etherjs 4.0 from参数无效 报错
    console.log(transactionParameters, 333333333333333);
    return this.sendTransaction(transactionParameters);
  }

  // 获取手续费
  getGasPrice(isToken) {
    const gasLimit = getGasLimit(isToken);
    return this.provider.getGasPrice().then(gasPrice => {
      return ethers.utils
        .formatEther(gasPrice.mul(gasLimit).toString())
        .toString();
    });
  }

  // 加速手续费
  async getSpeedUpFee(gasLimit) {
    const gasPrice = await this.getSpeedUpGasPrice();
    return ethers.utils
      .formatEther(gasPrice.mul(gasLimit).toString())
      .toString();
  }

  // 加速gasprice
  getSpeedUpGasPrice() {
    const GWEI_10 = ethers.utils.parseUnits("10", 9);
    return this.provider.getGasPrice().then(gasPrice => {
      return gasPrice.add(GWEI_10);
    });
  }


  // 提现gas
  getWithdrawGas() {
    return this.provider.getGasPrice().then(gasPrice => {
      return gasPrice;
    });
  }

  /**
   * @param mainAssetUSD 提现网络主资产USD
   * @param feeUSD 手续费USD
   * @param isToken 提现资产是否是token
   * @param feeDecimals 手续费精度
   * @param isMainAsset 手续费是否是提现网络主资产
   * @param isNVT 手续费是否是NVT
   * */
  async calWithdrawalFee(mainAssetUSD, feeUSD, isToken, feeDecimals, isMainAsset, isNVT) {
    const gasPrice = await this.getWithdrawGas();
    let gasLimit;
    if (isToken) {
      gasLimit = new ethers.utils.BigNumber("210000");
    } else {
      gasLimit = new ethers.utils.BigNumber("190000");
    }
    if (isMainAsset) {
      return this.formatEthers(gasLimit.mul(gasPrice), feeDecimals);
    }
    const feeUSDBig = ethers.utils.parseUnits(feeUSD.toString(), 6);
    const mainAssetUSDBig = ethers.utils.parseUnits(mainAssetUSD.toString(), 6);
    let result = mainAssetUSDBig
      .mul(gasPrice)
      .mul(gasLimit)
      .mul(ethers.utils.parseUnits("1", feeDecimals))
      .div(ethers.utils.parseUnits("1", 18))
      .div(feeUSDBig);
    if (isNVT) {
      // 如果是nvt，向上取整
      const numberStr = ethers.utils.formatUnits(result, feeDecimals);
      const ceil = Math.ceil(numberStr);
      result = ethers.utils.parseUnits(ceil.toString(), feeDecimals).toString();
    }
    return this.formatEthers(result, feeDecimals);
  }

  /**
   * @desc 计算提现到tron的手续费
   * @param mainAssetUSD 提现网络主资产USD
   * @param feeUSD 手续费USD
   * @param feeDecimals 手续费精度
   * @param isMainAsset 手续费为trx
   * @param isNVT 是否是NVT
   * */
  calWithdrawalFeeForTRON(mainAssetUSD = "", feeUSD = "", feeDecimals, isMainAsset, isNVT) {
    if (isMainAsset) {
      return this.formatEthers(config.trxWithdrawFee, feeDecimals);
    } else {
      const feeUSDBig = ethers.utils.parseUnits(feeUSD.toString(), 6);
      const mainAssetUSDBig = ethers.utils.parseUnits(mainAssetUSD.toString(), 6);
      let result = mainAssetUSDBig
        .mul(config.trxWithdrawFee)
        .mul(ethers.utils.parseUnits("1", feeDecimals))
        .div(ethers.utils.parseUnits("1", 6))
        .div(feeUSDBig);
      if (isNVT) {
        // 如果是nvt，向上取整
        const numberStr = ethers.utils.formatUnits(result, feeDecimals);
        const ceil = Math.ceil(numberStr);
        result = ethers.utils.parseUnits(ceil.toString(), feeDecimals).toString();
      }
      return this.formatEthers(result, feeDecimals);
    }
  }

  formatEthers(amount, decimals) {
    return ethers.utils.formatUnits(amount, decimals).toString();
  }

  /**
   * 通过自定义的eth/bnb数量 计算出相应的nvt数量
   * @param nvtUSD                            nvt的USDT价格
   * @param number                           异构链币种数量
   * @param heterogeneousChainUSD      异构链币种的USDT价格
   */
  calNvtByEth(nvtUSD, number, heterogeneousChainUSD) {
    let ethAmount = ethers.utils.parseEther(number);
    // console.log('ethAmount: ' + ethAmount.toString());
    let nvtUSDBig = ethers.utils.parseUnits(nvtUSD, 6);
    let ethUSDBig = ethers.utils.parseUnits(heterogeneousChainUSD, 6);
    let result = ethAmount
      .mul(ethUSDBig)
      .div(ethers.utils.parseUnits(nvtUSDBig.toString(), 10));
    // console.log('result: ' + result.toString());
    // console.log('result format: ' + ethers.utils.formatUnits(result, 8));
    let numberStr = ethers.utils.formatUnits(result, 8).toString();
    let ceil = Math.ceil(numberStr);
    // console.log('ceil: ' + ceil);
    let finalResult = ethers.utils.parseUnits(ceil.toString(), 8);
    // console.log('finalResult: ' + finalResult);
    return finalResult.toString();
  }
}

export async function getSymbolUSD(data = {}) {
  const { chainId = config.chainId, assetId = config.assetId } = data;

  const channel = "getBestSymbolPrice";
  const params = createRPCParams(channel);
  params.params = [chainId, assetId];
  const res = await listen({
    url,
    channel,
    params: {
      cmd: true,
      channel: "psrpc:" + JSON.stringify(params)
    }
  });
  return res;
}
