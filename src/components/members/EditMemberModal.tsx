'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { X, Loader2, UserCog } from 'lucide-react'
import { Checkbox } from '../ui/Checkbox'

interface Member {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
  memberId?: string
  customRole?: { _id: string; name: string }
  isActive: boolean
  enrolledCourses?: Array<{ courseId: string; groupName?: string; enrolledAt: string }>
  showOnLanding?: boolean
  description?: string
  avatar?: string
  username?: string
  passwordDisplay?: string
  studentRegistrationNo?: string
}

interface EditMemberModalProps {
  member: Member
  onClose: () => void
  onUpdate: (memberId: string, updates: any) => void
  canEditAdminUsers?: boolean
}

// System roles — same list as Create modal
const SYSTEM_ROLES = [
  { _id: 'admin', name: 'Admin', description: 'Full system access' },
  { _id: 'lecturer', name: 'Lecturer', description: 'Can create and manage courses' },
  { _id: 'minor_staff', name: 'Minor Staff', description: 'Limited administrative access' },
  { _id: 'student', name: 'Student', description: 'Course participant access' }
]

// Snapshot of original values used to detect if anything changed
const getInitialData = (m: Member) => ({
  firstName: m.firstName,
  lastName: m.lastName,
  username: m.username || '',
  passwordDisplay: m.passwordDisplay || '',
  role: m.role,
  memberId: m.memberId || '',
  isActive: m.isActive,
  showOnLanding: m.showOnLanding || false,
  description: m.description || '',
  avatar: m.avatar || '',
  studentRegistrationNo: m.studentRegistrationNo || ''
})

export function EditMemberModal({ member, onClose, onUpdate, canEditAdminUsers = false }: EditMemberModalProps) {
  const initialData = getInitialData(member)

  const [formData, setFormData] = useState(initialData)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isAdminMember = member.role === 'admin'

  const isFormValid =
    formData.firstName.trim() !== '' &&
    formData.lastName.trim() !== '' &&
    formData.username.trim() !== '' &&
    formData.passwordDisplay.trim() !== ''

  // True only when at least one value differs from what was saved
  const hasChanges =
    formData.firstName !== initialData.firstName ||
    formData.lastName !== initialData.lastName ||
    formData.username !== initialData.username ||
    formData.passwordDisplay !== initialData.passwordDisplay ||
    formData.role !== initialData.role ||
    formData.memberId !== initialData.memberId ||
    formData.isActive !== initialData.isActive ||
    formData.showOnLanding !== initialData.showOnLanding ||
    formData.description !== initialData.description ||
    formData.avatar !== initialData.avatar

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required')
      return
    }
    if (formData.role === 'admin' && !canEditAdminUsers) {
      setError('You do not have permission to assign admin role')
      return
    }
    if (isAdminMember && !canEditAdminUsers) {
      setError('You do not have permission to edit administrator accounts')
      return
    }

    setLoading(true)
    try {
      let finalAvatarUrl = formData.avatar

      await onUpdate(member._id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        passwordDisplay: formData.passwordDisplay,
        role: formData.role,
        memberId: formData.memberId || undefined,
        isActive: formData.isActive,
        showOnLanding: formData.showOnLanding,
        description: formData.description,
        avatar: finalAvatarUrl,
        studentRegistrationNo: formData.studentRegistrationNo
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member')
    } finally {
      setLoading(false)
    }
  }

  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <CardHeader className="p-4 sm:p-6 pb-4 sm:pb-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-red-600" />
              <div>
                <CardTitle>Edit Team Member</CardTitle>
                <CardDescription>Update member information and settings</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Scrollable Content */}
        <CardContent className="p-4 sm:p-6 flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1">
                <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {/* First Name / Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            {/* Username / Email (email read-only) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="john.doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={member.email}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </div>

            {/* Password / Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-password">Password</Label>
                <Input
                  id="edit-password"
                  type="text"
                  value={formData.passwordDisplay}
                  onChange={(e) => setFormData(prev => ({ ...prev, passwordDisplay: e.target.value }))}
                  placeholder="Account password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">System Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => {
                    if (value === 'admin' && !canEditAdminUsers) {
                      setError('You do not have permission to assign admin role')
                      return
                    }
                    setError('')
                    setFormData(prev => ({ ...prev, role: value }))
                  }}
                  disabled={isAdminMember && !canEditAdminUsers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYSTEM_ROLES.map((r) => (
                      <SelectItem
                        key={r._id}
                        value={r._id}
                        disabled={r._id === 'admin' && !canEditAdminUsers}
                      >
                        {r.name}{r._id === 'admin' && !canEditAdminUsers ? ' (Requires permission)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isAdminMember && !canEditAdminUsers && (
                  <p className="text-xs text-destructive">You cannot edit administrator accounts</p>
                )}
              </div>
            </div>

            {/* Student Registration No (only for students) */}
            {formData.role === 'student' && (
              <div className="space-y-2">
                <Label htmlFor="edit-studentRegistrationNo">Student Registration No</Label>
                <Input
                  id="edit-studentRegistrationNo"
                  value={formData.studentRegistrationNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentRegistrationNo: e.target.value }))}
                  placeholder="Enter student registration number"
                />
              </div>
            )}

            {/* Professional Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Professional Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief biography for the lecture panel..."
                className="h-20 resize-none"
              />
            </div>

            {/* Show on Landing Page */}
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-white/10">
              <Checkbox
                id="edit-showOnLanding"
                checked={formData.showOnLanding}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showOnLanding: checked === true }))}
              />
              <Label htmlFor="edit-showOnLanding" className="text-sm font-medium leading-none cursor-pointer">
                Display on Landing Page (Lecture Panel)
              </Label>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-white/10">
              <div>
                <Label htmlFor="edit-isActive" className="text-sm font-medium leading-none cursor-pointer">
                  Active Status
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.isActive ? 'Member can access the system' : 'Member cannot access the system'}
                </p>
              </div>
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </form>
        </CardContent>

        {/* Fixed Footer */}
        <div className="p-4 sm:p-6 pt-0 flex-shrink-0">
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-white/10">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !isFormValid || !hasChanges}
              className="bg-red-600 hover:bg-red-700 text-white disabled:bg-slate-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Member'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
