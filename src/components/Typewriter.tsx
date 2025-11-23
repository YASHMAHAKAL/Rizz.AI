import { animate } from "framer-motion";
import { useEffect, useState } from "react";

interface TypewriterProps {
    text: string;
    speed?: number;
    className?: string;
}

export function Typewriter({ text, speed = 20, className }: TypewriterProps) {
    const [displayText, setDisplayText] = useState("");

    useEffect(() => {
        const controls = animate(0, text.length, {
            duration: text.length * (speed / 1000),
            onUpdate: (latest) => {
                setDisplayText(text.slice(0, Math.floor(latest)));
            },
            ease: "linear",
        });

        return () => controls.stop();
    }, [text, speed]);

    return <span className={className}>{displayText}</span>;
}
