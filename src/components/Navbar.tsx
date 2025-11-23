import React from 'react';
import { Sparkles, MessageCircle, User, Heart, Flame } from 'lucide-react';
import { useRizz } from '../context/RizzContext';

export function Navbar() {
    const { currentView, setCurrentView, streak } = useRizz();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/20 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
                    <div className="bg-coral p-1.5 rounded-lg text-white">
                        <Sparkles size={20} fill="currentColor" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-coral to-coral-soft bg-clip-text text-transparent">
                        Rizz.AI
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    <NavLink
                        icon={<Heart size={18} />}
                        label="Instant Rizz"
                        active={currentView === 'home'}
                        onClick={() => setCurrentView('home')}
                    />
                    <NavLink
                        icon={<MessageCircle size={18} />}
                        label="Dating Coach"
                        active={currentView === 'chat'}
                        onClick={() => setCurrentView('chat')}
                    />
                    <NavLink
                        icon={<User size={18} />}
                        label="Profile"
                        active={currentView === 'profile'}
                        onClick={() => setCurrentView('profile')}
                    />
                </div>

                <div className="flex items-center gap-4">
                    {streak > 0 && (
                        <div className="hidden md:flex items-center gap-1 text-orange-500 font-bold bg-orange-50 px-3 py-1 rounded-full border border-orange-100 animate-in fade-in">
                            <Flame size={18} fill="currentColor" />
                            <span>{streak}</span>
                        </div>
                    )}
                    <button className="md:hidden p-2 text-charcoal-light">
                        <User size={24} />
                    </button>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${active ? 'text-coral' : 'text-charcoal-light hover:text-coral'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}
