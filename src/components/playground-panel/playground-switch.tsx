"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { Code2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { PlaygroundMode } from "./types"


interface PlaygroundSwitchProps {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    mode: PlaygroundMode
}
  




export default function PlaygroundSwitch({ checked, onCheckedChange, mode }: PlaygroundSwitchProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="mode-switch"
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Label htmlFor="mode-switch" className="font-medium max-w-24 text-center text-sm justify-center items-center">
        {mode === "overview" ? "Overview" : "Storybooks"}
      </Label>
    </div>
  )
}

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "w-16 h-7 peer inline-flex shrink-0 items-center rounded-full border border-transparent transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
        "data-[state=checked]:bg-input/80",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
            "size-6 pointer-events-none block rounded-full ring-0 transition-transform data-[state=checked]:translate-x-9 data-[state=unchecked]:translate-x-1 flex items-center justify-center",
            "data-[state=unchecked]:bg-[#A05BFE] data-[state=unchecked]:text-white",
            "data-[state=checked]:bg-[#13AE5B] data-[state=checked]:text-white",
            className,
        )}
      >
        <Code2Icon className={"h-3.5 w-3.5"}/>
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}
