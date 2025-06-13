
'use client';

import React, { useState } from 'react';
import type { Budget, MainCategory } from '@/lib/definitions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTableActions } from '@/components/shared/DataTableActions';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { deleteBudget } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { PiggyBank } from 'lucide-react';
import { getMonthName } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export interface AugmentedBudget extends Budget {
  actualSpent: number;
  mainCategoryName: string;
}

interface BudgetListProps {
  initialBudgets: AugmentedBudget[];
  translations: any; 
  locale: string;
}

export function BudgetList({ initialBudgets, translations, locale }: BudgetListProps) {
  const [budgets, setBudgets] = useState<AugmentedBudget[]>(initialBudgets);
  const [itemToDelete, setItemToDelete] = useState<AugmentedBudget | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteBudget(itemToDelete.id);
      setBudgets(budgets.filter((b) => b.id !== itemToDelete.id));
      toast({
        title: translations.deleteSuccessToastTitle,
        description: translations.deleteSuccessToastDescription,
      });
    } catch (error) {
      toast({
        title: translations.errorToastTitle,
        description: translations.errorToastDescription.replace('{error}', error instanceof Error ? error.message : String(error)),
        variant: 'destructive',
      });
    } finally {
      setItemToDelete(null);
    }
  };

  const formatCurrency = (amount: number) => {
    // TODO: Make currency dynamic based on user settings or wallet
    return amount.toLocaleString(locale, { style: 'currency', currency: 'USD' });
  };

  if (budgets.length === 0) {
    return (
      <Card className="text-center p-10 shadow">
        <PiggyBank className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">{translations.noBudgets}</h3>
        <p className="text-muted-foreground">{translations.description}</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translations.monthYearHeader || 'Month/Year'}</TableHead>
                <TableHead>{translations.categoryHeader || 'Category'}</TableHead>
                <TableHead>{translations.budgetProgressHeader || 'Budget Progress'}</TableHead>
                <TableHead className="text-right">{translations.actionsHeader || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => {
                const monthYear = `${getMonthName(budget.month, locale)} ${budget.year}`;
                const progressPercentage = budget.plannedAmount > 0 ? (budget.actualSpent / budget.plannedAmount) * 100 : 0;
                const progressBarColor = progressPercentage > 100 ? 'bg-destructive' : 'bg-primary';
                
                return (
                  <TableRow key={budget.id}>
                    <TableCell>{monthYear}</TableCell>
                    <TableCell className="font-medium">{budget.mainCategoryName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className={budget.actualSpent > budget.plannedAmount ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                            {formatCurrency(budget.actualSpent)} {translations.spentLabel || 'spent'}
                          </span>
                          <span className="text-muted-foreground">
                            / {formatCurrency(budget.plannedAmount)}
                          </span>
                        </div>
                        <Progress value={Math.min(progressPercentage, 100)} className="h-2" indicatorClassName={progressBarColor} />
                        {progressPercentage > 100 && (
                           <p className="text-xs text-destructive">{translations.overBudgetWarning || 'Over budget!'}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DataTableActions
                        onEdit={() => router.push(`/${locale}/budgets/edit/${budget.id}`)}
                        onDelete={() => setItemToDelete(budget)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <DeleteConfirmationDialog
        isOpen={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={handleDelete}
        itemName={`${translations.title.toLowerCase()} for ${itemToDelete?.mainCategoryName || ''} for ${getMonthName(itemToDelete?.month || 1, locale)} ${itemToDelete?.year}`}
      />
    </>
  );
}
