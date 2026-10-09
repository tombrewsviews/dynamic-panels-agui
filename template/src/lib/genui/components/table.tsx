"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Fragment } from "react";
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BuiltinActionType, defineComponent, useTriggerAction } from "@openuidev/react-lang";
import { z } from "zod";
import { actionSchema, type ActionSchema } from "../action";
import { useIsSelected } from "../selection";

const ColSchema = z.object({
  header: z.string(),
  type: z.enum(["string", "number", "boolean"]).optional(),
});

export const Col = defineComponent({
  name: "Col",
  props: ColSchema,
  description: "Column definition for Table — header label and optional type.",
  component: () => null,
});

const TableSchema = z.object({
  columns: z.array(Col.ref),
  rows: z.array(z.array(z.any())),
  /** Optional per-row action; a row with one becomes clickable. */
  rowActions: z.array(actionSchema).optional(),
  /** Optional button at the end of each row (e.g. Detach); its click doesn't open the row. */
  rowButtons: z.array(z.object({ label: z.string(), hint: z.string().optional(), action: actionSchema })).optional(),
  /** Optional section headings, each placed before the row at index `start`. */
  sections: z.array(z.object({ label: z.string(), detail: z.string().optional(), start: z.number() })).optional(),
  /** Wrap long cell text instead of scrolling the table sideways. */
  wrap: z.boolean().optional(),
});

export const Table = defineComponent({
  name: "Table",
  props: TableSchema,
  description: "Data table. columns: Col[] with header/type, rows: 2D array of values, rowActions: optional action per row, rowButtons: optional {label, hint, action} button per row, sections: optional {label, detail, start} headings, wrap: wrap text instead of scrolling.",
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const isSelected = useIsSelected();
    const rowActions = (props.rowActions ?? []) as ActionSchema[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columns = ((props.columns ?? []) as any[]).map((c) => ({
      header: String(c?.props?.header ?? ""),
      type: c?.props?.type ?? "string",
    }));
    const rows = (props.rows ?? []) as unknown[][];
    const rowButtons = (props.rowButtons ?? []) as { label: string; hint?: string; action: ActionSchema }[];
    const sections = (props.sections ?? []) as { label: string; detail?: string; start: number }[];
    const span = columns.length + (rowButtons.length ? 1 : 0);
    const cellWrap = props.wrap ? "whitespace-normal break-words align-top" : "";
    const fire = (label: string, a: ActionSchema) =>
      a &&
      triggerAction(label, undefined, {
        type: a.type ?? BuiltinActionType.ContinueConversation,
        params: (a as { params?: Record<string, unknown> }).params,
      });

    return (
      <div className="rounded-md border">
        <ShadcnTable>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className={col.type === "number" ? "text-right" : ""}>
                  {col.header}
                </TableHead>
              ))}
              {rowButtons.length > 0 && (
                <TableHead className="w-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, ri) => {
              const action = rowActions[ri];
              const selected = !!action && isSelected(action);
              const run = () =>
                action &&
                triggerAction(String(row[0] ?? ""), undefined, {
                  type: action.type ?? BuiltinActionType.ContinueConversation,
                  params: (action as { params?: Record<string, unknown> }).params,
                });
              return (
              <Fragment key={ri}>
              {sections
                .filter((sec) => sec.start === ri)
                .map((sec) => (
                  <TableRow key={`section-${sec.label}`} className="bg-muted/50 hover:bg-muted/50">
                    <TableCell colSpan={span} className="py-1.5 whitespace-normal">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
                        <span className="font-medium">{sec.label}</span>
                        {sec.detail && <span className="text-muted-foreground tabular-nums">{sec.detail}</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              <TableRow
                {...(action && {
                  role: "button",
                  tabIndex: 0,
                  "aria-label": `Open ${String(row[0] ?? "")}`,
                  "aria-current": selected || undefined,
                  // Selected: the item open in the side panel — filled, with a bar on the leading edge.
                  className: cn(
                    "cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none",
                    selected && "bg-muted font-medium shadow-[inset_3px_0_0_var(--ring)] hover:bg-muted",
                  ),
                  onClick: run,
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      run();
                    }
                  },
                })}
              >
                {columns.map((col, ci) => (
                  <TableCell
                    key={ci}
                    className={cn(col.type === "number" && "text-right tabular-nums", cellWrap)}
                  >
                    {String(row[ci] ?? "")}
                  </TableCell>
                ))}
                {rowButtons.length > 0 && (
                  <TableCell className={cn("w-0 py-1 text-right", props.wrap && "align-top")}>
                    {rowButtons[ri] && (
                      <Button
                        size="xs"
                        variant="ghost"
                        aria-label={rowButtons[ri].hint ?? rowButtons[ri].label}
                        // The row itself opens on click / Enter; the button keeps its own.
                        onClick={(e) => {
                          e.stopPropagation();
                          fire(rowButtons[ri].label, rowButtons[ri].action);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {rowButtons[ri].label}
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
              </Fragment>
              );
            })}
          </TableBody>
        </ShadcnTable>
      </div>
    );
  },
});
