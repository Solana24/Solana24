// ThemeProvider.tsx
"use client"; // 클라이언트 컴포넌트 지정

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps, ReactNode } from "react";

type NextThemesProviderProps = ComponentProps<typeof NextThemesProvider>;

interface ThemeProviderProps extends NextThemesProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
