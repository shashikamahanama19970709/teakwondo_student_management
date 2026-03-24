'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useOrganization } from '@/hooks/useOrganization'
import { Building2, Upload, Save, X } from 'lucide-react'
import { useNotify } from '@/lib/notify'
import { useSignedUrl } from '@/hooks/useSignedUrl'

export function OrganizationSettings() {
  const { success: notifySuccess, error: notifyError } = useNotify()
  const { organization, loading, refetch } = useOrganization()
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
    vision: '',
    mission: '',
    contactInfo: {
      facebookUrl: '',
      showFacebook: false,
      linkedinUrl: '',
      showLinkedin: false,
      whatsapp: '',
      showWhatsapp: false,
      email: '',
      showEmail: false,
      mobile: '',
      showMobile: false,
      landphone: '',
      showLandphone: false,
      address: '',
      showAddress: false,
      mapLocationUrl: '',
      showMapLocation: false
    }
  })
  
  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get signed URL for existing logo
  const { signedUrl: logoSignedUrl } = useSignedUrl(organization?.logo)


  // Helper function to invalidate caches and notify other components
  const invalidateOrganizationCache = useCallback(async () => {
    // Dispatch custom event to notify other components about settings change
    window.dispatchEvent(new CustomEvent('organization-settings-updated', {
      detail: { timestamp: Date.now() }
    }))
    
    // Force cache invalidation by updating window state
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        { ...window.history.state, cacheKey: Date.now() },
        ''
      )
    }
  }, [])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      if (!allowedTypes.includes(file.type)) {
        notifyError({
          title: 'Invalid File Type',
          message: 'Only JPEG, PNG, GIF, WebP, and SVG files are allowed.'
        })
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        notifyError({
          title: 'File Too Large',
          message: 'File size must be less than 5MB.'
        })
        return
      }
      
      setLogo(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogo(null)
    setLogoPreview(null)
  }



  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required'
    }

    if (formData.domain) {
      // Allow both plain domains (example.com) and full URLs (https://example.com)
      const domainRegex = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/
      if (!domainRegex.test(formData.domain)) {
        newErrors.domain = 'Please enter a valid domain name or URL'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if all required fields are filled
  const isFormValid = formData.name.trim() !== '' && (!formData.domain || /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/.test(formData.domain))

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        domain: organization.domain || '',
        description: organization.description || '',
        vision: organization.vision || '',
        mission: organization.mission || '',
        contactInfo: {
          facebookUrl: organization.contactInfo?.facebookUrl || '',
          showFacebook: organization.contactInfo?.showFacebook ?? false,
          linkedinUrl: organization.contactInfo?.linkedinUrl || '',
          showLinkedin: organization.contactInfo?.showLinkedin ?? false,
          whatsapp: organization.contactInfo?.whatsapp || '',
          showWhatsapp: organization.contactInfo?.showWhatsapp ?? false,
          email: organization.contactInfo?.email || '',
          showEmail: organization.contactInfo?.showEmail ?? false,
          mobile: organization.contactInfo?.mobile || '',
          showMobile: organization.contactInfo?.showMobile ?? false,
          landphone: organization.contactInfo?.landphone || '',
          showLandphone: organization.contactInfo?.showLandphone ?? false,
          address: organization.contactInfo?.address || '',
          showAddress: organization.contactInfo?.showAddress ?? false,
          mapLocationUrl: organization.contactInfo?.mapLocationUrl || '',
          showMapLocation: organization.contactInfo?.showMapLocation ?? false
        }
      })
    }
  }, [organization])


  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      let logoUrl: string | undefined = undefined

      // Upload logo to Backblaze with custom naming if a new one was selected
      if (logo) {
        const formData = new FormData()
        formData.append('file', logo)
        formData.append('type', 'companylogo') // Specify upload type for naming

        const uploadResponse = await fetch('/api/upload/custom', {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to upload logo')
        }

        const uploadResult = await uploadResponse.json()
        logoUrl = uploadResult.fileUrl
      }

      // Prepare organization data
      const organizationData = {
        ...formData,
        ...(logoUrl && { logo: logoUrl }) // Only include logo if a new one was uploaded
      }

      const response = await fetch('/api/organization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(organizationData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update organization')
      }

      // Clear logo state after successful upload
      if (logo) {
        setLogo(null)
        setLogoPreview(null)
      }

      // Clear cache and refetch organization data to show updated values
      await refetch()
      
      // Wait a bit for refetch to complete, then invalidate caches
      setTimeout(() => {
        invalidateOrganizationCache()
      }, 100)

      notifySuccess({
        title: 'Organization Updated',
        message: 'Organization settings have been updated successfully'
      })
    } catch (error) {
      notifyError({
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update organization settings'
      })
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Organization Information</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Update your organization's basic information and settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6 pt-0">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">Organization Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your Company Name"
              className={`text-xs sm:text-sm ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && (
              <p className="text-xs sm:text-sm text-red-600 break-words">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain" className="text-xs sm:text-sm">Website Domain (Optional)</Label>
            <Input
              id="domain"
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="yourcompany.com or https://yourcompany.com"
              className={`text-xs sm:text-sm ${errors.domain ? 'border-red-500' : ''}`}
            />
            <p className="text-xs text-muted-foreground break-words">
              Enter your website domain or full URL (e.g., example.com or https://example.com)
            </p>
            {errors.domain && (
              <p className="text-xs sm:text-sm text-red-600 break-words">{errors.domain}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs sm:text-sm">Organization Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your organization..."
              rows={3}
              className={`text-xs sm:text-sm min-h-[80px] ${errors.description ? 'border-red-500' : ''}`}
            />
            <p className="text-xs text-muted-foreground break-words">
              Provide a brief description of your organization for public display
            </p>
            {errors.description && (
              <p className="text-xs sm:text-sm text-red-600 break-words">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vision" className="text-xs sm:text-sm">Organization Vision</Label>
            <Textarea
              id="vision"
              value={formData.vision}
              onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
              placeholder="Describe your organization's vision..."
              rows={3}
              className={`text-xs sm:text-sm min-h-[80px] ${errors.vision ? 'border-red-500' : ''}`}
            />
            <p className="text-xs text-muted-foreground break-words">
              What is your organization's long-term vision and aspiration?
            </p>
            {errors.vision && (
              <p className="text-xs sm:text-sm text-red-600 break-words">{errors.vision}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mission" className="text-xs sm:text-sm">Organization Mission</Label>
            <Textarea
              id="mission"
              value={formData.mission}
              onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
              placeholder="Describe your organization's mission..."
              rows={3}
              className={`text-xs sm:text-sm min-h-[80px] ${errors.mission ? 'border-red-500' : ''}`}
            />
            <p className="text-xs text-muted-foreground break-words">
              What is your organization's purpose and primary objectives?
            </p>
            {errors.mission && (
              <p className="text-xs sm:text-sm text-red-600 break-words">{errors.mission}</p>
            )}
          </div>

          {/* Company Logo Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Company Logo</Label>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">
                Upload your company logo to brand your organization
              </p>
            </div>

            <div className="bg-card border rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {(logoPreview || logoSignedUrl) ? (
                  <div className="relative flex-shrink-0">
                    <img
                      src={logoPreview || logoSignedUrl}
                      alt="Company logo"
                      className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-lg border bg-background"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0"
                    >
                      <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <Label htmlFor="logo" className="text-xs sm:text-sm font-medium text-foreground">
                    Company Logo
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2 sm:mb-3 break-words">
                    Upload a logo that represents your company brand
                  </p>
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="logo"
                    className="cursor-pointer inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-border rounded-md text-xs sm:text-sm font-medium text-foreground bg-background hover:bg-accent transition-colors"
                  >
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Upload Logo
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">Max 5MB, PNG/JPG/SVG/WebP/GIF</p>
                </div>
              </div>
            </div>
          </div>

          {/* Public Contact & About Page Settings */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs sm:text-sm">About Page Contact & Social</Label>
              <p className="text-xs text-muted-foreground break-words">
                Configure contact details and social links for the public About page. Use the toggles to control which items are visible.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Facebook */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="facebookUrl" className="text-xs sm:text-sm">Facebook URL</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Show on About</span>
                    <Switch
                      checked={formData.contactInfo.showFacebook}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, showFacebook: checked }
                        }))
                      }
                    />
                  </div>
                </div>
                <Input
                  id="facebookUrl"
                  type="text"
                  value={formData.contactInfo.facebookUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, facebookUrl: e.target.value }
                    }))
                  }
                  placeholder="https://facebook.com/your-page"
                  className="text-xs sm:text-sm"
                />
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="linkedinUrl" className="text-xs sm:text-sm">LinkedIn URL</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Show on About</span>
                    <Switch
                      checked={formData.contactInfo.showLinkedin}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, showLinkedin: checked }
                        }))
                      }
                    />
                  </div>
                </div>
                <Input
                  id="linkedinUrl"
                  type="text"
                  value={formData.contactInfo.linkedinUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, linkedinUrl: e.target.value }
                    }))
                  }
                  placeholder="https://linkedin.com/company/your-org"
                  className="text-xs sm:text-sm"
                />
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="whatsapp" className="text-xs sm:text-sm">WhatsApp Number / Link</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Show on About</span>
                    <Switch
                      checked={formData.contactInfo.showWhatsapp}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, showWhatsapp: checked }
                        }))
                      }
                    />
                  </div>
                </div>
                <Input
                  id="whatsapp"
                  type="text"
                  value={formData.contactInfo.whatsapp}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, whatsapp: e.target.value }
                    }))
                  }
                  placeholder="e.g. +9471xxxxxxx or https://wa.me/"
                  className="text-xs sm:text-sm"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="contactEmail" className="text-xs sm:text-sm">Public Email</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Show on About</span>
                    <Switch
                      checked={formData.contactInfo.showEmail}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, showEmail: checked }
                        }))
                      }
                    />
                  </div>
                </div>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, email: e.target.value }
                    }))
                  }
                  placeholder="info@yourdomain.com"
                  className="text-xs sm:text-sm"
                />
              </div>

              {/* Mobile */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="mobile" className="text-xs sm:text-sm">Mobile Number</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Show on About</span>
                    <Switch
                      checked={formData.contactInfo.showMobile}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, showMobile: checked }
                        }))
                      }
                    />
                  </div>
                </div>
                <Input
                  id="mobile"
                  type="text"
                  value={formData.contactInfo.mobile}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, mobile: e.target.value }
                    }))
                  }
                  placeholder="Primary mobile number"
                  className="text-xs sm:text-sm"
                />
              </div>

              {/* Landphone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="landphone" className="text-xs sm:text-sm">Land Phone</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Show on About</span>
                    <Switch
                      checked={formData.contactInfo.showLandphone}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, showLandphone: checked }
                        }))
                      }
                    />
                  </div>
                </div>
                <Input
                  id="landphone"
                  type="text"
                  value={formData.contactInfo.landphone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, landphone: e.target.value }
                    }))
                  }
                  placeholder="Landline number (optional)"
                  className="text-xs sm:text-sm"
                />
              </div>

              {/* Address */}
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="address" className="text-xs sm:text-sm">Address</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Show on About</span>
                    <Switch
                      checked={formData.contactInfo.showAddress}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, showAddress: checked }
                        }))
                      }
                    />
                  </div>
                </div>
                <Textarea
                  id="address"
                  value={formData.contactInfo.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, address: e.target.value }
                    }))
                  }
                  rows={2}
                  placeholder="Street, city, region..."
                  className="text-xs sm:text-sm min-h-[60px]"
                />
              </div>

              {/* Google Map Location */}
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="mapLocationUrl" className="text-xs sm:text-sm">Google Map Location URL</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Show on About</span>
                    <Switch
                      checked={formData.contactInfo.showMapLocation}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactInfo: { ...prev.contactInfo, showMapLocation: checked }
                        }))
                      }
                    />
                  </div>
                </div>
                <Input
                  id="mapLocationUrl"
                  type="text"
                  value={formData.contactInfo.mapLocationUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, mapLocationUrl: e.target.value }
                    }))
                  }
                  placeholder="Google Maps embed or share URL for your location"
                  className="text-xs sm:text-sm"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
                  Paste the Google Maps embed URL or share link. This will be used to show an interactive map on the About page.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 sm:mt-8">
            <Button onClick={handleSave} disabled={saving || !isFormValid} className="flex items-center gap-2 w-full sm:w-auto text-xs sm:text-sm">
              {saving ? (
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              {saving ? 'Saving...' : 'Save Organization Information'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
