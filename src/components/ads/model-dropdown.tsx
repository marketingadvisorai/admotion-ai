import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LlmProfile } from '@/modules/llm/types';
import { Check, ChevronDown, MessageSquare, Image } from 'lucide-react';

interface ModelOption {
  value: string;
  label: string;
  detail?: string;
  bestFor?: string;
  category?: 'chat' | 'image';
}

interface ModelDropdownProps {
  profiles: LlmProfile[];
  value: string;
  onChange: (slug: string) => void;
  extraOptions?: ModelOption[];
}

export function ModelDropdown({ profiles, value, onChange, extraOptions = [] }: ModelDropdownProps) {
  // Chat models
  const chatModels: ModelOption[] = [
    { value: 'gpt-4o', label: 'GPT-4o', detail: 'OpenAI', bestFor: 'Best for ideas', category: 'chat' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', detail: 'OpenAI', bestFor: 'Fast & efficient', category: 'chat' },
    { value: 'claude-3.5', label: 'Claude 3.5', detail: 'Anthropic', bestFor: 'Creative writing', category: 'chat' },
    { value: 'gemini-pro', label: 'Gemini Pro', detail: 'Google', bestFor: 'Multimodal', category: 'chat' },
  ];

  // Image generation models
  const imageModels: ModelOption[] = [
    { value: 'dall-e-3', label: 'DALL-E 3', detail: 'OpenAI', bestFor: 'High quality', category: 'image' },
    { value: 'imagen-3', label: 'Imagen 3', detail: 'Google', bestFor: 'Photorealistic', category: 'image' },
    { value: 'gemini-imagen', label: 'Gemini Imagen', detail: 'Google', bestFor: 'Fast generation', category: 'image' },
  ];

  const allOptions = [...chatModels, ...imageModels, ...extraOptions];
  const selectedOption = allOptions.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label || value || 'Model';

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
        <DropdownMenuLabel className="flex items-center gap-2">
          <MessageSquare className="size-4" />
          Chat Models
        </DropdownMenuLabel>
        {chatModels.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onChange(option.value)}>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">{option.label}</span>
              <span className="text-xs text-slate-500">
                {option.detail}{option.bestFor ? ` • ${option.bestFor}` : ''}
              </span>
            </div>
            {value === option.value && <Check className="ml-auto size-4 text-blue-600" />}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="flex items-center gap-2">
          <Image className="size-4" />
          Image Models
        </DropdownMenuLabel>
        {imageModels.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onChange(option.value)}>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">{option.label}</span>
              <span className="text-xs text-slate-500">
                {option.detail}{option.bestFor ? ` • ${option.bestFor}` : ''}
              </span>
            </div>
            {value === option.value && <Check className="ml-auto size-4 text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
