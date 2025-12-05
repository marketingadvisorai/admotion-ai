import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, MessageSquare, Image as ImageIcon } from 'lucide-react';

interface AvailableApis {
  openai: boolean;
  gemini: boolean;
  anthropic: boolean;
}

interface ModelOption {
  value: string;
  label: string;
  detail: string;
  bestFor: string;
  provider: 'openai' | 'gemini' | 'anthropic';
}

interface ModelDropdownProps {
  availableApis: AvailableApis;
  mode: 'chat' | 'make';
  selectedChatModel: string;
  selectedImageModel: string;
  onChatModelChange: (model: string) => void;
  onImageModelChange: (model: string) => void;
  compact?: boolean;
}

// All available chat models
const ALL_CHAT_MODELS: ModelOption[] = [
  { value: 'gpt-4o', label: 'GPT-4o', detail: 'OpenAI', bestFor: 'Best for ideas', provider: 'openai' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', detail: 'OpenAI', bestFor: 'Fast & efficient', provider: 'openai' },
  { value: 'claude-3.5', label: 'Claude 3.5', detail: 'Anthropic', bestFor: 'Creative writing', provider: 'anthropic' },
  { value: 'gemini-pro', label: 'Gemini Pro', detail: 'Google', bestFor: 'Multimodal', provider: 'gemini' },
];

// All available image generation models
const ALL_IMAGE_MODELS: ModelOption[] = [
  { value: 'dall-e-3', label: 'DALL-E 3', detail: 'OpenAI', bestFor: 'High quality', provider: 'openai' },
  { value: 'imagen-3', label: 'Imagen 3', detail: 'Google', bestFor: 'Photorealistic', provider: 'gemini' },
  { value: 'gemini-imagen', label: 'Gemini Imagen', detail: 'Google', bestFor: 'Fast generation', provider: 'gemini' },
];

export function ModelDropdown({
  availableApis,
  mode,
  selectedChatModel,
  selectedImageModel,
  onChatModelChange,
  onImageModelChange,
  compact = false,
}: ModelDropdownProps) {
  // Filter models based on available APIs
  const availableChatModels = ALL_CHAT_MODELS.filter((model) => availableApis[model.provider]);
  const availableImageModels = ALL_IMAGE_MODELS.filter((model) => availableApis[model.provider]);

  // Get current selection based on mode
  const currentValue = mode === 'chat' ? selectedChatModel : selectedImageModel;
  const currentModels = mode === 'chat' ? availableChatModels : availableImageModels;
  const onModelChange = mode === 'chat' ? onChatModelChange : onImageModelChange;

  const selectedOption = currentModels.find((option) => option.value === currentValue);
  const selectedLabel = selectedOption?.label || (mode === 'chat' ? 'Chat Model' : 'Image Model');

  // If no models available for current mode
  if (currentModels.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`rounded-full border-white/80 bg-white/90 text-slate-500 shadow-sm cursor-not-allowed ${compact ? 'text-xs px-2 py-1 h-7' : ''}`}
        disabled
      >
        No {mode === 'chat' ? 'chat' : 'image'} models
        <ChevronDown className={`ml-1 text-slate-400 ${compact ? 'size-3' : 'size-4'}`} />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`rounded-full border-white/80 bg-white/90 text-slate-800 shadow-sm ${compact ? 'text-xs px-2 py-1 h-7' : ''}`}
        >
          {compact ? selectedOption?.label.split(' ')[0] || selectedLabel : selectedLabel}
          <ChevronDown className={`ml-1 text-slate-500 ${compact ? 'size-3' : 'size-4'}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          {mode === 'chat' ? <MessageSquare className="size-4" /> : <ImageIcon className="size-4" />}
          {mode === 'chat' ? 'Chat Models' : 'Image Models'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {currentModels.map((option) => (
          <DropdownMenuItem 
            key={option.value} 
            onClick={() => onModelChange(option.value)}
            className="cursor-pointer"
          >
            <div className="flex flex-col flex-1">
              <span className="text-sm font-semibold text-slate-900">{option.label}</span>
              <span className="text-xs text-slate-500">
                {option.detail} • {option.bestFor}
              </span>
            </div>
            {currentValue === option.value && <Check className="ml-auto size-4 text-blue-600" />}
          </DropdownMenuItem>
        ))}
        
        {/* Show info about unavailable models */}
        {mode === 'chat' && ALL_CHAT_MODELS.length > availableChatModels.length && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-slate-400">
              More models available with additional API keys
            </div>
          </>
        )}
        {mode === 'make' && ALL_IMAGE_MODELS.length > availableImageModels.length && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-slate-400">
              More models available with additional API keys
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
