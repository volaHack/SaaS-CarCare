"use client";

import React, { useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { motion } from "framer-motion";

interface Beam {
    id: number;
    x: number;
    duration: number;
}

interface BackgroundMeteorsProps {
    children?: ReactNode;
    /** When true, renders as a fixed fullscreen background layer (no wrapper) */
    fixed?: boolean;
}

export default function BackgroundMeteors({
    children,
    fixed = false,
}: BackgroundMeteorsProps) {
    const [beams, setBeams] = useState<Beam[]>([]);
    const gridSize = 40;
    const totalLines = 35;
    const spawnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const generateSafeGridPositions = useCallback((count: number): number[] => {
        const available: number[] = [];
        for (let i = 0; i < totalLines - 1; i++) {
            available.push(i);
        }

        const selected: number[] = [];
        while (available.length > 0 && selected.length < count) {
            const idx = Math.floor(Math.random() * available.length);
            const value = available[idx];
            selected.push(value);
            available.splice(
                0,
                available.length,
                ...available.filter((v) => Math.abs(v - value) > 1)
            );
        }

        return selected.map((line) => line * gridSize);
    }, []);

    const removeBeam = useCallback((id: number) => {
        setBeams((prev) => prev.filter((b) => b.id !== id));
    }, []);

    useEffect(() => {
        const spawnBatch = () => {
            const count = Math.floor(Math.random() * 2) + 3;
            const xPositions = generateSafeGridPositions(count);

            const newBeams: Beam[] = xPositions.map((x) => ({
                id: Math.random(),
                x,
                duration: 4 + Math.random() * 1.5,
            }));

            setBeams((prev) => [...prev, ...newBeams]);

            // Schedule each beam's removal after it finishes its animation
            newBeams.forEach((b) => {
                setTimeout(() => removeBeam(b.id), b.duration * 1000);
            });

            // Spawn the next batch with some overlap so there's no gap
            const minDuration = Math.min(...newBeams.map((b) => b.duration));
            spawnTimer.current = setTimeout(spawnBatch, (minDuration * 0.6) * 1000);
        };

        spawnBatch();

        return () => {
            if (spawnTimer.current) clearTimeout(spawnTimer.current);
        };
    }, [generateSafeGridPositions, removeBeam]);

    if (fixed) {
        return (
            <div
                className="pointer-events-none"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 0,
                    overflow: "hidden",
                }}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundSize: `${gridSize}px ${gridSize}px`,
                        backgroundImage:
                            "linear-gradient(to right, #262626 1px, transparent 1px), linear-gradient(to bottom, #024e6b 1px, transparent 1px)",
                    }}
                />
                <div
                    className="absolute inset-0 bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
                />
                {beams.map((b) => (
                    <motion.div
                        key={b.id}
                        className="absolute top-0"
                        style={{ left: b.x, zIndex: 2 }}
                        initial={{ y: -150 }}
                        animate={{ y: "100vh" }}
                        transition={{
                            duration: b.duration,
                            ease: "linear",
                        }}
                    >
                        <div
                            className="h-14 w-px rounded-full bg-gradient-to-t from-green-200 via-green-800 to-transparent"
                            style={{ margin: "0 auto" }}
                        />
                    </motion.div>
                ))}
            </div>
        );
    }

    return (
        <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black">
            <div
                className="absolute inset-0"
                style={{
                    backgroundSize: `${gridSize}px ${gridSize}px`,
                    backgroundImage:
                        "linear-gradient(to right, #262626 1px, transparent 1px), linear-gradient(to bottom, #024e6b  1px, transparent 1px)",
                }}
            />
            <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
            />
            {beams.map((b) => (
                <motion.div
                    key={b.id}
                    className="absolute top-0"
                    style={{ left: b.x, zIndex: 2 }}
                    initial={{ y: -150 }}
                    animate={{ y: "100vh" }}
                    transition={{
                        duration: b.duration,
                        ease: "linear",
                    }}
                >
                    <div
                        className="h-14 w-px rounded-full bg-gradient-to-t from-green-200 via-green-800 to-transparent"
                        style={{ margin: "0 auto" }}
                    />
                </motion.div>
            ))}

            <div className="absolute inset-0 z-10 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}