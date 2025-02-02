"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const PhantomWalletButton: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const disconnectWallet = async () => {
    // Disconnect wallet logic
    setWalletAddress(null);
  };

  return (
    <div className="absolute top-4 right-4">
      {walletAddress ? (
        <Button onClick={disconnectWallet} className="text-gray-700 border border-gray-300">
          Disconnect {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
        </Button>
      ) : (
        <Button onClick={() => alert("Connect Wallet")} className="text-white bg-blue-500">
          Connect Wallet
        </Button>
      )}
    </div>
  );
};

export default PhantomWalletButton;
