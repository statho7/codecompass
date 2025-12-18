import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function AnalysisLoader() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-center gap-3 py-8">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-lg font-medium">Analyzing repository...</p>
      </div>

      <div className="grid gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                <div className="h-4 w-4/6 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
