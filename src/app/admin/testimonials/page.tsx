'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
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
import { Plus, Edit, Trash2, Upload, X, Inbox, Loader2, ImagePlus, Quote } from 'lucide-react'

interface Testimonial {
    _id: string
    name: string
    role: string
    message: string
    profile_picture: string
    signedUrl?: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

const testimonialSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
    role: z.string().trim().min(1, 'Role is required').max(100, 'Role cannot exceed 100 characters'),
    message: z.string().trim()
        .min(1, 'Message is required')
        .refine((val: string) => {
            const wordCount = val.trim().split(/\s+/).filter((word: string) => word.length > 0).length
            return wordCount <= 100
        }, {
            message: 'Message cannot exceed 100 words'
        })
        .refine((val) => !val.startsWith('"') || !val.endsWith('"'), {
            message: 'Message cannot start and end with double quotes'
        })
        .refine((val) => !(val.startsWith('"') && val.endsWith('"')), {
            message: 'Double quotes are automatically added by the system'
        }),
    profile_picture: z.string().min(1, 'Profile picture is required'),
    isActive: z.boolean().default(true)
})

type TestimonialFormData = z.infer<typeof testimonialSchema>

export default function TestimonialsAdminPage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
    const [localImagePreview, setLocalImagePreview] = useState<string>('')
    const [uploadingImage, setUploadingImage] = useState(false)
    const [editingImageSignedUrl, setEditingImageSignedUrl] = useState<string>('')
    const [messageWordCount, setMessageWordCount] = useState(0)

    const inputClasses = "h-[44px] border border-[#E5E7EB] rounded-[8px] px-[12px] text-[14px] transition-all duration-200 focus:border-[#2563EB] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-white/10 dark:text-white dark:focus:border-[#7bffde] dark:focus:shadow-[0_0_0_3px_rgba(123,255,222,0.12)] w-full"
    const textareaClasses = "min-h-[120px] resize-y border border-[#E5E7EB] rounded-[8px] p-[12px] text-[14px] transition-all duration-200 focus:border-[#2563EB] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-white/10 dark:text-white dark:focus:border-[#7bffde] dark:focus:shadow-[0_0_0_3px_rgba(123,255,222,0.12)] w-full"
    const labelClasses = "text-[13px] font-medium text-slate-700 block mb-[6px] dark:text-slate-300"

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset,
        setValue,
        watch,
        trigger
    } = useForm<TestimonialFormData>({
        resolver: zodResolver(testimonialSchema),
        mode: 'onChange',
        defaultValues: {
            isActive: true
        }
    })

    // Watch message field to update word count
    const messageValue = watch('message', '')
    
    useEffect(() => {
        const wordCount = messageValue.trim().split(/\s+/).filter((word: string) => word.length > 0).length
        setMessageWordCount(wordCount)
    }, [messageValue])

    useEffect(() => {
        fetchTestimonials()
    }, [])

    const fetchTestimonials = async () => {
        try {
            const response = await fetch('/api/testimonials?all=true')
            if (!response.ok) throw new Error('Failed to fetch testimonials')
            const data = await response.json()

            // For each testimonial with a profile_picture, fetch a signed URL
            const testimonialsWithSignedUrls = await Promise.all(
                data.testimonials.map(async (t: any) => {
                    if (!t.profile_picture) return t;
                    try {
                        const res = await fetch(`/api/files/signed-url?key=${encodeURIComponent(t.profile_picture)}`);
                        const signed = await res.json();
                        return { ...t, signedUrl: signed.url };
                    } catch (err) {
                        console.error('Failed to fetch signed URL for testimonial:', t.name, err);
                        return { ...t, signedUrl: '' };
                    }
                })
            );
            setTestimonials(testimonialsWithSignedUrls);
        } catch (error) {
            console.error('Error fetching testimonials:', error)
            toast.error('Failed to load testimonials')
        } finally {
            setLoading(false)
        }
    }

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

            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('folder', 'testimonials')

                const uploadRes = await fetch('/api/upload/image', {
                    method: 'POST',
                    body: formData,
                })

                if (!uploadRes.ok) {
                    throw new Error('Failed to upload image')
                }

                const uploadData = await uploadRes.json()
                setValue('profile_picture', uploadData.fileUrl, { shouldValidate: true })
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

    const removeImage = () => {
        setSelectedImageFile(null)
        setLocalImagePreview('')
        setValue('profile_picture', editingTestimonial?.profile_picture || '', { shouldValidate: true })
    }

    const onSubmit = async (data: TestimonialFormData) => {
        setSubmitting(true)
        try {
            // The profile_picture is already set from the upload in handleFileChange
            // For editing without new image, it uses the existing one

            const payload = data
            const url = editingTestimonial
                ? `/api/testimonials/${editingTestimonial._id}`
                : '/api/testimonials'

            const method = editingTestimonial ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                throw new Error('Failed to save testimonial')
            }

            toast.success(editingTestimonial ? 'Testimonial updated successfully' : 'Testimonial created successfully')
            handleModalClose()
            fetchTestimonials()
        } catch (error) {
            console.error('Error saving testimonial:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to save testimonial')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditTestimonial = async (testimonial: Testimonial) => {
        setEditingTestimonial(testimonial)
        setValue('name', testimonial.name)
        setValue('role', testimonial.role)
        setValue('message', testimonial.message)
        setValue('profile_picture', testimonial.profile_picture)
        setValue('isActive', testimonial.isActive)
        const wordCount = testimonial.message.trim().split(/\s+/).filter((word: string) => word.length > 0).length
        setMessageWordCount(wordCount)
        setLocalImagePreview('')
        setSelectedImageFile(null)
        setUploadingImage(false)
        
        // Fetch signed URL for existing image
        if (testimonial.profile_picture) {
            try {
                const res = await fetch(
                    `/api/files/signed-url?key=${encodeURIComponent(testimonial.profile_picture)}`
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
        
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/testimonials/${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Failed to delete testimonial')

            toast.success('Testimonial deleted successfully')
            fetchTestimonials()
        } catch (error) {
            console.error('Error deleting testimonial:', error)
            toast.error('Failed to delete testimonial')
        }
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        reset()
        setEditingTestimonial(null)
        setLocalImagePreview('')
        setSelectedImageFile(null)
        setUploadingImage(false)
        setEditingImageSignedUrl('')
        setMessageWordCount(0)
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
                    <h1 className="text-3xl font-bold">Testimonials Management</h1>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => {
                                setEditingTestimonial(null)
                                reset({ isActive: true })
                                setUploadingImage(false)
                            }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Testimonial
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[620px] w-full p-[24px_28px] rounded-[12px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] border-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-[4%] data-[state=open]:slide-in-from-top-[4%] dark:bg-slate-900 max-h-[90vh] transition-all duration-150 ease-out flex flex-col">
                            <DialogHeader className="flex-shrink-0 mb-[24px] text-left">
                                <span className="text-[12px] tracking-[0.08em] text-[#6B7280] font-semibold uppercase block mb-[4px]">TESTIMONIAL MANAGEMENT</span>
                                <DialogTitle className="text-[20px] font-semibold text-[#111827] dark:text-white mt-0">{editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto">
                                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[26px]">
                                    <div className="grid grid-cols-2 gap-[18px]">
                                        <div>
                                            <Label htmlFor="name" className={labelClasses}>Name</Label>
                                            <input id="name" {...register('name')} placeholder="e.g. John Doe" className={inputClasses} />
                                            {errors.name && <p className="text-[12px] text-red-500 mt-1.5 font-medium">{errors.name.message}</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor="role" className={labelClasses}>Role</Label>
                                            <input id="role" {...register('role')} placeholder="e.g. Student, Parent" className={inputClasses} />
                                            {errors.role && <p className="text-[12px] text-red-500 mt-1.5 font-medium">{errors.role.message}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="message" className={labelClasses}>Message</Label>
                                        <div className="relative">
                                            <textarea 
                                                id="message" 
                                                {...register('message', {
                                                    onChange: (e) => {
                                                        const wordCount = e.target.value.trim().split(/\s+/).filter((word: string) => word.length > 0).length
                                                        setMessageWordCount(wordCount)
                                                        trigger('message')
                                                    }
                                                })} 
                                                placeholder="Enter the testimonial message..." 
                                                className={`${textareaClasses} pr-[60px]`}
                                            />
                                            <div className={`absolute bottom-3 right-3 text-[11px] font-medium ${
                                                messageWordCount > 90 ? 'text-orange-500' : 
                                                messageWordCount === 100 ? 'text-red-500' : 
                                                'text-gray-400'
                                            }`}>
                                                {messageWordCount}/100 words
                                            </div>
                                        </div>
                                        {errors.message && <p className="text-[12px] text-red-500 mt-1.5 font-medium">{errors.message.message}</p>}
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                            Maximum 100 words. Double quotes are automatically added by the system.
                                        </p>
                                    </div>

                                <div>
                                    <Label className={labelClasses}>Profile Image</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-24 w-24 rounded-[12px] border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-slate-800 dark:border-white/10">
                                            {(localImagePreview || editingTestimonial?.profile_picture) ? (
                                                <Image
                                                    src={localImagePreview || editingImageSignedUrl || ''}
                                                    alt="Preview"
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <ImagePlus className="h-10 w-10 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-[40px] px-[16px] rounded-[8px]"
                                                onClick={() => document.getElementById('image-upload')?.click()}
                                                disabled={uploadingImage}
                                            >
                                                {uploadingImage ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        {(localImagePreview || editingTestimonial?.profile_picture) ? 'Change Image' : 'Upload Image'}
                                                    </>
                                                )}
                                            </Button>
                                            <input
                                                id="image-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileChange}
                                            />
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400">JPG, PNG or WEBP. Max 2MB.</p>
                                        </div>
                                    </div>
                                    {errors.profile_picture && <p className="text-[12px] text-red-500 mt-1.5 font-medium">{errors.profile_picture.message}</p>}
                                </div>

                                <div className="flex items-center space-x-2 bg-[#F9FAFB] dark:bg-white/5 p-[14px] rounded-[8px]">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        {...register('isActive')}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <Label htmlFor="isActive" className="text-[14px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer">Show on Landing Page</Label>
                                </div>
                                </form>
                            </div>

                            <div className="flex-shrink-0 flex justify-end gap-[12px] pt-[8px] border-t border-[#E5E7EB] dark:border-white/10 mt-[4px]">
                                <Button type="button" variant="outline" className="h-[44px] px-[20px] rounded-[8px]" onClick={handleModalClose}>Cancel</Button>
                                <Button
                                    type="submit"
                                    disabled={submitting || !isValid || uploadingImage || (!editingTestimonial && !watch('profile_picture'))}
                                    className="h-[44px] px-[24px] bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-[8px] transition-all duration-200 flex items-center justify-center dark:bg-[#0d9488] dark:hover:bg-[#0f766e]"
                                    onClick={handleSubmit(onSubmit)}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {editingTestimonial ? 'UPDATING...' : 'CREATING...'}
                                        </>
                                    ) : (
                                        <>
                                            {editingTestimonial ? 'UPDATE' : 'CREATE'} TESTIMONIAL
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {testimonials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-gray-50">
                        <Inbox className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-gray-500">No testimonials found. Add your first one!</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="max-w-xs">Message</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {testimonials.map((testimonial, index) => {
                                    return (
                                    <TableRow key={testimonial._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-10 w-10 rounded-full overflow-hidden">
                                                    {testimonial.signedUrl ? (
                                                        <img
                                                            src={testimonial.signedUrl}
                                                            alt={testimonial.name}
                                                            className="object-cover w-full h-full"
                                                            onError={() => console.error(`Failed to load image for ${testimonial.name}:`, testimonial.signedUrl)}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                            <ImagePlus className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-medium">{testimonial.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{testimonial.role}</TableCell>
                                        <TableCell className="max-w-xs truncate">{testimonial.message}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${testimonial.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {testimonial.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleEditTestimonial(testimonial)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the testimonial.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(testimonial._id)} className="bg-red-500 hover:bg-red-600">
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </MainLayout>
    )
}
