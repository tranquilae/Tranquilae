import { PlanManagement } from "@/components/plan-management"
import { UserProfile } from "@/components/user-profile"
import { AppPreferences } from "@/components/app-preferences"
import { IntegrationsPanel } from "@/components/integrations-panel"
import { AccountSettings } from "@/components/account-settings"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account, preferences, and subscription</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main settings area */}
        <div className="lg:col-span-2 space-y-6">
          <PlanManagement />
          <UserProfile />
          <AppPreferences />
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <IntegrationsPanel />
          <AccountSettings />
        </div>
      </div>
    </div>
  )
}
