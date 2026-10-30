import type { ReactNode } from "react";

import { useAuthInitialization } from "../../hooks/useAuthInitialization";

interface AuthInitializerProps {
  children: ReactNode;
}

export default function AuthInitializer({ children }: AuthInitializerProps) {
  const { isInitializing } = useAuthInitialization();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900 dark:border-slate-800 dark:border-t-indigo-500" />

          <p className="text-sm text-gray-500 dark:text-slate-400">Loading GarageFlow...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
