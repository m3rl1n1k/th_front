'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MainCategory, SubCategory } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const categoryFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, { message: 'Must be a valid hex color code (e.g., #RRGGBB or #RGB).' }),
  mainCategoryId: z.string().optional(), // Only for sub-categories
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  type: 'main' | 'sub';
  initialData?: MainCategory | SubCategory | null;
  mainCategories?: MainCategory[]; // Required if type is 'sub'
  onSubmitAction: (data: CategoryFormValues) => Promise<MainCategory | SubCategory | null>;
}

export function CategoryForm({ type, initialData, mainCategories, onSubmitAction }: CategoryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const defaultValues: Partial<CategoryFormValues> = initialData
    ? {
        name: initialData.name,
        color: initialData.color,
        mainCategoryId: type === 'sub' ? (initialData as SubCategory).mainCategoryId : undefined,
      }
    : {
        name: '',
        color: '#3498db', // Default color
        mainCategoryId: type === 'sub' && mainCategories && mainCategories.length > 0 ? mainCategories[0].id : undefined,
      };
  
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues,
  });

  async function onSubmit(data: CategoryFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(data);
      if (result) {
        toast({
          title: initialData ? 'Category Updated' : 'Category Created',
          description: `Category "${result.name}" has been successfully ${initialData ? 'updated' : 'created'}.`,
        });
        router.push('/categories');
        router.refresh();
      } else {
        throw new Error('Failed to save category');
      }
    } catch (error) {
       toast({
        title: 'Error',
        description: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">
          {initialData ? `Edit ${type === 'main' ? 'Main' : 'Sub'} Category` : `Create New ${type === 'main' ? 'Main' : 'Sub'} Category`}
        </CardTitle>
        <CardDescription>
          {type === 'main' ? 'Main categories help group your sub-categories.' : 'Sub-categories provide detailed classification for transactions.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder={`e.g., ${type === 'main' ? 'Groceries' : 'Vegetables'}`} {...field} disabled={isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === 'sub' && mainCategories && (
              <FormField
                control={form.control}
                name="mainCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      disabled={isSubmitting || mainCategories.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={mainCategories.length > 0 ? "Select a main category" : "No main categories available"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mainCategories.map((mc) => (
                          <SelectItem key={mc.id} value={mc.id}>
                            {mc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mainCategories.length === 0 && <p className="text-sm text-muted-foreground mt-1">Please create a main category first.</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input type="color" {...field} className="w-16 h-10 p-1" disabled={isSubmitting} />
                    </FormControl>
                     <Input 
                        type="text" 
                        placeholder="#RRGGBB" 
                        value={field.value} 
                        onChange={field.onChange} 
                        className="flex-1"
                        disabled={isSubmitting}
                      />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || (type === 'sub' && (!mainCategories || mainCategories.length === 0))}>
                 {isSubmitting ? (initialData ? 'Saving...' : 'Creating...') : (initialData ? 'Save Changes' : 'Create Category')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
