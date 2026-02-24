"use client";

import { useEffect, useRef, useCallback } from "react";

declare global {
    interface Window {
        turnstile: {
            render: (container: HTMLElement, options: Record<string, unknown>) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        onTurnstileLoad?: () => void;
    }
}

interface TurnstileProps {
    onVerify: (token: string) => void;
    onExpire?: () => void;
    onError?: () => void;
    theme?: "light" | "dark" | "auto";
    size?: "normal" | "compact";
}

export default function CloudflareTurnstile({
    onVerify,
    onExpire,
    onError,
    theme = "dark",
    size = "normal",
}: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const scriptLoaded = useRef(false);

    const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

    const renderWidget = useCallback(() => {
        if (!containerRef.current || !window.turnstile || !siteKey) return;

        // Remove existing widget if any
        if (widgetIdRef.current) {
            try {
                window.turnstile.remove(widgetIdRef.current);
            } catch { /* ignore */ }
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            size,
            callback: (token: string) => onVerify(token),
            "expired-callback": () => onExpire?.(),
            "error-callback": () => onError?.(),
        });
    }, [siteKey, theme, size, onVerify, onExpire, onError]);

    useEffect(() => {
        if (!siteKey) {
            console.warn("Cloudflare Turnstile: NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY no está configurada");
            return;
        }

        // If script is already loaded
        if (window.turnstile) {
            renderWidget();
            return;
        }

        // Load script
        if (!scriptLoaded.current) {
            scriptLoaded.current = true;

            window.onTurnstileLoad = () => {
                renderWidget();
            };

            const script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch { /* ignore */ }
            }
        };
    }, [siteKey, renderWidget]);

    if (!siteKey) {
        return null; // No renderizar si no hay key
    }

    return (
        <div
            ref={containerRef}
            style={{
                display: "flex",
                justifyContent: "center",
                margin: "12px 0",
            }}
        />
    );
}
