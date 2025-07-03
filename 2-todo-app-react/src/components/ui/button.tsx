import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-offset-2 active:scale-95 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl hover:shadow-indigo-500/25 hover:shadow-2xl focus-visible:ring-indigo-500/50 transform hover:scale-105 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        destructive:
          "bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white shadow-2xl hover:shadow-red-500/25 hover:shadow-2xl focus-visible:ring-red-500/50 transform hover:scale-105 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        outline:
          "border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 shadow-lg hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-xl focus-visible:ring-indigo-500/50 transform hover:scale-105 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-r before:from-indigo-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        secondary:
          "bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-800 shadow-lg hover:from-gray-200 hover:to-gray-400 hover:shadow-xl focus-visible:ring-gray-500/50 transform hover:scale-105 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/30 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        ghost:
          "text-gray-600 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 rounded-2xl focus-visible:ring-indigo-400/50 transform hover:scale-105 transition-all duration-300",
        link: "text-indigo-600 underline-offset-4 hover:underline hover:text-indigo-700 transition-colors duration-300",
        success:
          "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-2xl hover:shadow-emerald-500/25 hover:shadow-2xl focus-visible:ring-emerald-500/50 transform hover:scale-105 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
      },
      size: {
        default: "h-12 px-6 py-3 text-base has-[>svg]:px-5",
        sm: "h-9 rounded-xl gap-1.5 px-4 text-sm has-[>svg]:px-3",
        lg: "h-14 rounded-2xl px-8 text-lg has-[>svg]:px-7",
        icon: "size-12 rounded-2xl",
        xl: "h-16 rounded-3xl px-10 text-xl has-[>svg]:px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }