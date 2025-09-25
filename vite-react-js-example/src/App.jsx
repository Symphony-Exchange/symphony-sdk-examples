import { Ethersv5Example } from "./ethersv5Example";
import { EthersExample } from "./ethersExample";
import { ViemExample } from "./viemExample";
import { useState } from "react";
// import { Debug } from "./debug";s
function App() {
  const [example, setExample] = useState("Viem");
  return (
    <div className="h-full w-screen flex flex-col items-center justify-between p-[2%]">
      <div className="gap-2 flex items-center justify-center w-full">
        <button
          className={`bg-blue-500 ${example == "Viem" && "!bg-green-500"}`}
          onClick={() => setExample("Viem")}
        >
          Viem
        </button>
        <button
          className={`bg-blue-500 ${example == "Ethers V5" && "!bg-green-500"}`}
          onClick={() => setExample("Ethers V5")}
        >
          Ethers V5
        </button>
        <button
          className={`bg-blue-500 ${example == "Ethers" && "!bg-green-500"}`}
          onClick={() => setExample("Ethers")}
        >
          Ethers
        </button>
      </div>
      {example == "Viem" && <ViemExample />}
      {example == "Ethers V5" && <Ethersv5Example />}
      {example == "Ethers" && <EthersExample />}
      {/* <Debug /> */}
    </div>
  );
}

export default App;
