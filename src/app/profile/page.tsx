"use client";

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, Mail, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalLoader } from '@/context/global-loader-context';

// Mock User Profile Data structure - replace with actual API call and type
interface UserProfileData {
  name: string;
  email: string;
  memberSince: string; // ISO Date string
  profilePictureUrl?: string; // Optional
}

export default function ProfilePage() {
  const { user, token, isAuthenticated, fetchUser } = useAuth();
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setIsLoading: setGlobalLoading } = useGlobalLoader();

  useEffect(() => {
    if (isAuthenticated && user) { // User data might already be in auth context
      setGlobalLoading(true);
      setIsLoading(true);
      // If detailed profile data needs to be fetched separately:
      // fetchUserProfileApi(token).then(data => {
      //   setProfileData(data);
      // }).catch(err => console.error(err))
      // .finally(() => setIsLoading(false));
      
      // For now, using user data from auth context
      setProfileData({
        name: user.login, // Assuming 'login' is the username/name
        email: user.email,
        memberSince: new Date().toISOString(), // Placeholder, fetch actual if available
        profilePictureUrl: `https://placehold.co/150x150.png?text=${user.login.charAt(0).toUpperCase()}`
      });
      setIsLoading(false);
      setGlobalLoading(false);
    } else if (isAuthenticated && !user) {
        // if authenticated but user data is not yet available, fetch it.
        setGlobalLoading(true);
        setIsLoading(true);
        fetchUser().finally(() => {
            setIsLoading(false);
            setGlobalLoading(false);
        });
    }
  }, [isAuthenticated, user, token, fetchUser, setGlobalLoading]);

  if (isLoading || !profileData) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="font-headline text-3xl font-bold text-foreground">{t('userProfileTitle')}</h1>
          <Card className="shadow-lg">
            <CardHeader className="items-center text-center">
              <Skeleton className="h-24 w-24 rounded-full mb-4" />
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Mail className="mr-3 h-5 w-5 text-muted-foreground" />
                <Skeleton className="h-5 w-full" />
              </div>
              <div className="flex items-center">
                <UserCircle className="mr-3 h-5 w-5 text-muted-foreground" />
                <Skeleton className="h-5 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="font-headline text-3xl font-bold text-foreground text-center">{t('userProfileTitle')}</h1>
        
        <Card className="shadow-xl overflow-hidden">
          <div className="bg-gradient-to-br from-primary via-primary/80 to-accent h-32" />
          <CardHeader className="items-center text-center -mt-16">
            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
              <AvatarImage src={profileData.profilePictureUrl} alt={profileData.name} data-ai-hint="person portrait" />
              <AvatarFallback className="text-4xl">
                {profileData.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="font-headline text-2xl mt-4">{profileData.name}</CardTitle>
            <CardDescription>{t('loggedInAs', { username: profileData.name })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4 pb-8 px-6">
            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex items-center">
                <Mail className="mr-4 h-6 w-6 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-md font-medium text-foreground">{profileData.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <UserCircle className="mr-4 h-6 w-6 text-primary" />
                 <div>
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-md font-medium text-foreground">{format(new Date(profileData.memberSince), "MMMM d, yyyy")}</p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-6">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile (Not Implemented)
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
