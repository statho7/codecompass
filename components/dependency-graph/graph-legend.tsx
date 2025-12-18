"use client"

const LEGEND_ITEMS = [
  { type: "page", label: "Pages", color: "#8b5cf6" },
  { type: "component", label: "Components", color: "#3b82f6" },
  { type: "api", label: "API Routes", color: "#f59e0b" },
  { type: "util", label: "Utilities", color: "#10b981" },
  { type: "config", label: "Config", color: "#6b7280" },
  { type: "style", label: "Styles", color: "#ec4899" },
]

export function GraphLegend() {
  return (
    <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">File Types</p>
      <div className="flex flex-wrap gap-3">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.type} className="flex items-center gap-1.5">
            <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
