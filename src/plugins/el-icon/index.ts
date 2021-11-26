import { App } from "vue";
import {
  CaretBottom,
  ArrowDown,
  ArrowDownBold,
  ArrowRight,
  Loading,
  Minus,
  Plus,
  Back,
  CaretRight
} from "@element-plus/icons";

// 全局注册@element-plus icon
const components = [
  CaretBottom,
  ArrowDown,
  ArrowDownBold,
  ArrowRight,
  Loading,
  Minus,
  Plus,
  Back,
  CaretRight
];
export function useElIcon(app: App) {
  components.forEach(component => {
    app.component(component.name, component);
  });
}
