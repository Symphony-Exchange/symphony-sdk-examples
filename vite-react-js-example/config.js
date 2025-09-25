import { createConfig, http, injected } from "@wagmi/core";
import { sei } from "@wagmi/core/chains";
import { walletConnect } from "@wagmi/connectors";

export const config = createConfig({
  chains: [sei],
  connectors: [
    walletConnect({
      projectId: "ad61788b80f352ef125d2cd1b6b6c634",
    }),
    injected({
      target() {
        return {
          id: "windowProvider",
          name: "Window Provider",
          provider: window.ethereum,
        };
      },
    }),
  ],
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
  transports: {
    [sei.id]: http(),
  },
});
