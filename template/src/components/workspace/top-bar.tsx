"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { ITEMS } from "@/lib/workspace/demo-data";
import { useWorkspace } from "@/lib/workspace/store";
import { SearchIcon, WrenchIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { StatusDot } from "./status";

/** App bar: mark, ⌘K command palette, global stats slot, account menu with theme. */
export function TopBar({ appName = "Workspace", mark = "WS" }: { appName?: string; mark?: string }) {
  const [open, setOpen] = useState(false);
  const { select, openTool } = useWorkspace.getState();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 rounded-2xl border bg-card px-3 shadow-xs">
      <div className="flex items-center gap-2" aria-label={appName}>
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-[11px] font-bold tracking-tight text-primary-foreground">{mark}</span>
        <span className="hidden text-sm font-semibold lg:inline">{appName}</span>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-full max-w-72 items-center gap-2 rounded-lg border bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SearchIcon className="size-4" />
        <span className="flex-1 text-left">Search…</span>
        <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
      </button>

      <div className="ml-auto flex items-center gap-4 text-sm">
        {/* Global stats go here: label + tabular number, each a dropdown with its breakdown. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Account menu"
          >
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">U</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">User</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Theme</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search items and actions">
        <CommandInput placeholder="Search items…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Items">
            {ITEMS.map((i) => (
              <CommandItem key={i.id} value={`${i.title} ${i.subtitle} ${i.id}`} onSelect={() => run(() => select(i.id))}>
                <StatusDot status={i.status} />
                <span className="truncate">{i.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">#{i.id}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => run(openTool)}>
              <WrenchIcon /> Open the tool for the selected item
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
