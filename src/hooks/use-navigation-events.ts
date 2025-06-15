"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useGlobalLoader } from '@/context/global-loader-context';

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setIsLoading } = useGlobalLoader();

  useEffect(() => {
    // This effect runs when the component mounts, which means navigation has completed.
    // We set loading to false here in case a previous navigation started but didn't complete
    // or if the page was loaded directly.
    setIsLoading(false);

    // Return a cleanup function to handle unmounting or if dependencies change (which they will on navigation)
    return () => {
      // When the component unmounts (or path/params change), it implies a new navigation is starting.
      // However, directly setting setIsLoading(true) here can cause flicker if navigation is very fast.
      // It's better to set isLoading true at the very start of a navigation action (e.g., Link onClick).
      // For now, we'll rely on Link components or programmatic navigation to set isLoading true.
      // This hook primarily ensures isLoading is false once navigation completes.
    };
  }, [pathname, searchParams, setIsLoading]);

  return null;
}
