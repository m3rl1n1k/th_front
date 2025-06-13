'use client'; // For redirect
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth'; // Using mock auth

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndRedirect() {
      const authStatus = await isAuthenticated();
      if (authStatus) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
