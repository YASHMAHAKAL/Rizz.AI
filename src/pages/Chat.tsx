import { useState, useRef, useEffect } from 'react';
import { Card } from '../components/Card';
import { useRizz } from '../context/RizzContext';
import { generateChatReply } from '../services/gemini';
import { Send, User, Bot, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export function Chat() {
    const { chatHistory, addChatMessage, decrementCredits, credits } = useRizz();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Use the default session for now
    const currentSession = chatHistory[0];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentSession.messages]);

    const handleSend = async () => {
        if (!input.trim() || credits <= 0) return;

        const userMsg = input;
        setInput('');
        addChatMessage(currentSession.id, { role: 'user', text: userMsg });
        decrementCredits(1);
        setIsLoading(true);

        try {
            // Prepare history for API
            const history = currentSession.messages.map(m => ({
                role: m.role,
                parts: m.text
            }));

            const { reply, critique } = await generateChatReply(history, userMsg);

            addChatMessage(currentSession.id, {
                role: 'model',
                text: reply,
                critique
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Sidebar - Sessions */}
            <Card className="hidden md:flex w-64 flex-col gap-4 h-full">
                <h3 className="font-bold text-charcoal px-2">Active Sessions</h3>
                <div className="flex-1 overflow-y-auto space-y-2">
                    <div className="p-3 rounded-xl bg-coral/10 text-coral font-medium text-sm cursor-pointer border border-coral/20">
                        Current Chat
                    </div>
                    {/* Placeholder for more sessions */}
                </div>
            </Card>

            {/* Main Chat Area */}
            <Card className="flex-1 flex flex-col h-full p-0 overflow-hidden bg-white/50">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {currentSession.messages.length === 0 && (
                        <div className="text-center text-gray-400 mt-20">
                            <p>Start a roleplay session!</p>
                            <p className="text-sm">"Pretend you're my date at a coffee shop..."</p>
                        </div>
                    )}

                    {currentSession.messages.map((msg, idx) => (
                        <div key={idx} className={clsx("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-coral/20 flex items-center justify-center text-coral flex-shrink-0">
                                    <Bot size={16} />
                                </div>
                            )}

                            <div className="space-y-2 max-w-[80%]">
                                <div className={clsx(
                                    "p-3 rounded-2xl text-sm leading-relaxed",
                                    msg.role === 'user'
                                        ? "bg-coral text-white rounded-tr-none"
                                        : "bg-white border border-gray-100 text-charcoal rounded-tl-none shadow-sm"
                                )}>
                                    {msg.text}
                                </div>

                                {/* Critique Widget */}
                                {msg.critique && (
                                    <div className="bg-yellow-50 border border-yellow-100 p-2 rounded-lg flex gap-2 items-start animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-yellow-800 font-medium">Coach: {msg.critique}</p>
                                    </div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                                    <User size={16} />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-coral/20 flex items-center justify-center text-coral">
                                <Bot size={16} />
                            </div>
                            <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-coral/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-coral/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-coral/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-2 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-coral/20 outline-none text-charcoal placeholder:text-gray-400"
                            disabled={isLoading || credits <= 0}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim() || credits <= 0}
                            className="p-2 rounded-xl bg-coral text-white hover:bg-coral-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                    {credits <= 0 && (
                        <p className="text-xs text-red-500 mt-2 text-center">Out of credits! Wait for refill.</p>
                    )}
                </div>
            </Card>
        </div>
    );
}
