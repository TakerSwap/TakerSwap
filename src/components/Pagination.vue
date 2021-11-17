<template>
  <div class="pagination-bar" v-if="newPager.total > newPager.size">
    <el-pagination
      layout="prev, pager, next"
      :pager-count="5"
      :current-page="newPager.index"
      :total="newPager.total"
      :page-size="newPager.size"
      @current-change="pageChange"
    ></el-pagination>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { Pager } from "@/views/trading/types";

export default defineComponent({
  name: "Pagination",
  props: {
    pager: {
      type: Object as PropType<Pager>,
      default: () => {}
    }
  },
  setup(props, context) {
    const newPager = computed<Pager>({
      get() {
        return props.pager;
      },
      set(val) {
        context.emit("update:pager", val);
      }
    });
    function pageChange(index: number) {
      newPager.value.index = index;
      context.emit("change", index);
    }
    return {
      newPager,
      pageChange
    };
  }
});
</script>

<style scoped>
.pagination-bar {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
