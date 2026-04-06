"use client"

import { useTranslations } from "next-intl"
import type { Control, FieldValues } from "react-hook-form"

import { Checkbox } from "@/components/ui/checkbox"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { HubSpotField as HubSpotFieldType } from "@/lib/hubspot"

import { mapFieldType } from "./helpers"

interface HubSpotFieldProps {
  readonly field: HubSpotFieldType
  readonly control: Control<FieldValues>
}

function FieldLabel({
  html,
  required,
  className,
}: {
  readonly html: string
  readonly required?: boolean
  readonly className?: string
}) {
  const label = required ? `${html} *` : html

  return (
    <FormLabel
      className={className}
      dangerouslySetInnerHTML={{ __html: label }}
    />
  )
}

function FieldDescription({ html }: { readonly html: string }) {
  return <FormDescription dangerouslySetInnerHTML={{ __html: html }} />
}

export function HubSpotField({ field, control }: HubSpotFieldProps) {
  const t = useTranslations("forms")

  return (
    <FormField
      name={field.name}
      control={control}
      render={({ field: rhfField }) => {
        switch (field.fieldType) {
          case "multi_line_text":
            return (
              <FormItem>
                <FieldLabel html={field.label} required={field.required} />
                <FormControl>
                  <Textarea
                    {...rhfField}
                    placeholder={field.placeholder ?? ""}
                  />
                </FormControl>
                {field.description && (
                  <FieldDescription html={field.description} />
                )}
                <FormMessage />
              </FormItem>
            )

          case "dropdown":
            return (
              <FormItem>
                <FieldLabel html={field.label} required={field.required} />
                <Select
                  name={rhfField.name}
                  value={rhfField.value as string}
                  onValueChange={rhfField.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          field.placeholder || t("selectPlaceholder")
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.description && (
                  <FieldDescription html={field.description} />
                )}
                <FormMessage />
              </FormItem>
            )

          case "single_checkbox":
            return (
              <FormItem className="flex flex-row items-start gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={rhfField.value as boolean}
                    onCheckedChange={rhfField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FieldLabel
                    html={field.label}
                    required={field.required}
                    className="font-normal"
                  />
                  {field.description && (
                    <FieldDescription html={field.description} />
                  )}
                  <FormMessage />
                </div>
              </FormItem>
            )

          case "radio":
            return (
              <FormItem>
                <FieldLabel html={field.label} required={field.required} />
                <FormControl>
                  <RadioGroup
                    value={rhfField.value as string}
                    onValueChange={rhfField.onChange}
                    className="flex flex-col gap-2"
                  >
                    {field.options?.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center gap-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`${field.name}-${option.value}`}
                        />
                        <FormLabel
                          htmlFor={`${field.name}-${option.value}`}
                          className="font-normal"
                        >
                          {option.label}
                        </FormLabel>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                {field.description && (
                  <FieldDescription html={field.description} />
                )}
                <FormMessage />
              </FormItem>
            )

          default:
            return (
              <FormItem>
                <FieldLabel html={field.label} required={field.required} />
                <FormControl>
                  <Input
                    {...rhfField}
                    type={mapFieldType(field.fieldType)}
                    placeholder={field.placeholder ?? ""}
                  />
                </FormControl>
                {field.description && (
                  <FieldDescription html={field.description} />
                )}
                <FormMessage />
              </FormItem>
            )
        }
      }}
    />
  )
}
