
"use client";

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, Mail, Edit3, Briefcase, AlertTriangle as InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/api';
import type { ApiError } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface UserProfileData {
  login: string; 
  email: string;
  memberSince: string;
  profilePictureUrl?: string;
  userCurrencyCode?: string; 
}

export default function ProfilePage() {
  const { user, token, isAuthenticated, isLoading: authIsLoading, fetchUser } = useAuth();
  const { t, dateFnsLocale } = useTranslation(); 
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [editLogin, setEditLogin] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCurrencyCode, setEditCurrencyCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrencyPrompt, setShowCurrencyPrompt] = useState(false);


  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoading(true);

      const newProfileData = {
        login: user.login,
        email: user.email,
        memberSince: user.memberSince || new Date().toISOString(),
        profilePictureUrl: `https://placehold.co/150x150.png?text=${user.login.charAt(0).toUpperCase()}`,
        userCurrencyCode: user.userCurrency?.code || t('notSet'),
      };
      setProfileData(newProfileData);
      setEditLogin(newProfileData.login);
      setEditEmail(newProfileData.email);
      setEditCurrencyCode(user.userCurrency?.code || '');

      if (!user.userCurrency?.code) {
        setShowCurrencyPrompt(true);
      } else {
        setShowCurrencyPrompt(false);
      }

      setIsLoading(false);
    } else if (isAuthenticated && !user && token) {
        setIsLoading(true);
        fetchUser().finally(() => {
            setIsLoading(false);
        });
    } else if (!isAuthenticated) {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, token, fetchUser, t]);


  const handleProfileUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      toast({ variant: "destructive", title: t('error'), description: t('tokenMissingError') });
      return;
    }

    // Basic validation for currency code (3 uppercase letters)
    if (editCurrencyCode && !/^[A-Z]{3}$/.test(editCurrencyCode)) {
        toast({
            variant: "destructive",
            title: t('errorUpdatingProfile'),
            description: t('invalidCurrencyCodeFormat'),
        });
        return;
    }


    setIsSubmitting(true);
    const payload = {
      login: editLogin,
      email: editEmail,
      userCurrencyCode: editCurrencyCode || undefined, // Send undefined if empty to let backend handle
    };

    try {
      await updateUserProfile(payload, token);
      await fetchUser(); // Refresh user data in context
      toast({ title: t('profileUpdateSuccessTitle'), description: t('profileUpdateSuccessDescApi') });
      // Dialog will close automatically due to DialogClose asChild on Button
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: t('errorUpdatingProfile'),
        description: apiError.message || t('unexpectedError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading || authIsLoading || (!isAuthenticated && !token)) {
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
               <div className="flex items-center">
                <Briefcase className="mr-3 h-5 w-5 text-muted-foreground" />
                <Skeleton className="h-5 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!profileData && isAuthenticated) {
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


  let formattedMemberSince = "N/A";
  try {
    if (profileData.memberSince) {
      formattedMemberSince = format(new Date(profileData.memberSince), "MMMM d, yyyy", { locale: dateFnsLocale });
    }
  } catch (error) {
    // Invalid date format, formattedMemberSince remains "N/A"
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {showCurrencyPrompt && (
          <Alert variant="default" className="mb-6 bg-primary/10 border-primary/30 text-primary-foreground dark:bg-primary/20 dark:border-primary/40 dark:text-primary-foreground">
            <InfoIcon className="h-5 w-5 text-primary" />
            <AlertTitle>{t('completeYourProfileTitle')}</AlertTitle>
            <AlertDescription>
              {t('completeYourProfileDesc')}
            </AlertDescription>
          </Alert>
        )}
        <h1 className="font-headline text-3xl font-bold text-foreground text-center">{t('userProfileTitle')}</h1>

        <Card className="shadow-xl overflow-hidden">
          <div className="bg-gradient-to-br from-primary via-primary/80 to-accent h-32" />
          <CardHeader className="items-center text-center -mt-16">
            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
              <AvatarImage src={profileData.profilePictureUrl} alt={profileData.login} data-ai-hint="avatar user"/>
              <AvatarFallback className="text-4xl">
                {profileData.login.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="font-headline text-2xl mt-4">{profileData.login}</CardTitle>
            <CardDescription>{t('loggedInAs', { username: profileData.login })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4 pb-8 px-6">
            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex items-center">
                <Mail className="mr-4 h-6 w-6 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('emailLabel')}</p>
                  <p className="text-md font-medium text-foreground">{profileData.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <UserCircle className="mr-4 h-6 w-6 text-primary" />
                 <div>
                  <p className="text-xs text-muted-foreground">{t('memberSinceLabel')}</p>
                  <p className="text-md font-medium text-foreground">{formattedMemberSince}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Briefcase className="mr-4 h-6 w-6 text-primary" />
                 <div>
                  <p className="text-xs text-muted-foreground">{t('preferredCurrencyLabel')}</p>
                  <p className="text-md font-medium text-foreground">{profileData.userCurrencyCode || t('notSet')}</p>
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
                      <Label htmlFor="login" className="text-right">
                        {t('loginLabel')}
                      </Label>
                      <Input id="login" value={editLogin} onChange={(e) => setEditLogin(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        {t('emailLabel')}
                      </Label>
                      <Input id="email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="currencyCode" className="text-right">
                        {t('currencyCodeLabel')}
                      </Label>
                      <Input id="currencyCode" value={editCurrencyCode} onChange={(e) => setEditCurrencyCode(e.target.value.toUpperCase())} className="col-span-3" placeholder="USD, EUR, PLN..." maxLength={3} />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                       <Button type="button" variant="outline">{t('cancelButton')}</Button>
                    </DialogClose>
                    {/* For DialogClose on submit to work, form submission must be handled by the button itself */}
                     <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? t('saving') : t('saveChangesButton')}
                    </Button>
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
