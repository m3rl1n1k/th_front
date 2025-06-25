
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
};

const defaultDashboardOrder = ['total_balance', 'monthly_income', 'average_expenses', 'expenses_chart', 'last_activity', 'current_budget'];

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
  { id: 'expenses_chart', labelKey: 'dashboardCardExpensesChart' },
  { id: 'last_activity', labelKey: 'dashboardCardLastActivity' },
  { id: 'current_budget', labelKey: 'dashboardCardCurrentBudget' },
];

const SortableCardItem = ({ id, label, isVisible, onVisibilityChange }: { id: string; label: string; isVisible: boolean; onVisibilityChange: (checked: boolean) => void; }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between rounded-md p-3 bg-muted/30">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 h-auto">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Label htmlFor={`visibility-${id}`} className="flex-1 cursor-pointer">{label}</Label>
      </div>
      <Switch id={`visibility-${id}`} checked={isVisible} onCheckedChange={onVisibilityChange} />
    </div>
  );
};


export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, token, fetchUser, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  
  const [isIncomeColorModalOpen, setIsIncomeColorModalOpen] = useState(false);
  const [isExpenseColorModalOpen, setIsExpenseColorModalOpen] = useState(false);
  const [isCapitalColorModalOpen, setIsCapitalColorModalOpen] = useState(false);

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
    }
  });

  const [orderedCards, setOrderedCards] = useState<DashboardCardConfig[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    // Populate General Settings from user object
    if (user?.settings) {
      generalForm.reset({
        chart_income_color: user.settings.chart_income_color ?? DEFAULT_CHART_INCOME_COLOR,
        chart_expense_color: user.settings.chart_expense_color ?? DEFAULT_CHART_EXPENSE_COLOR,
        chart_capital_color: user.settings.chart_capital_color ?? DEFAULT_CHART_CAPITAL_COLOR,
        records_per_page: user.settings.records_per_page ?? DEFAULT_RECORDS_PER_PAGE,
      });
    }

    // Populate Dashboard Settings from localStorage
    let savedDashboardSettings = null;
    if (typeof window !== 'undefined') {
      const storedSettings = localStorage.getItem(DASHBOARD_SETTINGS_KEY);
      if (storedSettings) {
        try {
          savedDashboardSettings = JSON.parse(storedSettings);
        } catch (e) {
          // Failed to parse dashboard settings from localStorage
        }
      }
    }

    const savedOrder = savedDashboardSettings?.dashboard_cards_order || defaultDashboardOrder;
    const savedVisibility = savedDashboardSettings?.dashboard_cards_visibility || defaultDashboardVisibility;

    dashboardForm.reset({
      dashboard_cards_order: savedOrder,
      dashboard_cards_visibility: savedVisibility
    });

    const allCardIds = new Set(ALL_DASHBOARD_CARDS.map(c => c.id));
    const currentOrder = savedOrder.filter((id: string) => allCardIds.has(id));
    ALL_DASHBOARD_CARDS.forEach(card => {
      if (!currentOrder.includes(card.id)) {
        currentOrder.push(card.id);
      }
    });

    setOrderedCards(currentOrder.map((id: string) => ALL_DASHBOARD_CARDS.find(c => c.id === id)!));
    
  }, [user, generalForm, dashboardForm]);
  
  const watchedIncomeColor = generalForm.watch("chart_income_color");
  const watchedExpenseColor = generalForm.watch("chart_expense_color");
  const watchedCapitalColor = generalForm.watch("chart_capital_color");
  const watchedVisibility = dashboardForm.watch("dashboard_cards_visibility");

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
      const apiError = error as ApiError;
      toast({ variant: "destructive", title: t('errorUpdatingUserSettings'), description: apiError.message || t('unexpectedError') });
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

  return (
    <MainLayout>
      <div className="space-y-8 max-w-2xl mx-auto">
        <h1 className="font-headline text-3xl font-bold text-foreground">
          {t('settingsPageTitle')}
        </h1>

        <form onSubmit={dashboardForm.handleSubmit(handleDashboardSettingsSave)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                {t('dashboardLayoutSettingsTitle')}
              </CardTitle>
              <CardDescription>{t('dashboardLayoutSettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={orderedCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {orderedCards.map(card => (
                      <SortableCardItem
                        key={card.id}
                        id={card.id}
                        label={t(card.labelKey as any)}
                        isVisible={watchedVisibility?.[card.id] ?? true}
                        onVisibilityChange={(checked) => {
                          dashboardForm.setValue(`dashboard_cards_visibility.${card.id}`, checked, { shouldDirty: true });
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
          </Card>
        </form>

        <form onSubmit={generalForm.handleSubmit(handleGeneralSettingsSave)}>
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                {t('generalSettingsTitle')}
              </CardTitle>
              <CardDescription>{t('generalSettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chart_income_color_input">{t('chartIncomeColorLabel')}</Label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: watchedIncomeColor || 'transparent' }} />
                  <Controller name="chart_income_color" control={generalForm.control} render={({ field }) => (<Input id="chart_income_color_input" value={field.value || ''} onChange={field.onChange} readOnly className="flex-grow" placeholder="#10b981"/>)}/>
                  <Dialog open={isIncomeColorModalOpen} onOpenChange={setIsIncomeColorModalOpen}><DialogTrigger asChild><Button type="button" variant="outline"><Palette className="mr-2 h-4 w-4" /> {t('selectColorButton') || "Select"}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{t('selectIncomeColorTitle') || "Select Income Color"}</DialogTitle></DialogHeader><Controller name="chart_income_color" control={generalForm.control} render={({ field }) => (<ColorSwatches value={field.value} onChange={(color) => { field.onChange(color); setIsIncomeColorModalOpen(false); }} />)}/></DialogContent></Dialog>
                </div>
                {generalForm.formState.errors.chart_income_color && <p className="text-sm text-destructive">{generalForm.formState.errors.chart_income_color.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="chart_expense_color_input">{t('chartExpenseColorLabel')}</Label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: watchedExpenseColor || 'transparent' }} />
                  <Controller name="chart_expense_color" control={generalForm.control} render={({ field }) => (<Input id="chart_expense_color_input" value={field.value || ''} onChange={field.onChange} readOnly className="flex-grow" placeholder="#ef4444"/>)}/>
                  <Dialog open={isExpenseColorModalOpen} onOpenChange={setIsExpenseColorModalOpen}><DialogTrigger asChild><Button type="button" variant="outline"><Palette className="mr-2 h-4 w-4" /> {t('selectColorButton') || "Select"}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{t('selectExpenseColorTitle') || "Select Expense Color"}</DialogTitle></DialogHeader><Controller name="chart_expense_color" control={generalForm.control} render={({ field }) => (<ColorSwatches value={field.value} onChange={(color) => { field.onChange(color); setIsExpenseColorModalOpen(false); }} />)}/></DialogContent></Dialog>
                </div>
                {generalForm.formState.errors.chart_expense_color && <p className="text-sm text-destructive">{generalForm.formState.errors.chart_expense_color.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="chart_capital_color_input">{t('chartCapitalColorLabel')}</Label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: watchedCapitalColor || 'transparent' }} />
                  <Controller name="chart_capital_color" control={generalForm.control} render={({ field }) => (<Input id="chart_capital_color_input" value={field.value || ''} onChange={field.onChange} readOnly className="flex-grow" placeholder="#f59e0b"/>)}/>
                   <Dialog open={isCapitalColorModalOpen} onOpenChange={setIsCapitalColorModalOpen}><DialogTrigger asChild><Button type="button" variant="outline"><Palette className="mr-2 h-4 w-4" /> {t('selectColorButton') || "Select"}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{t('selectCapitalColorTitle') || "Select Capital Color"}</DialogTitle></DialogHeader><Controller name="chart_capital_color" control={generalForm.control} render={({ field }) => (<ColorSwatches value={field.value} onChange={(color) => { field.onChange(color); setIsCapitalColorModalOpen(false); }} />)}/></DialogContent></Dialog>
                </div>
                {generalForm.formState.errors.chart_capital_color && <p className="text-sm text-destructive">{generalForm.formState.errors.chart_capital_color.message}</p>}
              </div>
               <div className="space-y-2 sm:max-w-xs pt-4">
                  <Label htmlFor="records_per_page">{t('recordsPerPageLabel')}</Label>
                  <Controller name="records_per_page" control={generalForm.control} render={({ field }) => (<Input id="records_per_page" type="number" min="1" max="100" placeholder={String(DEFAULT_RECORDS_PER_PAGE)} {...field} value={field.value ?? ''} className={generalForm.formState.errors.records_per_page ? 'border-destructive' : ''}/>)}/>
                  <p className="text-xs text-muted-foreground">{t('recordsPerPageDesc')}</p>
                  {generalForm.formState.errors.records_per_page && <p className="text-sm text-destructive">{generalForm.formState.errors.records_per_page.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button type="submit" disabled={generalForm.formState.isSubmitting || !generalForm.formState.isDirty}>
                  {generalForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {t('saveSettingsButton')}
                </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
}
