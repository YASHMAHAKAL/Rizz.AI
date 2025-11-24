import { Card } from '../components/Card';
import { useRizz } from '../context/RizzContext';
import { Trash2, Copy, Check, BarChart3, Heart } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

export function Profile() {
    const { savedItems, deleteItem, history } = useRizz();
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'analytics' | 'vault'>('analytics');

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Mock Analytics Calculation
    // In a real app, we'd parse the history to find actual vibe usage
    const totalGenerations = history.length;
    const vibes = [
        { label: 'Funny', percent: 45, color: 'bg-yellow-400' },
        { label: 'Romantic', percent: 30, color: 'bg-pink-400' },
        { label: 'Bold', percent: 15, color: 'bg-red-500' },
        { label: 'Mysterious', percent: 10, color: 'bg-purple-500' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-charcoal">Your Rizz Profile</h1>
                <p className="text-charcoal-light">Track your stats and manage your best lines.</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={clsx(
                        "px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2",
                        activeTab === 'analytics'
                            ? "bg-coral text-white shadow-lg shadow-coral/20"
                            : "bg-white text-charcoal-light hover:text-coral"
                    )}
                >
                    <BarChart3 size={18} /> Vibe Analytics
                </button>
                <button
                    onClick={() => setActiveTab('vault')}
                    className={clsx(
                        "px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2",
                        activeTab === 'vault'
                            ? "bg-coral text-white shadow-lg shadow-coral/20"
                            : "bg-white text-charcoal-light hover:text-coral"
                    )}
                >
                    <Heart size={18} /> Rizz Vault
                </button>
            </div>

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'analytics' ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <h3 className="text-lg font-bold text-charcoal mb-6">Vibe Breakdown</h3>
                            <div className="space-y-6">
                                {vibes.map((vibe) => (
                                    <div key={vibe.label} className="space-y-2">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-charcoal">{vibe.label}</span>
                                            <span className="text-charcoal-light">{vibe.percent}%</span>
                                        </div>
                                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={clsx("h-full rounded-full transition-all duration-1000", vibe.color)}
                                                style={{ width: `${vibe.percent}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="flex flex-col justify-center items-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-coral/10 text-coral mb-2">
                                <BarChart3 size={32} />
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-charcoal">{totalGenerations}</div>
                                <div className="text-charcoal-light font-medium">Total Lines Generated</div>
                            </div>
                            <div className="w-full h-px bg-gray-100 my-4" />
                            <p className="text-sm text-charcoal-light">
                                You're a <span className="font-bold text-coral">Certified Rizzler</span>!
                                Keep generating to unlock more insights.
                            </p>
                        </Card>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {savedItems.length === 0 ? (
                            <Card className="text-center py-12">
                                <Heart size={48} className="mx-auto text-gray-200 mb-4" />
                                <h3 className="text-xl font-bold text-charcoal mb-2">Your Vault is Empty</h3>
                                <p className="text-charcoal-light">Save your favorite lines to access them here later.</p>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {savedItems.map((item) => (
                                    <Card key={item.id} className="group hover:border-coral/30 transition-colors">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-coral uppercase tracking-wider bg-coral/10 px-2 py-1 rounded-md">
                                                        {item.type}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{item.date}</span>
                                                </div>
                                                <p className="text-charcoal font-medium leading-relaxed">{item.text}</p>
                                            </div>

                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => copyToClipboard(item.text, item.id)}
                                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-charcoal transition-colors"
                                                    title="Copy"
                                                >
                                                    {copiedId === item.id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => deleteItem(item.id)}
                                                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
