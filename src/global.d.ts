import { ethers } from "ethers";
declare global {
  interface Window {
    ethereum: any; //ethers.providers.Web3Provider,
    NaboxWallet: any; //ethers.providers.Web3Provider
    nabox: any;
  }
}

