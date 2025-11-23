
import { Card } from './Card';
import { Lightbulb, ArrowRight } from 'lucide-react';

export function Sidebar() {
    return (
        <aside className="hidden lg:block w-80 sticky top-24 h-fit space-y-6">
            <Card className="bg-gradient-to-br from-white/80 to-coral/5 border-coral/20">
                <div className="flex items-center gap-2 mb-3 text-coral">
                    <Lightbulb size={20} />
                    <h3 className="font-bold">Daily Rizz Tip</h3>
                </div>
                <p className="text-charcoal-light text-sm leading-relaxed mb-4">
                    "Confidence isn't walking into a room thinking you're better than everyone; it's walking in not having to compare yourself to anyone at all."
                </p>
                <button className="text-xs font-semibold text-coral flex items-center gap-1 hover:gap-2 transition-all">
                    View Archive <ArrowRight size={14} />
                </button>
            </Card>

            <Card>
                <h3 className="font-bold text-charcoal mb-3">Trending Topics</h3>
                <div className="space-y-2">
                    {['First Date Ideas', 'Icebreakers', 'Body Language', 'Texting Etiquette'].map((topic) => (
                        <div key={topic} className="flex items-center justify-between group cursor-pointer">
                            <span className="text-sm text-charcoal-light group-hover:text-coral transition-colors">{topic}</span>
                            <span className="text-xs text-gray-400">→</span>
                        </div>
                    ))}
                </div>
            </Card>
        </aside>
    );
}
