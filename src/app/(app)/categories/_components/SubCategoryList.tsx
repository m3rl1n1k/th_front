'use client';

import React, { useState } from 'react';
import type { SubCategory, MainCategory } from '@/lib/definitions';
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
import { deleteSubCategory } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Tag } from 'lucide-react';

interface SubCategoryListProps {
  initialSubCategories: SubCategory[];
  mainCategories: MainCategory[]; // To display main category name
}

export function SubCategoryList({ initialSubCategories, mainCategories }: SubCategoryListProps) {
  const [subCategories, setSubCategories] = useState<SubCategory[]>(initialSubCategories);
  const [itemToDelete, setItemToDelete] = useState<SubCategory | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const getMainCategoryName = (mainCategoryId: string) => {
    return mainCategories.find(mc => mc.id === mainCategoryId)?.name || 'N/A';
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteSubCategory(itemToDelete.id);
      setSubCategories(subCategories.filter((sc) => sc.id !== itemToDelete.id));
      toast({
        title: 'Sub-Category Deleted',
        description: `Sub-category "${itemToDelete.name}" has been successfully deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Error Deleting Sub-Category',
        description: `Could not delete sub-category: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });
    } finally {
      setItemToDelete(null);
    }
  };
  
  if (subCategories.length === 0) {
     return (
      <Card className="text-center p-10 shadow">
        <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Sub-Categories Yet</h3>
        <p className="text-muted-foreground">Create sub-categories for more detailed financial tracking.</p>
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
              <TableHead>Main Category</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subCategories.map((subCategory) => (
              <TableRow key={subCategory.id}>
                <TableCell className="font-medium">{subCategory.name}</TableCell>
                <TableCell>{getMainCategoryName(subCategory.mainCategoryId)}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span
                      className="h-4 w-4 rounded-full mr-2 border"
                      style={{ backgroundColor: subCategory.color }}
                    ></span>
                     <Badge variant="outline" style={{ borderColor: subCategory.color, color: subCategory.color }}>{subCategory.color}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DataTableActions
                    onEdit={() => router.push(`/categories/edit/sub/${subCategory.id}`)}
                    onDelete={() => setItemToDelete(subCategory)}
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
