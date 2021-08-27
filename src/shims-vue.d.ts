/* eslint-disable */
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "*.png";
declare module "*.jpg";
declare module "*.gif";
declare module "*.svg";
declare module "lodashe";
declare module "nerve-sdk-js"

declare module "element-ui/lib/locale/lang/*" {
  export const elementLocale: any;
}
