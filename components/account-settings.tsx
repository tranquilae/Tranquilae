"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Download, Trash2, LogOut, HelpCircle } from "lucide-react"

export function AccountSettings() {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Account & Security
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Actions */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
            <Shield className="h-4 w-4" />
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
            <HelpCircle className="h-4 w-4" />
            Help & Support
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-border">
          <h4 className="font-medium text-sm text-muted-foreground mb-3">Danger Zone</h4>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* App Info */}
        <div className="pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">Tranquilae v1.2.0</p>
          <p className="text-xs text-muted-foreground">© 2024 Tranquilae. All rights reserved.</p>
        </div>
      </CardContent>
    </Card>
  )
}
