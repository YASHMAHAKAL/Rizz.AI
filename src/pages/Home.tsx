import { useState } from 'react';
import { Card } from '../components/Card';
import { Sparkles, Heart, Copy, Check, Zap, Camera } from 'lucide-react';
import { useRizz } from '../context/RizzContext';
import { generateRizz } from '../services/gemini';
import { clsx } from 'clsx';
import { ScreenshotModal } from '../components/ScreenshotModal';
import { Typewriter } from '../components/Typewriter';
import { MagneticButton } from '../components/MagneticButton';
import confetti from 'canvas-confetti';

const VIBES = ['Funny', 'Romantic', 'Bold', 'Mysterious'];

export function Home() {
    const { credits, decrementCredits, addToHistory, saveItem } = useRizz();
    const [target, setTarget] = useState('');
    const [selectedVibe, setSelectedVibe] = useState('Funny');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [showScreenshotModal, setShowScreenshotModal] = useState(false);

    const handleGenerate = async () => {
        if (credits <= 0) {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        if (!target.trim()) return;

        setIsLoading(true);
        setResponse('');

        try {
            const prompt = `Write a ${selectedVibe} pickup line for ${target}`;
            const result = await generateRizz(prompt);
            setResponse(result);
            addToHistory(result);
            decrementCredits();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(response);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto relative">
            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-charcoal text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-medium">
                        <span>Out of Rizz! 😱</span>
                        <span className="text-sm text-gray-400">Wait for refill</span>
                    </div>
                </div>
            )}

            {/* Screenshot Modal */}
            {showScreenshotModal && <ScreenshotModal onClose={() => setShowScreenshotModal(false)} />}

            {/* Hero Section */}
            <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-coral/20 text-coral text-sm font-medium mb-2">
                    <Sparkles size={14} />
                    <span>AI-Powered Dating Assistant</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-charcoal tracking-tight">
                    Unlock Your <span className="text-coral">Charisma</span> ✨
                </h1>
                <p className="text-lg text-charcoal-light max-w-lg mx-auto leading-relaxed">
                    Master the art of conversation with personalized advice, witty comebacks, and confidence-boosting tips.
                </p>
            </div>

            {/* Main Input Card */}
            <Card className="border-coral/20 shadow-xl bg-white/60 backdrop-blur-xl">
                <div className="space-y-6">
                    {/* Input Area */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-charcoal ml-1">Who are you talking to?</label>
                            <button
                                onClick={() => setShowScreenshotModal(true)}
                                className="text-xs font-semibold text-coral flex items-center gap-1 hover:underline"
                            >
                                <Camera size={14} /> Upload Screenshot
                            </button>
                        </div>
                        <input
                            type="text"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder="e.g. Crush from Gym, Match on Tinder..."
                            className="w-full p-4 rounded-xl bg-white border border-gray-100 focus:border-coral/50 focus:ring-2 focus:ring-coral/20 outline-none transition-all text-charcoal placeholder:text-gray-400"
                        />
                    </div>

                    {/* Vibe Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-charcoal ml-1">Select your Vibe</label>
                        <div className="flex flex-wrap gap-2">
                            {VIBES.map((vibe) => (
                                <button
                                    key={vibe}
                                    onClick={() => setSelectedVibe(vibe)}
                                    className={clsx(
                                        'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
                                        selectedVibe === vibe
                                            ? 'bg-coral text-white shadow-lg shadow-coral/30 scale-105'
                                            : 'bg-white text-charcoal-light hover:bg-coral/10 hover:text-coral'
                                    )}
                                >
                                    {vibe}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <MagneticButton
                        onClick={handleGenerate}
                        disabled={isLoading || !target.trim()}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-coral to-coral-soft text-white font-bold text-lg shadow-lg shadow-coral/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                    >
                        {isLoading ? (
                            <>
                                <Heart className="animate-ping absolute" size={20} fill="currentColor" />
                                <Heart size={20} fill="currentColor" />
                                <span>Cooking up Rizz...</span>
                            </>
                        ) : (
                            <>
                                <Zap size={20} className="group-hover:fill-current" />
                                <span>Generate Rizz ✨</span>
                            </>
                        )}
                    </MagneticButton>
                </div>
            </Card>

            {/* Result Card */}
            {response && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <Card className="bg-gradient-to-br from-white to-coral/5 border-coral/20 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coral to-purple-500" />

                        <div className="p-2">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2 text-coral text-sm font-bold uppercase tracking-wider">
                                    <Sparkles size={14} />
                                    <span>Instant Rizz</span>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            saveItem({ text: response, type: 'text' });
                                            confetti({
                                                particleCount: 100,
                                                spread: 70,
                                                origin: { y: 0.6 }
                                            });
                                        }}
                                        className="p-2 rounded-lg hover:bg-coral/10 text-gray-400 hover:text-coral transition-colors"
                                        title="Save to Vault"
                                    >
                                        <Heart size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            copyToClipboard();
                                            confetti({
                                                particleCount: 50,
                                                spread: 50,
                                                origin: { y: 0.6 }
                                            });
                                        }}
                                        className="p-2 rounded-lg hover:bg-coral/10 text-gray-400 hover:text-coral transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>

                            <p className="text-xl md:text-2xl font-medium text-charcoal leading-relaxed">
                                <Typewriter text={response} />
                            </p>

                            <div className="mt-6 flex justify-end">
                                <span className="text-xs text-gray-400">AI-generated • Use with confidence 😉</span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
