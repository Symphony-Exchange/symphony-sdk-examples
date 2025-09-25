import { useState, useEffect } from "react";
import { connect, getWalletClient } from "@wagmi/core";
import { config } from "../config";
import { Symphony, symphonyAbi, symphonyAddress } from "symphony-sdk/viem";
import { createWalletClient, custom, http, decodeFunctionResult } from "viem";
import { sei } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// Initialize Symphony SDK
const SymphonySDK = new Symphony();

export const ViemExample = () => {
  const symphonyConfig = SymphonySDK.getConfig();
  const chainId = symphonyConfig.chainId;
  const nativeAddress = symphonyConfig.nativeAddress;

  const [tokenList, setTokenList] = useState(undefined);
  const [walletClientViem, setWalletClientViem] = useState(undefined);
  const [route, setRoute] = useState(undefined);
  const [transactionHash, setTransactionHash] = useState(undefined);
  const [isApproved, setIsApproved] = useState(undefined);
  const [tokenIn, setTokenIn] = useState(undefined);
  const [tokenOut, setTokenOut] = useState(undefined);
  const [amount, setAmount] = useState("100");
  const [routeDetails, setRouteDetails] = useState(undefined);
  const [slippageAmount, setSlippageAmount] = useState("100");
  const [isBps, setIsBps] = useState(true);
  const [customApprovalAmount, setCustomApprovalAmount] = useState("1.05");
  const [isTokenListed, setIsTokenListed] = useState(undefined);

  // Private key for testing
  const pk = import.env.TEST_WALLET || "";

  // Fetch route when inputs change
  useEffect(() => {
    const fetchRoute = async () => {
      console.log("Tried to fetch:", amount, tokenIn, tokenOut);
      if (amount && tokenIn && tokenOut) {
        try {
          const routeData = await SymphonySDK.getRoute(
            tokenIn,
            tokenOut,
            amount
          );
          setRoute(routeData);

          // Get route details
          if (routeData) {
            const details = await routeData.getRouteDetails();
            setRouteDetails(details);
            console.log("Route details:", details);
          }
        } catch (error) {
          console.error("Error fetching route:", error);
        }
      }
    };
    const debounceTimeout = setTimeout(fetchRoute, 300);
    return () => clearTimeout(debounceTimeout);
  }, [tokenIn, tokenOut, amount, tokenList]);

  // Fetch token list on mount
  useEffect(() => {
    const fetchList = async () => {
      try {
        const list = await SymphonySDK.getTokenListAsync();

        setTokenList(list);
        const keys = Object.keys(list);
        if (keys.length > 1) {
          setTokenIn(keys[1]);
          // Check if token is listed
          const listed = await SymphonySDK.isTokenListedAsync(keys[1]);
          setIsTokenListed(listed);
          console.log(`Token ${keys[1]} listed:`, listed);
        }
        if (keys.length > 2) setTokenOut(keys[2]);
      } catch (error) {
        console.error("Error fetching token list:", error);
      }
    };
    fetchList();
  }, []);

  const connectWallet = async () => {
    try {
      const result = await connect(config, {
        connector: config.connectors[0],
      });

      const client = await getWalletClient(config, {
        chainId: sei.id,
      });

      if (client) {
        setWalletClientViem(client);
        SymphonySDK.connectWalletClient(client);
        console.log("Connected with wagmi:", client.account?.address);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const connectViemDirect = async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const walletClient = createWalletClient({
          chain: sei,
          transport: custom(window.ethereum),
        });
        const [address] = await walletClient.requestAddresses();
        walletClient.account = { address, type: "json-rpc" };
        SymphonySDK.connectWalletClient(walletClient);
        setWalletClientViem(walletClient);
        console.log("Connected with Viem:", address);
      }
    } catch (error) {
      console.error("Error connecting with Viem:", error);
    }
  };

  const connectPrivateKey = async () => {
    try {
      if (!pk) {
        alert("Please set VITE_TEST_WALLET in your .env");
        return;
      }
      const account = privateKeyToAccount(pk);
      const walletClient = createWalletClient({
        account,
        chain: sei,
        transport: http("https://rpc.symphony.ag"),
      });
      SymphonySDK.connectWalletClient(walletClient);
      setWalletClientViem(walletClient);
      console.log("Connected with PK:", account.address);
    } catch (error) {
      console.error("Error connecting with private key:", error);
    }
  };

  const handleCheckApproval = async () => {
    if (!route || !walletClientViem) return;
    try {
      const approved = await route.checkApproval();
      setIsApproved(approved);
    } catch (error) {
      console.error("Error checking approval:", error);
    }
  };

  const handleApprove = async () => {
    if (!route || !walletClientViem) return;
    try {
      const txHash = await route.giveApproval();
      setTransactionHash(txHash.transactionHash);
      setIsApproved(true);
      console.log("Approval receipt:", txHash);
    } catch (error) {
      console.error("Error approving:", error);
    }
  };

  const handleSwap = async () => {
    if (!route || !walletClientViem) return;
    try {
      const { swapReceipt, approveReceipt } = await route.swap({
        options: {
          skipApproval: false,
          skipCheckApproval: false,
        },
        slippage: {
          slippageAmount: slippageAmount,
          isBps: isBps,
        },
      });
      setTransactionHash(swapReceipt?.transactionHash);
      console.log("Swap result:", { swapReceipt, approveReceipt });
    } catch (error) {
      console.error("Error swapping:", error);
    }
  };

  const handleRefreshRoute = async () => {
    if (!route) return;
    try {
      const refreshedRoute = await route.refresh();
      setRoute(refreshedRoute);
      const details = await refreshedRoute.getRouteDetails();
      setRouteDetails(details);
      console.log("Route refreshed", refreshedRoute);
    } catch (error) {
      console.error("Error refreshing route:", error);
    }
  };

  const handleCustomApprove = async () => {
    if (!route || !walletClientViem) return;
    try {
      const receipt = await route.giveApproval({
        amount: customApprovalAmount,
        options: { isRaw: false },
      });
      setTransactionHash(receipt.transactionHash);
      setIsApproved(true);
      console.log("Custom approval receipt:", receipt);
    } catch (error) {
      console.error("Error with custom approval:", error);
    }
  };

  const handleGenerateCalldata = async () => {
    if (!route) return;
    try {
      const from =
        walletClientViem?.account?.address ||
        "0x0000000000000000000000000000000000000000";
      const tx = await route.generateCalldata({ from });
      console.log("Generated calldata:", tx);

      // Try to simulate with public client
      const publicClient = symphonyConfig.publicClient;
      if (publicClient) {
        const result = await publicClient.call(tx);
        console.log("Raw result:", result);

        // Decode the result using viem
        const decoded = decodeFunctionResult({
          abi: symphonyAbi,
          functionName: "executeSwaps",
          data: result.data,
        });
        console.log("Decoded result:", decoded?.toString());
      }
    } catch (error) {
      console.error("Error generating/simulating calldata:", error);
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-5 items-center justify-center">
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Viem Example</h2>

        <div className="mb-4 space-y-4">
          <div className="flex gap-4 items-center">
            <label className="w-24">Token In:</label>
            <select
              className="flex-1 p-2 border rounded"
              value={tokenIn || ""}
              onChange={(e) => setTokenIn(e.target.value)}
            >
              <option value="">Select token</option>
              {tokenList &&
                Object.values(tokenList).map((token) => (
                  <option
                    key={token.attributes.address}
                    value={token.attributes.address}
                  >
                    {token.attributes.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex gap-4 items-center">
            <label className="w-24">Token Out:</label>
            <select
              className="flex-1 p-2 border rounded"
              value={tokenOut || ""}
              onChange={(e) => setTokenOut(e.target.value)}
            >
              <option value="">Select token</option>
              {tokenList &&
                Object.values(tokenList).map((token) => (
                  <option
                    key={token.attributes.address}
                    value={token.attributes.address}
                  >
                    {token.attributes.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex gap-4 items-center">
            <label className="w-24">Amount:</label>
            <input
              type="text"
              className="flex-1 p-2 border rounded"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
        </div>

        <div className="bg-gray-900 p-4 rounded mb-4">
          <textarea
            readOnly
            className="w-full min-h-[300px] p-2 bg-gray-700 rounded text-white"
            value={`TokenIn: ${route?.tokenIn || "N/A"}\nTokenOut: ${
              route?.tokenOut || "N/A"
            }\nAmountIn: ${route?.amountInFormatted || "N/A"}\nAmountOut: ${
              route?.amountOutFormatted || "N/A"
            }\n\nRoute Details:\n${
              routeDetails
                ? `Total Out: ${routeDetails.totalOut}\nPaths: ${routeDetails.pathPercentages}\nRebate: ${routeDetails.rebate}`
                : "Loading..."
            }\n\nRaw Route:\n${
              JSON.stringify(route?.route, null, 2) || "No route available"
            }`}
          />
        </div>

        <div className="mb-4 space-y-4 bg-gray-800 p-4 rounded">
          <div className="flex gap-4 items-center">
            <label className="w-32 text-white">Slippage Amount:</label>
            <input
              type="text"
              className="flex-1 p-2 border rounded max-w-xs"
              value={slippageAmount}
              onChange={(e) => setSlippageAmount(e.target.value)}
              placeholder="100"
            />
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={isBps}
                onChange={(e) => setIsBps(e.target.checked)}
              />
              <span>Use BPS</span>
            </label>
          </div>

          <div className="flex gap-4 items-center">
            <label className="w-32 text-white">Custom Approval:</label>
            <input
              type="text"
              className="flex-1 p-2 border rounded max-w-xs"
              value={customApprovalAmount}
              onChange={(e) => setCustomApprovalAmount(e.target.value)}
              placeholder="1.05"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Connected to:</span>
            <span className="font-mono">
              {walletClientViem?.account?.address || "Not connected"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-semibold">Transaction Hash:</span>
            <span className="font-mono text-sm">
              {transactionHash || "No transaction yet"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-semibold">Is Approved:</span>
            <span>
              {isApproved !== undefined ? String(isApproved) : "Unknown"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-semibold">Token Listed:</span>
            <span>
              {isTokenListed !== undefined
                ? String(isTokenListed)
                : "Not checked"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-semibold">Config ChainId:</span>
            <span>{chainId || "Not set"}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-semibold">Native Address:</span>
            <span className="font-mono text-sm">{nativeAddress}</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={connectWallet}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            >
              Wagmi Connect
            </button>

            <button
              onClick={connectViemDirect}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            >
              Viem Connect
            </button>

            <button
              onClick={connectPrivateKey}
              className="px-4 py-2 bg-green-400 text-white rounded hover:bg-green-500 transition-colors"
            >
              PK Wallet
            </button>

            <button
              onClick={handleCheckApproval}
              disabled={!route || !walletClientViem}
              className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:bg-gray-300 transition-colors"
            >
              Check Approval:{" "}
              {isApproved !== undefined ? String(isApproved) : "?"}
            </button>

            <button
              onClick={handleApprove}
              disabled={!route || !walletClientViem || isApproved}
              className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 disabled:bg-gray-300 transition-colors"
            >
              Give Approval
            </button>

            <button
              onClick={handleCustomApprove}
              disabled={!route || !walletClientViem}
              className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:bg-gray-300 transition-colors"
            >
              Approve Custom
            </button>

            <button
              onClick={handleSwap}
              disabled={!route || !walletClientViem}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:bg-gray-300 transition-colors"
            >
              Swap
            </button>

            <button
              onClick={handleRefreshRoute}
              disabled={!route}
              className="px-4 py-2 bg-sky-400 text-white rounded hover:bg-sky-500 disabled:bg-gray-300 transition-colors"
            >
              Refresh Quote
            </button>

            <button
              onClick={handleGenerateCalldata}
              disabled={!route}
              className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-800 disabled:bg-gray-300 transition-colors"
            >
              Try Encoded
            </button>

            <button
              onClick={async () => {
                SymphonySDK.setConfig({ nativeAddress: "0x1" });
                console.log("Config updated:", symphonyConfig);
                console.log(
                  "Token list:",
                  await SymphonySDK.getTokenListAsync()
                );
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Log Config & List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
