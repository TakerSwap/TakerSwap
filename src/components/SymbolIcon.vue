<template>
  <img class="symbol-icon" :src="getIconSrc(icon)" alt="" @error="replaceImg" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getIconSrc } from "@/utils/util";
import defaultIcon from "@/assets/img/defaultIcon.svg";
export default defineComponent({
  props: {
    icon: String
  },
  name: "SymbolIcon",
  setup() {
    function replaceImg(e: Event) {
      const target = e.target as HTMLImageElement;
      target.src = defaultIcon;
    }
    return {
      getIconSrc,
      replaceImg
    };
  }
});
</script>

<style lang="scss">
.symbol-icon {
  width: 35px;
  height: 35px;
  border-radius: 50%;
}
</style>
