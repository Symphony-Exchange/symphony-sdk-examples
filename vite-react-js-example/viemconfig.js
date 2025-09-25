import { createWalletClient, custom } from "viem";

export const walletClientViem = createWalletClient({
  transport: custom(window.ethereum),
});
