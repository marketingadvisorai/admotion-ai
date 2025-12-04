'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';

const GLOBAL_MODEL_KEY = 'admotion:global-model';

const GLOBAL_MODELS = [
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'nano-banana', label: 'Nano Banana' },
];

export function GlobalModelSwitcher() {
  const [model, setModel] = useState<string>('chatgpt');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(GLOBAL_MODEL_KEY) : null;
    if (stored) setModel(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(GLOBAL_MODEL_KEY, model);
  }, [model, hydrated]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-w-[170px] justify-between rounded-2xl border-white/70 bg-white/90 px-3 text-slate-800 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur"
        >
          {GLOBAL_MODELS.find((m) => m.value === model)?.label || model}
          <ChevronDown className="size-4 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-2xl border border-white/70 bg-white/95 shadow-xl backdrop-blur">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Global Model
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {GLOBAL_MODELS.map((m) => (
          <DropdownMenuItem key={m.value} onClick={() => setModel(m.value)}>
            <span className="text-sm font-semibold text-slate-900">{m.label}</span>
            {model === m.value && <Check className="ml-auto size-4 text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
