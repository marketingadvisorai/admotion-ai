import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LlmProfile } from '@/modules/llm/types';
import { Check, ChevronDown } from 'lucide-react';

interface ModelOption {
  value: string;
  label: string;
  detail?: string;
  bestFor?: string;
}

interface ModelDropdownProps {
  profiles: LlmProfile[];
  value: string;
  onChange: (slug: string) => void;
  extraOptions?: ModelOption[];
}

export function ModelDropdown({ profiles, value, onChange, extraOptions = [] }: ModelDropdownProps) {
  const builtIns: ModelOption[] = [
    { value: 'gpt-5.1', label: 'GPT 5.1', detail: 'OpenAI' },
    { value: 'nano-banana', label: 'Nano Banana', detail: 'Internal' },
  ];

  const options = [...builtIns, ...extraOptions];
  const selectedLabel = options.find((option) => option.value === value)?.label || value || 'Model';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-white/80 bg-white/90 text-slate-800 shadow-sm"
        >
          {selectedLabel}
          <ChevronDown className="ml-1 size-4 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Model</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onChange(option.value)}>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">{option.label}</span>
              {option.detail && (
                <span className="text-xs text-slate-500">
                  {option.detail}
                  {option.bestFor ? ` • ${option.bestFor}` : ''}
                </span>
              )}
            </div>
            {value === option.value && <Check className="ml-auto size-4 text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
