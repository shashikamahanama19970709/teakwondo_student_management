'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Upload, X, Inbox, Loader2, ImagePlus, Eye, Calendar } from 'lucide-react'

interface Announcement {
  _id: string
  title: string
  description: string
  featureImageUrl: string
  signedUrl?: string
  happeningDate: string
  expireDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const announcementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().min(1, 'Description is required').max(2000, 'Description cannot exceed 2000 characters'),
  featureImageUrl: z.string().min(1, 'Feature image is required'),
  happeningDate: z.string().min(1, 'Please select dates'),
  expireDate: z.string().min(1, 'Please select dates')
}).refine((data) => {
  if (!data.expireDate || !data.happeningDate) return true;
  return new Date(data.expireDate) >= new Date(data.happeningDate);
}, {
  message: 'Expire date cannot be earlier than happening date',
  path: ['expireDate']
})

type AnnouncementFormData = z.infer<typeof announcementSchema>

export default function AnnouncementsAdminPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [localImagePreview, setLocalImagePreview] = useState<string>('')
  const [imagePreviewError, setImagePreviewError] = useState(false)
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([])
  const [editingImageSignedUrl, setEditingImageSignedUrl] = useState<string>('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    search: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isValidating },
    reset,
    setValue,
    watch,
    trigger
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    mode: 'onChange'
  })

  const watchedImageUrl = watch('featureImageUrl')
  const formValues = watch()

  // Custom validation that checks all required fields are filled
  const isFormValid = isValid && 
                     formValues.title?.trim() && 
                     formValues.description?.trim() && 
                     formValues.featureImageUrl?.trim() && 
                     formValues.happeningDate && 
                     formValues.expireDate && 
                     !uploadingImage && 
                     !submitting 

  useEffect(() => {
    fetchAllAnnouncements()
  }, [])

  useEffect(() => {
    setImagePreviewError(false)
  }, [watchedImageUrl])

  const fetchAllAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements?all=true')
      if (!response.ok) throw new Error('Failed to fetch announcements')
      const data = await response.json()

      const announcementsWithSignedUrls = await Promise.all(
  data.announcements.map(async (a: any) => {
    if (!a.featureImageUrl) return a;

    const res = await fetch(
      `/api/files/signed-url?key=${encodeURIComponent(a.featureImageUrl)}`
    );
    const signed = await res.json();

    return {
      ...a,
      signedUrl: signed.url,
    };
  })
);

setAllAnnouncements(announcementsWithSignedUrls);

      setPagination(prev => ({
        ...prev,
        total: announcementsWithSignedUrls.length,
        pages: Math.ceil(announcementsWithSignedUrls.length / prev.limit)
      }))
    } catch (error) {
      console.error('Error fetching announcements:', error)
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  // Get paginated announcements for display
  const paginatedAnnouncements = allAnnouncements.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  )

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and WEBP formats are supported')
        return
      }
      setSelectedImageFile(file)
      setLocalImagePreview(URL.createObjectURL(file))
      setUploadingImage(true)
      setImagePreviewError(false)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'announcements')

        const uploadRes = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json()
          throw new Error(errorData.error || 'Failed to upload image')
        }

        const uploadData = await uploadRes.json()
        setValue('featureImageUrl', uploadData.fileUrl, { shouldValidate: true })
        // Trigger validation to ensure form state updates
        await trigger()
        toast.success('Image uploaded successfully')
      } catch (error) {
        console.error('Error uploading image:', error)
        toast.error('Failed to upload image')
        setSelectedImageFile(null)
        setLocalImagePreview('')
      } finally {
        setUploadingImage(false)
      }
    }
  }

  const removeImage = async () => {
    setSelectedImageFile(null)
    setLocalImagePreview('')
    if (editingAnnouncement) {
      setValue('featureImageUrl', editingAnnouncement.featureImageUrl || '', { shouldValidate: true })
    } else {
      setValue('featureImageUrl', '', { shouldValidate: true })
    }
    await trigger()
    setImagePreviewError(false)
    const fileInput = document.getElementById('featureImageFile') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const onSubmit = async (data: AnnouncementFormData) => {
    setSubmitting(true)
    try {
      // The featureImageUrl is already set from the upload in handleFileChange
      // For editing without new image, it uses the existing one

      const payload = { ...data }
      const url = editingAnnouncement
        ? `/api/announcements/${editingAnnouncement._id}`
        : '/api/announcements'

      const method = editingAnnouncement ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save announcement')
      }

      toast.success(editingAnnouncement ? 'Announcement updated successfully' : 'Announcement created successfully')
      handleModalClose()
      fetchAllAnnouncements()
    } catch (error) {
      console.error('Error saving announcement:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save announcement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setValue('title', announcement.title)
    setValue('description', announcement.description)
    setValue('featureImageUrl', announcement.featureImageUrl || '')
    setValue('happeningDate', new Date(announcement.happeningDate).toISOString().split('T')[0])
    setValue('expireDate', new Date(announcement.expireDate).toISOString().split('T')[0])
    setLocalImagePreview('')
    setSelectedImageFile(null)
    setUploadingImage(false)
    setImagePreviewError(false)
    
    // Fetch signed URL for existing image
    if (announcement.featureImageUrl) {
      try {
        const res = await fetch(
          `/api/files/signed-url?key=${encodeURIComponent(announcement.featureImageUrl)}`
        );
        const signed = await res.json();
        setEditingImageSignedUrl(signed.url);
      } catch (error) {
        console.error('Error fetching signed URL for edit:', error);
        setEditingImageSignedUrl('');
      }
    } else {
      setEditingImageSignedUrl('');
    }
    
    await trigger()
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete announcement')

      toast.success('Announcement deleted successfully')
      fetchAllAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('Failed to delete announcement')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    reset()
    setEditingAnnouncement(null)
    setLocalImagePreview('')
    setSelectedImageFile(null)
    setUploadingImage(false)
    setImagePreviewError(false)
    setEditingImageSignedUrl('')
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">Loading...</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Announcements Management</h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingAnnouncement(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[720px] max-h-[90vh] overflow-hidden p-0 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] bg-white border-0 flex flex-col transition-all duration-180 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]">
              <DialogHeader className="px-7 py-6 border-b border-slate-100 flex-shrink-0">
                <DialogTitle className="text-[20px] font-semibold text-gray-900">
                  {editingAnnouncement ? 'Edit Announcement' : 'Add New Announcement'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                <div className="px-7 py-6 space-y-7 overflow-y-auto flex-1">

                  {/* SECTION A — Announcement Details */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.04em]">Announcement Details</h3>
                    <div>
                      <Label htmlFor="title" className="text-[13px] font-medium text-gray-700 block mb-1.5">Title <span className="text-red-500">*</span></Label>
                      <Input
                        id="title"
                        {...register('title')}
                        placeholder="Enter announcement title"
                        className={`h-10 px-3 border border-gray-200 rounded-lg text-[14px] transition-all duration-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12 ${errors.title ? 'border-red-400 focus:border-red-400 focus:ring-red-400/12' : ''}`}
                      />
                      {errors.title && (
                        <p className="text-[12px] text-red-600 mt-1.5">{errors.title.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-[13px] font-medium text-gray-700 block mb-1.5">Description <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="description"
                        {...register('description')}
                        placeholder="Enter announcement description"
                        className={`min-h-[96px] resize-y px-3 py-2 border border-gray-200 rounded-lg text-[14px] transition-all duration-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12 ${errors.description ? 'border-red-400 focus:border-red-400 focus:ring-red-400/12' : ''}`}
                      />
                      {errors.description && (
                        <p className="text-[12px] text-red-600 mt-1.5">{errors.description.message}</p>
                      )}
                    </div>
                  </div>

                  {/* SECTION B — Feature Image */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.04em]">Feature Image</h3>
                    <div>
                      {!(localImagePreview || (watchedImageUrl && watchedImageUrl.trim() !== '')) || imagePreviewError ? (
                        <Label
                          htmlFor="featureImageFile"
                          className="flex flex-col items-center justify-center w-full h-[140px] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImagePlus className="w-8 h-8 mb-3 text-gray-400" />
                            <p className="text-sm text-gray-600 font-medium tracking-tight">Drag & drop image here or <span className="text-blue-600">Browse</span></p>
                            <p className="text-[12px] text-gray-500 mt-1">Supports JPG, PNG, WEBP (Max 5MB)</p>
                          </div>
                          <Input
                            id="featureImageFile"
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </Label>
                      ) : (
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-[#F9FAFB] transition-all duration-180 animate-in fade-in zoom-in-95">
                          <div className="flex items-center space-x-4">
                            <div className="relative w-[100px] h-[75px] rounded border border-gray-200 bg-white overflow-hidden shadow-sm">
                              <img
                                src={localImagePreview || editingImageSignedUrl || watchedImageUrl || ''}
                                alt="Preview"
                                className="w-full h-full object-contain"
                                onError={() => setImagePreviewError(true)}
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-medium text-gray-800">Image Selected</span>
                              <span className="text-[12px] text-gray-500 mt-0.5">Will be uploaded on save</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Label
                              htmlFor="featureImageFile"
                              className="cursor-pointer text-[13px] font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-[6px] transition-colors shadow-sm"
                            >
                              Replace
                              <Input
                                id="featureImageFile"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors duration-200 px-3 py-1.5 h-auto text-[13px] font-medium rounded-[6px]"
                              onClick={removeImage}
                            >
                              <Trash2 className="w-[14px] h-[14px] mr-1.5" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}

                      {imagePreviewError && (
                        <div className="mt-2 text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-100">
                          Failed to load image. Please try uploading a different file.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION C — Schedule */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.04em]">Schedule</h3>
                    <div className="bg-[#F9FAFB] p-4 rounded-lg border border-gray-100">
                      <p className="text-[12px] text-gray-500 mb-4 font-normal">Select how long this announcement should remain visible.</p>

                      <div className="grid grid-cols-2 gap-[18px]">
                        <div>
                          <Label htmlFor="happeningDate" className="text-[13px] font-medium text-gray-700 block mb-1.5">Happening Date <span className="text-red-500">*</span></Label>
                          <Input
                            id="happeningDate"
                            type="date"
                            {...register('happeningDate')}
                            className={`h-10 px-3 border border-gray-200 rounded-lg text-[14px] bg-white transition-all duration-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12 ${errors.happeningDate ? 'border-red-400 focus:border-red-400 focus:ring-red-400/12' : ''}`}
                          />
                          {errors.happeningDate && (
                            <p className="text-[12px] text-red-600 mt-1.5">{errors.happeningDate.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="expireDate" className="text-[13px] font-medium text-gray-700 block mb-1.5">Expire Date <span className="text-red-500">*</span></Label>
                          <Input
                            id="expireDate"
                            type="date"
                            {...register('expireDate')}
                            className={`h-10 px-3 border border-gray-200 rounded-lg text-[14px] bg-white transition-all duration-200 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12 ${errors.expireDate ? 'border-red-400 focus:border-red-400 focus:ring-red-400/12' : ''}`}
                          />
                          {errors.expireDate && (
                            <p className="text-[12px] text-red-600 mt-1.5">{errors.expireDate.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* FOOTER ACTIONS */}
                <div className="sticky bottom-0 bg-white border-t border-slate-100 flex justify-end space-x-3 px-7 py-4 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleModalClose}
                    disabled={submitting || uploadingImage}
                    className="text-[#374151] bg-transparent hover:bg-gray-100 h-10 px-5 font-medium text-[14px] rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isFormValid}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:bg-[#CBD5E1] disabled:text-gray-500 disabled:border-transparent disabled:cursor-not-allowed h-10 px-[20px] font-medium text-[14px] rounded-lg transition-all duration-200 shadow-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : uploadingImage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : editingAnnouncement ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thumbnail</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Happening Date</TableHead>
                <TableHead>Expire Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAnnouncements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 space-y-4">
                      <div className="bg-gray-50 p-6 rounded-full">
                        <Inbox className="w-12 h-12 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">No Announcements Found</h3>
                        <p className="text-sm mt-1">There are currently no announcements to display.</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            setEditingAnnouncement(null);
                            setIsModalOpen(true);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create your first announcement
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAnnouncements.map((announcement) => (
                  <TableRow key={announcement._id}>
                    <TableCell>
                      {announcement.signedUrl ? (
                        <div className="w-[100px] h-[75px] rounded border border-gray-200 bg-white overflow-hidden shadow-sm">
                          <img
                            src={announcement.signedUrl}
                            alt={announcement.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-[100px] h-[75px] rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                          <ImagePlus className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="font-medium">{announcement.title}</TableCell>
                    <TableCell>{new Date(announcement.happeningDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(announcement.expireDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${announcement.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {announcement.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setViewingAnnouncement(announcement)
                            setIsViewModalOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{announcement.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(announcement._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="px-4 py-2">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Read Mode Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[480px] p-0 overflow-hidden border-0 bg-transparent shadow-none">
          {viewingAnnouncement && (
            <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl dark:border-white/20 dark:bg-slate-900 transition-all">
              {viewingAnnouncement.featureImageUrl ? (
                <div className="aspect-video relative w-full overflow-hidden bg-slate-100">
                  <img
                    src={viewingAnnouncement.signedUrl || ''}
                    alt={viewingAnnouncement.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-white/10">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{viewingAnnouncement.title}</h2>
                </div>
              )}

              <div className="p-6">
                {viewingAnnouncement.featureImageUrl && (
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{viewingAnnouncement.title}</h2>
                )}

                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-white/60 mb-6 pb-6 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2 font-medium">
                    <Calendar className="h-4 w-4 text-[#0d9488] dark:text-[#7bffde]" />
                    <span>Happens on: {new Date(viewingAnnouncement.happeningDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${viewingAnnouncement.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {viewingAnnouncement.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-slate-600 dark:text-white/80 leading-relaxed whitespace-pre-wrap text-[15px]">
                    {viewingAnnouncement.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 flex justify-end">
                  <Button
                    onClick={() => setIsViewModalOpen(false)}
                    variant="outline"
                    className="px-6 rounded-full font-medium bg-slate-50 hover:bg-slate-100 border-transparent hover:border-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:hover:border-white/20 transition-all"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </MainLayout>
  )
}