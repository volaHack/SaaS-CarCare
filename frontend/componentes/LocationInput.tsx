"use client";

import { useState, useEffect, useRef } from "react";
import styles from "../app/dashboard/page.module.css";

interface Suggestion {
    display_name: string;
    lat: string;
    lon: string;
    type: string;
}

interface LocationInputProps {
    label: string;
    value: string;
    placeholder: string;
    onChange: (value: string, coords?: { lat: number; lng: number }) => void;
}

export default function LocationInput({ label, value, placeholder, onChange }: LocationInputProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSuggestions = async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=es`
            );
            const data = await response.json();
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (error) {
            console.error("Error fetching suggestions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            fetchSuggestions(val);
        }, 500);
    };

    const handleSelect = (suggestion: Suggestion) => {
        onChange(suggestion.display_name, {
            lat: parseFloat(suggestion.lat),
            lng: parseFloat(suggestion.lon),
        });
        setShowSuggestions(false);
        setSuggestions([]);
    };

    return (
        <div className={styles.formGroup} style={{ position: "relative" }} ref={containerRef}>
            <label className={styles.label}>{label}</label>
            <div style={{ position: 'relative' }}>
                <input
                    className={styles.input}
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                />
                {loading && (
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', scale: '0.8' }}>
                        <div style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    </div>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "#111",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    marginTop: "4px",
                    zIndex: 100,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                    maxHeight: "200px",
                    overflowY: "auto"
                }}>
                    {suggestions.map((s, i) => (
                        <div
                            key={i}
                            onClick={() => handleSelect(s)}
                            style={{
                                padding: "0.8rem 1rem",
                                cursor: "pointer",
                                borderBottom: i === suggestions.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)",
                                fontSize: "0.85rem",
                                transition: "background 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            <div style={{ fontWeight: "700", color: "#fff", marginBottom: "2px" }}>
                                {s.display_name.split(',')[0]}
                                <span style={{ fontSize: '0.7rem', color: 'var(--accent)', marginLeft: '8px', textTransform: 'uppercase' }}>{s.type}</span>
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {s.display_name.split(',').slice(1).join(',').trim()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
