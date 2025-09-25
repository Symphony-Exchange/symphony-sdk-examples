"use client";

import { Ethersv5Example } from "./Ethersv5Example";
import { EthersExample } from "./EthersExample";
import { ViemExample } from "./ViemExample";
import { useState } from "react";

function App() {
  const [example, setExample] = useState("Viem");

  return (
    <div className="h-full w-screen flex flex-col items-center justify-between p-[2%] gap-8 ">
      <div className="gap-2 flex items-center justify-center w-full">
        <button
          className={`px-4 py-2 rounded text-white bg-blue-500 hover:bg-blue-600 transition-colors ${
            example === "Viem" && "!bg-green-500 hover:!bg-green-600"
          }`}
          onClick={() => setExample("Viem")}
        >
          Viem
        </button>
        <button
          className={`px-4 py-2 rounded text-white bg-blue-500 hover:bg-blue-600 transition-colors ${
            example === "Ethers V5" && "!bg-green-500 hover:!bg-green-600"
          }`}
          onClick={() => setExample("Ethers V5")}
        >
          Ethers V5
        </button>
        <button
          className={`px-4 py-2 rounded text-white bg-blue-500 hover:bg-blue-600 transition-colors ${
            example === "Ethers" && "!bg-green-500 hover:!bg-green-600"
          }`}
          onClick={() => setExample("Ethers")}
        >
          Ethers
        </button>
      </div>
      {example === "Viem" && <ViemExample />}
      {example === "Ethers V5" && <Ethersv5Example />}
      {/* {example === 'Ethers' && <EthersExample />} */}
    </div>
  );
}

export default App;
