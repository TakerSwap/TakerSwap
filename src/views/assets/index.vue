<template>
  <div class="w1300 assets-wrap">
    <!--    el-table resize卡顿问题-->
    <div
      class="hack-table-resize"
      v-if="!showTransfer"
      style="position: relative"
    >
      <div style="position: absolute; width: 100%">
        <div class="assets">
          <div class="address-wrap flex-center">
            <div class="address">
              {{ $t("assets.assets3") }}
              {{ takerAddress }}
              <i class="iconfont icon-fuzhi" @click="$copy(takerAddress)"></i>
            </div>
            <i
              class="iconfont icon-tianjia"
              @click="showAssetManage = true"
            ></i>
          </div>
          <el-table
            :data="tableData"
            height="480"
            class="show_table"
            v-loading="loading"
            element-loading-background="rgba(24, 24, 55, 0.8)"
          >
            <el-table-column width="20px"></el-table-column>
            <el-table-column :label="$t('public.public1')">
              <template v-slot="scope">
                <div class="flex-center">
                  <symbol-icon :icon="scope.row.symbol"></symbol-icon>
                  <el-tooltip placement="top">
                    <template #content>
                      <div>
                        ID: {{ scope.row.assetKey }}
                        <br />
                        <span
                          v-if="
                            getContractAddress(
                              scope.row.heterogeneousList,
                              scope.row.registerChainId
                            )
                          "
                        >
                          {{ $t("assets.assets10")
                          }}{{
                            getContractAddress(
                              scope.row.heterogeneousList,
                              scope.row.registerChainId
                            )
                          }}
                        </span>
                      </div>
                    </template>
                    <div class="t_info">
                      <span>{{ scope.row.symbol }}</span>
                      <p>{{ "(" + scope.row.originNetwork + ")" }}</p>
                    </div>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('public.public2')">
              <template v-slot="scope">
                {{ $thousands(scope.row.available) }}
              </template>
            </el-table-column>
            <el-table-column prop="locking" :label="$t('public.public3')">
              <template v-slot="scope">
                {{ $thousands(scope.row.locking) }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('public.public4')">
              <template v-slot="scope">
                {{ $thousands(scope.row.number) }}
                <p class="ydy">≈${{ $thousands(scope.row.valuation) }}</p>
              </template>
            </el-table-column>
            <el-table-column
              :label="$t('public.public5')"
              align="center"
              width="260px"
            >
              <template v-slot="scope">
                <div class="handle-column" v-if="scope.row">
                  <el-tooltip
                    :content="$t('assets.assets4')"
                    placement="top"
                    v-if="isShowCrossHandle(scope.row)"
                  >
                    <i
                      class="iconfont icon-chongzhidaoL2"
                      :class="{ disable: disableTx }"
                      @click="transfer(scope.row, 'crossIn')"
                    ></i>
                  </el-tooltip>
                  <el-divider
                    direction="vertical"
                    v-if="isShowCrossHandle(scope.row)"
                  ></el-divider>
                  <el-tooltip :content="$t('assets.assets5')" placement="top">
                    <i
                      class="iconfont icon-L2zhuanzhang"
                      @click="transfer(scope.row, 'general')"
                    ></i>
                  </el-tooltip>
                  <el-divider
                    direction="vertical"
                    v-if="isShowCrossHandle(scope.row)"
                  ></el-divider>
                  <el-tooltip
                    :content="$t('assets.assets6')"
                    placement="top"
                    v-if="isShowCrossHandle(scope.row)"
                  >
                    <i
                      class="iconfont icon-tixiandaoL1"
                      :class="{ disable: disableTx }"
                      @click="transfer(scope.row, 'withdrawal')"
                    ></i>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
    <div class="mobile-cont pb-28" v-if="!showTransfer">
      <div class="p-24 address-wrap flex-center">
        <div class="address">
          {{ $t("assets.assets3") }}
          <span class="text-7e size-14">
            {{ superLong(takerAddress, 9) }}
          </span>
          <i class="iconfont icon-fuzhi" @click="$copy(takerAddress)"></i>
        </div>
        <i class="iconfont icon-tianjia" @click="showAssetManage = true"></i>
      </div>
      <el-empty
        description="No Data"
        v-loading="loading"
        v-if="!tableData.length"
      />
      <div v-for="(item, index) in tableData" v-else :key="index">
        <div class="p-24 asset-cont-wrap" @click="assetClick(item)">
          <div class="asset-cont">
            <div class="asset-item">
              <span class="asset-img">
                <symbol-icon :icon="item.symbol"></symbol-icon>
              </span>
              <span class="font-bold" style="font-size: 14px; line-height: 1">
                {{ item.symbol }}
                <br />
                <span>({{ item.originNetwork }})</span>
              </span>
            </div>
            <div class="asset-amount flex-center">
              <div class="left">
                <div class="font-bold align-right" style="font-size: 15px">
                  {{ $thousands(item.number) }}
                </div>
                <div class="size-13 text-7e align-right">
                  ≈{{ $thousands(item.valuation) }}
                </div>
              </div>
              <i
                :class="[
                  'el-icon-caret-right',
                  item.showDetail ? 'rotate-icon' : ''
                ]"
              ></i>
            </div>
          </div>
          <div class="t_info">
            <span>ID: {{ item.assetKey }}</span>
            <br />
            <span
              v-if="
                getContractAddress(item.heterogeneousList, item.registerChainId)
              "
            >
              {{ $t("assets.assets10")
              }}{{
                superLong(
                  getContractAddress(
                    item.heterogeneousList,
                    item.registerChainId
                  ),
                  10
                )
              }}
            </span>
          </div>
        </div>

        <CollapseTransition>
          <div class="option-btn" v-if="item.showDetail">
            <div class="btn-cont">
              <div
                class="btn"
                @click="transfer(item, 'crossIn')"
                v-if="isShowCrossHandle(item)"
                :class="{ btn_disable: disableTx }"
              >
                {{ $t("assets.assets4") }}
              </div>
              <div class="btn" @click="transfer(item, 'general')">
                {{ $t("assets.assets5") }}
              </div>
              <div
                class="btn"
                @click="transfer(item, 'withdrawal')"
                v-if="isShowCrossHandle(item)"
                :class="{ btn_disable: disableTx }"
              >
                {{ $t("assets.assets6") }}
              </div>
            </div>
          </div>
        </CollapseTransition>
      </div>
    </div>
    <assets-manage
      v-model:showAssetManage="showAssetManage"
      :assetList="allAssetsList"
      :selectAssets="selectAssets"
      @addAssets="filterAssets"
    ></assets-manage>
    <transfer
      v-if="showTransfer"
      v-model:currentTab="currentTab"
      v-model:show="showTransfer"
    />
  </div>
</template>

<script>
import { defineComponent, ref, watch, computed, onMounted, provide, getCurrentInstance } from "vue"
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { superLong, _networkInfo } from "@/api/util";
import SymbolIcon from "@/components/SymbolIcon.vue";
import AssetsManage from "./AssetsManage.vue";
import Transfer from "./transfer/index.vue";
import CollapseTransition from "@/components/CollapseTransition.vue";

export default defineComponent({
  name: "assets",
  components: {
    SymbolIcon,
    AssetsManage,
    Transfer,
    CollapseTransition
  },
  provide() {
    return {
      father: this
    };
  },
  setup() {
    const internalInstance = getCurrentInstance();
    provide("father", internalInstance);
    const store = useStore();
    const router = useRouter();
    const loading = ref(true);
    const loaded = ref(false);
    const showAssetManage = ref(false);
    let sortDataByValue = [];
    const allAssetsList = ref([]); // L2 所有资产
    const selectAssets = ref([]); // 勾选显示的资产
    const crossInOutSymbol = ref([]); // 支持Ethereum转入/转出的资产
    const showTransfer = ref(false);
    const currentTab = ref("first");
    const tableData = ref([]);
    const transferAsset = ref({});
    onMounted(() => {
      if (!store.getters.takerAddress) {
        router.push("/");
      }
    });
    const network = computed(() => {
      return store.getters.chain;
    });
    const disableTx = computed(() => {
      return store.getters.wrongChain;
    });
    const currentAccount = computed(() => {
      return store.state.addressInfo;
    });
    const address = computed(() => {
      return store.getters.currentAddress;
    });
    const takerAddress = computed(() => {
      return store.getters.takerAddress;
    });
    watch(
      () => store.state.assetList,
      val => {
        if (val && val.length) {
          getList(val);
        } else {
          getList([]);
        }
      },
      {
        immediate: true
        // deep: true
      }
    );
    function getList(list) {
      loading.value = !loaded.value;
      loading.value = false;
      list.map(v => {
        const exist = allAssetsList.value.find(
          item => v.assetKey === item.assetKey
        );
        v.showDetail = exist ? exist.showDetail : false;
      });
      sortDataByValue = [...list].sort((a, b) => {
        return a.valuation - b.valuation > 0 ? -1 : 1;
      });
      crossInOutSymbol.value = [...list].filter(item => {
        if (!item.heterogeneousList) {
          return false;
        } else {
          let supportedChain = false;
          item.heterogeneousList.map(v => {
            Object.keys(_networkInfo).map(key => {
              if (
                _networkInfo[key].chainId === v.heterogeneousChainId &&
                key === network.value
              ) {
                supportedChain = true;
              }
            });
          });
          return supportedChain;
        }
      });
      allAssetsList.value = list;
      filterAssets();
      loaded.value = true;
    }
    function filterAssets() {
      let result = [];
      if (currentAccount.value.visiableAssets) {
        sortDataByValue.map(v =>
          currentAccount.value.visiableAssets.map(item => {
            if (item === v.assetKey) {
              result.push(v);
            }
          })
        );
      } else {
        const defaultSymbol = ["ETH", "USDT", "USDC"];
        result = sortDataByValue.filter(
          v => defaultSymbol.indexOf(v.symbol) > -1
        );
      }
      selectAssets.value = result;
      tableData.value = result;
    }
    function transfer(asset, type) {
      if (type !== "general" && disableTx.value) return;
      if (type === "crossIn") {
        // L1到L2
        currentTab.value = "first";
      } else if (type === "withdrawal") {
        // L2到L1
        currentTab.value = "third";
      } else {
        // L2内部转账
        currentTab.value = "second";
      }
      showTransfer.value = true;
      transferAsset.value = asset;
      // console.log(this.transferAsset,55)
    }
    function isShowCrossHandle(item) {
      if (!item.heterogeneousList) return false;
      let supportedChain = false;
      item.heterogeneousList.map(v => {
        Object.keys(_networkInfo).map(key => {
          if (_networkInfo[key].chainId === v.heterogeneousChainId && key === network.value) {
            supportedChain = true;
          }
        });
      });
      return supportedChain;
    }
    function assetClick(item) {
      for (let asset of tableData.value) {
        if (item.assetKey === asset.assetKey) {
          item.showDetail = !item.showDetail;
        } else {
          asset.showDetail = false;
        }
      }
    }
    function getContractAddress(heterogeneousList, registerChainId) {
      if (!heterogeneousList || !heterogeneousList.length) {
        return false;
      }
      const info = heterogeneousList.filter(
        v => v.heterogeneousChainId === registerChainId
      )[0];
      if (!info) {
        return false;
      } else {
        return info.contractAddress;
      }
    }

    return {
      loading,
      loaded,
      showAssetManage,
      allAssetsList,
      selectAssets,
      crossInOutSymbol,
      showTransfer,
      currentTab,
      tableData,
      transferAsset,
      network,
      disableTx,
      currentAccount,
      address,
      takerAddress,
      filterAssets,
      transfer,
      isShowCrossHandle,
      superLong,
      assetClick,
      getContractAddress
    };
  }
});

/*export default defineComponent({
  name: "assets",
  props: {},
  components: {
    SymbolIcon,
    AssetsManage,
    Transfer,
    CollapseTransition
  },
  provide() {
    return {
      father: this
    };
  },
  watch: {
    "$store.state.assetList": {
      immediate: true,
      // deep: true,
      handler(val) {
        if (val && val.length) {
          this.getList(val);
        } else {
          this.getList([]);
        }
      }
    }
  },
  computed: {
    network() {
      return this.$store.getters.chain;
    },
    disableTx() {
      return this.$store.getters.wrongChain;
    },
    currentAccount() {
      return this.$store.state.addressInfo;
    },
    address() {
      return this.$store.getters.currentAddress;
    },
    takerAddress() {
      return this.$store.getters.takerAddress;
    }
  },
  data() {
    return {
      loading: true,
      showAssetManage: false,
      selectAssets: [], // 勾选显示的资产
      allAssetsList: [], // L2 所有资产
      crossInOutSymbol: [], // 支持Ethereum转入/转出的资产
      showTransfer: false,
      currentTab: "first",
      tableData: [],
      transferAsset: {},
      show: false,
      loaded: false
    };
  },

  mounted() {
    if (!this.$store.getters.takerAddress){
      this.$router.push("/");
    }
  },

  methods: {
    assetClick(item) {
      for (let asset of this.tableData) {
        if (item.assetKey === asset.assetKey) {
          item.showDetail = !item.showDetail;
        } else {
          asset.showDetail = false;
        }
      }
    },
    async getList(list) {
      this.loading = !this.loaded;
      this.loading = false;
      list.map(v => {
        const exist = this.allAssetsList.find(
          item => v.assetKey === item.assetKey
        );
        v.showDetail = exist ? exist.showDetail : false;
      });
      const sortDataByValue = [...list].sort((a, b) => {
        return a.valuation - b.valuation > 0 ? -1 : 1;
      });
      const crossInOutSymbol = [...list].filter(item => {
        if (!item.heterogeneousList) {
          return false;
        } else {
          let supportedChain = false;
          item.heterogeneousList.map(v => {
            Object.keys(_networkInfo).map(key => {
              if (_networkInfo[key].chainId === v.heterogeneousChainId && key === this.network) {
                supportedChain = true;
              }
            });
          });
          return supportedChain;
        }
      });
      this.sortDataByValue = sortDataByValue;
      this.allAssetsList = list;
      this.crossInOutSymbol = crossInOutSymbol;
      this.filterAssets();
      this.loaded = true;
    },
    //过滤展示资产列表
    filterAssets() {
      // console.log(this.sortDataByValue, 66);
      let result = [];
      if (this.currentAccount.visiableAssets) {
        this.sortDataByValue.map(v =>
          this.currentAccount.visiableAssets.map(item => {
            if (item === v.assetKey) {
              result.push(v);
            }
          })
        );
      } else {
        const defaultSymbol = ["ETH", "USDT", "USDC"];
        result = this.sortDataByValue.filter(
          v => defaultSymbol.indexOf(v.symbol) > -1
        );
      }
      this.selectAssets = result;
      this.tableData = result;
    },

    transfer(asset, type) {
      if (type !== "general" && this.disableTx) return;
      if (type === "crossIn") {
        // L1到L2
        this.currentTab = "first";
      } else if (type === "withdrawal") {
        // L2到L1
        this.currentTab = "third";
      } else {
        // L2内部转账
        this.currentTab = "second";
      }
      this.showTransfer = true;
      this.transferAsset = asset;
      // console.log(this.transferAsset,55)
    },
    isShowCrossHandle(item) {
      if (!item.heterogeneousList) return false;
      let supportedChain = false;
      item.heterogeneousList.map(v => {
        Object.keys(_networkInfo).map(key => {
          if (_networkInfo[key].chainId === v.heterogeneousChainId && key === this.network) {
            supportedChain = true;
          }
        });
      });
      return supportedChain;
    },
    superLong(str, len = 9) {
      return superLong(str, len);
    },
    getContractAddress(heterogeneousList, registerChainId) {
      if (!heterogeneousList || !heterogeneousList.length) {
        return false;
      }
      const info = heterogeneousList.filter(
        v => v.heterogeneousChainId === registerChainId
      )[0];
      if (!info) {
        return false;
      } else {
        return info.contractAddress;
      }
    }
  }
});*/
</script>

<style lang="scss" scoped>
@import "../../assets/css/style.scss";
.assets-wrap {
  padding: 0 20px;
}
.show_table.el-table--scrollable-y .el-table__body-wrapper {
  overflow: scroll;
}
.handle-column {
  line-height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  .iconfont {
    font-size: 24px;
    color: $linkColor;
    margin: 0 10px;
    cursor: pointer;
    &.disable {
      cursor: not-allowed;
    }
  }
  .el-divider {
    background-color: $labelColor;
  }
}
.mobile-cont {
  display: none;
  //padding: 24px 15px 28px 15px;
  background-color: $BgColor;
  overflow: hidden;
  border-radius: 10px;

  .address-wrap {
    justify-content: space-between;
    font-size: 16px;
    //color: #333;
    margin: 20px 0 10px;
    i {
      color: $linkColor;
      font-size: 20px;
      cursor: pointer;
      margin-left: 10px;
    }
  }
  .asset-cont-wrap {
    padding: 10px 15px;
    border-bottom: 1px solid #202049;
    .t_info {
      font-size: 12px;
      color: $labelColor;
      display: flex;
      justify-content: space-between;
      //padding-top: 2px;
    }
  }
  .asset-cont {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 0;
    .asset-item {
      display: flex;
      align-items: center;
      max-width: 40%;
      .asset-img {
        height: 25px;
        width: 25px;
        overflow: hidden;
        margin-right: 6px;
        flex-shrink: 0;
        :deep(.symbol-icon) {
          height: 100%;
          width: 100%;
          border-radius: 50%;
        }
      }
      .font-bold span {
        color: $labelColor;
        font-weight: 400;
        font-size: 12px;
      }
    }
    .asset-amount {
      flex: 1;
      justify-content: flex-end;
    }
    .el-icon-caret-right {
      font-size: 16px;
      margin-left: 5px;
      transition: transform 0.1s ease;
    }
    .rotate-icon {
      transform: rotate(-90deg);
    }
  }
  .option-btn {
    padding: 20px 0;
    background-color: #313161;
    .btn-cont {
      display: flex;
      align-items: center;
      justify-content: center;
      .btn {
        cursor: pointer;
        height: 36px;
        width: 88px;
        font-size: 15px;
        background-color: $btnColor;
        //color: #ffffff;
        line-height: 36px;
        text-align: center;
        border-radius: 10px;
        margin: 0 5px;
      }
    }
  }
}
.font-bold {
  //font-weight: bolder;
}
.p-24 {
  padding: 0 15px 0 15px;
}
.pt-25 {
  padding: 25px 15px 0 15px;
}
.pb-28 {
  padding-bottom: 28px;
}
.align-right {
  text-align: right;
}
.btn_disable {
  background-color: #a0cfff !important;
  cursor: not-allowed;
}
.assets {
  max-height: 721px;
  background-color: $BgColor;
  //box-shadow: 0px 2px 0px 0px #e9eaf4;
  border-radius: 30px;
  padding: 35px 40px;
  .font_20 {
    font-size: 20px;
  }
  .address-wrap {
    justify-content: space-between;
    font-size: 24px;
    color: $txColor;
    margin: 10px 0 30px;
    i {
      color: $linkColor;
      font-size: 32px;
      cursor: pointer;
      margin-left: 20px;
    }
  }
  :deep(.el-table) {
    th .cell {
      font-size: 16px;
    }
    tr .cell {
      font-size: 16px;
      color: #fff !important;
    }
    tr .flex-center {
      span {
        //font-weight: 600;
        //margin-left: 10px;
      }
      .t_info {
        margin-left: 10px;
        span {
          //font-weight: 600;
          line-height: 1;
          margin-bottom: 5px;
        }
        p {
          font-size: 14px;
          text-align: left;
          color: $labelColor;
          line-height: 1;
        }
      }
    }
    .el-button--text {
      color: #4a5ef2;
    }
    .ydy {
      color: $labelColor;
    }
  }
}
@media screen and (max-width: 1024px) {
  .mobile-cont {
    display: block;
  }
  .assets {
    display: none;
  }
}
@media screen and (max-width: 1200px) {
  //.show_table {
  //  display: none;
  //}
  //.assets-list {
  //  display: block;
  //}
  .assets {
    padding: 20px;
    border-radius: 20px !important;
  }
  .assets .top .top-title {
    font-size: 18px;
  }
  .assets .font_20 {
    font-size: 16px;
  }
  .transfer-page .bottom {
    padding: 10px;
  }
}
</style>
