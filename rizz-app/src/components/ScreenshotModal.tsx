import { useState, useRef } from 'react';
import { Card } from './Card';
import { Upload, X, Loader2, Sparkles, AlertCircle, Copy } from 'lucide-react';
import { analyzeScreenshot } from '../services/gemini';
import { useRizz } from '../context/RizzContext';
import { clsx } from 'clsx';

interface ScreenshotModalProps {
    onClose: () => void;
}

export function ScreenshotModal({ onClose }: ScreenshotModalProps) {
    const { decrementCredits, credits } = useRizz();
    const [isDragging, setIsDragging] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<{ tone: string; options: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (credits < 2) return; // Should be handled by UI state, but safety check

        setIsScanning(true);
        decrementCredits(2);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            try {
                const analysis = await analyzeScreenshot(base64);
                setResult(analysis);
            } catch (error) {
                console.error(error);
            } finally {
                setIsScanning(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <Card className="w-full max-w-lg bg-white relative overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-charcoal transition-colors"
                >
                    <X size={20} />
                </button>

                {!result ? (
                    <div className="space-y-6 text-center py-8">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-charcoal">Analyze Screenshot</h2>
                            <p className="text-charcoal-light">Upload a chat screenshot to decode the vibe.</p>
                            <p className="text-xs font-medium text-coral flex items-center justify-center gap-1">
                                <Sparkles size={12} /> Costs 2 Credits
                            </p>
                        </div>

                        {isScanning ? (
                            <div className="py-12 flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-coral/20 rounded-full animate-ping" />
                                    <div className="relative bg-white p-4 rounded-full shadow-xl border border-coral/10">
                                        <Loader2 size={40} className="text-coral animate-spin" />
                                    </div>
                                </div>
                                <p className="font-medium text-charcoal animate-pulse">Scanning for Rizz...</p>
                            </div>
                        ) : (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={onDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={clsx(
                                    "border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer group",
                                    isDragging
                                        ? "border-coral bg-coral/5 scale-[1.02]"
                                        : "border-gray-200 hover:border-coral/50 hover:bg-gray-50"
                                )}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                />
                                <div className="flex flex-col items-center gap-3 text-gray-400 group-hover:text-coral transition-colors">
                                    <Upload size={32} />
                                    <span className="font-medium">Click or Drag & Drop</span>
                                </div>
                            </div>
                        )}

                        {credits < 2 && (
                            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                                <AlertCircle size={16} />
                                Not enough credits!
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="text-center space-y-1">
                            <span className="text-xs font-bold text-coral uppercase tracking-wider">Analysis Complete</span>
                            <h3 className="text-xl font-bold text-charcoal">Vibe: {result.tone}</h3>
                        </div>

                        <div className="space-y-3">
                            {result.options.map((option, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-coral/30 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={clsx(
                                            "text-xs font-bold uppercase",
                                            idx === 0 ? "text-green-500" : idx === 1 ? "text-red-500" : "text-blue-500"
                                        )}>
                                            {idx === 0 ? "Safe" : idx === 1 ? "Risky" : "Witty"}
                                        </span>
                                        <Copy size={14} className="opacity-0 group-hover:opacity-100 text-gray-400" />
                                    </div>
                                    <p className="text-charcoal font-medium">{option}</p>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setResult(null)}
                            className="w-full py-3 rounded-xl bg-gray-100 text-charcoal font-medium hover:bg-gray-200 transition-colors"
                        >
                            Analyze Another
                        </button>
                    </div>
                )}
            </Card>
        </div>
    );
}
