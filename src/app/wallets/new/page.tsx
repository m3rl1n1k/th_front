
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { createWallet, getWalletTypes } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { CreateWalletPayload, WalletTypeMap } from '@/types';
import { Save, ArrowLeft, Palette, Loader2, Check } from 'lucide-react';
import { iconMapKeys, IconRenderer } from '@/components/common/icon-renderer';
import { cn } from '@/lib/utils';

const predefinedColors = [
  '#FFFFFF', '#000000', '#808080', '#D3D3D3',
  '#FF0000', '#FA8072', '#FFC0CB', '#DC143C',
  '#FFA500', '#FFD700', '#FFFF00',
  '#008000', '#90EE90', '#2E8B57', '#32CD32',
  '#0000FF', '#ADD8E6', '#4682B4', '#00008B',
  '#800080', '#DA70D6', '#9370DB',
  '#A52A2A', '#DEB887', '#F5F5DC'
];

const hexColorRegex = /^#([0-9A-Fa-f]{6})$/i;
const currencyCodeRegex = /^[A-Z]{3}$/;

const createWalletFormSchema = (t: Function) => z.object({
  name: z.string().min(1, { message: t('walletNameRequired') }).max(50, { message: t('walletNameTooLong') }),
  initialBalance: z.coerce.number().optional().nullable(),
  currencyCode: z.string().regex(currencyCodeRegex, { message: t('invalidCurrencyCode') }).min(3, { message: t('currencyCodeRequired') }).max(3),
  typeKey: z.string().min(1, { message: t('walletTypeRequired') }),
  accountNumber: z.string().max(50, { message: t('accountNumberTooLong') }).optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().regex(hexColorRegex, { message: t('invalidHexColor') }).optional().nullable(),
});

type WalletFormData = z.infer<ReturnType<typeof createWalletFormSchema>>;

export default function NewWalletPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [walletTypes, setWalletTypes] = useState<WalletTypeMap>({});
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  const WalletFormSchema = createWalletFormSchema(t);

  const { control, handleSubmit, register, formState: { errors, isSubmitting } } = useForm<WalletFormData>({
    resolver: zodResolver(WalletFormSchema),
    defaultValues: {
      name: '',
      initialBalance: null,
      currencyCode: '',
      typeKey: '',
      accountNumber: null,
      icon: null,
      color: predefinedColors[0],
    },
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingTypes(true);
      getWalletTypes(token)
        .then(data => setWalletTypes(data.types || {}))
        .catch(error => toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message }))
        .finally(() => setIsLoadingTypes(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, t, toast]);

  const onSubmit: SubmitHandler<WalletFormData> = async (data) => {
    if (!token) return;
    const payload: CreateWalletPayload = {
      name: data.name,
      initial_balance_cents: data.initialBalance ? Math.round(data.initialBalance * 100) : 0,
      currency_code: data.currencyCode.toUpperCase(),
      type_key: data.typeKey,
      account_number: data.accountNumber || null,
      icon: data.icon || null,
      color: data.color || null,
    };

    try {
      await createWallet(payload, token);
      toast({ title: t('walletCreatedTitle'), description: t('walletCreatedDesc') });
      router.push('/wallets');
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorCreatingWallet'), description: error.message });
    }
  };

  const ColorSwatches = ({ value, onChange }: { value: string | null | undefined, onChange: (color: string) => void }) => (
    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 p-1 border rounded-md bg-muted/20 max-w-sm">
      {predefinedColors.map((color) => (
        <button
          type="button"
          key={color}
          onClick={() => onChange(color)}
          className={cn(
            "w-full aspect-square rounded-md border-2 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            value === color ? 'border-primary ring-2 ring-primary ring-offset-background' : 'border-transparent hover:border-muted-foreground/50',
            color === '#FFFFFF' && 'border-input'
          )}
          style={{ backgroundColor: color }}
          title={color}
          aria-label={`Color ${color}`}
        >
          {value === color && <Check className={cn("h-4 w-4 text-primary-foreground mix-blend-difference", color === '#000000' || color === '#00008B' || color === '#800080' || color === '#A52A2A' ? 'text-white' : 'text-black')} />}
        </button>
      ))}
    </div>
  );
  
  const anyDataLoading = isLoadingTypes;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold text-foreground">{t('newWalletTitle')}</h1>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backButton')}
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('enterWalletDetails')}</CardTitle>
            <CardDescription>{t('fillWalletFormBelow')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('walletNameLabel')}</Label>
                  <Input id="name" {...register('name')} placeholder={t('walletNamePlaceholder')} className={errors.name ? 'border-destructive' : ''} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="typeKey">{t('walletTypeLabel')}</Label>
                  <Controller
                    name="typeKey"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingTypes || Object.keys(walletTypes).length === 0}>
                        <SelectTrigger id="typeKey" className={errors.typeKey ? 'border-destructive' : ''}>
                          <SelectValue placeholder={isLoadingTypes ? t('loading') : t('selectWalletTypePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(walletTypes).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {t(`walletType_${value}` as any, { defaultValue: value })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.typeKey && <p className="text-sm text-destructive">{errors.typeKey.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="initialBalance">{t('initialBalanceLabel')}</Label>
                  <Input id="initialBalance" type="number" step="0.01" {...register('initialBalance')} placeholder={t('initialBalancePlaceholder')} className={errors.initialBalance ? 'border-destructive' : ''} />
                  {errors.initialBalance && <p className="text-sm text-destructive">{errors.initialBalance.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencyCode">{t('currencyCodeLabel')}</Label>
                  <Input id="currencyCode" {...register('currencyCode')} placeholder={t('currencyCodePlaceholder')} className={errors.currencyCode ? 'border-destructive' : ''} maxLength={3}/>
                  {errors.currencyCode && <p className="text-sm text-destructive">{errors.currencyCode.message}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                  <Label htmlFor="accountNumber">{t('accountNumberLabelOptional')}</Label>
                  <Input id="accountNumber" {...register('accountNumber')} placeholder={t('accountNumberPlaceholder')} className={errors.accountNumber ? 'border-destructive' : ''} />
                  {errors.accountNumber && <p className="text-sm text-destructive">{errors.accountNumber.message}</p>}
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="icon">{t('iconLabel')}</Label>
                    <Controller
                        name="icon"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={(value) => field.onChange(value === 'none' ? null : value)} value={field.value || 'none'}>
                            <SelectTrigger id="icon" className={errors.icon ? 'border-destructive' : ''}>
                                <SelectValue placeholder={t('selectIconPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                                <SelectItem value="none">{t('noIconOption')}</SelectItem>
                                {iconMapKeys.map(iconKey => (
                                <SelectItem key={iconKey} value={iconKey}>
                                    <div className="flex items-center gap-2">
                                    <IconRenderer iconName={iconKey} className="h-4 w-4" />
                                    {iconKey}
                                    </div>
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.icon && <p className="text-sm text-destructive">{errors.icon.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="main-color-swatches">{t('colorLabel')}</Label>
                    <Controller
                        name="color"
                        control={control}
                        render={({ field }) => (
                           <ColorSwatches value={field.value} onChange={field.onChange} />
                        )}
                    />
                    {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting || anyDataLoading}>
                  {isSubmitting || anyDataLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting || anyDataLoading ? t('saving') : t('saveWalletButton')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
