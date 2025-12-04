import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StyleOption<T extends string> {
  id: T;
  label: string;
  description?: string;
}

interface StyleDropdownProps<T extends string> {
  value: T;
  options: StyleOption<T>[];
  onChange: (value: T) => void;
  label?: string;
}

export function StyleDropdown<T extends string>({ value, options, onChange, label = 'Ads Style' }: StyleDropdownProps<T>) {
  const current = options.find((o) => o.id === value) || options[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full border-white/80 bg-white/90 text-slate-800 shadow-sm">
          <span className="text-sm font-semibold">{current?.label}</span>
          <ChevronDown className="size-4 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn('flex items-center gap-3 rounded-lg', value === option.id && 'bg-slate-50')}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{option.label}</p>
              {option.description && <p className="text-xs text-slate-500 line-clamp-2">{option.description}</p>}
            </div>
            {value === option.id && <Check className="ml-auto size-4 text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
