"use client";

import {
  FormNameContext,
  FormValidationContext,
  defineComponent,
  useCreateFormValidation,
} from "@openuidev/react-lang";
import { z } from "zod";
import { Buttons } from "./buttons";
import { FormControl } from "./form-control";

const FormSchema = z.object({
  name: z.string(),
  buttons: Buttons.ref,
  fields: z.array(FormControl.ref).default([]),
});

export const Form = defineComponent({
  name: "Form",
  props: FormSchema,
  description:
    "Form container with fields and explicit action buttons. fields: FormControl[], buttons: Buttons.",
  component: ({ props, renderNode }) => {
    const formValidation = useCreateFormValidation();
    const formName = props.name as string;

    return (
      <FormValidationContext.Provider value={formValidation}>
        <FormNameContext.Provider value={formName}>
          {/* ⌘/Ctrl+Enter in any field runs the form's primary (default-variant) button. */}
          <div
            role="form"
            className="space-y-4"
            onKeyDown={(e) => {
              if (e.key !== "Enter" || !(e.metaKey || e.ctrlKey)) return;
              const primary = e.currentTarget.querySelector<HTMLButtonElement>(
                '[data-slot="button"][data-variant="default"]:not(:disabled)',
              );
              if (!primary) return;
              e.preventDefault();
              // Fields commit their value on blur; let that land before submitting.
              (document.activeElement as HTMLElement | null)?.blur();
              setTimeout(() => primary.click());
            }}
          >
            {renderNode(props.fields)}
            {renderNode(props.buttons)}
          </div>
        </FormNameContext.Provider>
      </FormValidationContext.Provider>
    );
  },
});
