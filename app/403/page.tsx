import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft } from "lucide-react"

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-6">
      <Card className="w-full max-w-md glass-card border-0">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You don't have permission to access this page. Admin privileges are required.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              If you believe this is an error, please contact your system administrator.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/auth/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
              
              <Button asChild className="flex-1">
                <Link href="/">
                  Go Home
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>
          {" • "}
          <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link>
        </p>
      </div>
    </div>
  )
}
