<template>
  <div class="w1300 home">
    <div class="pc-cont">
      <div class="overview-total lh_1">
        {{ $t("home.home1") }}${{ rewardInfo.locked }}
      </div>
      <div class="info-top pd_40">
        <div class="title">{{ $t("home.home2") }}</div>
        <div class="flex-center info-wrap">
          <div class="info-item">
            <p class="label">{{ $t("home.home3") }}</p>
            <p class="value">${{ $thousands(overviewData.priceUSD) }}</p>
          </div>
          <div class="info-item">
            <p class="label">{{ $t("home.home4") }}</p>
            <p class="value">{{ $thousands(overviewData.circulation) }}</p>
          </div>
          <div class="info-item">
            <p class="label">{{ $t("home.home5") }}</p>
            <p class="value">{{ $thousands(overviewData.destroyed) }}</p>
          </div>
          <div class="info-item">
            <p class="label">{{ $t("home.home6") }}</p>
            <p class="value">{{ $thousands(overviewData.totalAmount) }}</p>
          </div>
        </div>
      </div>
      <div class="info-middle">
        <div class="left">
          <div class="left-top pd_40">
            <div>
              <div class="title">
                {{ $t("home.home7") }}
              </div>
              <p>${{ $thousands(rewardInfo.received) }}</p>
            </div>
            <div class="flex1-tr">
              <i class="iconfont icon-yilingjiangli"></i>
            </div>
          </div>
          <div class="left-bottom pd_40">
            <div>
              <div class="title">
                {{ $t("home.home8") }}
              </div>
              <p>${{ $thousands(rewardInfo.unclaimed) }}</p>
            </div>
            <div class="flex1-tr">
              <span class="icon-wrap">
                <i class="iconfont icon-dailingjiangli"></i>
              </span>
            </div>
          </div>
          <div class="right_block pd_40">
            <div class="title">
              Farm
              <span class="more" @click="toUrl">
                {{ $t("home.home9") }}
                <el-icon><arrow-right /></el-icon>
              </span>
            </div>
            <div class="farm-list">
              <div
                class="farm-item"
                v-for="item in farmList"
                :key="item.farmHash"
              >
                <div class="coin_name">
                  {{ item.name }}
                </div>
                <div class="farm-info">
                  <div>
                    <div class="label">APR</div>
                    <p class="value">{{ item.apr }}%</p>
                  </div>
                  <div>
                    <div class="label">{{ $t("home.home10") }}</div>
                    <p class="value">{{ item.syrupTokenSymbol }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="right pd_40">
          <div class="title">
            Farm
            <span class="more" @click="toUrl">
              {{ $t("home.home9") }}
              <el-icon><arrow-right /></el-icon>
            </span>
          </div>
          <div class="farm-list">
            <div
              class="farm-item"
              v-for="item in farmList"
              :key="item.farmHash"
            >
              <farm-symbol
                class="farm-symbol"
                :imgList="item.logoList"
                :name="item.name"
              ></farm-symbol>
              <div class="farm-info">
                <div>
                  <div class="label">APR</div>
                  <p class="value">{{ item.apr }}%</p>
                </div>
                <div>
                  <div class="label">{{ $t("home.home10") }}</div>
                  <p class="value">{{ item.syrupTokenSymbol }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="info-bottom pd_40 flex-center">
        <div class="info-item">
          <p class="label">{{ $t("home.home12") }}</p>
          <p class="value">${{ $thousands(txInfo.amount) }}</p>
        </div>
        <div class="info-item">
          <p class="label">{{ $t("home.home13") }}</p>
          <p class="value">{{ $thousands(txInfo.count) }}</p>
        </div>
        <div class="info-item">
          <p class="label">{{ $t("home.home14") }}</p>
          <p class="value">${{ $thousands(txInfo.fee) }}</p>
        </div>
      </div>
    </div>
    <div class="mobile-cont">
      <div class="mobile-total">
        <div class="text-3a size-15 font-bold">{{ $t("home.home2") }}</div>
        <div class="d-flex align-items-center space-between size-14 mt-16">
          <span class="text-7e">{{ $t("home.home3") }}</span>
          <span>${{ $thousands(overviewData.priceUSD) }}</span>
        </div>
        <div class="d-flex align-items-center space-between size-14 mt-16">
          <span class="text-7e">{{ $t("home.home4") }}</span>
          <span>{{ $thousands(overviewData.circulation) }}</span>
        </div>
        <div class="d-flex align-items-center space-between size-14 mt-16">
          <span class="text-7e">{{ $t("home.home5") }}</span>
          <span>{{ $thousands(overviewData.destroyed) }}</span>
        </div>
        <div class="d-flex align-items-center space-between size-14 mt-16">
          <span class="text-7e">{{ $t("home.home6") }}</span>
          <span>{{ $thousands(overviewData.totalAmount) }}</span>
        </div>
      </div>
      <div class="mobile-total d-flex space-between align-items-center mt-15">
        <div class="font-bold">
          <div class="size-15">{{ $t("home.home7") }}</div>
          <div class="size-19 mt-15">
            ${{ $thousands(rewardInfo.received) }}
          </div>
        </div>
        <div class="img-cont">
          <i class="iconfont icon-yilingjiangli"></i>
        </div>
      </div>
      <div class="mobile-total d-flex space-between align-items-center mt-15">
        <div class="font-bold">
          <div class="size-15">{{ $t("home.home8") }}</div>
          <div class="size-19 mt-15">
            ${{ $thousands(rewardInfo.unclaimed) }}
          </div>
        </div>
        <div class="img-cont rotate-30 mt-15">
          <i class="iconfont icon-dailingjiangli"></i>
        </div>
      </div>
      <div class="mobile-total mt-15">
        <div class="d-flex space-between">
          <span class="text-3a size-15 font-bold">Farm</span>
          <span class="text-4a size-14" @click="toUrl">
            {{ $t("home.home9") }}
          </span>
        </div>
        <div class="d-flex text-7e mt-15 size-14">
          <span class="flex-1">LP</span>
          <span class="flex-1">{{ $t("home.home10") }}</span>
          <span class="text-right w-90">APR</span>
        </div>
        <div
          class="d-flex text-3a mt-16 size-14"
          v-for="item in farmList"
          :key="item.farmHash"
        >
          <span class="flex-1">{{ item.name }}</span>
          <span class="flex-1">{{ item.syrupTokenSymbol }}</span>
          <span class="text-right w-90">{{ item.apr }}%</span>
        </div>
      </div>
      <div class="mobile-total mt-15">
        <div class="d-flex align-items-center space-between size-14">
          <span class="text-7e">{{ $t("home.home12") }}</span>
          <span>{{ $thousands(txInfo.amount) }}</span>
        </div>
        <div class="d-flex align-items-center space-between size-14 mt-16">
          <span class="text-7e">{{ $t("home.home13") }}</span>
          <span>{{ $thousands(txInfo.count) }}</span>
        </div>
        <div class="d-flex align-items-center space-between size-14 mt-16">
          <span class="text-7e">{{ $t("home.home14") }}</span>
          <span>{{ $thousands(txInfo.fee) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FarmSymbol from "@/views/farm/FarmSymbol.vue";
import { listen } from "@/service/socket/websocket";
import config from "@/config";
import { genId, divisionDecimals } from "@/utils/util";

const url = config.WS_URL;

export default {
  name: "Home",
  components: {
    FarmSymbol
  },
  props: {},
  data() {
    return {
      loading: null,
      overviewData: {},
      rewardInfo: {},
      farmList: [],
      txInfo: {},
      dialogLoading: false,
      addLpInfo: {},
      lpBalance: ""
    };
  },
  computed: {
    takerAddress() {
      return this.$store.state.addressInfo?.address?.Taker;
    }
  },
  mounted() {
    /*this.loading = this.$loading({
      // lock: true,
      // text: "Loading",
      // spinner: "el-icon-loading",
      target: ".home",
      body: false,
      background: "rgba(0, 0, 0, 0.7)"
    });*/
    this.getOverview();
    this.getRewardInfo();
    this.getFarmInfo();
    this.getTxInfo();
  },
  methods: {
    getOverview() {
      const channel = "mainAssetInfo";
      const params = {
        method: channel
      };
      listen({
        url,
        channel,
        params: {
          cmd: true,
          channel: "cmd:" + JSON.stringify(params)
        },
        success: data => {
          console.log(data, "mainAssetInfo");
          const decimal = data.decimals;
          this.overviewData = {
            priceUSD: data.priceUSD,
            circulation: divisionDecimals(data.circulation, decimal).split(".")[0],
            destroyed: divisionDecimals(data.destroyed, decimal).split(".")[0],
            totalAmount: divisionDecimals(data.totalAmount, decimal).split(".")[0]
          };
          // this.loading.close();
        }
      });
    },
    getRewardInfo() {
      const channel = "rewardSummary";
      const params = {
        method: channel,
        id: genId()
      };
      listen({
        url,
        channel,
        params: {
          cmd: true,
          channel: "cmd:" + JSON.stringify(params)
        },
        success: data => {
          console.log(data, 999)
          for (let i in data) {
            data[i] = data[i].toString().split(".")[0];
          }
          this.rewardInfo = data;
        }
      });
    },
    getFarmInfo() {
      const channel = "farmPage";
      const params = {
        method: channel,
        id: genId(),
        params: {
          pageIndex: 1,
          pageSize: 3,
          orderby: "apr"
        }
      };
      listen({
        url,
        channel,
        params: {
          cmd: true,
          channel: "cmd:" + JSON.stringify(params)
        },
        success: data => {
          data.map(v => {
            v.logoList = v.logo2 ? [v.logo, v.logo2] : [v.logo];
            v.stakeAmount = 0;
            v.stakeUSD = 0;
            v.pendingRewardUSD = 0;
            v.pendingReward = 0;
          });
          this.farmList = data;
        }
      });
    },
    getTxInfo() {
      const channel = "tradingVolume";
      listen({
        url,
        channel,
        params: {
          cmd: false,
          channel
        },
        success: data => {
          this.txInfo = {
            ...data,
            amount: divisionDecimals(data.amount, 6).split(".")[0],
            fee: divisionDecimals(data.fee, 6).split(".")[0]
          };
        }
      });
    },
    toUrl() {
      this.$router.push("/farm");
    }
  }
};
</script>

<style lang="scss">
@import "../../assets/css/style.scss";
.home {
  //padding-bottom: 60px;
  //margin-top: -15px;
  .lh_1 {
    line-height: 1;
  }
  .pd_40 {
    padding: 40px;
    background-color: $BgColor;
    border-radius: 20px;
  }
  .title {
    font-size: 20px;
    line-height: 1;
    margin-bottom: 28px;
    //font-weight: 600;
  }
  .label {
    font-size: 16px;
    color: $labelColor;
  }
  .info-item {
    flex: 1;
    text-align: center;
  }
  .value {
    font-size: 24px;
    margin-top: 5px;
  }
  .overview-total {
    font-size: 30px;
    color: #fff;
    text-align: center;
    margin-bottom: 40px;
  }
  .info-top {
    height: 200px;
  }
  .info-middle {
    margin: 40px 0;
    display: flex;
    .left {
      margin-right: 40px;
      width: 500px;
      .left-top,
      .left-bottom {
        display: flex;
        height: 177px;
        p {
          font-size: 30px;
          line-height: 1;
          //font-weight: 600;
        }
        .flex1-tr {
          flex: 1;
          text-align: right;
        }
        .iconfont {
          font-size: 80px;
          color: #004884;
        }
      }
      .left-top {
        margin-bottom: 40px;
      }
      .left-bottom {
        .icon-wrap {
          font-size: 90px;
          transform: rotate(30deg);
          display: inline-block;
        }
      }
    }
    .right {
      flex: 1;
      height: 394px;
      overflow: hidden;
      .title {
        position: relative;
        .more {
          position: absolute;
          right: 0;
          top: 0;
          color: $linkColor;
          font-size: 16px;
          cursor: pointer;
          font-weight: 400;
        }
      }
      .farm-list {
        height: 240px;
        overflow: auto;
      }
      .farm-item {
        margin-top: 32px;
        height: 58px;
        display: flex;
        align-items: center;
        &:first-child {
          margin-top: 0;
        }
        .farm-symbol {
          width: 285px;
        }
        .farm-info {
          flex: 1;
          display: flex;
          align-items: center;
          height: 100%;
          & > div {
            flex: 1;
          }
          .label {
            font-size: 14px;
          }
          .value {
            font-size: 18px;
            //font-weight: 600;
          }
        }
        .handle {
          color: #4a5ef2;
          margin-right: 20px;
        }
      }
    }
  }
  .info-bottom {
    .value {
      line-height: 1;
      margin-top: 10px;
    }
  }
  .mt-16 {
    margin-top: 12px;
  }
}
.info-wrap {
  align-items: normal;
}
.right_block {
  display: none;
  flex: 1;
  height: 394px;
  overflow: hidden;
  .title {
    position: relative;
    .more {
      position: absolute;
      right: 0;
      top: 0;
      color: #4a5ef2;
      font-size: 16px;
      cursor: pointer;
      font-weight: 400;
    }
  }
  .farm-list {
    height: 240px;
    overflow: auto;
  }
  .farm-item {
    margin-top: 32px;
    height: 58px;
    display: flex;
    align-items: center;
    &:first-child {
      margin-top: 0;
    }
    .farm-symbol {
      width: 285px;
    }
    .farm-info {
      flex: 1;
      display: flex;
      align-items: center;
      height: 100%;
      & > div {
        flex: 1;
      }
      .label {
        font-size: 14px;
      }
      .value {
        font-size: 18px;
        //font-weight: 600;
      }
    }
    .handle {
      color: #4a5ef2;
      margin-right: 20px;
    }
  }
}
.mobile-cont {
  display: none;
  .mobile-total {
    padding: 20px 15px;
    background-color: $BgColor;
    border-radius: 10px;
    .img-cont {
      width: 60px;
      height: 63px;
      line-height: 63px;
      margin-right: 10px;
      i {
        color: #004884;
        font-size: 60px;
      }
    }
  }
}
@media screen and (max-width: 1200px) {
  .home .info-middle .right {
    height: 500px;
    display: none;
  }
  .home .info-middle .left {
    margin-right: 0 !important;
    width: 100% !important;
    .left-bottom {
      margin-bottom: 40px !important;
    }
  }
  .right_block {
    display: block !important;
    width: 100% !important;
    padding: 20px !important;
  }
  .pd_40_rd_20 {
    padding: 24px;
  }
  .coin_name {
    font-size: 14px;
    //font-weight: bold;
    width: 180px;
  }
  .home .value {
    font-size: 20px;
  }
}

@media screen and (max-width: 600px) {
  .home {
    margin-top: -20px;
  }
  .home .overview-total {
    font-size: 20px !important;
  }
  .home .info-top {
    height: auto !important;
  }
  .home .info-middle .right {
    height: 500px;
    display: none;
  }
  .coin_name {
    font-size: 14px;
    //font-weight: bold;
    width: 80px;
  }
  .info-wrap {
    display: flex;
    flex-direction: column;
    .info-item {
      display: flex;
      align-items: center;
      margin-top: 10px;
      .label {
        width: 65px;
        font-size: 14px;
      }
      .value {
        font-size: 16px !important;
      }
    }
    .home .pd_40 {
      padding: 20px !important;
    }
  }
  .right_block {
    display: block;
    font-size: 14px;
  }
  .right_block .farm-item .farm-info .value {
    font-size: 14px;
  }
  .home .title {
    font-size: 17px;
  }
  .info-bottom {
    padding: 24px !important;
  }
}
@media screen and (max-width: 650px) {
  .home .info-middle .left .left-top {
    div {
      p {
        font-size: 20px !important;
      }
    }
  }
  .home .info-middle .left .left-bottom {
    div {
      p {
        font-size: 20px !important;
      }
    }
  }
}
@media screen and (max-width: 800px) {
  .mobile-cont {
    display: block;
  }
  .pc-cont {
    display: none;
  }
}
.w-90 {
  width: 90px;
}
.text-3a {
  color: $txColor;
}
.size-14 {
  font-size: 14px;
}
.size-15 {
  font-size: 15px;
}
.size-19 {
  font-size: 19px;
}
.font-bold {
  //font-weight: bold;
}
.mt-15 {
  margin-top: 15px;
}
.mt-16 {
  margin-top: 16px;
}
.rotate-30 {
  transform: rotate(30deg);
}
.text-right {
  text-align: right;
}
</style>
