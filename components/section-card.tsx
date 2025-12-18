"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SectionCardProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  icon?: React.ReactNode // Added optional icon prop
}

export function SectionCard({ title, children, defaultOpen = false, icon }: SectionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none hover:bg-accent/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl flex items-center gap-2">
            {icon}
            {title}
          </span>
          <ChevronDown className={cn("size-5 transition-transform duration-200", isOpen && "rotate-180")} />
        </CardTitle>
      </CardHeader>
      {isOpen && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  )
}
