import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings | Shifterino',
  description: 'Manage your application settings and preferences.',
}

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>
      <div className="grid gap-6">
        {/* Settings content will go here */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Application Settings</h2>
          <p className="text-muted-foreground">
            Settings page is under construction. Check back soon for more
            options.
          </p>
        </div>
      </div>
    </div>
  )
}
