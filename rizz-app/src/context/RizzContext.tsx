import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ChatSession {
    id: string;
    messages: { role: 'user' | 'model'; text: string; critique?: string }[];
}

export interface SavedItem {
    id: string;
    text: string;
    type: 'text' | 'analysis';
    date: string;
}

interface RizzContextType {
    credits: number;
    history: string[];
    userVibe: string;
    chatHistory: ChatSession[];
    currentView: 'home' | 'chat' | 'profile';
    savedItems: SavedItem[];
    streak: number;
    decrementCredits: (amount?: number) => void;
    addToHistory: (text: string) => void;
    setUserVibe: (vibe: string) => void;
    addChatMessage: (sessionId: string, message: { role: 'user' | 'model'; text: string; critique?: string }) => void;
    setCurrentView: (view: 'home' | 'chat' | 'profile') => void;
    saveItem: (item: Omit<SavedItem, 'id' | 'date'>) => void;
    deleteItem: (id: string) => void;
}

const RizzContext = createContext<RizzContextType | undefined>(undefined);

export function RizzProvider({ children }: { children: ReactNode }) {
    const [credits, setCredits] = useState(5);
    const [history, setHistory] = useState<string[]>([]);
    const [userVibe, setUserVibe] = useState("Flirty");
    const [chatHistory, setChatHistory] = useState<ChatSession[]>([{ id: 'default', messages: [] }]);
    const [currentView, setCurrentView] = useState<'home' | 'chat' | 'profile'>('home');

    // Load saved items and streak from localStorage
    const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
        const saved = localStorage.getItem('rizz_saved_items');
        return saved ? JSON.parse(saved) : [];
    });

    const [streak, setStreak] = useState(() => {
        return parseInt(localStorage.getItem('rizz_streak') || '0');
    });

    const [lastActiveDate, setLastActiveDate] = useState(() => {
        return localStorage.getItem('rizz_last_active_date') || '';
    });

    // Persist saved items
    useEffect(() => {
        localStorage.setItem('rizz_saved_items', JSON.stringify(savedItems));
    }, [savedItems]);

    // Streak Logic
    const updateStreak = () => {
        const today = new Date().toDateString();
        if (lastActiveDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastActiveDate === yesterday.toDateString()) {
                // Consecutive day
                const newStreak = streak + 1;
                setStreak(newStreak);
                localStorage.setItem('rizz_streak', newStreak.toString());
            } else if (lastActiveDate !== today) {
                // Missed a day or first day
                setStreak(1);
                localStorage.setItem('rizz_streak', '1');
            }

            setLastActiveDate(today);
            localStorage.setItem('rizz_last_active_date', today);
        }
    };

    const decrementCredits = (amount = 1) => {
        setCredits((prev) => Math.max(0, prev - amount));
        updateStreak();
    };

    const addToHistory = (text: string) => {
        setHistory((prev) => [text, ...prev]);
    };

    const addChatMessage = (sessionId: string, message: { role: 'user' | 'model'; text: string; critique?: string }) => {
        setChatHistory(prev => {
            const sessionIndex = prev.findIndex(s => s.id === sessionId);
            if (sessionIndex === -1) return prev;

            const newHistory = [...prev];
            newHistory[sessionIndex] = {
                ...newHistory[sessionIndex],
                messages: [...newHistory[sessionIndex].messages, message]
            };
            return newHistory;
        });
    };

    const saveItem = (item: Omit<SavedItem, 'id' | 'date'>) => {
        const newItem: SavedItem = {
            ...item,
            id: crypto.randomUUID(),
            date: new Date().toLocaleDateString()
        };
        setSavedItems(prev => [newItem, ...prev]);
    };

    const deleteItem = (id: string) => {
        setSavedItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <RizzContext.Provider value={{
            credits, history, userVibe, chatHistory, currentView, savedItems, streak,
            decrementCredits, addToHistory, setUserVibe, addChatMessage, setCurrentView, saveItem, deleteItem
        }}>
            {children}
        </RizzContext.Provider>
    );
}

export function useRizz() {
    const context = useContext(RizzContext);
    if (context === undefined) {
        throw new Error('useRizz must be used within a RizzProvider');
    }
    return context;
}
