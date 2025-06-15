
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns'; 
import { useToast } from '@/hooks/use-toast';


interface UserProfileData {
  name: string;
  email: string;
  memberSince: string; 
  profilePictureUrl?: string; 
}

export default function ProfilePage() {
  const { user, token, isAuthenticated, fetchUser } = useAuth();
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setIsLoading: setGlobalLoading } = useGlobalLoader();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated && user) { 
      setGlobalLoading(true);
      setIsLoading(true);
      
      setProfileData({
        name: user.login, 
        email: user.email,
        memberSince: user.memberSince || new Date().toISOString(), 
        profilePictureUrl: `https://placehold.co/150x150.png?text=${user.login.charAt(0).toUpperCase()}`
      });
      setIsLoading(false);
      setGlobalLoading(false);
    } else if (isAuthenticated && !user && token) { // Ensure token exists before fetching
        setGlobalLoading(true);
        setIsLoading(true);
        fetchUser().finally(() => {
            setIsLoading(false);
            setGlobalLoading(false);
        });
    } else if (!isAuthenticated) {
      setIsLoading(false); // Not authenticated, not loading profile
      setGlobalLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, token, fetchUser, setGlobalLoading]);


  if (isLoading || (!isAuthenticated && !token)) { // Show skeleton if loading or if not authenticated and no token (initial state)
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
  
  if (!profileData && isAuthenticated) { // If authenticated but profileData is still null (e.g. fetch error)
     return (
      <MainLayout>
        <div className="space-y-6">
          <h1 className="font-headline text-3xl font-bold text-foreground">{t('userProfileTitle')}</h1>
          <Card>
            <CardHeader><CardTitle>{t('errorFetchingData')}</CardTitle></CardHeader>
            <CardContent><p>{t('noDataAvailable')}</p></CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  // This case handles when user is null but token might be DUMMY_TOKEN (dev mode initial state)
  // or if profileData is truly null after attempts to load.
  if (!profileData) {
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
               <p className="text-center text-muted-foreground">{t('loading')}...</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }


  const handleProfileUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Profile update submitted");
    toast({ title: "Profile Update", description: "Update functionality is not yet implemented." });
  };
  
  let formattedMemberSince = "N/A";
  try {
    if (profileData.memberSince) {
      formattedMemberSince = format(new Date(profileData.memberSince), "MMMM d, yyyy");
    }
  } catch (error) {
    console.warn("Invalid date for memberSince:", profileData.memberSince);
  }


  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="font-headline text-3xl font-bold text-foreground text-center">{t('userProfileTitle')}</h1>
        
        <Card className="shadow-xl overflow-hidden">
          <div className="bg-gradient-to-br from-primary via-primary/80 to-accent h-32" />
          <CardHeader className="items-center text-center -mt-16">
            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
              <AvatarImage src={profileData.profilePictureUrl} alt={profileData.name} data-ai-hint="person portrait"/>
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
                  <p className="text-md font-medium text-foreground">{formattedMemberSince}</p>
                </div>
              </div>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-6">
                  <Edit3 className="mr-2 h-4 w-4" /> {t('editProfileButton')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t('editProfileDialogTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('editProfileDialogDescription')}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleProfileUpdate}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        {t('nameLabel')}
                      </Label>
                      <Input id="name" defaultValue={profileData.name} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        {t('emailLabel')}
                      </Label>
                      <Input id="email" type="email" defaultValue={profileData.email} className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                       <Button type="button" variant="outline">{t('cancelButton')}</Button>
                    </DialogClose>
                    <Button type="submit">{t('saveChangesButton')}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

