
'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clock, PlayCircle, CheckCircle2, MoreVertical, ChevronDown } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import type { FeedbackItem, FeedbackStatus, FeedbackType, feedbackStatuses } from '@/lib/definitions';
import { updateFeedbackStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const dateLocales: { [key: string]: Locale } = {
  en: enUS,
  es: es,
};

interface FeedbackDisplayProps {
  groupedFeedbacks: { type: FeedbackType; feedbacks: FeedbackItem[] }[];
  translations: any; // from viewFeedbackPage namespace
  locale: string;
}

const statusColors: Record<FeedbackStatus, string> = {
  pending: 'bg-yellow-500 hover:bg-yellow-500/90',
  active: 'bg-blue-500 hover:bg-blue-500/90',
  closed: 'bg-green-500 hover:bg-green-500/90',
};

const statusIcons: Record<FeedbackStatus, React.ElementType> = {
  pending: Clock,
  active: PlayCircle,
  closed: CheckCircle2,
};

export function FeedbackDisplay({ groupedFeedbacks, translations, locale }: FeedbackDisplayProps) {
  const { toast } = useToast();
  const router = useRouter();
  const currentDtsLocale = dateLocales[locale] || enUS;

  const handleStatusChange = async (feedbackId: string, newStatus: FeedbackStatus) => {
    try {
      const result = await updateFeedbackStatus(feedbackId, newStatus);
      if (result) {
        toast({
          title: translations.statusUpdateSuccess || 'Status Updated',
          description: `Feedback status changed to ${translations.statuses?.[newStatus] || newStatus}.`,
        });
        router.refresh();
      } else {
        throw new Error('Failed to update status from server.');
      }
    } catch (error) {
      toast({
        title: translations.statusUpdateError || 'Error',
        description: (error instanceof Error ? error.message : String(error)),
        variant: 'destructive',
      });
    }
  };

  if (groupedFeedbacks.length === 0) {
    return <p className="text-center text-muted-foreground py-8">{translations.noFeedback}</p>;
  }

  return (
    <Accordion type="multiple" defaultValue={groupedFeedbacks.map(g => g.type)} className="w-full space-y-2">
      {groupedFeedbacks.map((group) => (
        <AccordionItem value={group.type} key={group.type} className="border rounded-lg shadow-sm bg-card">
          <AccordionTrigger className="p-4 hover:no-underline">
            <h3 className="text-lg font-semibold font-headline">
              {translations.feedbackTypes?.[group.type] || group.type} ({group.feedbacks.length})
            </h3>
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0 border-t">
            <div className="space-y-4">
              {group.feedbacks.map((item) => {
                const StatusIcon = statusIcons[item.status];
                return (
                  <Card key={item.id} className="bg-card-foreground/5">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{item.subject}</CardTitle>
                          <CardDescription className="text-xs">
                            {translations.createdAtLabel || 'Submitted'}: {format(new Date(item.createdAt), 'PPpp', { locale: currentDtsLocale })} 
                            ({formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: currentDtsLocale })})
                            {item.userEmail && ` | ${translations.emailLabel || 'User Email'}: ${item.userEmail}`}
                          </CardDescription>
                        </div>
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1 h-auto">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(['pending', 'active', 'closed'] as FeedbackStatus[]).map(s => (
                              <DropdownMenuItem 
                                key={s} 
                                onClick={() => handleStatusChange(item.id, s)}
                                disabled={item.status === s}
                              >
                                {React.createElement(statusIcons[s], {className: "mr-2 h-4 w-4"})}
                                {translations.statuses?.[s] || s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{item.message}</p>
                    </CardContent>
                    <CardFooter>
                       <Badge className={`${statusColors[item.status]} text-white`}>
                          <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                          {translations.statuses?.[item.status] || item.status}
                        </Badge>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
