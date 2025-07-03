import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-6 shrink-0 rounded-xl border-2 border-gray-300 bg-white shadow-lg transition-all duration-300 outline-none hover:border-indigo-400 hover:shadow-indigo-200 focus-visible:ring-4 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-indigo-500 data-[state=checked]:to-purple-600 data-[state=checked]:border-indigo-500 data-[state=checked]:shadow-indigo-500/25 data-[state=checked]:scale-110 aria-invalid:border-red-500 aria-invalid:ring-red-500/20 relative overflow-hidden group",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-white transition-all duration-300 transform data-[state=checked]:scale-100 data-[state=unchecked]:scale-0 data-[state=checked]:rotate-0 data-[state=unchecked]:rotate-45"
      >
        <CheckIcon className="size-4 drop-shadow-sm animate-in zoom-in duration-300" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }