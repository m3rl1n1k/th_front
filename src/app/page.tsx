'use client';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth'; 

export default function HomePage() {
  const router = useRouter();
  const params = useParams();
  // Ensure locale is a string, fallback to default 'en' if needed
  const locale = typeof params.locale === 'string' ? params.locale : 'en';

  useEffect(() => {
    async function checkAuthAndRedirect() {
      const authStatus = await isAuthenticated();
      if (authStatus) {
        router.replace(`/${locale}/dashboard`);
      } else {
        router.replace(`/${locale}/login`);
      }
    }
    checkAuthAndRedirect();
  }, [router, locale]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
