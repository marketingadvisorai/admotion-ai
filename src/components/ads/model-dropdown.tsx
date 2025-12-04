import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LlmProfile } from '@/modules/llm/types';
import { Check, ChevronDown } from 'lucide-react';

interface ModelOption {
  value: string;
  label: string;
  detail?: string;
}

interface ModelDropdownProps {
  profiles: LlmProfile[];
  value: string;
  onChange: (slug: string) => void;
  extraOptions?: ModelOption[];
}

export function ModelDropdown({ profiles, value, onChange, extraOptions = [] }: ModelDropdownProps) {
  const builtIns: ModelOption[] = [
    { value: 'chatgpt', label: 'ChatGPT' },
    { value: 'nano-banana', label: 'Nano Banana' },
  ];

  const dynamicOptions: ModelOption[] = profiles.map((profile) => ({
    value: profile.slug,
    label: profile.slug,
    detail: `${profile.provider} • ${profile.model}`,
  }));

  const options = [...builtIns, ...extraOptions, ...dynamicOptions];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-white/80 bg-white/90 text-slate-800 shadow-sm"
        >
          {value || 'Model'}
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
              {option.detail && <span className="text-xs text-slate-500">{option.detail}</span>}
            </div>
            {value === option.value && <Check className="ml-auto size-4 text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
