import { GoalTracker } from "@/components/goal-tracker"
import { NotesEditor } from "@/components/notes-editor"
import { RemindersPanel } from "@/components/reminders-panel"
import { GoalProgress } from "@/components/goal-progress"

export default function NotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notes & Goals</h1>
          <p className="text-muted-foreground mt-1">Track your progress and capture your thoughts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          <GoalTracker />
          <NotesEditor />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <GoalProgress />
          <RemindersPanel />
        </div>
      </div>
    </div>
  )
}
