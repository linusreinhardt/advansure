interface QuickRepliesProps {
  options: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}

/** Vorschlags-Chips über dem Eingabefeld – beschleunigen häufige Antworten. */
export function QuickReplies({ options, onSelect, disabled }: QuickRepliesProps) {
  if (options.length === 0) return null;
  return (
    <div className="scrollbar-thin flex gap-2 overflow-x-auto px-4 pb-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(option)}
          className="shrink-0 whitespace-nowrap rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
