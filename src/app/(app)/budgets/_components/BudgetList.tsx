
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
import { getMonthName } from '@/lib/utils'; // We'll create this helper

interface BudgetListProps {
  initialBudgets: Budget[];
  mainCategories: MainCategory[];
  translations: any; // from budgetsPage namespace
  locale: string;
}

export function BudgetList({ initialBudgets, mainCategories, translations, locale }: BudgetListProps) {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [itemToDelete, setItemToDelete] = useState<Budget | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const getMainCategoryName = (mainCategoryId: string) => {
    return mainCategories.find(mc => mc.id === mainCategoryId)?.name || 'N/A';
  };

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
                <TableHead>Month/Year</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Planned Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => {
                const categoryName = getMainCategoryName(budget.mainCategoryId);
                const monthYear = `${getMonthName(budget.month, locale)} ${budget.year}`;
                return (
                  <TableRow key={budget.id}>
                    <TableCell>{monthYear}</TableCell>
                    <TableCell className="font-medium">{categoryName}</TableCell>
                    <TableCell className="text-right">
                      {budget.plannedAmount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} {/* TODO: Use actual currency */}
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
        itemName={`${translations.title.toLowerCase()} for ${getMainCategoryName(itemToDelete?.mainCategoryId || '')} for ${getMonthName(itemToDelete?.month || 1, locale)} ${itemToDelete?.year}`}
      />
    </>
  );
}
