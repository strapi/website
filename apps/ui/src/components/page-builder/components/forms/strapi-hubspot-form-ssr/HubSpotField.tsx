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
                <FormLabel>
                  {field.label}
                  {field.required && " *"}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...rhfField}
                    placeholder={field.placeholder ?? ""}
                  />
                </FormControl>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )

          case "dropdown":
            return (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && " *"}
                </FormLabel>
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
                  <FormDescription>{field.description}</FormDescription>
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
                  <FormLabel className="font-normal">
                    {field.label}
                    {field.required && " *"}
                  </FormLabel>
                  {field.description && (
                    <FormDescription>{field.description}</FormDescription>
                  )}
                  <FormMessage />
                </div>
              </FormItem>
            )

          case "radio":
            return (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && " *"}
                </FormLabel>
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
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )

          default:
            return (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && " *"}
                </FormLabel>
                <FormControl>
                  <Input
                    {...rhfField}
                    type={mapFieldType(field.fieldType)}
                    placeholder={field.placeholder ?? ""}
                  />
                </FormControl>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )
        }
      }}
    />
  )
}
