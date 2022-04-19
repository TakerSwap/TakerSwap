import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "",
    name: "home",
    component: () => import("@/views/trading/index.vue"),
    meta: { requireAuth: true }
  },
  {
    path: "/assets",
    name: "assets",
    component: () => import("@/views/assets/index.vue"),
    meta: { requireAuth: true }
  },
  {
    path: "/trading/:fromAsset?/:toAsset?",
    name: "trading",
    component: () => import("@/views/trading/index.vue"),
    meta: { requireAuth: true }
  },
  {
    path: "/liquidity/:fromAsset?/:toAsset?",
    name: "liquidity",
    component: () => import("@/views/liquidity/index.vue"),
    meta: { requireAuth: true }
  },
  {
    path: "/farm/:hash?",
    name: "farm",
    component: () => import("@/views/farm/index.vue"),
    meta: { requireAuth: true }
  },
  {
    path: "/pool/:hash?",
    name: "pool",
    component: () => import("@/views/pool/index.vue"),
    meta: { requireAuth: true }
  },
  {
    path: "/create-farm",
    name: "createFarm",
    component: () => import("@/views/createFarm/index.vue"),
    meta: { requireAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 };
  }
});

export default router;
