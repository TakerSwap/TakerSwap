import { reactive, toRefs, watch, onBeforeUnmount } from "vue";
import * as subSocket from "@/service/socket/websocket";
import config from "@/config";
import {
  Division,
  divisionAndFix,
  divisionDecimals,
  Times,
  Minus,
  fixNumber
} from "@/utils/util";
import { ETransfer } from "@/utils/api";
import { ethers } from "ethers";
import useContractAddress from "./useContractAddress";
import { abi, abiTwo, abiThree } from "@/contractConfig/contractConfig";
import { getTakerFarm, uniAssetPrice } from "@/service/api";
import useStoreState from "@/hooks/useStoreState";
import { TakerFarmItem, UserStakeFarm, FarmList, UniFarmItem } from "../types";

const url = config.WS_URL;

export default function useData(isPool: boolean) {
  const state = reactive<FarmList>({
    takerList: [],
    uniList: []
  });
  let totalUniList: UniFarmItem[] = [];
  let totalTakerList: TakerFarmItem[] = [];
  let filterType = "1"; // 排序类型 1.按照收益排名 2.按照流动性排名
  let onlySeeMortgage = false; // 只看已质押
  onBeforeUnmount(() => {
    subSocket.unListen(url, "farmListSub");
  });
  async function getFarmData(farmHash?: string) {
    const data = ((await getTakerFarm(farmHash)) || []) as TakerFarmItem[];
    const times = +new Date();
    data.map(v => {
      v.stakeAmount = "0";
      v.stakeUSD = 0;
      v.pendingRewardUSD = 0;
      v.pendingReward = "0";
      v.isLocked = Minus(Times(v.lockedTime, 1000), times).toNumber() < 0;
      v.syrupTokenBalance = fixNumber(v.syrupTokenBalance, 8);
    });
    totalTakerList = [...data];
    state.takerList = filter(data, filterType, onlySeeMortgage);
  }

  const { addressInfo, wrongChain: disableTx } = useStoreState();

  // 用户参与的farm
  function getUserFarm(farmHash?: string) {
    const address = addressInfo.value?.address?.Taker;
    if (!address) return;
    const channel = "farmListSub";
    subSocket.listen({
      url,
      channel,
      params: {
        cmd: false,
        channel: channel + ":" + address + (farmHash ? "," + farmHash : "")
      },
      success(data: UserStakeFarm[]) {
        // console.log(data, 321)
        const totalList = [...totalTakerList];
        if (totalList.length) {
          data.map(item => {
            totalList.map(v => {
              if (v.farmHash === item.farmHash) {
                const length = item.stakedTokenAmount.toString().length;
                v.apr = item.apr;
                v.stakeAmount = fixNumber(item.stakedTokenAmount, length);
                v.stakeUSD = item.stakedTokenAmountUSD;
                v.tatalStakeTokenUSD = item.tatalStakeTokenUSD;
                v.pendingRewardUSD = item.pendingRewardUSD;
                v.pendingReward = fixNumber(item.pendingReward, 8);
              }
            });
          });
        }
        state.takerList = filter(totalList, filterType, onlySeeMortgage);
      }
    });
  }

  watch(
    () => disableTx.value,
    () => {
      getUniData();
    }
  );

  const contractAddress = useContractAddress().value;

  async function getUniData() {
    if (disableTx.value) {
      state.uniList = [];
      return;
    }
    const transfer = new ETransfer();
    const provider = transfer.provider;
    // pool合约信息
    const contract = new ethers.Contract(contractAddress, abi, provider);

    const poolLengthValue = await contract.poolLength();
    const poolLength = Number(poolLengthValue.toString());

    const tokenList = [];
    const uniList = [...state.uniList];
    for (let item = 0; item < poolLength; item++) {
      const tokenInfo = {
        name: "",
        stakeTokenSymbol: "",
        syrupTokenSymbol: "",
        stakeTokenDecimals: 0,
        lpToken: "", // 质押资产合约
        candyToken: "", // 奖励资产合约
        syrupTokenBalance: "",
        pendingReward: "",
        pendingRewardUSD: "",
        stakeAmount: "",
        stakeUSD: "",
        stakedTokenAmount: "",
        tatalStakeTokenUSD: "",
        syrupTokenDecimals: 0,
        apr: "",
        lpBalance: "", // 质押资产余额
        farmHash: item + "", // taker farm 取hash，uni取index
        showDetail: false
      };

      tokenInfo.showDetail = uniList[item]?.showDetail;

      const poolInfoValue = await contract.poolInfo(item); //1.质押资产合约地址 2.奖励资产合约地址，3忽略，4：每个区块奖励的糖果总数，5：当前质押资产总量，6，奖励资产的余额（本pool）
      // 质押、奖励资产合约地址
      tokenInfo.lpToken = poolInfoValue[0];
      tokenInfo.candyToken = poolInfoValue[1];

      // 质押资产信息
      const contractTwo = new ethers.Contract(
        tokenInfo.lpToken,
        abiTwo,
        provider
      );
      tokenInfo.name = tokenInfo.stakeTokenSymbol = await contractTwo.symbol();

      const decimalsValue = await contractTwo.decimals();
      tokenInfo.stakeTokenDecimals = decimalsValue.toString();

      // 奖励资产信息
      const contractThree = new ethers.Contract(
        tokenInfo.candyToken,
        abiThree,
        provider
      );
      // 奖励资产symbol
      tokenInfo.syrupTokenSymbol = await contractThree.symbol();

      // 奖励资产精度
      const earningsDecimals = await contractThree.decimals();
      tokenInfo.syrupTokenDecimals = earningsDecimals.toString();

      // pool奖励资产剩余数量
      tokenInfo.syrupTokenBalance = divisionAndFix(
        poolInfoValue[6],
        tokenInfo.syrupTokenDecimals,
        2
      );

      const dayNumber = 5760; //每日出块数量(86400/15=5760)
      // console.log(tokenInfo, 66333)
      const candyPrice: any =
        (await uniAssetPrice(tokenInfo.syrupTokenSymbol)) || "0";
      const lpPrice: any =
        (await uniAssetPrice(tokenInfo.stakeTokenSymbol)) || "0";

      // 每天产生的奖励总价值
      const c = Times(
        Times(dayNumber, candyPrice),
        poolInfoValue[4] // 每个区块奖励的糖果总数
      ).toString();
      //const a = 365 * (5760 * 1 * 88 / tokenInfo.candyDecimals); //365 * ( 每日出块数量  * candyPrice * candyPerBlock / candyDecimals )
      const a = Times(
        "365",
        Division(c, tokenInfo.syrupTokenDecimals)
      ).toString();
      //const b = 1 * 200000 / 50;  //lpPrice 1 * lpSupply / lpDecimals
      const b = Division(
        Times(lpPrice, poolInfoValue[5]), // [5]- 当前质押总量
        tokenInfo.stakeTokenDecimals
      ).toString();
      //APR = 365 * ( 每日出块数量  * candyPrice 1 * candyPerBlock / candyDecimals )
      //除以
      //( lpPrice 1 * lpSupply / lpDecimals )
      tokenInfo.apr = b === "0" ? "0" : Division(a, b).toFixed(2);

      tokenInfo.tatalStakeTokenUSD = Times(
        lpPrice,
        divisionDecimals(poolInfoValue[5], tokenInfo.stakeTokenDecimals)
      ).toString();

      const address = addressInfo.value?.address?.Ethereum;
      if (address) {
        // 待领取收益数量
        const pendingTokenValue = await contract.pendingToken(item, address);
        tokenInfo.pendingReward = divisionDecimals(
          pendingTokenValue.toString(),
          tokenInfo.syrupTokenDecimals
        );

        // 待领取收益数量-usd
        tokenInfo.pendingRewardUSD = fixNumber(
          Times(tokenInfo.pendingReward, candyPrice).toFixed(),
          4
        );

        // console.log(tokenInfo.pendingReward, 99)

        // 已质押数量
        const userInfoValue = await contract.userInfo(item, address);
        tokenInfo.stakeAmount = fixNumber(
          divisionDecimals(
            userInfoValue[0].toString(),
            tokenInfo.stakeTokenDecimals
          ),
          8
        );

        // 已质押数量-usd
        tokenInfo.stakeUSD = fixNumber(
          Times(tokenInfo.stakeAmount, lpPrice).toFixed(),
          4
        );

        // 质押token余额
        const balanceOfValue = await contractTwo.balanceOf(address);
        tokenInfo.lpBalance = divisionDecimals(
          balanceOfValue.toString(),
          tokenInfo.stakeTokenDecimals
        );
      }
      tokenList.push(tokenInfo);
    }
    // console.log(tokenList, "===tokenList===");
    totalUniList = [...tokenList];
    state.uniList = filter(tokenList, filterType, onlySeeMortgage, true);
    // state.uniList = tokenList;
  }

  function filterList(type: string, mortgage: boolean) {
    filterType = type;
    onlySeeMortgage = mortgage;
    if (totalUniList.length) {
      state.uniList = filter([...totalUniList], type, mortgage, true);
    }
    if (totalTakerList.length) {
      const takerList = filter([...totalTakerList], type, mortgage);
      console.log(takerList, 11);
      state.takerList = takerList;
    }
  }

  function filter(list: any, type: string, mortgage: boolean, isUni?: boolean) {
    let newList = [...list];
    if (!isUni) {
      if (isPool) {
        newList = [...newList].filter(v => !v.swapPairAddress);
      } else {
        newList = [...newList].filter(v => v.swapPairAddress);
      }
    }
    if (mortgage) {
      newList = [...newList].filter(v => Number(v.stakeAmount));
    }
    const sortBy = type === "1" ? "apr" : "tatalStakeTokenUSD";
    console.log(newList, 798798)
    return [...newList].sort((a, b) => {
      return b[sortBy] - a[sortBy];
    });
  }

  return {
    ...toRefs(state),
    getFarmData,
    getUserFarm,
    getUniData,
    filterList
  };
}
