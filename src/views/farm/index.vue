<template>
  <div class="tab-bar" v-if="!isPool">
    <span
      @click="current = FarmType.UniFarm"
      :class="{ active: current === FarmType.UniFarm }"
    >
      L1 {{ $t("header.header8") }}
    </span>
    <span
      @click="current = FarmType.TakerFarm"
      :class="{ active: current === FarmType.TakerFarm }"
    >
      Taker {{ $t("header.header8") }}
    </span>
  </div>
  <div class="w1300 farm">
    <div class="top clear" v-if="!isPool">
      <div
        class="fl tab-item"
        :class="{ isActive: current === FarmType.UniFarm }"
        @click="current = FarmType.UniFarm"
      >
        L1 {{ $t("header.header8") }}
      </div>
      <div
        class="fr tab-item"
        :class="{ isActive: current === FarmType.TakerFarm }"
        @click="current = FarmType.TakerFarm"
      >
        Taker {{ $t("header.header8") }}
      </div>
    </div>
    <div class="search">
      <div class="sort">
        <el-select
          v-model="sortValue"
          placeholder=""
          popper-class="farm-select"
        >
          <el-option :label="$t('farmRankType.apr')" value="1"></el-option>
          <el-option :label="$t('farmRankType.usd')" value="2"></el-option>
        </el-select>
      </div>
      <div class="mortgage">
        <el-switch
          v-model="mortgageValue"
          active-color="#315D9B"
          inactive-color="#565a69"
          :active-text="$t('farm.farm1')"
          :width="35"
        ></el-switch>
      </div>
    </div>
    <farm-item
      v-if="current === FarmType.UniFarm"
      :list="uniList"
      :loading="uniLoading"
      @handleLoading="handleLoading"
    ></farm-item>
    <farm-item
      v-if="current === FarmType.TakerFarm"
      :list="takerList"
      :loading="takerLoading"
      @handleLoading="handleLoading"
      :isPool="isPool"
      isTaker
    ></farm-item>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  reactive,
  toRefs,
  onMounted,
  ref,
  onUnmounted,
  watch
} from "vue";
import FarmItem from "./FarmItem.vue";
import useFarmData from "./hooks/useData";
import { useRoute } from "vue-router";

import { FarmType, SearchState } from "./types";

export default defineComponent({
  name: "Farm",
  props: {
    isPool: Boolean
  },
  components: {
    FarmItem
  },
  setup(props) {
    const route = useRoute();
    const uniLoading = ref(true);
    const takerLoading = ref(true);
    const current = ref<FarmType>(FarmType.UniFarm); // uniFarm -1 / takerFarm -2
    if (props.isPool) {
      current.value = FarmType.TakerFarm;
    }
    const state = reactive<SearchState>({
      sortValue: "1", // 下拉框值 apr -1 liquid -2
      mortgageValue: false // 只看已质押
    });
    const {
      takerList,
      getFarmData,
      getUserFarm,
      uniList,
      getUniData,
      filterList
    } = useFarmData(props.isPool);
    watch(
      () => [state.sortValue, state.mortgageValue] as [string, boolean],
      ([type, status]) => {
        // console.log(type, status, 999);
        filterList(type, status);
      }
    );
    onMounted(async () => {
      console.log(2343444)
      const hash = route.params?.hash as string;
      // console.log(hash, 123, route)
      if (hash) {
        current.value = FarmType.TakerFarm;
      }
      // init();
      await getFarmData(hash);
      getUserFarm(hash);
      takerLoading.value = false;
    });

    let timer: number;
    onMounted(async () => {
      if (props.isPool) return;
      await getUniData();
      uniLoading.value = false;
      timer = window.setInterval(async () => {
        await getUniData();
      }, 5000);
    });
    onUnmounted(() => clearInterval(timer));

    function handleLoading(status: boolean) {
      if (current.value === FarmType.UniFarm) {
        uniLoading.value = status;
      } else {
        takerLoading.value = status;
      }
    }

    return {
      current,
      uniLoading,
      takerLoading,
      ...toRefs(state),
      takerList,
      uniList,
      handleLoading,
      FarmType
    };
  }
});
</script>

<style lang="scss">
@import "../../assets/css/style.scss";
.tab-bar {
  display: none;
  margin-left: 30px;
  align-items: center;
  font-size: 16px;
  border-bottom: 1px solid #ffffff;
  color: $labelColor;
  span {
    cursor: pointer;
    box-sizing: border-box;
    height: 30px;
    margin-right: 15px;
  }
  .active {
    color: $txColor;
    border-bottom: 2px solid #ffffff;
  }
}
.farm {
  //min-height: 750px;
  //padding: 0 20px;
  .top {
    width: 360px;
    height: 48px;
    margin: 0 auto;
    border-radius: 24px;
    background-color: #2a2a56;
    .tab-item {
      width: 180px;
      height: 48px;
      text-align: center;
      line-height: 48px;
      color: $labelColor;
      font-size: 16px;
      cursor: pointer;
    }
    .isActive {
      background-color: #004884;
      border-radius: 24px;
      margin: 0 0 0 -1px;
      color: #fff;
      //border: 0 solid #5f71f5;
    }
  }
  .search {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    margin: 10px 0 20px;
    .sort {
      width: 170px;
      height: 40px;
      .el-input__inner {
        background: #5f71f5;
        border: none;
        border-radius: 12px;
        color: #fff;
      }
      ::-webkit-input-placeholder {
        color: #fff;
      }
      .el-select__caret {
        color: #fff;
      }
    }
    .el-select {
      input {
        background: #2a2a56;
      }
    }
    .el-switch {
      .el-switch__label {
        color: $labelColor;
      }
    }
  }
  .info {
    background: #ffffff;
    border-radius: 20px;
    padding: 20px 0 80px;
    min-height: 200px;
    position: relative;
    .lis {
      .title {
        height: 90px;
        border-bottom: 1px solid #e4efff;
        display: flex;
        align-items: center;
        padding: 0 40px;
        .symbol {
          min-width: 200px;
          .names {
            font-size: 20px;
            font-weight: bold;
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
              color: #7e87c2;
              line-height: 1;
              margin-bottom: 8px;
            }
            h2 {
              font-size: 18px;
              font-weight: bold;
              line-height: 1;
            }
          }
        }
        .view {
          font-size: 15px;
        }
      }
    }
    .more {
      position: absolute;
      width: 100%;
      text-align: center;
      bottom: 20px;
    }
  }
  @media screen and (max-width: 500px) {
    //padding: 0 16px;
  }
}
.farm-select.el-select__popper.el-popper[role="tooltip"] {
  background: $btnColor !important;
  border: 0 !important;
  border-radius: 10px;
  //.el-select-dropdown__item.hover,
  //.el-select-dropdown__item:hover {
  //  background: $btnColor!important;
  //}
  .el-select-dropdown__item {
    color: $labelColor;
    &:hover,
    &.selected {
      background: $btnColor !important;
      opacity: 0.65;
    }
  }
  .el-select-dropdown__item {
    span {
      color: #fff;
    }
    &:hover {
      background: $btnColor;
      opacity: 0.65;
    }
  }
  .el-popper__arrow:before {
    background: $btnColor;
    border: 0 !important;
  }
}
@media screen and (max-width: 1200px) {
  .tab-bar {
    display: flex;
    margin-left: 20px;
    margin-top: -30px;
  }
  .farm .top {
    display: none;
    width: 300px;
    .tab-item {
      width: 150px;
    }
  }
  .farm .search {
    .sort {
      .el-input__inner {
        height: 36px;
        line-height: 36px;
        border-radius: 8px;
      }
    }
  }
}
@media screen and (max-width: 500px) {
  .tab-bar {
    margin-top: 0;
  }
}
</style>
