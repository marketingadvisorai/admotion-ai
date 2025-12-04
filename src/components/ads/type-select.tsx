import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';

interface TypeSelectOption {
  value: string | number;
  label: string;
}

interface TypeSelectProps<T extends string | number> {
  value: T;
  options: TypeSelectOption[];
  onChange: (value: T) => void;
  label: string;
  suffix?: string;
}

export function TypeSelect<T extends string | number>({ value, options, onChange, label, suffix }: TypeSelectProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full border-white/80 bg-white/90 text-slate-800 shadow-sm">
          <span className="text-sm font-semibold">
            {value}
            {suffix ?? ''}
          </span>
          <ChevronDown className="size-4 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 p-1" align="start">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt) => (
          <DropdownMenuItem key={opt.value} onClick={() => onChange(opt.value as T)}>
            <span className="text-sm font-semibold text-slate-900">{opt.label}</span>
            {value === opt.value && <Check className="ml-auto size-4 text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
