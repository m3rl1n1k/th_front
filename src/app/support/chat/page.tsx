
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactMarkdown from 'react-markdown';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { supportChat, type ChatMessage } from '@/ai/flows/support-chat-flow';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const chatFormSchema = (t: Function) => z.object({
  message: z.string().min(1, { message: t('chatMessageRequiredError') }),
});

type ChatFormData = z.infer<ReturnType<typeof chatFormSchema>>;

export default function SupportChatPage() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const ChatSchema = chatFormSchema(t);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChatFormData>({
    resolver: zodResolver(ChatSchema),
  });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const onSubmit: SubmitHandler<ChatFormData> = async (data) => {
    const userMessage: ChatMessage = { role: 'user', content: data.message };
    setMessages(prev => [...prev, userMessage]);
    reset();
    setIsThinking(true);

    try {
      const response = await supportChat({
        history: messages,
        message: data.message,
        language: language,
      });

      const modelMessage: ChatMessage = { role: 'model', content: response.response };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: (error as Error).message || t('unexpectedError'),
      });
      // Optionally remove the user's message if the API call fails
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <MainLayout>
      <Card className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px] shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            {t('supportChat')}
          </CardTitle>
          <CardDescription>{t('supportChatDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0">
          <ScrollArea className="h-full p-6">
            <div className="space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'model' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg",
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {msg.role === 'model' ? (
                      <ReactMarkdown
                        className="text-sm"
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                          a: ({node, ...props}) => <a className="text-primary underline" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'user' && user && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://placehold.co/100x100.png?text=${user.login.charAt(0).toUpperCase()}`} alt={user.login} data-ai-hint="avatar user"/>
                      <AvatarFallback>{user.login.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isThinking && (
                 <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div className="bg-muted p-3 rounded-lg flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">{t('supportChatThinking')}</span>
                    </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="pt-4 border-t">
          <form onSubmit={handleSubmit(onSubmit)} className="w-full flex items-center gap-2">
            <Input
              {...register('message')}
              placeholder={t('chatPlaceholder')}
              autoComplete="off"
              className={errors.message ? 'border-destructive' : ''}
              disabled={isThinking}
            />
            <Button type="submit" size="icon" disabled={isThinking}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </MainLayout>
  );
}
