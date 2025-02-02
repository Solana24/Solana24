"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export function WalletModal({ isOpen, onClose, onConnect }: WalletModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#1C1C28] border-[#2D2D3D] text-white rounded-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-center">
            Connect a wallet on Solana to continue
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2">
          {/* Phantom Wallet Button */}
          <Button
            variant="outline"
            className="w-full justify-between h-14 px-4 bg-transparent hover:bg-[#2D2D3D] border-[#2D2D3D]"
            onClick={onConnect}
          >
            <div className="flex items-center gap-2">
              <Image
                src="/images/phantom-icon.svg"
                alt="Phantom"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-white">Phantom</span>
            </div>
            <span className="text-sm text-gray-400">Detected</span>
          </Button>

          {/* MetaMask Button */}
          <Button
            variant="outline"
            className="w-full justify-between h-14 px-4 bg-transparent hover:bg-[#2D2D3D] border-[#2D2D3D]"
            disabled
          >
            <div className="flex items-center gap-2">
              <Image
                src="/images/metamask-icon.svg"
                alt="MetaMask"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-white">MetaMask</span>
            </div>
            <span className="text-sm text-gray-400">Detected</span>
          </Button>
        </div>

        {/* More Options Button */}
        <Button
          variant="outline"
          className="w-full mt-2 bg-[#1B65F6]/10 text-[#1B65F6] hover:bg-[#1B65F6]/20 border-[#1B65F6]/20"
          onClick={() => {
            console.log("More options clicked");
          }}
        >
          More options
        </Button>
      </DialogContent>
    </Dialog>
  );
}
