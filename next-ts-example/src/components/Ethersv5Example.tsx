"use client";

import { useState, useEffect } from "react";
import { Symphony, getRoute, Route, symphonyAbi } from "symphony-sdk/ethersv5";
import type {
  Address,
  SymphonyConfig,
  SwapResult,
  FeeParams,
  TokenList,
  TokenMetadata,
  RouteDetails,
} from "symphony-sdk/ethersv5";
import { ethers, providers } from "ethersv5";

// Initialize Symphony SDK
const SymphonySDK = new Symphony();

export const Ethersv5Example = () => {
  const [tokenList, setTokenList] = useState<TokenList | undefined>(undefined);
  const [signer, setSigner] = useState<ethers.Signer | undefined>(undefined);
  const [route, setRoute] = useState<Route | undefined>(undefined);
  const [transactionHash, setTransactionHash] = useState<string | undefined>(
    undefined
  );
  const [isApproved, setIsApproved] = useState<boolean | undefined>(undefined);
  const [tokenIn, setTokenIn] = useState<Address | undefined>(undefined);
  const [tokenOut, setTokenOut] = useState<Address | undefined>(undefined);
  const [amount, setAmount] = useState<string>("100");
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | undefined>(
    undefined
  );
  const [slippageAmount, setSlippageAmount] = useState<string>("100");
  const [isBps, setIsBps] = useState<boolean>(true);
  const [customApprovalAmount, setCustomApprovalAmount] =
    useState<string>("105");
  const [isTokenListed, setIsTokenListed] = useState<boolean | undefined>(
    undefined
  );

  // Private key for testing
  const pk = process.env.TEST_WALLET || "";

  // Fetch route when inputs change
  useEffect(() => {
    const fetchRoute = async () => {
      console.log("Tried to fetch:", amount, tokenIn, tokenOut);
      if (amount && tokenIn && tokenOut) {
        try {
          if (!signer) {
            console.log("No signer available yet");
            return;
          }
          const routeData: Route = await SymphonySDK.getRoute(
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
  }, [tokenIn, tokenOut, amount, signer]);

  // Fetch token list on mount
  useEffect(() => {
    const fetchList = async () => {
      try {
        const list: TokenList = await SymphonySDK.getTokenListAsync();

        setTokenList(list);
        const keys = Object.keys(list);
        if (keys.length > 1) {
          setTokenIn(keys[1] as Address);
          // Check if token is listed
          const listed = await SymphonySDK.isTokenListedAsync(
            keys[1] as Address
          );
          setIsTokenListed(listed);
          console.log(`Token ${keys[1]} listed:`, listed);
        }
        if (keys.length > 2) setTokenOut(keys[2] as Address);
      } catch (error) {
        console.error("Error fetching token list:", error);
      }
    };
    fetchList();
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const provider = new ethers.providers.Web3Provider(
          (window as any).ethereum
        );
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        setSigner(signer);
        setAddress(address);
        SymphonySDK.connectSigner(signer);

        console.log("Connected with address:", address);
      } else {
        console.error("No Ethereum wallet found");
        alert("Please install MetaMask or another Ethereum wallet");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const handleCheckApproval = async () => {
    if (!route || !signer) return;
    try {
      const approved: boolean = await route.checkApproval();
      setIsApproved(approved);
    } catch (error) {
      console.error("Error checking approval:", error);
    }
  };

  const handleApprove = async () => {
    if (!route || !signer) return;
    try {
      // giveApproval now returns a TransactionReceipt (already waited)
      const receipt = await route.giveApproval();
      setTransactionHash(receipt.transactionHash);
      setIsApproved(true);
    } catch (error) {
      console.error("Error approving:", error);
    }
  };

  const handleSwap = async () => {
    if (!route || !signer) return;
    try {
      const swapResult: SwapResult = await route.swap();
      setTransactionHash(swapResult.swapReceipt.transactionHash);
      console.log("Swap result:", swapResult);
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
    if (!route || !signer) return;
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

  const handleConnectPK = async () => {
    try {
      if (!pk) {
        alert("Please set NEXT_PUBLIC_TEST_WALLET in your .env.local");
        return;
      }
      const provider = new ethers.providers.JsonRpcProvider(
        "https://evm-rpc.sei-apis.com"
      );
      const wallet = new ethers.Wallet(pk, provider);
      setSigner(wallet);
      SymphonySDK.connectSigner(wallet);
      const addr = await wallet.getAddress();
      setAddress(addr);
      console.log("Connected with PK:", addr);
    } catch (error) {
      console.error("Error connecting with private key:", error);
    }
  };

  const handleGenerateCalldata = async () => {
    if (!route) return;
    try {
      const tx = await route.generateCalldata({
        from:
          (address as Address) || "0x0000000000000000000000000000000000000000",
      });
      console.log("Generated calldata:", tx);

      // Try to simulate the transaction
      if (signer && "provider" in signer) {
        const provider = (signer as any).provider;
        const result = await provider.call(tx);
        console.log("Raw result:", result);

        // Decode the result
        const iface = new ethers.utils.Interface(symphonyAbi);
        const decoded = iface.decodeFunctionResult("executeSwaps", result);
        console.log("Decoded result:", decoded?.toString());
      }
    } catch (error) {
      console.error("Error generating/simulating calldata:", error);
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-5 items-center justify-center">
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Ethers v5 Example</h2>

        <div className="mb-4 space-y-4">
          <div className="flex gap-4 items-center">
            <label className="w-24">Token In:</label>
            <select
              className="flex-1 p-2 border rounded"
              value={tokenIn || ""}
              onChange={(e) => setTokenIn(e.target.value as Address)}
            >
              <option value="">Select token</option>
              {tokenList &&
                Object.values(tokenList).map((token: TokenMetadata) => (
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
              onChange={(e) => setTokenOut(e.target.value as Address)}
            >
              <option value="">Select token</option>
              {tokenList &&
                Object.values(tokenList).map((token: TokenMetadata) => (
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

        <div className="bg-gray-800 p-4 rounded mb-4">
          <textarea
            readOnly
            className="w-full min-h-[300px] p-2 bg-gray-700 rounded text-white"
            value={`TokenIn: ${route?.tokenIn || "N/A"}\nTokenOut: ${
              route?.tokenOut || "N/A"
            }\nAmountIn: ${route?.amountInFormatted || "N/A"}\nAmountOut: ${
              route?.amountOutFormatted || "N/A"
            }\n\nRoute Details:\n${
              routeDetails
                ? `Total Out: ${routeDetails.totalOut}\nPaths: ${routeDetails.pathPercentages}`
                : "Loading..."
            }\n\nRaw Route:\n${
              JSON.stringify(route?.route, null, 2) || "No route available"
            }`}
          />
        </div>

        <div className="mb-4 space-y-4 bg-gray-100 p-4 rounded">
          <div className="flex gap-4 items-center">
            <label className="w-32">Slippage Amount:</label>
            <input
              type="text"
              className="flex-1 p-2 border rounded max-w-xs"
              value={slippageAmount}
              onChange={(e) => setSlippageAmount(e.target.value)}
              placeholder="100"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isBps}
                onChange={(e) => setIsBps(e.target.checked)}
              />
              <span>Use BPS</span>
            </label>
          </div>

          <div className="flex gap-4 items-center">
            <label className="w-32">Custom Approval:</label>
            <input
              type="text"
              className="flex-1 p-2 border rounded max-w-xs"
              value={customApprovalAmount}
              onChange={(e) => setCustomApprovalAmount(e.target.value)}
              placeholder="105"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Connected to:</span>
            <span className="font-mono">{address || "Not connected"}</span>
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
            <span>{SymphonySDK.getConfig().chainId || "Not set"}</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={connectWallet}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              MetaMask Connect
            </button>

            <button
              onClick={handleConnectPK}
              className="px-4 py-2 bg-green-400 text-white rounded hover:bg-green-500 transition-colors"
            >
              PK Wallet
            </button>

            <button
              onClick={handleCheckApproval}
              disabled={!route || !signer}
              className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:bg-gray-300 transition-colors"
            >
              Check Approval:{" "}
              {isApproved !== undefined ? String(isApproved) : "?"}
            </button>

            <button
              onClick={handleApprove}
              disabled={!route || !signer || isApproved}
              className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 disabled:bg-gray-300 transition-colors"
            >
              Give Approval
            </button>

            <button
              onClick={handleCustomApprove}
              disabled={!route || !signer}
              className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 disabled:bg-gray-300 transition-colors"
            >
              Approve Custom
            </button>

            <button
              onClick={handleSwap}
              disabled={!route || !signer}
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
                console.log("Current config:", SymphonySDK.getConfig());
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
