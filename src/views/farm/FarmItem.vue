<template>
  <div
    class="farm-item"
    v-loading="loading"
    element-loading-background="rgba(24, 24, 55, 0.8)"
  >
    <el-empty description="No Data" v-if="!list.length" />
    <template v-if="true">
      <div class="lis" v-for="(item, index) of list" :key="index">
        <div class="title">
          <farm-symbol :name="item.name"></farm-symbol>
          <ul>
            <li class="fl">
              <p>{{ $t("farm.farm2") }}</p>
              <h2>{{ $thousands(item.pendingReward) }} {{ item.syrupTokenSymbol }}</h2>
            </li>
            <li class="fl">
              <p>{{ $t("farm.farm3") }}</p>
              <h2>{{ Number(item.apr) ? item.apr + "%" : "--" }}</h2>
            </li>
            <li class="fl">
              <p>{{ $t("farm.farm4") }}</p>
              <h2>{{ Number(item.tatalStakeTokenUSD) ? "$" + $thousands(item.tatalStakeTokenUSD) : "--" }}</h2>
            </li>
            <li class="fl">
              <p>{{ $t("farm.farm5") }}</p>
              <h2>{{ $thousands(item.syrupTokenBalance) }} {{ item.syrupTokenSymbol }}</h2>
            </li>
          </ul>
          <div class="link view" @click="showId(item.farmHash)">
<!--            {{ $t("farm.farm6") }}-->
            <i
              :class="{ 'el-icon-arrow-right': true, expand: item.showDetail }"
            ></i>
          </div>
        </div>
        <collapse-transition>
          <DetailsBar
            :tokenInfo="item"
            :isTaker="isTaker"
            :isPool="isPool"
            :takerAddress="takerAddress"
            v-show="item.showDetail"
            @loading="handleLoading"
          ></DetailsBar>
        </collapse-transition>
      </div>
    </template>
<!--    <div class="more" v-if="isTaker && takerAddress">
      <span class="link" @click="createFarm">{{ $t("farm.farm11") }}</span>
    </div>-->
  </div>
  <div class="mobile-cont">
    <el-empty description="No Data" v-if="!list.length"></el-empty>
    <div v-for="(item, index) in list" v-else :key="item.farmHash">
      <div class="farm-item_cont">
        <div class="farm-item_list">
          <div class="symbol-cont">
            <farm-symbol :name="item.name"></farm-symbol>
          </div>
          <div class="farm-info">
            <div class="farm-info_item">
              <div class="text-7e">{{ $t("farm.farm2") }}</div>
              <div class="mt-8 size-15">
                {{ $thousands(item.pendingReward) }}
              </div>
            </div>
            <div class="farm-info_item">
              <div class="text-7e">APR</div>
              <div class="mt-8 size-15">
                {{ Number(item.apr) ? item.apr + "%" : "--" }}
              </div>
            </div>
          </div>
        </div>
        <div class="farm-option text-4a size-14" @click="showId(item.farmHash)">
          {{ $t("farm.farm6") }}
        </div>
      </div>
      <collapse-transition>
        <DetailsBar
          :tokenInfo="item"
          :isTaker="isTaker"
          :isPool="isPool"
          :takerAddress="takerAddress"
          v-show="item.showDetail"
          @loading="handleLoading"
        ></DetailsBar>
      </collapse-transition>
    </div>
  </div>
</template>

<script>
import { defineComponent, reactive, toRefs, computed } from "vue";
import DetailsBar from "./DetailsBar.vue";
import CollapseTransition from "@/components/CollapseTransition.vue";
import FarmSymbol from "./FarmSymbol.vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";

export default defineComponent({
  name: "FarmItem",
  props: {
    loading: Boolean,
    list: Array,
    isTaker: Boolean,
    isPool: Boolean
  },
  emits: ["handleLoading"],
  setup(props, { emit }) {
    const router = useRouter();
    const store = useStore();
    const state = reactive({
      contractAddress: "0x0faee22173db311f4c57c81ec6867e5deef6c218" //合约地址
    });

    const takerAddress = computed(() => {
      return store.getters.takerAddress;
    });

    async function createFarm() {
      router.push("/create-farm");
    }

    //详情
    function showId(hash) {
      for (let item of props.list) {
        if (item.farmHash === hash) {
          item.showDetail = !item.showDetail;
        } else {
          item.showDetail = false;
        }
      }
    }
    function handleLoading(status) {
      emit("handleLoading", status);
    }

    return {
      ...toRefs(state),
      takerAddress,
      showId,
      handleLoading,
      createFarm
    };
  },
  components: {
    DetailsBar,
    CollapseTransition,
    FarmSymbol
  },
  computed: {},
  mounted() {}
});
</script>

<style lang="scss" scoped>
@import "../../assets/css/style.scss";
.mobile-cont {
  display: none;
  border-radius: 10px;
  background-color: $BgColor;
  overflow: hidden;
  //padding-bottom: 20px;
  .farm-item_cont {
    display: flex;
    padding: 15px 15px 15px 15px;
    border-bottom: 1px solid #202049;
    justify-content: space-between;
    align-items: center;
    .farm-item_list {
      .symbol-cont {
        display: flex;
        font-size: 15px;
        //font-weight: bold;
        :deep(.farm-item-symbol) {
          width: auto;
          padding: 0;
          height: 35px;
          .mult-img-wrap, .img-wrap {
            width: 45px;
            img {
              width: 30px;
              height: 30px;
            }
          }
          .name {
            font-size: 16px;
          }
        }
      }
      .farm-info {
        display: flex;
        margin-top: 8px;
        .farm-info_item {
          width: 124px;
        }
        .mt-8 {
          margin-top: 0px;
        }
      }
    }
  }
  .farm-option {
    cursor: pointer;
    flex-shrink: 0;
  }
}
.farm-item {
  display: block;
  background: $BgColor;
  border-radius: 20px;
  padding: 20px 0 20px;
  min-height: 200px;
  position: relative;
  overflow: hidden;
  .lis {
    font-family: PingFang SC;
    .title {
      height: 90px;
      border-bottom: 1px solid #20204A;
      display: flex;
      align-items: center;
      padding: 0 30px;
      .symbol {
        min-width: 200px;
        .names {
          font-size: 20px;
          //font-weight: bold;
        }
      }
      ul {
        /* width: 1000px; */
        flex: 1;
        li {
          width: 25%;
          text-align: center;
          p {
            font-size: 14px;
            color: $labelColor;
            line-height: 1;
            margin-bottom: 8px;
          }
          h2 {
            font-size: 18px;
            font-family: Roboto;
            font-weight: 400;
            line-height: 1;
          }
        }
      }
      .view {
        font-size: 15px;
        padding-left: 10px;
      }
    }
  }
  .farm-item_mobile {
    display: none;
  }
  .more {
    position: absolute;
    width: 100%;
    text-align: center;
    bottom: 20px;
  }
}
@media screen and (max-width: 1200px) {
  .farm-item .lis {
    font-size: 20px !important;
  }
}
@media screen and (max-width: 1024px) {
  .farm-item {
    display: none !important;
  }
  .mobile-cont {
    display: block;
  }
  .farm-item {
    padding: 15px;
  }
}
.mt-8 {
  margin-top: 7.5px;
}
.size-15 {
  font-size: 15px;
  //font-weight: bold;
}
.size-14 {
  font-size: 14px;
}
</style>
