
"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, Mail, Edit3, Briefcase, AlertTriangle as InfoIcon, Coins, Loader2, Lock, KeyRound as KeyIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, getCurrencies, changePassword as apiChangePassword } from '@/lib/api';
import type { ApiError, User as UserType, CurrenciesApiResponse, CurrencyInfo, ChangePasswordPayload } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface UserProfileData {
  login: string;
  email: string;
  memberSince: string;
  profilePictureUrl?: string;
  userCurrencyCode?: string | null;
}

const currencyCodeRegex = /^[A-Z]{3}$/;
const MOST_USEFUL_CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'PLN', 'UAH', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];
const NO_CURRENCY_SELECTED_PLACEHOLDER = '__NO_CURRENCY_SELECTED__';


const createEditProfileSchema = (t: Function) => z.object({
  login: z.string().min(3, { message: t('loginMinLengthError') }),
  email: z.string().email({ message: t('invalidEmail') }),
  userCurrencyCode: z.string()
    .refine(value => value === NO_CURRENCY_SELECTED_PLACEHOLDER || value === '' || currencyCodeRegex.test(value), {
      message: t('invalidCurrencyCodeFormat'),
    })
    .optional()
    .nullable(),
});

type EditProfileFormData = z.infer<ReturnType<typeof createEditProfileSchema>>;

const createChangePasswordSchema = (t: Function) => z.object({
  currentPassword: z.string().min(1, { message: t('currentPasswordRequiredError') }),
  newPassword: z.string().min(6, { message: t('newPasswordMinLengthError') }),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: t('newPasswordsDoNotMatchError'),
  path: ["confirmNewPassword"],
});

type ChangePasswordFormData = z.infer<ReturnType<typeof createChangePasswordSchema>>;


export default function ProfilePage() {
  const { user, token, isAuthenticated, isLoading: authIsLoading, fetchUser } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const { toast } = useToast();
  const [showCurrencyPrompt, setShowCurrencyPrompt] = useState(false);
  const [allCurrencies, setAllCurrencies] = useState<CurrencyInfo[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);

  const EditProfileSchema = createEditProfileSchema(t);
  const ChangePasswordSchema = createChangePasswordSchema(t);

  const editProfileForm = useForm<EditProfileFormData>({
    resolver: zodResolver(EditProfileSchema),
    defaultValues: {
      login: '',
      email: '',
      userCurrencyCode: null,
    }
  });

  const changePasswordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    }
  });

  const fetchPageData = useCallback(async () => {
    if (!isAuthenticated || !user || !token) {
      setIsLoadingPage(false);
      return;
    }
    setIsLoadingPage(true);
    setIsLoadingCurrencies(true);

    try {
      const currenciesData = await getCurrencies(token);
      const formattedCurrencies = Object.entries(currenciesData.currencies).map(([nameKey, code]) => ({
        code,
        nameKey,
        displayName: `${code} - ${nameKey.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`,
      }));
      setAllCurrencies(formattedCurrencies);
      setIsLoadingCurrencies(false);
      
      const newProfileData = {
        login: user.login,
        email: user.email,
        memberSince: user.memberSince || new Date().toISOString(),
        profilePictureUrl: `https://placehold.co/150x150.png?text=${user.login.charAt(0).toUpperCase()}`,
        userCurrencyCode: user.userCurrency?.code || null,
      };
      setProfileData(newProfileData);
      editProfileForm.reset({
        login: newProfileData.login,
        email: newProfileData.email,
        userCurrencyCode: user.userCurrency?.code || null,
      });

      if (!user.userCurrency?.code) {
        setShowCurrencyPrompt(true);
      } else {
        setShowCurrencyPrompt(false);
      }

    } catch (error) {
        console.error("Error fetching page data for profile:", error);
        toast({ variant: "destructive", title: t('errorFetchingData'), description: (error as ApiError).message });
    } finally {
        setIsLoadingPage(false);
    }
  }, [isAuthenticated, user, token, editProfileForm, t, toast]);


  useEffect(() => {
    if (isAuthenticated && user) {
        fetchPageData();
    } else if (isAuthenticated && !user && token && !authIsLoading) {
      fetchUser().then(() => {
        // fetchPageData will be called by user state change if successful
      });
    } else if (!isAuthenticated && !authIsLoading) {
      setIsLoadingPage(false);
      setIsLoadingCurrencies(false);
    }
  }, [isAuthenticated, user, token, authIsLoading, fetchUser, fetchPageData]);


  const { mostUsefulCurrenciesList, otherCurrenciesList } = useMemo(() => {
    const useful = allCurrencies
      .filter(c => MOST_USEFUL_CURRENCY_CODES.includes(c.code))
      .sort((a, b) => MOST_USEFUL_CURRENCY_CODES.indexOf(a.code) - MOST_USEFUL_CURRENCY_CODES.indexOf(b.code));

    const others = allCurrencies
      .filter(c => !MOST_USEFUL_CURRENCY_CODES.includes(c.code))
      .sort((a, b) => (a.displayName || a.code).localeCompare(b.displayName || b.code));

    return { mostUsefulCurrenciesList: useful, otherCurrenciesList: others };
  }, [allCurrencies]);

  const handleProfileUpdate: SubmitHandler<EditProfileFormData> = async (data) => {
    if (!token) {
      toast({ variant: "destructive", title: t('error'), description: t('tokenMissingError') });
      return;
    }

    const payload = {
      login: data.login,
      email: data.email,
      userCurrencyCode: data.userCurrencyCode === NO_CURRENCY_SELECTED_PLACEHOLDER ? undefined : (data.userCurrencyCode || undefined),
    };

    try {
      await updateUserProfile(payload, token);
      await fetchUser(); 
      toast({ title: t('profileUpdateSuccessTitle'), description: t('profileUpdateSuccessDescApi') });
      setShowCurrencyPrompt(false); 
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: t('errorUpdatingProfile'),
        description: apiError.message || t('unexpectedError'),
      });
    }
  };

  const handleChangePassword: SubmitHandler<ChangePasswordFormData> = async (data) => {
    if (!token) {
      toast({ variant: "destructive", title: t('error'), description: t('tokenMissingError') });
      return;
    }

    const payload: ChangePasswordPayload = {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    };

    try {
      await apiChangePassword(payload, token);
      toast({ title: t('passwordChangeSuccessTitle'), description: t('passwordChangeSuccessDesc') });
      changePasswordForm.reset();
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: t('passwordChangeFailedTitle'),
        description: apiError.message || t('unexpectedError'),
      });
    }
  };


  const isLoadingEffectively = isLoadingPage || authIsLoading || (!profileData && isAuthenticated);

  if (isLoadingEffectively) {
    return (
      <MainLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          <h1 className="font-headline text-3xl font-bold text-foreground text-center">{t('userProfileTitle')}</h1>
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
  
  if (!profileData && !authIsLoading && isAuthenticated) {
     return (
      <MainLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          <h1 className="font-headline text-3xl font-bold text-foreground text-center">{t('userProfileTitle')}</h1>
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
        <div className="space-y-6 max-w-2xl mx-auto">
          <h1 className="font-headline text-3xl font-bold text-foreground text-center">{t('userProfileTitle')}</h1>
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
    // error formatting date
  }

  return (
    <MainLayout>
      <div className="space-y-8 max-w-2xl mx-auto">
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
                <form onSubmit={editProfileForm.handleSubmit(handleProfileUpdate)}>
                  <DialogHeader>
                    <DialogTitle>{t('editProfileDialogTitle')}</DialogTitle>
                    <DialogDescription>
                      {t('editProfileDialogDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="login">{t('loginLabel')}</Label>
                      <Controller
                        name="login"
                        control={editProfileForm.control}
                        render={({ field }) => <Input id="login" {...field} />}
                      />
                      {editProfileForm.formState.errors.login && <p className="text-sm text-destructive">{editProfileForm.formState.errors.login.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('emailLabel')}</Label>
                       <Controller
                        name="email"
                        control={editProfileForm.control}
                        render={({ field }) => <Input id="email" type="email" {...field} />}
                      />
                      {editProfileForm.formState.errors.email && <p className="text-sm text-destructive">{editProfileForm.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userCurrencyCode">{t('currencyCodeLabel')}</Label>
                       <Controller
                        name="userCurrencyCode"
                        control={editProfileForm.control}
                        render={({ field }) => (
                          <Select
                            onValueChange={(value) => {
                                field.onChange(value);
                            }}
                            value={field.value || NO_CURRENCY_SELECTED_PLACEHOLDER}
                            disabled={isLoadingCurrencies || allCurrencies.length === 0}
                          >
                            <SelectTrigger id="userCurrencyCode" className={editProfileForm.formState.errors.userCurrencyCode ? 'border-destructive' : ''}>
                              <Coins className="mr-2 h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder={isLoadingCurrencies ? t('loading') : t('selectCurrencyPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                               <SelectItem value={NO_CURRENCY_SELECTED_PLACEHOLDER}>{t('notSet')}</SelectItem>
                               <SelectSeparator />
                              {mostUsefulCurrenciesList.length > 0 && (
                                <SelectGroup>
                                  <SelectLabel>{t('mostCommonCurrenciesLabel')}</SelectLabel>
                                  {mostUsefulCurrenciesList.map(curr => (
                                    <SelectItem key={curr.code} value={curr.code}>{curr.displayName}</SelectItem>
                                  ))}
                                </SelectGroup>
                              )}
                              {mostUsefulCurrenciesList.length > 0 && otherCurrenciesList.length > 0 && <SelectSeparator />}
                              {otherCurrenciesList.length > 0 && (
                                <SelectGroup>
                                  <SelectLabel>{t('allCurrenciesLabel')}</SelectLabel>
                                  {otherCurrenciesList.map(curr => (
                                    <SelectItem key={curr.code} value={curr.code}>{curr.displayName}</SelectItem>
                                  ))}
                                </SelectGroup>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {editProfileForm.formState.errors.userCurrencyCode && <p className="text-sm text-destructive">{editProfileForm.formState.errors.userCurrencyCode.message}</p>}
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                       <Button type="button" variant="outline">{t('cancelButton')}</Button>
                    </DialogClose>
                     <Button type="submit" disabled={editProfileForm.formState.isSubmitting || isLoadingCurrencies}>
                        {(editProfileForm.formState.isSubmitting || isLoadingCurrencies) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {(editProfileForm.formState.isSubmitting || isLoadingCurrencies) ? t('saving') : t('saveChangesButton')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <KeyIcon className="mr-3 h-6 w-6 text-primary" />
              {t('changePasswordTitle')}
            </CardTitle>
            <CardDescription>{t('changePasswordDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePasswordForm.handleSubmit(handleChangePassword)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('currentPasswordLabel')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Controller
                    name="currentPassword"
                    control={changePasswordForm.control}
                    render={({ field }) => (
                      <Input id="currentPassword" type="password" placeholder="••••••••" {...field} className={`pl-10 ${changePasswordForm.formState.errors.currentPassword ? 'border-destructive' : ''}`} />
                    )}
                  />
                </div>
                {changePasswordForm.formState.errors.currentPassword && <p className="text-sm text-destructive">{changePasswordForm.formState.errors.currentPassword.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('newPasswordLabel')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Controller
                    name="newPassword"
                    control={changePasswordForm.control}
                    render={({ field }) => (
                      <Input id="newPassword" type="password" placeholder={t('newPasswordPlaceholder')} {...field} className={`pl-10 ${changePasswordForm.formState.errors.newPassword ? 'border-destructive' : ''}`} />
                    )}
                  />
                </div>
                {changePasswordForm.formState.errors.newPassword && <p className="text-sm text-destructive">{changePasswordForm.formState.errors.newPassword.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">{t('confirmNewPasswordLabel')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Controller
                    name="confirmNewPassword"
                    control={changePasswordForm.control}
                    render={({ field }) => (
                      <Input id="confirmNewPassword" type="password" placeholder={t('confirmNewPasswordPlaceholder')} {...field} className={`pl-10 ${changePasswordForm.formState.errors.confirmNewPassword ? 'border-destructive' : ''}`} />
                    )}
                  />
                </div>
                {changePasswordForm.formState.errors.confirmNewPassword && <p className="text-sm text-destructive">{changePasswordForm.formState.errors.confirmNewPassword.message}</p>}
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={changePasswordForm.formState.isSubmitting}>
                  {changePasswordForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyIcon className="mr-2 h-4 w-4" />}
                  {changePasswordForm.formState.isSubmitting ? t('saving') : t('changePasswordButton')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
