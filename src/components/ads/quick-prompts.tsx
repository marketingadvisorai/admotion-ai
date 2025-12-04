import Image from 'next/image';

interface QuickPromptCard {
  id: string;
  title: string;
  prompt: string;
  image: string;
  meta: string;
}

interface QuickPromptsProps {
  items: QuickPromptCard[];
  onSelect: (id: string) => void;
}

export function QuickPrompts({ items, onSelect }: QuickPromptsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className="group relative overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="relative aspect-[3/4]">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="(min-width: 1024px) 200px, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
            <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-900 shadow-sm">
              {item.meta}
            </span>
          </div>
          <div className="px-3 py-3">
            <p className="text-sm font-semibold text-slate-900 line-clamp-2">{item.title}</p>
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.prompt}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
