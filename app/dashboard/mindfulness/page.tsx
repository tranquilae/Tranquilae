import { MeditationPlayer } from "@/components/meditation-player"
import { JournalEntry } from "@/components/journal-entry"
import { DailyReflection } from "@/components/daily-reflection"
import { MindfulnessStats } from "@/components/mindfulness-stats"
import { MindfulnessSessionPanel } from "@/components/mindfulness-session-panel"

export default function MindfulnessPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mindfulness</h1>
          <p className="text-muted-foreground mt-1">Find peace and clarity in your daily practice</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main mindfulness area */}
        <div className="lg:col-span-2 space-y-6">
          <MeditationPlayer />
          <JournalEntry />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <MindfulnessSessionPanel />
          <MindfulnessStats />
        </div>
      </div>
    </div>
  )
}
