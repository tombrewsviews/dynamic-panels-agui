"use client";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, type LucideIcon } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";

export interface SlashCommand {
  name: string;
  /** Agent or tool that runs it, e.g. "Clarification agent". */
  title: string;
  /** Completes "… to {description}". */
  description: string;
  icon: LucideIcon;
  /** Argument typed after the command, e.g. "client name"; picking it from the menu waits for it. */
  arg?: string;
}

/**
 * Bottom-of-panel input. `live` inputs report every keystroke (used for
 * filtering); otherwise text is submitted on Enter / send. With `commands`,
 * typing "/" opens the agent list (↑↓ to move, ⏎ to run, esc closes).
 */
export function ChatInput({
  placeholder,
  onSubmit,
  onChange,
  value,
  leading,
  ariaLabel,
  commands,
  onCommand,
}: {
  placeholder: string;
  onSubmit?: (text: string) => void;
  onChange?: (text: string) => void;
  value?: string;
  leading?: ReactNode;
  ariaLabel: string;
  commands?: SlashCommand[];
  onCommand?: (name: string, args: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  // The same input can be mounted in several layout slots with shared text;
  // only the focused one shows the menu.
  const [focused, setFocused] = useState(false);
  const listId = useId();
  const text = value ?? draft;

  const setText = (t: string) => {
    if (value === undefined) setDraft(t);
    onChange?.(t);
  };

  // Menu shows while the text is a bare "/word".
  const typed = /^\/(\S*)$/.exec(text)?.[1]?.toLowerCase();
  const matches =
    commands && typed !== undefined
      ? commands.filter((c) => c.name.startsWith(typed) || c.title.toLowerCase().includes(typed))
      : [];
  const open = !!commands && focused && typed !== undefined && !dismissed;
  const current = Math.min(active, Math.max(0, matches.length - 1));

  // Esc closes the menu before anything else (tooltips, panel back) sees it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setDismissed(true);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  const run = (name: string, args = "") => {
    // A command that needs an argument fills the input and waits for it.
    if (!args.trim() && commands?.find((c) => c.name === name)?.arg) return setText(`/${name} `);
    onCommand?.(name, args.trim());
    setText("");
    setActive(0);
  };

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    // "/name args" typed in full runs the command too.
    const full = /^\/(\S+)\s*([\s\S]*)$/.exec(t);
    if (full && commands?.some((c) => c.name === full[1])) return run(full[1], full[2]);
    if (!onSubmit) return;
    onSubmit(t);
    if (value === undefined) setDraft("");
  };

  return (
    <div className="relative shrink-0 p-3 pt-2">
      {open && (
        <div className="absolute inset-x-3 bottom-full z-20 mb-1 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-md">
          <p className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 border-b px-3 py-1.5 text-[11px] text-muted-foreground">
            <span>
              <Kbd>↑</Kbd>
              <Kbd className="ml-0.5">↓</Kbd> to move
            </span>
            <span aria-hidden>·</span>
            <span>
              <Kbd>⏎</Kbd> to run
            </span>
            <span aria-hidden>·</span>
            <span>
              <Kbd>esc</Kbd> closes
            </span>
          </p>
          {matches.length ? (
            <ul id={listId} role="listbox" aria-label="Commands" className="flex max-h-72 flex-col gap-0.5 overflow-y-auto p-1">
              {matches.map((c, i) => (
                <li
                  key={c.name}
                  id={`${listId}-${c.name}`}
                  role="option"
                  aria-selected={i === current}
                  // mousedown keeps focus in the textarea
                  onMouseDown={(e) => {
                    e.preventDefault();
                    run(c.name);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2",
                    i === current && "bg-accent",
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
                    <c.icon className="size-4 text-muted-foreground" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-baseline gap-2 text-sm">
                      <span className="font-mono font-medium">
                        /{c.name}
                        {c.arg && <span className="font-normal text-muted-foreground"> &lt;{c.arg}&gt;</span>}
                      </span>
                      <span className="truncate">{c.title}</span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">to {c.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-3 text-sm text-muted-foreground">No command matches “/{typed}”</p>
          )}
        </div>
      )}
      {leading}
      <InputGroup className="rounded-xl bg-background">
        <InputGroupTextarea
          aria-label={ariaLabel}
          data-chat-input
          rows={1}
          placeholder={placeholder}
          value={text}
          className="max-h-32 min-h-10 py-2.5 text-sm"
          role={commands ? "combobox" : undefined}
          aria-expanded={commands ? open : undefined}
          aria-controls={open && matches.length ? listId : undefined}
          aria-autocomplete={commands ? "list" : undefined}
          aria-activedescendant={open && matches[current] ? `${listId}-${matches[current].name}` : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setText(e.target.value);
            setDismissed(false);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (open && matches.length) {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const step = e.key === "ArrowDown" ? 1 : -1;
                return setActive((current + step + matches.length) % matches.length);
              }
              if ((e.key === "Enter" && !e.shiftKey) || e.key === "Tab") {
                e.preventDefault();
                return run(matches[current].name);
              }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        {onSubmit && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-sm"
              variant="default"
              className="rounded-lg"
              aria-label="Send"
              disabled={!text.trim()}
              onClick={submit}
            >
              <ArrowUpIcon />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    </div>
  );
}
