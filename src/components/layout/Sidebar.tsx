'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { OrganizationLogo } from '@/components/ui/OrganizationLogo'
import { useOrganization } from '@/hooks/useOrganization'
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Clock,
  Settings,
  List,
  Calendar,
  Zap,
  Rocket,
  Shield,
  Play,
  Sliders,
  LogOut,
  Activity,
  Award,
  FolderOpen,
  CheckSquare,
  Users,
  Megaphone,
  Quote,
  MessageSquare,
  LayoutGrid,
  BookOpen
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { usePermissions } from '@/lib/permissions/permission-context'
import { Role } from '@/lib/permissions/permission-definitions'
import { StudentCourseNavigation } from '@/components/student/StudentCourseNavigation'
import packageJson from '../../../package.json'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: [Role.ADMIN, Role.LECTURER, Role.TEACHER]
  },
  {
    id: 'certifications',
    label: 'Certifications',
    icon: Award,
    path: '/certifications',
    roles: [Role.ADMIN, Role.LECTURER, Role.TEACHER]
  },
  {
    id: 'course-management',
    label: 'Course Management',
    icon: BookOpen,
    path: '/admin/course-management',
    roles: [Role.ADMIN, Role.LECTURER, Role.TEACHER]
  },
    {
    id: 'units',
    label: 'Units',
    icon: BookOpen,
    path: '/units',
    roles: [Role.ADMIN, Role.LECTURER, Role.TEACHER, Role.STUDENT]
  },
  {
    id: 'team',
    label: 'Team',
    icon: Users,
    path: '/team/members',
    roles: [Role.ADMIN, Role.LECTURER, Role.TEACHER],
    children: [
      {
        id: 'team-members',
        label: 'Members',
        icon: Users,
        path: '/team/members',
        roles: [Role.ADMIN, Role.LECTURER, Role.TEACHER]
      },
      {
        id: 'team-activity',
        label: 'Team Activity',
        icon: Activity,
        path: '/team/activity',
        roles: [Role.ADMIN, Role.LECTURER, Role.TEACHER]
      }
    ]
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: Megaphone,
    path: '/admin/announcements',
    roles: [Role.ADMIN]
  },
  {
    id: 'testimonials',
    label: 'Testimonials',
    icon: Quote,
    path: '/admin/testimonials',
    roles: [Role.ADMIN]
  },
  {
    id: 'inquiries',
    label: 'Inquiries',
    icon: MessageSquare,
    path: '/admin/inquiries',
    roles: [Role.ADMIN]
  },
  {
    id: 'customize-landing',
    label: 'Customize Landing',
    icon: LayoutGrid,
    path: '/admin/customize-landing',
    roles: [Role.ADMIN]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    roles: [Role.ADMIN, Role.LECTURER, Role.TEACHER]
  }
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { organization, loading } = useOrganization()
  const { theme, resolvedTheme } = useTheme()
  const { hasPermission, permissions } = usePermissions()
  const userRole = permissions?.userRole

  // Filter navigation items based on role
  const filteredNavigationItems = navigationItems.filter(item => {
    if (!userRole) return false
    return item.roles.includes(userRole as Role)
  })

  // Ensure component is mounted before rendering conditional content
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-expand parent sections when child pages are active
  useEffect(() => {
    const activeParentIds: string[] = []

    navigationItems.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child => pathname === child.path)
        if (isChildActive) {
          activeParentIds.push(item.id)
        }
      }
    })

    if (activeParentIds.length > 0) {
      setExpandedItems(prev => {
        const newExpanded = Array.from(new Set([...prev, ...activeParentIds]))
        return newExpanded
      })
    }
  }, [pathname])

  if (!mounted) return null

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleLogout = async () => {
    try {
      // Clear permission cache before logout
      try {
        sessionStorage.removeItem('help_line_academy_permissions')
        sessionStorage.removeItem('help_line_academy_permissions_timestamp')
      } catch (cacheError) {
        console.error('Error clearing permission cache:', cacheError)
      }

      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (response.ok) {
        // Clear any client-side state if needed
        router.push('/login')
      } else {
        console.error('Logout failed:', await response.text())
        // Still redirect to login even if logout API fails
        router.push('/login')
      }
    } catch (error) {
      console.error('Logout failed:', error)
      // Still redirect to login even if logout API fails
      router.push('/login')
    }
  }

  return (
    <>
      <div
        className={cn(
          'flex h-full flex-col border-r bg-background transition-all duration-300 rounded-r-2xl overflow-hidden',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Sidebar Header */}
        <div className="relative flex h-40 items-center justify-center px-4">
          {!collapsed && (
            <div className="flex items-center justify-center">
              {!mounted || loading ? (
                <div className="h-32 w-32 rounded bg-primary/10 animate-pulse" />
              ) : (
                <OrganizationLogo
                  lightLogo={organization?.logo}
                  darkLogo={organization?.darkLogo}
                  logoMode={organization?.logoMode}
                  fallbackText='K'
                  size="xl"
                  className="rounded"
                />
              )}
            </div>
          )}

          {/* Toggle Button - Positioned absolutely */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                >
                  {collapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{collapsed ? 'Expand side menu' : 'Collapse side menu'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="border-t" />

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <nav className="space-y-1">
            {/* Show student course navigation for students */}
            {userRole === Role.STUDENT ? (
              <StudentCourseNavigation collapsed={collapsed} />
            ) : (
              /* Show regular navigation for other roles */
              filteredNavigationItems.map((item) => (
                <NavigationItem
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  pathname={pathname}
                  expandedItems={expandedItems}
                  onToggleExpanded={toggleExpanded}
                  setExpandedItems={setExpandedItems}
                  router={router}
                />
              ))
            )}
          </nav>
        </div>

        {/* Version + Sticky Sign Out */}
        <div className="border-t p-2">
          {/* {!collapsed && (
            <div className="px-1 pb-2 text-xs text-muted-foreground flex items-center justify-between">
              <span>Version</span>
              <span className="font-mono">{packageJson.version}</span>
            </div>
          )} */}
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start text-muted-foreground hover:text-foreground rounded-lg',
              collapsed ? 'px-2' : 'px-3'
            )}
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut className={cn('h-4 w-4', collapsed ? 'mx-auto' : 'mr-2')} />
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </div>
      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Logout Confirmation"
        description="You are about to log out from the system. This will end your current session and you will need to log in again to access your account. Any unsaved work will be lost."
        confirmText="Logout"
        cancelText="Cancel"
      />
    </>
  )
}

interface NavigationItemProps {
  item: any
  collapsed: boolean
  pathname: string
  expandedItems: string[]
  onToggleExpanded: (itemId: string) => void
  setExpandedItems: React.Dispatch<React.SetStateAction<string[]>>
  router: any
}

function NavigationItem({ item, collapsed, pathname, expandedItems, onToggleExpanded, setExpandedItems, router }: NavigationItemProps) {
  const isActive = pathname === item.path
  const hasChildren = item.children && item.children.length > 0
  const isExpanded = expandedItems.includes(item.id)
  const Icon = item.icon

  // For collapsed sidebar with children, show popover
  if (collapsed && hasChildren) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isActive ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-center px-2 rounded-xl',
              isActive && 'bg-secondary text-secondary-foreground'
            )}
            title={item.label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-48 p-1 rounded-xl">
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-sm font-medium text-foreground border-b">
              {item.label}
            </div>
            {item.children.map((child: any) => (
              <Button
                key={child.id}
                variant={pathname === child.path ? 'secondary' : 'ghost'}
                className="w-full justify-start text-sm h-8 rounded-md"
                asChild
              >
                <Link href={child.path} prefetch onMouseEnter={() => router.prefetch(child.path)}>
                  <child.icon className="mr-2 h-4 w-4" />
                  {child.label}
                </Link>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Regular navigation item (expanded sidebar or no children)
  return (
    <div className="space-y-1">
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className={cn(
          'w-full justify-start',
          collapsed ? 'px-2' : 'px-3',
          isActive && 'bg-secondary text-secondary-foreground'
        )}
        title={collapsed ? item.label : undefined}
        asChild
      >
        <Link 
          href={item.path} 
          prefetch 
          onMouseEnter={() => router.prefetch(item.path)}
          onClick={() => {
            if (hasChildren && !collapsed) {
              onToggleExpanded(item.id)
              // If clicking on a parent with children, expand it and keep it expanded
              if (!expandedItems.includes(item.id)) {
                setExpandedItems(prev => [...prev, item.id])
              }
            }
          }}
        >
          <Icon className={cn('h-4 w-4', collapsed ? 'mx-auto' : 'mr-2')} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {hasChildren && (
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                />
              )}
            </>
          )}
        </Link>
      </Button>

      {/* Sub-navigation */}
      {hasChildren && isExpanded && !collapsed && (
        <div className="ml-4 space-y-1">
          {item.children.map((child: any) => {
            const isChildActive = pathname === child.path
            return (
              <Button
                key={child.id}
                variant={isChildActive ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start text-sm rounded-md",
                  isChildActive && 'bg-secondary text-secondary-foreground'
                )}
                asChild
              >
                <Link
                  href={child.path}
                  prefetch
                  onMouseEnter={() => router.prefetch(child.path)}
                  onClick={() => {
                    // Keep parent expanded when navigating to child
                    if (!expandedItems.includes(item.id)) {
                      setExpandedItems(prev => [...prev, item.id])
                    }
                  }}
                >
                  <child.icon className="mr-2 h-4 w-4" />
                  {child.label}
                </Link>
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
