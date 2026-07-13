import { forwardRef, type InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
  shortcut?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className, wrapperClassName, shortcut, "aria-label": ariaLabel = "Search", ...rest },
  ref,
) {
  return (
    <div
      className={cn(
        "relative flex h-9 items-center rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--elevated)] pl-9 pr-2 transition-colors focus-within:border-[color:var(--brand)]",
        wrapperClassName,
      )}
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 h-4 w-4 text-[color:var(--muted-foreground)]"
      />
      <input
        ref={ref}
        aria-label={ariaLabel}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-[color:var(--muted-foreground)]",
          className,
        )}
        {...rest}
      />
      {shortcut ? (
        <kbd className="ml-2 hidden shrink-0 rounded-md border border-[color:var(--color-border)] bg-[color:var(--surface)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--muted-foreground)] sm:inline-flex">
          {shortcut}
        </kbd>
      ) : null}
    </div>
  );
});
