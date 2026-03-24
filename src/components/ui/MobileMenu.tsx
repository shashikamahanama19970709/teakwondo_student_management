'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { startTransition } from 'react'
import Link from 'next/link'
import { X, Menu, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { OrganizationLogo } from '@/components/ui/OrganizationLogo'
import { useOrganization } from '@/hooks/useOrganization'
import { PermissionGate } from '@/lib/permissions/permission-components'
import { Permission } from '@/lib/permissions/permission-definitions'
import { usePermissions } from '@/lib/permissions/permission-context'
import { Role } from '@/lib/permissions/permission-definitions'
import { StudentCourseNavigation } from '@/components/student/StudentCourseNavigation'
import { 
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Users,
  Clock,
  Settings,
  List,
  Calendar,
  Bell,
  Zap,
  Shield,
  Play,
  BookOpen,
  Target,
  Activity,
  LogOut,
  Rocket,
  Award,
  Quote,
  MessageSquare,
  LayoutGrid
} from 'lucide-react'

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    permission: Permission.PROJECT_READ
  },
  {
    id: 'certifications',
    label: 'Certifications',
    icon: Award,
    path: '/certifications',
    permission: Permission.PROJECT_READ
  },
  {
    id: 'course-management',
    label: 'Course Management',
    icon: BookOpen,
    path: '/admin/course-management',
    permission: Permission.PROJECT_READ
  },
  {
    id: 'units',
    label: 'Units',
    icon: BookOpen,
    path: '/units',
    permission: Permission.TASK_READ
  },
  {
    id: 'team',
    label: 'Team',
    icon: Users,
    path: '/team/members',
    permission: Permission.TEAM_READ,
    children: [
      {
        id: 'team-members',
        label: 'Members',
        icon: Users,
        path: '/team/members',
        permission: Permission.TEAM_READ
      },
      {
        id: 'team-activity',
        label: 'Team Activity',
        icon: Activity,
        path: '/team/activity',
        permission: Permission.TEAM_READ
      }
    ]
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: Bell,
    path: '/admin/announcements',
    permission: Permission.ANNOUNCEMENT_READ
  },
  {
    id: 'testimonials',
    label: 'Testimonials',
    icon: Quote,
    path: '/admin/testimonials',
    permission: Permission.SETTINGS_VIEW
  },
  {
    id: 'inquiries',
    label: 'Inquiries',
    icon: MessageSquare,
    path: '/admin/inquiries',
    permission: Permission.SETTINGS_VIEW
  },
  {
    id: 'customize-landing',
    label: 'Customize Landing',
    icon: LayoutGrid,
    path: '/admin/customize-landing',
    permission: Permission.SETTINGS_VIEW
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    permission: Permission.SETTINGS_VIEW
  }
]

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()
  const router = useRouter()
  const { organization, loading } = useOrganization()
  const { hasPermission, permissions } = usePermissions()

  const userRole = permissions?.userRole

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
        router.push('/login')
      } else {
        console.error('Logout failed:', await response.text())
        router.push('/login')
      }
    } catch (error) {
      console.error('Logout failed:', error)
      router.push('/login')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Mobile Menu */}
      <div className="fixed inset-y-0 left-0 w-80 bg-background border-r z-50 lg:hidden overflow-y-auto">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="h-8 w-8 rounded bg-primary/10 animate-pulse" />
            ) : (
              <OrganizationLogo 
                lightLogo={organization?.logo} 
                darkLogo={organization?.darkLogo}
                logoMode={organization?.logoMode}
                fallbackText='K'
                size="sm"
                className="rounded"
              />
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="px-2 py-4">
          <nav className="space-y-1">
            {/* Show student course navigation for students */}
            {userRole === Role.STUDENT ? (
              <StudentCourseNavigation collapsed={false} />
            ) : (
              /* Show regular navigation for other roles */
              navigationItems
                .filter((item) => hasPermission(item.permission))
                .map((item) => ({
                  ...item,
                  children: item.children?.filter((child: any) => hasPermission(child.permission)) || []
                }))
                .map((item) => (
                <MobileNavigationItem
                  key={item.id}
                  item={item}
                  pathname={pathname}
                  expandedItems={expandedItems}
                  onToggleExpanded={toggleExpanded}
                  router={router}
                />
              ))
            )}
          </nav>
        </div>

        {/* Sign Out */}
        <div className="border-t p-2 mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground px-3"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </>
  )
}

interface MobileNavigationItemProps {
  item: any
  pathname: string
  expandedItems: string[]
  onToggleExpanded: (itemId: string) => void
  router: any
}

function MobileNavigationItem({ item, pathname, expandedItems, onToggleExpanded, router }: MobileNavigationItemProps) {
  const isActive = pathname === item.path
  const hasChildren = item.children && item.children.length > 0
  const isExpanded = expandedItems.includes(item.id)
  const Icon = item.icon

  return (
    <PermissionGate permission={item.permission}>
      <div className="space-y-1">
        {hasChildren ? (
          <Button
            variant={isActive ? 'secondary' : 'ghost'}
            className="w-full justify-start px-3"
            onClick={() => onToggleExpanded(item.id)}
          >
            <Icon className="h-4 w-4 mr-2" />
            <span className="flex-1 text-left">{item.label}</span>
            {hasChildren && (
              <ChevronRight
                className={cn(
                  'h-4 w-4 transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            )}
          </Button>
        ) : (
          <Button
            variant={isActive ? 'secondary' : 'ghost'}
            className="w-full justify-start px-3"
            asChild
          >
            <Link href={item.path} prefetch onMouseEnter={() => router.prefetch(item.path)}>
              <Icon className="h-4 w-4 mr-2" />
              <span className="flex-1 text-left">{item.label}</span>
            </Link>
          </Button>
        )}

        {/* Sub-navigation */}
        {hasChildren && isExpanded && (
          <div className="ml-4 space-y-1">
            {item.children.map((child: any) => (
              <PermissionGate key={child.id} permission={child.permission}>
                <Button
                  variant={pathname === child.path ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-sm"
                  asChild
                >
                  <Link href={child.path} prefetch onMouseEnter={() => router.prefetch(child.path)}>
                    <child.icon className="mr-2 h-4 w-4" />
                    {child.label}
                  </Link>
                </Button>
              </PermissionGate>
            ))}
          </div>
        )}
      </div>
    </PermissionGate>
  )
}
