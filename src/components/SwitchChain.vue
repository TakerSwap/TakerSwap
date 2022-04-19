<template>
  <div class="switch-chain-wrapper" ref="wrapper">
    <slot></slot>
    <ul class="support-network-list" v-show="show">
      <li
        v-for="item in supportChainList"
        :key="item.chainId"
        :class="{ active: item.chainId === chainId }"
        @click="switchChain(item)"
      >
        <img :src="item.logo" alt="" />
        {{ item.chainName }}
      </li>
      <div class="pop-arrow"></div>
    </ul>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  onBeforeUnmount,
  onMounted,
  ref
} from "vue";
import config from "@/config";
import useEthereum, { AddChain } from "@/hooks/useEthereum";
import { _networkInfo } from "@/utils/heterogeneousChainConfig";

interface ChainItem extends AddChain {
  logo: string;
}

export default defineComponent({
  name: "SwitchChain",
  props: {
    modelValue: Boolean,
    chainId: String
  },
  setup(props, { emit }) {
    const supportChainList: ChainItem[] = [];
    Object.values(_networkInfo).map((v: any) => {
      if (v.supported) {
        supportChainList.push({
          chainId: v[config.ETHNET],
          rpcUrls: v.rpcUrl ? [v.rpcUrl] : [],
          chainName: v.name,
          nativeCurrency: {
            name: v.name,
            symbol: v.mainAsset,
            decimals: v.decimals
          },
          blockExplorerUrls: [v.origin],
          logo: v.logo
        });
      }
    });
    const show = computed({
      get() {
        return props.modelValue;
      },
      set(val) {
        emit("update:modelValue", val);
      }
    });
    const { addEthereumChain, switchEthereumChain } = useEthereum();
    async function switchChain(item: ChainItem) {
      if (item.chainId === props.chainId) return;
      show.value = false;
      try {
        if (item.chainName !== "Ethereum") {
          const { logo, ...rest } = item;
          await addEthereumChain(rest);
        } else {
          await switchEthereumChain({ chainId: item.chainId });
        }
      } catch (e) {
        //
      }
    }
    const wrapper = ref<HTMLElement>();
    function clickHandler(e: MouseEvent) {
      const target = e.target;
      if (target instanceof Node && !wrapper.value?.contains(target)) {
        show.value = false;
      }
    }
    onMounted(() => {
      document.addEventListener("click", clickHandler);
    });
    onBeforeUnmount(() => {
      document.removeEventListener("click", clickHandler);
    });
    return {
      show,
      supportChainList,
      switchChain,
      wrapper
    };
  }
});
</script>

<style lang="scss">
@import "../assets/css/style.scss";
.switch-chain-wrapper {
  position: relative;
}
.support-network-list {
  position: absolute;
  top: 40px;
  left: -20px;
  z-index: 1;
  width: 140px;
  //padding: 6px 0;
  margin-top: 8px;
  border: 1px solid $btnColor;
  border-radius: 4px;
  background-color: $btnColor;
  //box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  li {
    padding-left: 10px;
    height: 40px;
    color: $txColor;
    display: flex;
    align-items: center;
    &:hover {
      opacity: 0.65;
    }
    &.active {
      color: $linkColor;
      font-weight: 700;
    }
    img {
      margin-right: 10px;
      width: 28px;
    }
  }
  .pop-arrow,
  .pop-arrow:after {
    position: absolute;
    display: block;
    width: 0;
    height: 0;
    border-width: 8px;
    border-top-width: 0;
    border-color: transparent;
    border-style: solid;
  }
  .pop-arrow {
    top: -8px;
    left: 30px;
    border-bottom-color: $btnColor;
    &:after {
      content: " ";
      top: 1px;
      margin-left: -6px;
      border-bottom-color: $btnColor;
    }
  }
}
</style>
