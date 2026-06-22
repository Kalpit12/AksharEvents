"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CountdownTimerProps {
  targetDate: Date | string;
  className?: string;
}

export function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className={`flex flex-wrap justify-center gap-2 sm:gap-3 ${className ?? ""}`}>
      {units.map((unit) => (
        <motion.div
          key={unit.label}
          className="flex min-w-[56px] flex-col items-center rounded-xl bg-primary px-2.5 py-2 text-primary-foreground sm:min-w-[60px] sm:px-3"
        >
          <span className="text-2xl font-bold tabular-nums">{String(unit.value).padStart(2, "0")}</span>
          <span className="text-[10px] uppercase tracking-wider opacity-80">{unit.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
