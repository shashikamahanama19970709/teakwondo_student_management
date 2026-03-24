'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { X, Loader2, UserPlus } from 'lucide-react'
import { Checkbox } from '../ui/Checkbox'
import { Switch } from '@/components/ui/switch'

interface CreateMemberModalProps {
  onClose: () => void
  onAction: (data: any) => Promise<{ error?: string } | void>
  initialData?: Partial<{
    username: string
    email: string
    firstName: string
    lastName: string
    role: string
    phone: string
  }>
  readOnlyFields?: string[]
}

// System roles
const SYSTEM_ROLES = [
  { _id: 'admin', name: 'Admin', description: 'Full system access' },
  { _id: 'lecturer', name: 'Lecturer', description: 'Can create and manage courses' },
  { _id: 'minor_staff', name: 'Minor Staff', description: 'Limited administrative access' },
  { _id: 'student', name: 'Student', description: 'Course participant access' }
]

export function InviteMemberModal({ onClose, onAction, initialData, readOnlyFields = [] }: CreateMemberModalProps) {
  const [formData, setFormData] = useState({
    username: initialData?.username || '',
    email: initialData?.email || '',
    password: '',
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    role: initialData?.role || 'student',
    description: '',
    showOnLanding: false,
    isActive: true,
    studentRegistrationNo: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const isFormValid = formData.firstName.trim() !== '' &&
    formData.lastName.trim() !== '' &&
    formData.username.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.password.trim() !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!formData.username || !formData.password || !formData.email) {
      setError('Username, email, and password are required')
      return
    }

    setLoading(true)
    try {
      const result = await onAction(formData)
      if (result && result.error) {
        setError(result.error)
      } else {
        setSuccessMessage('Member account created successfully!')
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } catch (err: any) {
      setError(err?.message || err?.error || 'Failed to create member account')
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
              <UserPlus className="h-5 w-5 text-red-600" />
              <div>
                <CardTitle>Create Member Account</CardTitle>
                <CardDescription>
                  Directly create a new user account for your team
                </CardDescription>
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

            {successMessage && (
              <Alert className="animate-in fade-in slide-in-from-top-1 border-green-200 bg-green-50">
                <AlertDescription className="text-sm font-medium text-green-800">{successMessage}</AlertDescription>
              </Alert>
            )}

            {/* First Name / Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  required
                  readOnly={readOnlyFields.includes('firstName')}
                  className={readOnlyFields.includes('firstName') ? 'bg-gray-50' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  required
                  readOnly={readOnlyFields.includes('lastName')}
                  className={readOnlyFields.includes('lastName') ? 'bg-gray-50' : ''}
                />
              </div>
            </div>

            {/* Username / Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="john.doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  required
                  readOnly={readOnlyFields.includes('email')}
                  className={readOnlyFields.includes('email') ? 'bg-gray-50' : ''}
                />
              </div>
            </div>

            {/* Password / Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Set account password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">System Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYSTEM_ROLES.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Student Registration No (only for students) */}
            {formData.role === 'student' && (
              <div className="space-y-2">
                <Label htmlFor="studentRegistrationNo">Student Registration No</Label>
                <Input
                  id="studentRegistrationNo"
                  value={formData.studentRegistrationNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentRegistrationNo: e.target.value }))}
                  placeholder="Enter student registration number"
                />
              </div>
            )}

            {/* Professional Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Professional Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief biography for the lecture panel..."
                className="h-20 resize-none"
              />
            </div>

            {/* Show on Landing Page */}
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-white/10">
              <Checkbox
                id="showOnLanding"
                checked={formData.showOnLanding}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showOnLanding: checked === true }))}
              />
              <Label
                htmlFor="showOnLanding"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Display on Landing Page (Lecture Panel)
              </Label>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-white/10">
              <div>
                <Label htmlFor="isActive" className="text-sm font-medium leading-none cursor-pointer">
                  Active Status
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.isActive ? 'Member can access the system' : 'Member cannot access the system'}
                </p>
              </div>
              <Switch
                id="isActive"
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
              disabled={loading || !isFormValid} 
              className="bg-red-600 hover:bg-red-700 text-white disabled:bg-slate-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Member Account'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
