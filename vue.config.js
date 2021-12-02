const webpack = require("webpack");
// const CompressionWebpackPlugin = require("compression-webpack-plugin");
// const productionGzipExtensions = ["js", "css"];
// const isProduction = process.env.NODE_ENV === "production";
const Components = require("unplugin-vue-components/webpack");
const { ElementPlusResolver } = require("unplugin-vue-components/resolvers");
// const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const proxyUrl =
  process.env.BUILD_ENV === "prod"
    ? "https://wallet.nerve.network/"
    : "http://seeda.nuls.io:8009";
module.exports = {
  publicPath: process.env.NODE_ENV === "production" ? "/" : "/",
  configureWebpack: config => {
    // element-plus import es-module
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto"
    });
    // if (isProduction) {
    //   config.plugins.push(
    //     new CompressionWebpackPlugin({
    //       algorithm: "gzip",
    //       test: new RegExp("\\.(" + productionGzipExtensions.join("|") + ")$"),
    //       threshold: 10240,
    //       minRatio: 0.8
    //     })
    //   );
    // }
    config.plugins.push(
      new webpack.DefinePlugin({
        //定义全局变量
        "process.env": {
          BUILD_ENV: JSON.stringify(process.env.BUILD_ENV)
        }
      })
    );
    // element-plus按需引入
    config.plugins.push(
      Components({
        resolvers: [ElementPlusResolver()]
      })
    );
    config.optimization = {
      // 添加分包
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          ethers: {
            name: "chunk",
            test: /[\\/]node_modules[\\/](ethers|@element-plus|jsrsasign|nerve-sdk-js)/,
            priority: -10
          },
          vendors: {
            name: "vendors",
            test: /[\\/]node_modules[\\/]^(element-plus)/,
            priority: -20
          }
        }
      }
    };
    // config.plugins.push(new BundleAnalyzerPlugin());
  },

  devServer: {
    port: 8030, // dev-beta
    // port: 8031, // dev-prod
    host: "0.0.0.0",
    https: false,
    open: true,
    proxy: {
      "/api": {
        target: proxyUrl,
        changeOrigin: true,
        pathRewrite: {
          // "^/api": ""
        }
      },
      "/test": {
        target: "http://xm_mp_dev.zhoulijun.top/api",
        changeOrigin: true,
        pathRewrite: {
          "^/test": ""
        }
      }
    }
  }
};
