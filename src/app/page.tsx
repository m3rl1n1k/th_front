
'use client';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth'; 

export default function HomePage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Derive locale inside useEffect to ensure params is available and use it directly
    const currentLocale = typeof params.locale === 'string' ? params.locale : 'en';
    
    async function checkAuthAndRedirect() {
      const authStatus = await isAuthenticated();
      if (authStatus) {
        router.replace(`/${currentLocale}/dashboard`);
      } else {
        router.replace(`/${currentLocale}/login`);
      }
    }
    checkAuthAndRedirect();
  }, [router, params.locale]); // Depend on params.locale to re-run if it changes

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}

