import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { PermissionProvider } from '@/lib/permissions/permission-context'
import { ToastProviderWrapper } from '@/components/providers/ToastProviderWrapper'
import { TooltipProvider } from '@/components/ui/tooltip'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Use Inter font for clean typography
const fontClass = `${inter.variable} font-sans`

export const metadata: Metadata = {
  title: 'Help Line Academy - Student Management Solution',
  description: 'Self-hosted course management solution for modern teams',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side fetch to hydrate permissions early
  let initialPermissions: any = null
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/auth/permissions`, {
      // Ensure we don't cache user-scoped permissions
      cache: 'no-store',
      // Next.js server fetch will forward cookies automatically for same-origin URLs
    })
    if (res.ok) {
      initialPermissions = await res.json()
    }
  } catch (_) {
    // Silently ignore; client will fall back to fetching
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontClass} antialiased overflow-y-hidden`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <PermissionProvider initialPermissions={initialPermissions}>
              <ToastProviderWrapper>
                {children}
              </ToastProviderWrapper>
            </PermissionProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
