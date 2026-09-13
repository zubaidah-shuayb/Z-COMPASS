import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Hit = {
  kind: "clarity" | "decision" | "memory" | "progress" | "reflection";
  id: string;
  title: string | null;
  snippet: string | null;
  updated_at: string;
  rank: number;
};

const kindLabels: Record<Hit["kind"], string> = {
  clarity: "Clarity",
  decision: "Compass",
  memory: "Remember",
  progress: "Progress",
  reflection: "Reflections",
};

export function SearchTrigger({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search everything"
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
          className,
        )}
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search</span>
        <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc("global_search", {
        query: term,
        max_results: 20,
      });
      if (cancelled) return;
      setLoading(false);
      setHits(error ? [] : ((data ?? []) as Hit[]));
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const go = (hit: Hit) => {
    onOpenChange(false);
    setQuery("");
    if (hit.kind === "decision") {
      void navigate({ to: "/compass/$decisionId", params: { decisionId: hit.id } });
      return;
    }
    const routes = {
      clarity: "/clarity",
      memory: "/remember",
      progress: "/progress",
      reflection: "/reflections",
    } as const;
    void navigate({ to: routes[hit.kind] });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search your clarity, decisions, notes, progress…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Searching…" : query.trim() ? "Nothing matched." : "Type to search."}
        </CommandEmpty>
        {hits.length > 0 && (
          <CommandGroup heading="Results">
            {hits.map((hit) => (
              <CommandItem
                key={`${hit.kind}-${hit.id}`}
                value={`${hit.kind}-${hit.id}-${hit.title ?? ""}`}
                onSelect={() => go(hit)}
              >
                <span className="mr-2 rounded bg-accent px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {kindLabels[hit.kind]}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {hit.title || hit.snippet || "Untitled"}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
