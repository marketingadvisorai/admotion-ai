import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, MessageSquare, Image as ImageIcon, Video } from 'lucide-react';

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

type MediaType = 'image' | 'video';

interface ModelDropdownProps {
  availableApis: AvailableApis;
  mode: 'chat' | 'make';
  selectedChatModel: string;
  selectedImageModel: string;
  onChatModelChange: (model: string) => void;
  onImageModelChange: (model: string) => void;
  compact?: boolean;
  /** Type of media being generated - defaults to 'image' */
  mediaType?: MediaType;
}

// All available chat models (latest first)
const ALL_CHAT_MODELS: ModelOption[] = [
  { value: 'gpt-5.1', label: 'GPT-5.1', detail: 'OpenAI', bestFor: 'Best quality (Recommended)', provider: 'openai' },
  { value: 'gpt-5.1-mini', label: 'GPT-5.1 Mini', detail: 'OpenAI', bestFor: 'Fast & efficient', provider: 'openai' },
  { value: 'gemini-3-pro', label: 'Gemini 3 Pro', detail: 'Google', bestFor: 'Best quality (Recommended)', provider: 'gemini' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', detail: 'Google', bestFor: 'Fast & multimodal', provider: 'gemini' },
  { value: 'claude-3.5', label: 'Claude 3.5', detail: 'Anthropic', bestFor: 'Creative writing', provider: 'anthropic' },
  { value: 'gpt-4o', label: 'GPT-4o', detail: 'OpenAI', bestFor: 'Legacy support', provider: 'openai' },
];

// All available image generation models (latest first)
const ALL_IMAGE_MODELS: ModelOption[] = [
  { value: 'gpt-image-1', label: 'GPT Image', detail: 'OpenAI', bestFor: 'Best quality (Recommended)', provider: 'openai' },
  { value: 'gpt-image-1-mini', label: 'GPT Image Mini', detail: 'OpenAI', bestFor: 'Cost-saving mode', provider: 'openai' },
  { value: 'nano-banana-pro', label: 'Nano Banana Pro', detail: 'Google', bestFor: 'Highest quality (Gemini 3 Pro)', provider: 'gemini' },
  { value: 'nano-banana', label: 'Nano Banana', detail: 'Google', bestFor: 'Fast drafts (Gemini 2.5 Flash)', provider: 'gemini' },
  { value: 'dall-e-3', label: 'DALL-E 3', detail: 'OpenAI', bestFor: 'Legacy support', provider: 'openai' },
];

// All available video generation models (latest first)
const ALL_VIDEO_MODELS: ModelOption[] = [
  { value: 'sora-2-pro', label: 'Sora 2 Pro', detail: 'OpenAI', bestFor: 'Highest quality (Recommended)', provider: 'openai' },
  { value: 'sora-2', label: 'Sora 2', detail: 'OpenAI', bestFor: 'Fast generation', provider: 'openai' },
  { value: 'veo-3.1', label: 'Veo 3.1', detail: 'Google', bestFor: 'Native audio support', provider: 'gemini' },
  { value: 'veo-2', label: 'Veo 2', detail: 'Google', bestFor: 'Fast drafts', provider: 'gemini' },
];

export function ModelDropdown({
  availableApis,
  mode,
  selectedChatModel,
  selectedImageModel,
  onChatModelChange,
  onImageModelChange,
  compact = false,
  mediaType = 'image',
}: ModelDropdownProps) {
  // Filter models based on available APIs
  const availableChatModels = ALL_CHAT_MODELS.filter((model) => availableApis[model.provider]);
  const availableImageModels = ALL_IMAGE_MODELS.filter((model) => availableApis[model.provider]);
  const availableVideoModels = ALL_VIDEO_MODELS.filter((model) => availableApis[model.provider]);

  // Get current selection based on mode and media type
  const currentValue = mode === 'chat' ? selectedChatModel : selectedImageModel;
  const currentModels = mode === 'chat' 
    ? availableChatModels 
    : mediaType === 'video' 
      ? availableVideoModels 
      : availableImageModels;
  const onModelChange = mode === 'chat' ? onChatModelChange : onImageModelChange;

  const selectedOption = currentModels.find((option) => option.value === currentValue);
  const mediaLabel = mediaType === 'video' ? 'Video Model' : 'Image Model';
  const selectedLabel = selectedOption?.label || (mode === 'chat' ? 'Chat Model' : mediaLabel);

  // If no models available for current mode
  if (currentModels.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`rounded-full border-white/80 bg-white/90 text-slate-500 shadow-sm cursor-not-allowed ${compact ? 'text-xs px-2 py-1 h-7' : ''}`}
        disabled
      >
        No {mode === 'chat' ? 'chat' : mediaType} models
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
          {mode === 'chat' ? (
            <MessageSquare className="size-4" />
          ) : mediaType === 'video' ? (
            <Video className="size-4" />
          ) : (
            <ImageIcon className="size-4" />
          )}
          {mode === 'chat' ? 'Chat Models' : mediaType === 'video' ? 'Video Models' : 'Image Models'}
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
        {mode === 'make' && mediaType === 'image' && ALL_IMAGE_MODELS.length > availableImageModels.length && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-slate-400">
              More models available with additional API keys
            </div>
          </>
        )}
        {mode === 'make' && mediaType === 'video' && ALL_VIDEO_MODELS.length > availableVideoModels.length && (
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
