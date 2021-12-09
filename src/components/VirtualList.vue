<template>
  <div class="virtual-list" :style="{ height }" ref="virtualList">
    <div class="scroll-box" :style="{ height }" @scroll="handleScroll" ref="scrollBox">
      <div class="scroll-hold" :style="{ width: '100%', height: scrollHoldHeight }"></div>
      <div class="list-wrap" v-if="renderList.length" ref="contentBox">
        <template v-for="item in renderList">
          <slot :item="item"></slot>
        </template>
      </div>
      <p
        class="no-data"
        v-else
        style="text-align: center; color: #ccc; padding-top: 30px"
      >
        No Data
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  PropType,
  ref,
  computed,
  nextTick
} from "vue";
import { AssetItemType } from "@/views/assets/types";

export default defineComponent({
  name: "VirtualList",
  props: {
    list: {
      type: Array as PropType<AssetItemType[]>,
      default: () => []
    },
    height: {
      type: String,
      default: "470px"
    },
    itemHeight: {
      type: Number,
      default: 66
    },
    bufferCount: {
      type: Number,
      default: 3
    }
  },
  setup(props) {
    const virtualList = ref<HTMLElement>();
    const scrollBox = ref<HTMLElement>();
    const contentBox = ref<HTMLElement>();
    let start = 0;
    let end = 0;
    const renderList = ref<AssetItemType[]>([]);
    let maxShowAmount: number;

    onMounted(() => {
      nextTick(() => {
        const { offsetHeight } = virtualList.value as HTMLElement;
        maxShowAmount =
          Math.floor(offsetHeight / props.itemHeight) +
          Number(props.bufferCount); // 显示的 + 用于缓冲的
        getRenderList(0, maxShowAmount);
      });
    });
    const scrollHoldHeight = computed(() => {
      return props.list.length * props.itemHeight + "px";
    });

    function resetScroll() {
      if (scrollBox.value) {
        start = 0;
        end = 0;
        scrollBox.value.scrollTop = 0;
        if (contentBox.value) {
          contentBox.value.style.transform = `translate3d(0, 0, 0)`;
        }
        getRenderList(0, maxShowAmount);
      }
    }
    function getRenderList(s: number, e: number) {
      start = s;
      end = e;
      renderList.value = props.list.slice(s, e);
    }
    function handleScroll() {
      const { scrollTop } = scrollBox.value as HTMLElement;
      const newStart = Math.floor(scrollTop / props.itemHeight);
      const boxOffset = scrollTop - (scrollTop % props.itemHeight);
      const newEnd = maxShowAmount + newStart;
      if (start !== newStart && end !== newEnd) {
        getRenderList(newStart, newEnd);
        nextTick(() => {
          const content = contentBox.value;
          if (content) {
            content.style.transform = `translate3d(0, ${boxOffset}px, 0)`;
          }
        });
      }
    }
    return {
      virtualList,
      scrollBox,
      contentBox,
      renderList,
      scrollHoldHeight,
      resetScroll,
      handleScroll
    };
  }
});
</script>

<style lang="scss" scoped>
.virtual-list {
  position: relative;
  overflow: auto;
  .scroll-box {
    position: relative;
    overflow: auto;
  }
  .scroll-hold {
    position: absolute;
    width: 100%;
  }
  .list-wrap {
    height: 100%;
  }
}
</style>
