import type { Look } from "@/types/look";
import { LookCard } from "./LookCard";

type LookCarouselProps = {
  looks: Look[];
  activeLookId: string | null;
  onSelect: (lookId: string) => void;
};

export function LookCarousel({ looks, activeLookId, onSelect }: LookCarouselProps) {
  return (
    <div className="w-full">
      <div className="px-4 pb-2 text-sm font-semibold text-white/80">
        Spring 2026 trends
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4">
        {looks.map((look) => (
          <div key={look.id} className="snap-start">
            <LookCard
              look={look}
              active={look.id === activeLookId}
              onSelect={() => onSelect(look.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

