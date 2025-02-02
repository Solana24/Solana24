// components/ui/dialog.tsx
"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ReactNode } from "react";

interface DialogProps extends DialogPrimitive.DialogProps {
  children: ReactNode;
}

export const Dialog = DialogPrimitive.Root;

interface DialogContentProps extends DialogPrimitive.DialogContentProps {
  children: ReactNode;
  className?: string;
}

export const DialogContent = ({ children, className, ...props }: DialogContentProps) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
    <DialogPrimitive.Content
      className={`fixed bg-white rounded-md p-6 shadow-lg ${className}`}
      {...props}
    >
      {children}
      <DialogPrimitive.Close asChild>
        <button className="absolute top-2 right-2">✖</button>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
}

export const DialogHeader = ({ children, className }: DialogHeaderProps) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

export const DialogTitle = ({ children, className }: DialogTitleProps) => (
  <DialogPrimitive.Title className={`text-lg font-bold ${className}`}>
    {children}
  </DialogPrimitive.Title>
);
