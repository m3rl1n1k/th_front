"use client";
// import { GenkitProvider } from "@genkit-ai/next/client"; // Removed as it doesn't exist
import type { PropsWithChildren } from "react";

export function GenkitClientProvider({ children }: PropsWithChildren) {
  // The GenkitProvider component is not exported from @genkit-ai/next/client.
  // For now, we'll just return children. If specific client-side Genkit
  // context is needed, the setup might be different in Genkit 1.x.
  return <>{children}</>;
}
