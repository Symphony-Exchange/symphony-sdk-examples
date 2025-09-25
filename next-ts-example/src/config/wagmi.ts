import { createConfig } from "@wagmi/core";
import { injected, metaMask, safe, walletConnect } from "@wagmi/connectors";
import { http } from "viem";
import { sei } from "viem/chains";

export const config = createConfig({
  chains: [sei],
  connectors: [
    injected(),
    walletConnect({
      projectId: "YOUR_PROJECT_ID", // Replace with your WalletConnect project ID
    }),
    metaMask(),
    safe(),
  ],
  transports: {
    [sei.id]: http("https://evm-rpc.sei-apis.com"),
  },
});