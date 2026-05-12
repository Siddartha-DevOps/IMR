"use client";
// src/components/movie/FAQSection.tsx
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FAQItem } from "@/types";

interface FAQSectionProps {
  items: FAQItem[];
}

export default function FAQSection({ items }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items.length) return null;

  return (
    <div className="card p-6">
      <h2 className="font-heading font-bold text-lg mb-5 flex items-center gap-2 before:content-[''] before:w-0.5 before:h-5 before:bg-gold before:rounded">
        Frequently Asked Questions
      </h2>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div
            key={i}
            className="border-b border-border/50 last:border-0 overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between gap-3 py-4 text-left hover:text-gold transition-colors group"
            >
              <span className="text-sm font-semibold text-white group-hover:text-gold transition-colors">
                {item.q}
              </span>
              <ChevronDown
                size={16}
                className={cn(
                  "text-muted flex-shrink-0 transition-transform duration-200",
                  openIndex === i && "rotate-180 text-gold"
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                openIndex === i ? "max-h-48 pb-4" : "max-h-0"
              )}
            >
              <p className="text-sm text-muted leading-relaxed">{item.a}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}