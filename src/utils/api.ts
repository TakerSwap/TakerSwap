import nerve from "nerve-sdk-js";
import { ethers } from "ethers";
import { Minus, Plus } from "./util";
// const Signature = require("elliptic/lib/elliptic/ec/signature");
// const txsignatures = require("nerve-sdk-js/lib/model/txsignatures");
// @ts-ignore
import Signature from "elliptic/lib/elliptic/ec/signature";
// @ts-ignore
import txsignatures from "nerve-sdk-js/lib/model/txsignatures";
// @ts-ignore
import BufferReader from "nerve-sdk-js/lib/utils/bufferreader";
// @ts-ignore
import txs from "nerve-sdk-js/lib/model/txs";
import config from "@/config";
import { getProvider } from "@/hooks/useEthereum";
import { broadcastHex, getAssetBalance } from "@/service/api";
import { RPC_URL } from "@/utils/heterogeneousChainConfig";

interface NProps {
  chain: "NERVE" | "NULS";
  type?: number;
}

export class NTransfer {
  chain: string;
  type?: number;
  sdk = nerve;
  provider: any;
  constructor(props: NProps) {
    if (!props.chain) {
      throw "未获取到交易网络，组装交易失败";
    }
    this.chain = props.chain; //链网络
    this.type = props.type; //交易类型
    this.sdk = nerve;
    this.provider = getProvider();
  }

  validateAddress(address: string) {
    try {
      const res = this.sdk.verifyAddress(address);
      return res.right;
    } catch (e) {
      return false;
    }
  }

  async getTxHex(data: any) {
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
    tAssemble.signatures = this.sdk.appSplicingPub(signature, pub);
    return tAssemble.txSerialize().toString("hex");
  }

  // 补充签名
  async appendSignature(data: any) {
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
    return tAssemble.txSerialize().toString("hex");
  }

  async inputsOrOutputs(data: any) {
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
  async transferTransaction(transferInfo: any) {
    const { from, to, assetsChainId, assetsId, amount, fee } = transferInfo;
    const inputs = [],
      outputs = [];
    //转账资产nonce
    const nonce = await this.getNonce(from, assetsChainId, assetsId);
    if (!nonce) throw "获取nonce值失败";
    if (config.chainId === assetsChainId && config.assetId === assetsId) {
      // 转账资产为本链主资产, 将手续费和转账金额合成一个input
      const newAmount = Plus(amount, fee).toFixed();
      inputs.push({
        address: from,
        assetsChainId,
        assetsId,
        amount: newAmount,
        locked: 0,
        nonce: nonce
      });
    } else {
      const mainAssetNonce = await this.getNonce(
        from,
        config.chainId,
        config.assetId
      );
      inputs.push({
        address: from,
        assetsChainId,
        assetsId,
        amount,
        locked: 0,
        nonce: transferInfo.nonce || nonce // 闪兑资产和跨链资产一样，闪兑后nonce值使用hash后16位
      });
      inputs.push({
        address: from,
        assetsChainId: config.chainId,
        assetsId: config.assetId,
        amount: fee,
        locked: 0,
        nonce: mainAssetNonce
      });
    }
    outputs.push({
      address: to,
      assetsChainId,
      assetsId,
      amount,
      lockTime: 0
    });
    return { inputs, outputs };
  }

  // nerve 提现
  async WithdrawalTransaction(transferInfo: any) {
    const {
      from,
      assetsChainId,
      assetsId,
      amount,
      withdrawalFee,
      fee_asset,
      fee
    } = transferInfo;
    let nonce;
    if (transferInfo.nonce) {
      nonce = transferInfo.nonce;
    } else {
      nonce = await this.getNonce(from, assetsChainId, assetsId);
    }
    let inputs = [];
    const totalFee = Plus(withdrawalFee, fee).toFixed();
    if (fee_asset.chainId === assetsChainId && fee_asset.assetId === assetsId) {
      const newAmount = Plus(amount, totalFee).toFixed();
      inputs.push({
        address: from,
        amount: newAmount,
        assetsChainId,
        assetsId,
        nonce,
        locked: 0
      });
    } else {
      const mainAssetNonce = await this.getNonce(
        from,
        fee_asset.chainId,
        fee_asset.assetId
      );
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

  async getNonce(from: string, assetsChainId: number, assetsId: number) {
    const res: any = await getAssetBalance(assetsChainId, assetsId, from);
    return res ? res.nonce : null;
  }

  async broadcastHex(txHex: string) {
    return await broadcastHex(txHex);
  }
}

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

export function getGasLimit(isToken: boolean) {
  return isToken ? tokenGaslimit : defaultGaslimit;
}

export class ETransfer {
  provider: any;
  constructor(chain?: string) {
    this.getProvider(chain);
  }

  getProvider(chain?: string) {
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

  decodeData(data: any) {
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

  formatEther(value: any) {
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
  async crossIn(params: any) {
    const {
      multySignAddress,
      nerveAddress,
      numbers,
      fromAddress,
      contractAddress,
      decimals
    } = params;
    let transactionParameters;
    this.validateAddress(multySignAddress);
    this.validateAddress(fromAddress);
    if (contractAddress) {
      this.validateAddress(contractAddress);
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
  async commonTransfer(params: any) {
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

  getEthBalance(address: string) {
    let balancePromise = this.provider.getBalance(address);
    return balancePromise
      .then((balance: any) => {
        return ethers.utils.formatEther(balance);
      })
      .catch((e: Error) => {
        // console.error('获取余额失败' + e)
        throw "获取余额失败" + e;
      });
  }

  /**
   * ERC20合约余额
   * @param contractAddress ERC20合约地址
   * @param tokenDecimals token小数位数
   * @param address 账户地址
   */
  getERC20Balance(
    contractAddress: string,
    tokenDecimals: number,
    address: string
  ) {
    let contract = new ethers.Contract(
      contractAddress,
      erc20BalanceAbiFragment,
      this.provider
    );
    let balancePromise = contract.balanceOf(address);
    return balancePromise
      .then((balance: any) => {
        // console.log(balance, 123456);
        return ethers.utils.formatUnits(balance, tokenDecimals);
      })
      .catch((e: Error) => {
        // console.error('获取ERC20余额失败' + e)
        throw "获取余额失败" + e;
      });
  }

  // 地址验证
  validateAddress(account: string) {
    try {
      ethers.utils.getAddress(account);
      return true;
    } catch (error) {
      throw "地址校验失败";
    }
  }

  //验证交易参数
  async validate(tx: any) {
    try {
      const result = await this.provider.call(tx);
      return ethers.utils.toUtf8String("0x" + result.substr(138));
    } catch (e) {
      return false;
    }
  }

  async sendTransaction(transactionParameters: any) {
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
  async getERC20Allowance(
    contractAddress: string,
    multySignAddress: string,
    address: string
  ) {
    const contract = new ethers.Contract(
      contractAddress,
      ERC20_ABI,
      this.provider
    );
    const allowancePromise = contract.allowance(address, multySignAddress);
    // console.log(contractAddress, multySignAddress, address, 66333)
    return allowancePromise
      .then((allowance: any) => {
        const baseAllowance = "39600000000000000000000000000";
        //已授权额度小于baseAllowance，则需要授权
        return Minus(baseAllowance, allowance).toNumber() >= 0;
      })
      .catch((e: Error) => {
        console.error("获取erc20资产授权额度失败" + e);
        return true;
      });
  }

  async approveERC20(
    contractAddress: string,
    multySignAddress: string,
    address: string
  ) {
    this.validateAddress(contractAddress);
    this.validateAddress(multySignAddress);
    this.validateAddress(address);
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
    // @ts-ignore
    delete transactionParameters.from; //etherjs 4.0 from参数无效 报错
    // console.log(transactionParameters, 333333333333333);
    return this.sendTransaction(transactionParameters);
  }

  // 获取手续费
  getGasPrice(isToken: boolean) {
    const gasLimit = getGasLimit(isToken);
    return this.provider.getGasPrice().then((gasPrice: any) => {
      return ethers.utils
        .formatEther(gasPrice.mul(gasLimit).toString())
        .toString();
    });
  }

  // 加速手续费
  async getSpeedUpFee(gasLimit: string) {
    const gasPrice = await this.getSpeedUpGasPrice();
    return ethers.utils
      .formatEther(gasPrice.mul(gasLimit).toString())
      .toString();
  }

  // 加速gasprice
  getSpeedUpGasPrice() {
    const GWEI_10 = ethers.utils.parseUnits("10", 9);
    return this.provider.getGasPrice().then((gasPrice: any) => {
      return gasPrice.add(GWEI_10);
    });
  }

  // 提现gas
  getWithdrawGas() {
    return this.provider.getGasPrice().then((gasPrice: any) => {
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
   * @param isTRX 手续费是否是TRX
   * */
  async calWithdrawalFee(
    mainAssetUSD: string,
    feeUSD: string,
    isToken: boolean,
    feeDecimals: number,
    isMainAsset: boolean,
    isNVT?: boolean,
    isTRX?: boolean
  ) {
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
    let result: any = mainAssetUSDBig
      .mul(gasPrice)
      .mul(gasLimit)
      .mul(ethers.utils.parseUnits("1", feeDecimals))
      .div(ethers.utils.parseUnits("1", 18))
      .div(feeUSDBig);
    if (isNVT || isTRX) {
      // 如果是nvt，向上取整
      const numberStr = ethers.utils.formatUnits(result, feeDecimals);
      const ceil = Math.ceil(+numberStr);
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
  calWithdrawalFeeForTRON(
    mainAssetUSD = "",
    feeUSD = "",
    feeDecimals: number,
    isMainAsset: boolean,
    isNVT?: boolean
  ) {
    if (isMainAsset) {
      return this.formatEthers(config.trxWithdrawFee, feeDecimals);
    } else {
      const feeUSDBig = ethers.utils.parseUnits(feeUSD.toString(), 6);
      const mainAssetUSDBig = ethers.utils.parseUnits(
        mainAssetUSD.toString(),
        6
      );
      let result: any = mainAssetUSDBig
        .mul(config.trxWithdrawFee)
        .mul(ethers.utils.parseUnits("1", feeDecimals))
        .div(ethers.utils.parseUnits("1", 6))
        .div(feeUSDBig);
      if (isNVT) {
        // 如果是nvt，向上取整
        const numberStr = ethers.utils.formatUnits(result, feeDecimals);
        const ceil = Math.ceil(+numberStr);
        result = ethers.utils
          .parseUnits(ceil.toString(), feeDecimals)
          .toString();
      }
      return this.formatEthers(result, feeDecimals);
    }
  }

  formatEthers(amount: any, decimals: number) {
    return ethers.utils.formatUnits(amount, decimals).toString();
  }
}
