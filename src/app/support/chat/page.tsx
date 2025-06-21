"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { supportChat, type ChatMessage } from '@/ai/flows/support-chat-flow';
import { Bot, Send, User, Loader2, AlertTriangle, Settings } from 'lucide-react';
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
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChatFormData>({
    resolver: zodResolver(ChatSchema),
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // Ensure this runs only on the client
    const key = localStorage.getItem('gemini_api_key');
    setGeminiApiKey(key);
  }, []);

  const onSubmit: SubmitHandler<ChatFormData> = async (data) => {
    if (!geminiApiKey) {
      toast({
        variant: "destructive",
        title: "API Key Missing",
        description: "Please set your Gemini API key in the settings page to use the AI chat.",
      });
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: data.message };
    setMessages(prev => [...prev, userMessage]);
    reset();
    setIsThinking(true);

    try {
      const response = await supportChat({
        history: messages,
        message: data.message,
        language: language, // Pass the current language
        apiKey: geminiApiKey, // Pass the API key
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
          <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
             {!geminiApiKey && (
              <Alert variant="default" className="mb-4 bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 !text-amber-600 dark:!text-amber-400" />
                <AlertTitle>Gemini API Key Required</AlertTitle>
                <AlertDescription>
                  Please go to the settings page to add your Gemini API key to enable this feature.
                  <Button variant="link" asChild className="p-0 h-auto ml-2 text-amber-800 dark:text-amber-200 font-semibold">
                    <Link href="/settings">
                      Go to Settings
                      <Settings className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
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
                      "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg whitespace-pre-wrap",
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
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
              disabled={isThinking || !geminiApiKey}
            />
            <Button type="submit" size="icon" disabled={isThinking || !geminiApiKey}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </MainLayout>
  );
}
