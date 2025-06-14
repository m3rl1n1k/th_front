
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/lib/auth'; 
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [username, setUsername] = useState('user@example.com'); // Default to 'user@example.com'
  const [password, setPassword] = useState('password'); // Default to 'password'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null); 
    try {
      // Pass the username state variable to the login function
      const user = await login(username, password); 
      if (user) {
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${user.login || user.name || user.email}!`,
        });
        router.push('/dashboard'); 
      } else {
        const errorMessage = "Invalid username or password.";
        setError(errorMessage);
        toast({
          title: 'Login Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      let errorMessage = err.message || 'An unexpected error occurred during login.';
      let errorTitle = 'Login Error';

      const lowerCaseErrorMessage = errorMessage.toLowerCase();
      if (lowerCaseErrorMessage.includes('failed to fetch') || 
          lowerCaseErrorMessage.includes('networkerror') ||
          lowerCaseErrorMessage.includes('network error')) {
        errorTitle = 'Network Error';
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
        errorMessage = `Could not connect to the server at ${apiUrl}. Please ensure the backend server is running and accessible. Original error: ${err.message}`;
      } else if (err.status === 401) {
        errorTitle = 'Authentication Failed';
        errorMessage = 'Invalid username or password. Please check your credentials.';
      }

      setError(errorMessage);
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-16 w-16"><path d="M8 6h10M6 12h10M4 18h10"/><path d="m18 12 4-4-4-4"/><path d="m18 12 4 4-4 4"/></svg>
          </div>
          <CardTitle className="text-3xl font-headline">FinanceFlow</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label> 
              <Input
                id="username"
                type="text" 
                placeholder="Enter your username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : <> <LogIn className="mr-2 h-4 w-4" /> Login </>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
