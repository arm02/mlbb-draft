"use client";

import { useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroSearchProps {
  value: string;
  onChange: (val: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function HeroSearch({
  value,
  onChange,
  onKeyDown,
  placeholder = "Search heroes…",
  autoFocus = false,
  className,
}: HeroSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search
        size={14}
        className="absolute left-2.5 text-text-muted pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn(
          "w-full bg-surface border border-border rounded-lg pl-8 pr-8 py-2",
          "text-sm text-text-primary placeholder:text-text-muted",
          "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30",
          "transition-colors"
        )}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
