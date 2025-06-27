
"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTranslation } from '@/context/i18n-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Save, Palette, ListChecks, Loader2, LayoutDashboard, GripVertical } from 'lucide-react';
import { updateUserSettings } from '@/lib/api';
import type { UserSettings, ApiError } from '@/types';
import { ColorSwatches } from '@/components/common/ColorSwatches';
import { Switch } from '@/components/ui/switch';
import { DndContext, closestCenter, type DragEndEvent, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const DEFAULT_RECORDS_PER_PAGE = 20;
const DEFAULT_CHART_INCOME_COLOR = '#10b981';
const DEFAULT_CHART_EXPENSE_COLOR = '#ef4444';
const DEFAULT_CHART_CAPITAL_COLOR = '#f59e0b';

const defaultDashboardVisibility = {
  total_balance: true,
  monthly_income: true,
  average_expenses: true,
  expenses_chart: true,
  last_activity: true,
  current_budget: true,
  quick_actions: true,
};

const defaultDashboardOrder = ['total_balance', 'monthly_income', 'average_expenses', 'quick_actions', 'expenses_chart', 'last_activity', 'current_budget'];

const defaultDashboardSizes: Record<string, string> = {
  total_balance: '1x1',
  monthly_income: '1x1',
  average_expenses: '1x1',
  quick_actions: '2x1',
  expenses_chart: '2x2',
  last_activity: '2x2',
  current_budget: '2x1',
};

const DASHBOARD_SETTINGS_KEY = 'dashboard_layout_settings';

const hexColorRegex = /^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/i;

const generalSettingsSchema = (t: Function) => z.object({
  chart_income_color: z.string().regex(hexColorRegex, { message: t('invalidHexColorError') }).nullable().optional(),
  chart_expense_color: z.string().regex(hexColorRegex, { message: t('invalidHexColorError') }).nullable().optional(),
  chart_capital_color: z.string().regex(hexColorRegex, { message: t('invalidHexColorError') }).nullable().optional(),
  records_per_page: z.coerce.number().min(1, { message: t('recordsPerPageMinError') }).max(100, { message: t('recordsPerPageMaxError') }).nullable().optional(),
});

type GeneralSettingsFormData = z.infer<ReturnType<typeof generalSettingsSchema>>;

const dashboardSettingsSchema = z.object({
  dashboard_cards_visibility: z.record(z.boolean()).default(defaultDashboardVisibility),
  dashboard_cards_order: z.array(z.string()).default(defaultDashboardOrder),
  dashboard_cards_sizes: z.record(z.string()).default(defaultDashboardSizes),
});

type DashboardSettingsFormData = z.infer<typeof dashboardSettingsSchema>;

type DashboardCardConfig = {
  id: string;
  labelKey: string;
};

const ALL_DASHBOARD_CARDS: DashboardCardConfig[] = [
  { id: 'total_balance', labelKey: 'dashboardCardTotalBalance' },
  { id: 'monthly_income', labelKey: 'dashboardCardMonthlyIncome' },
  { id: 'average_expenses', labelKey: 'dashboardCardAverageExpenses' },
  { id: 'quick_actions', labelKey: 'dashboardCardQuickActions' },
  { id: 'expenses_chart', labelKey: 'dashboardCardExpensesChart' },
  { id: 'last_activity', labelKey: 'dashboardCardLastActivity' },
  { id: 'current_budget', labelKey: 'dashboardCardCurrentBudget' },
];

const ALL_CARD_SIZES: { value: string, label: string }[] = [
    { value: '1x1', label: '1x1' },
    { value: '1x2', label: '1x2 (Tall)' },
    { value: '2x1', label: '2x1 (Wide)' },
    { value: '2x2', label: '2x2 (Large)' },
    { value: '4x1', label: '4x1 (Full Width)' },
    { value: '4x2', label: '4x2 (Full Width, Tall)' },
];

const getAvailableSizesForCard = (cardId: string) => {
    return ALL_CARD_SIZES;
};

const SortableDashboardItem = ({ id, label, isVisible, onVisibilityChange, size, onSizeChange }: {
    id: string;
    label: string;
    isVisible: boolean;
    onVisibilityChange: (checked: boolean) => void;
    size: string;
    onSizeChange: (newSize: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, };
  const availableSizes = getAvailableSizesForCard(id);

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-3 rounded-md p-3 bg-muted/50 border sm:flex-row sm:items-center sm:gap-4">
      <div className="flex flex-1 items-center gap-3">
        <Button variant="ghost" size="icon" {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 h-auto shrink-0">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Label htmlFor={`visibility-${id}`} className="font-medium cursor-pointer truncate">{label}</Label>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center">
        <Select value={size} onValueChange={onSizeChange}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableSizes.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Switch id={`visibility-${id}`} checked={isVisible} onCheckedChange={onVisibilityChange} />
      </div>
    </div>
  );
};


export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, token, fetchUser, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  
  const [orderedCards, setOrderedCards] = useState<DashboardCardConfig[]>([]);

  const generalForm = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema(t)),
    defaultValues: {
      chart_income_color: DEFAULT_CHART_INCOME_COLOR,
      chart_expense_color: DEFAULT_CHART_EXPENSE_COLOR,
      chart_capital_color: DEFAULT_CHART_CAPITAL_COLOR,
      records_per_page: DEFAULT_RECORDS_PER_PAGE,
    },
  });

  const dashboardForm = useForm<DashboardSettingsFormData>({
    resolver: zodResolver(dashboardSettingsSchema),
    defaultValues: {
      dashboard_cards_visibility: defaultDashboardVisibility,
      dashboard_cards_order: defaultDashboardOrder,
      dashboard_cards_sizes: defaultDashboardSizes,
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    if (user?.settings) {
      generalForm.reset({
        chart_income_color: user.settings.chart_income_color ?? DEFAULT_CHART_INCOME_COLOR,
        chart_expense_color: user.settings.chart_expense_color ?? DEFAULT_CHART_EXPENSE_COLOR,
        chart_capital_color: user.settings.chart_capital_color ?? DEFAULT_CHART_CAPITAL_COLOR,
        records_per_page: user.settings.records_per_page ?? DEFAULT_RECORDS_PER_PAGE,
      });
    }

    let savedDashboardSettings = null;
    if (typeof window !== 'undefined') {
      const storedSettings = localStorage.getItem(DASHBOARD_SETTINGS_KEY);
      if (storedSettings) {
        try {
          savedDashboardSettings = JSON.parse(storedSettings);
        } catch (e) {
            // Failed to parse dashboard settings
        }
      }
    }

    const savedOrder = savedDashboardSettings?.dashboard_cards_order || defaultDashboardOrder;
    const savedVisibility = savedDashboardSettings?.dashboard_cards_visibility || defaultDashboardVisibility;
    const savedSizes = savedDashboardSettings?.dashboard_cards_sizes || defaultDashboardSizes;

    const allCardIds = new Set(ALL_DASHBOARD_CARDS.map(c => c.id));
    const currentOrder = savedOrder.filter((id: string) => allCardIds.has(id));
    ALL_DASHBOARD_CARDS.forEach(card => {
      if (!currentOrder.includes(card.id)) {
        currentOrder.push(card.id);
      }
    });
    
    dashboardForm.reset({
      dashboard_cards_order: currentOrder,
      dashboard_cards_visibility: { ...defaultDashboardVisibility, ...savedVisibility },
      dashboard_cards_sizes: { ...defaultDashboardSizes, ...savedSizes },
    });

    setOrderedCards(currentOrder.map((id: string) => ALL_DASHBOARD_CARDS.find(c => c.id === id)!));
    
  }, [user, generalForm, dashboardForm]);
  
  const watchedIncomeColor = generalForm.watch("chart_income_color");
  const watchedExpenseColor = generalForm.watch("chart_expense_color");
  const watchedCapitalColor = generalForm.watch("chart_capital_color");
  const watchedVisibility = dashboardForm.watch("dashboard_cards_visibility");
  const watchedSizes = dashboardForm.watch("dashboard_cards_sizes");

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedCards((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newOrderArray = arrayMove(items, oldIndex, newIndex);
        dashboardForm.setValue('dashboard_cards_order', newOrderArray.map(item => item.id), { shouldDirty: true });
        return newOrderArray;
      });
    }
  };

  const handleGeneralSettingsSave: SubmitHandler<GeneralSettingsFormData> = async (data) => {
    if (!token) {
      toast({ variant: "destructive", title: t('error'), description: t('tokenMissingError') });
      return;
    }
    try {
      const payload: Partial<UserSettings> = {
        chart_income_color: data.chart_income_color || null,
        chart_expense_color: data.chart_expense_color || null,
        chart_capital_color: data.chart_capital_color || null,
        records_per_page: data.records_per_page ? Number(data.records_per_page) : null,
      };
      await updateUserSettings(payload, token);
      await fetchUser();
      toast({ title: t('userSettingsSavedSuccess'), description: t('generalSettingsSavedDesc') });
      generalForm.reset(data); // Reset dirty state
    } catch (error) {
      if ((error as ApiError).code !== 401) {
        toast({ variant: "destructive", title: t('errorUpdatingUserSettings'), description: (error as ApiError).message || t('unexpectedError') });
      }
    }
  };

  const handleDashboardSettingsSave: SubmitHandler<DashboardSettingsFormData> = async (data) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(DASHBOARD_SETTINGS_KEY, JSON.stringify(data));
        toast({ title: t('userSettingsSavedSuccess'), description: t('dashboardSettingsSavedDesc') });
        dashboardForm.reset(data); // Reset dirty state
      }
    } catch (error) {
      const e = error as Error;
      toast({ variant: "destructive", title: t('errorUpdatingUserSettings'), description: e.message || t('unexpectedError') });
    }
  };
  
  if (authIsLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const ColorPickerSetting = ({
      label,
      description,
      formControl,
      watchedColor,
  }: {
      label: string;
      description: string;
      formControl: any;
      watchedColor: string | null | undefined;
  }) => (
      <div className="space-y-2">
          <Label>{label}</Label>
          <Dialog>
              <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-start text-left font-normal gap-2 h-auto p-2">
                      <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: watchedColor || 'transparent' }} />
                      <div className="flex flex-col">
                          <span className="font-mono text-sm">{watchedColor}</span>
                          <span className="text-xs text-muted-foreground">{description}</span>
                      </div>
                  </Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>{t('selectColorButton')} - {label}</DialogTitle>
                  </DialogHeader>
                  <Controller name={formControl.name} control={formControl.control} render={({ field }) => (
                      <ColorSwatches value={field.value} onChange={field.onChange} />
                  )}/>
              </DialogContent>
          </Dialog>
      </div>
  );

  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="font-headline text-3xl font-bold text-foreground">
            {t('settingsPageTitle')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('settingsPageDesc')}</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              {t('dashboardLayoutSettingsTitle')}
            </CardTitle>
            <CardDescription>{t('dashboardLayoutSettingsDesc')}</CardDescription>
          </CardHeader>
          <form onSubmit={dashboardForm.handleSubmit(handleDashboardSettingsSave)}>
            <CardContent>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={orderedCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {orderedCards.map(card => (
                      <SortableDashboardItem
                        key={card.id}
                        id={card.id}
                        label={t(card.labelKey as any)}
                        isVisible={watchedVisibility?.[card.id] ?? true}
                        onVisibilityChange={(checked) => {
                          dashboardForm.setValue(`dashboard_cards_visibility.${card.id}`, checked, { shouldDirty: true });
                        }}
                        size={watchedSizes?.[card.id] ?? '1x1'}
                        onSizeChange={(newSize) => {
                            dashboardForm.setValue(`dashboard_cards_sizes.${card.id}`, newSize, { shouldDirty: true });
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={dashboardForm.formState.isSubmitting || !dashboardForm.formState.isDirty}>
                {dashboardForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {t('saveLayoutButton')}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                {t('generalSettingsTitle')}
              </CardTitle>
              <CardDescription>{t('generalSettingsDesc')}</CardDescription>
            </CardHeader>
            <form onSubmit={generalForm.handleSubmit(handleGeneralSettingsSave)}>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-md font-semibold text-foreground">{t('chartColorsTitle')}</h3>
                        <p className="text-sm text-muted-foreground">{t('chartColorsDesc')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                           <ColorPickerSetting 
                                label={t('chartIncomeColorLabel')}
                                description={t('chartIncomeColorDesc')}
                                formControl={{name: 'chart_income_color', control: generalForm.control}}
                                watchedColor={watchedIncomeColor}
                           />
                           <ColorPickerSetting 
                                label={t('chartExpenseColorLabel')}
                                description={t('chartExpenseColorDesc')}
                                formControl={{name: 'chart_expense_color', control: generalForm.control}}
                                watchedColor={watchedExpenseColor}
                           />
                           <ColorPickerSetting 
                                label={t('chartCapitalColorLabel')}
                                description={t('chartCapitalColorDesc')}
                                formControl={{name: 'chart_capital_color', control: generalForm.control}}
                                watchedColor={watchedCapitalColor}
                           />
                        </div>
                    </div>
                    <Separator />
                     <div>
                        <h3 className="text-md font-semibold text-foreground">{t('displayPreferencesTitle')}</h3>
                        <p className="text-sm text-muted-foreground">{t('displayPreferencesDesc')}</p>
                        <div className="space-y-2 sm:max-w-xs pt-4">
                            <Label htmlFor="records_per_page">{t('recordsPerPageLabel')}</Label>
                            <Controller name="records_per_page" control={generalForm.control} render={({ field }) => (<Input id="records_per_page" type="number" min="1" max="100" placeholder={String(DEFAULT_RECORDS_PER_PAGE)} {...field} value={field.value ?? ''} className={generalForm.formState.errors.records_per_page ? 'border-destructive' : ''}/>)}/>
                            {generalForm.formState.errors.records_per_page && <p className="text-sm text-destructive">{generalForm.formState.errors.records_per_page.message}</p>}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={generalForm.formState.isSubmitting || !generalForm.formState.isDirty}>
                      {generalForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {t('saveSettingsButton')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
      </div>
    </MainLayout>
  );
}
