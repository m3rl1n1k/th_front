
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // useParams removed
import { isAuthenticated } from '@/lib/auth'; 

export default function HomePage() {
  const router = useRouter();
  // const params = useParams(); // useParams removed

  useEffect(() => {
    // const currentLocale = typeof params.locale === 'string' ? params.locale : 'en'; // Locale logic removed
    
    async function checkAuthAndRedirect() {
      const authStatus = await isAuthenticated();
      if (authStatus) {
        router.replace('/dashboard'); // Redirect to non-prefixed path
      } else {
        router.replace('/login'); // Redirect to non-prefixed path
      }
    }
    checkAuthAndRedirect();
  }, [router]); // params.locale dependency removed

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
