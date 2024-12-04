'use client';

import * as React from 'react';
import {MessageCircle, ArrowUp, X} from 'lucide-react';
import {Button} from '@/app/components/ui/button';
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from '@/app/components/ui/tabs';
import {cn} from '@/lib/utils';
import {Textarea} from '@/app/components/ui/textarea';

export default function Component() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [messages, setMessages] = React.useState<
        {text: string; sender: 'user' | 'bot'}[]
    >([]);
    const [input, setInput] = React.useState('');
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [summary, setSummary] = React.useState<string>('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToTop = () => {
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
        });
    };

    React.useEffect(scrollToTop, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setMessages([...messages, {text: input, sender: 'user'}]); // Append message to end
        setInput('');

        // Simulate bot response
        setTimeout(() => {
            setMessages(prev => [
                ...prev,
                {
                    text: 'Thanks for your message! This is a demo response.',
                    sender: 'bot',
                },
            ]);
        }, 1000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleSummarize = () => {
        if (!selectedFile) return;
        // Simulate summarization
        setSummary(
            'This is a simulated summary of the uploaded file. In a real application, this would be the result of processing the file content.',
        );
    };

    return (
        <>
            {/* Chat Button */}
            <Button
                onClick={() => setIsOpen(true)}
                className={cn(
                    'fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg',
                    isOpen && 'hidden',
                )}
            >
                <MessageCircle className="h-6 w-6" />
            </Button>

            {/* Chat Window */}
            <div
                className={cn(
                    'fixed bottom-4 right-4 w-[380px] rounded-lg bg-background shadow-xl transition-all duration-300',
                    isOpen
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-full opacity-0 pointer-events-none',
                )}
            >
                <div className="flex flex-col h-[600px]">
                    {/* Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8 z-10"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    {/* Tabs */}
                    <Tabs defaultValue="chat" className="flex flex-col h-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="summarize">
                                Summarize
                            </TabsTrigger>
                            <TabsTrigger value="chat">Chat</TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="summarize"
                            className="flex flex-col flex-1 h-full"
                        >
                            <div className="flex-1 p-4 flex flex-col">
                                <div className="text-2xl font-medium text-center mb-4">
                                    Summary
                                </div>
                                <div className="flex-1 bg-muted/50 rounded-lg p-4 overflow-y-auto h-[400px]">
                                    {summary ? (
                                        <p className="text-muted-foreground">
                                            {summary}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground text-center">
                                            {selectedFile
                                                ? 'Click Summarize to process the file'
                                                : 'Select a file to see its summary'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="border-t p-4 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    {selectedFile
                                        ? selectedFile.name
                                        : 'No file selected'}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="sr-only"
                                        onChange={handleFileChange}
                                        accept=".txt,.pdf,.doc,.docx"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                    >
                                        Choose File
                                    </label>
                                    <Button
                                        onClick={handleSummarize}
                                        disabled={!selectedFile}
                                    >
                                        Summarize
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent
                            value="chat"
                            className="flex flex-col h-full"
                        >
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 && (
                                    <div className="flex items-center justify-center text-muted-foreground h-full">
                                        Chat
                                    </div>
                                )}
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            'max-w-[80%] rounded-lg px-4 py-2',
                                            message.sender === 'user'
                                                ? 'ml-auto bg-primary text-primary-foreground'
                                                : 'bg-muted',
                                        )}
                                    >
                                        {message.text}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />{' '}
                                {/* Ensure this is at the bottom of the messages */}
                            </div>

                            {/* Input Area */}
                            <form
                                onSubmit={handleSubmit}
                                className="border-t p-4 flex gap-2 items-end"
                            >
                                <Textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Chat with the LLM"
                                    className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmit(e);
                                        }
                                    }}
                                />
                                <Button
                                    type="submit"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0"
                                >
                                    <ArrowUp className="h-5 w-5" />
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
}
