import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';

export interface AspectOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  visualWidth: string;
}

interface AspectDropdownProps<T extends string> {
  value: T;
  options: AspectOption<T>[];
  onChange: (value: T) => void;
  label?: string;
}

export function AspectDropdown<T extends string>({ value, options, onChange, label = 'Aspect ratio' }: AspectDropdownProps<T>) {
  const current = options.find((o) => o.value === value) || options[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full border-white/80 bg-white/90 text-slate-800 shadow-sm">
          <span className={cn('h-3 rounded-full border border-slate-300 bg-slate-100', current?.visualWidth)} />
          <span className="text-sm font-semibold">{current?.label}</span>
          <ChevronDown className="size-4 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52 p-1" align="start">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className="flex items-center gap-3"
          >
            <span className={cn('h-3 rounded-full border border-slate-300 bg-slate-100', option.visualWidth)} />
            <div>
              <p className="text-sm font-semibold text-slate-900">{option.label}</p>
              {option.hint && <p className="text-xs text-slate-500">{option.hint}</p>}
            </div>
            {value === option.value && <Check className="ml-auto size-4 text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
