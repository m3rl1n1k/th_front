'use client';

import React, { useState } from 'react';
import type { MainCategory } from '@/lib/definitions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DataTableActions } from '@/components/shared/DataTableActions';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { deleteMainCategory } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Tag } from 'lucide-react';

export function MainCategoryList({ initialMainCategories }: { initialMainCategories: MainCategory[] }) {
  const [categories, setCategories] = useState<MainCategory[]>(initialMainCategories);
  const [itemToDelete, setItemToDelete] = useState<MainCategory | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMainCategory(itemToDelete.id);
      setCategories(categories.filter((c) => c.id !== itemToDelete.id));
      toast({
        title: 'Main Category Deleted',
        description: `Category "${itemToDelete.name}" has been successfully deleted. Associated sub-categories were also removed.`,
      });
      router.refresh(); // Refresh to update subcategory list if on the same page
    } catch (error) {
      toast({
        title: 'Error Deleting Category',
        description: `Could not delete category: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });
    } finally {
      setItemToDelete(null);
    }
  };

  if (categories.length === 0) {
    return (
      <Card className="text-center p-10 shadow">
        <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Main Categories Yet</h3>
        <p className="text-muted-foreground">Create main categories to organize your finances.</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span
                      className="h-4 w-4 rounded-full mr-2 border"
                      style={{ backgroundColor: category.color }}
                    ></span>
                    <Badge variant="outline" style={{ borderColor: category.color, color: category.color }}>{category.color}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DataTableActions
                    onEdit={() => router.push(`/categories/edit/main/${category.id}`)}
                    onDelete={() => setItemToDelete(category)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <DeleteConfirmationDialog
        isOpen={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={handleDelete}
        itemName={itemToDelete?.name}
      />
    </>
  );
}
