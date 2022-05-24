import { createStore } from 'vuex'
import { providers, ethers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

let providerOptions = {
  walletconnect: {
      package: WalletConnectProvider, // required
      options: {
          infuraId: "412acf21edf5444a8c9f6bd737cf8ca2", // required
      },
  },
};

let w3;

export default createStore({
  state: {
    account: null,
    login_secret: null,
    askConnection: false,
  },
  getters: {
  },
  mutations: {
    askConnection: function (state, status = true) {
      state.askConnection = status;
    },
    setWeb3: async function (state, infos) {
      try {
        if (infos == null || infos.login_secret == null) {
          throw 'force_disconnect'
        } else {
          state.account = infos.account;
          state.login_secret = infos.login_secret;
        }
      } catch (error) {
        console.log(error)
        state.account = null;
        state.login_secret = null;
      }
      this.dispatch("followedCollections/refreshCollections", null, { root: true });
    },
  },
  actions: {
    askConnection: async function (context, opt = {}) {
      console.log("YOU NEED TO BE CONNECTED")
      context.commit("askConnection", true)
    },
    connect: async function (context, opt = {}) {
      try {
        let web3Modal = new Web3Modal({
          network: "mainnet", // optional
          cacheProvider: true, // optional
          providerOptions // required
        });
        console.log("connect mutation")
        if (opt.clearCache == true || true) {
          web3Modal.clearCachedProvider();
        }
        if (opt.tryFromCache == true && !web3Modal.cachedProvider) {
          return
        }
        let provider = await web3Modal.connect();
        w3 = new providers.Web3Provider(provider);
        let infos = {
          login_secret: null,
          account: provider.selectedAddress,
        }
        console.log(sessionStorage.getItem(`login_secret_${infos.account}`))
        if (sessionStorage.getItem(`login_secret_${infos.account}`)) {
          infos.login_secret = sessionStorage.getItem(`login_secret_${infos.account}`);
          infos.askConnection = false;
          context.dispatch("followedCollections/refreshCollections", null, { root: true });
        } else {
          let message = ((`I'm signing this message to log in `));
          const signer = w3.getSigner();
          const sig = await signer.signMessage(message)
          if (sig != null) {
            sessionStorage.setItem(`login_secret_${infos.account}`, sig);
            infos.login_secret = sig;
            infos.askConnection = false;
          }
        }
        console.log(infos)
        context.commit("setWeb3", infos)
      } catch (error) {
        console.log(error)
      }
    },
    disconnect: async function (context) {
      web3Modal.clearCachedProvider();
      context.commit("setWeb3", null)
    }
  },
  modules: {
  }
})
