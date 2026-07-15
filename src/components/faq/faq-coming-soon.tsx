"use client";

import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

export function FaqComingSoon() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-champagne-dark"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Help centre
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="text-3xl font-bold tracking-tight sm:text-4xl"
      >
        Frequently Asked Questions
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 2.4, delay: 0.35, repeat: Infinity, ease: "easeInOut" }}
        className="mt-8 text-2xl font-semibold tracking-wide text-champagne-dark sm:text-3xl"
      >
        Coming soon
      </motion.p>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 h-px w-24 origin-center bg-gradient-to-r from-transparent via-champagne to-transparent"
      />

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.5 }}
        className="mt-6 max-w-md text-sm text-muted-foreground sm:text-base"
      >
        We&apos;re preparing clear answers for booking, exhibitors, and the portal. Check back shortly.
      </motion.p>
    </div>
  );
}
