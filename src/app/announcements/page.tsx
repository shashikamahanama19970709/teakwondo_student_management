'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { PublicFooter } from '@/components/layout/PublicFooter'

const inquirySchema = z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters'),
    lastName: z.string().trim().min(1, 'Last name is required').max(50, 'Last name cannot exceed 50 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(9, 'Please enter a valid phone number'),
    message: z.string().min(10, 'Message is required'),
})

type InquiryFormData = z.infer<typeof inquirySchema>

// High-end Form Component (Recycled from Landing)
function InquiryForm({ announcementTitle, onSuccess, onCancel }: { announcementTitle: string; onSuccess: () => void; onCancel: () => void }) {
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string>('')

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isValid, touchedFields }
    } = useForm<InquiryFormData>({
        resolver: zodResolver(inquirySchema),
        mode: 'onChange'
    })

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^\d+]/g, '');
        if (!value.startsWith('+94') && value.length > 0) {
            if (value.startsWith('0')) {
                value = '+94' + value.substring(1);
            } else if (!value.startsWith('+')) {
                value = '+94' + value;
            }
        }
        let formatted = value;
        const match = value.match(/^(\+94)(\d{0,2})(\d{0,3})(\d{0,4})$/);
        if (match) {
            formatted = [match[1], match[2] ? ' ' + match[2] : '', match[3] ? ' ' + match[3] : '', match[4] ? ' ' + match[4] : ''].join('').trim();
        } else if (value.length > 12) {
            formatted = value.substring(0, 15);
        }
        setValue('phone', formatted, { shouldValidate: true, shouldDirty: true });
    }

    const onSubmitForm = async (data: InquiryFormData) => {
        setSubmitting(true)
        setSubmitError('')
        try {
            const response = await fetch('/api/announcements/inquiry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    announcementTitle
                }),
            })

            if (!response.ok) {
                if (response.status === 429) {
                    const errorData = await response.json()
                    setSubmitError(errorData.error || 'You have already submitted an inquiry in the last 24 hours')
                    return
                }
                throw new Error('Failed to submit inquiry')
            }

            toast.success('Inquiry submitted successfully! We will contact you soon.')
            onSuccess()
        } catch (error) {
            console.error('Error submitting inquiry:', error)
            toast.error('Failed to submit inquiry. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const inputClasses = "h-[44px] border border-[#E5E7EB] rounded-[8px] px-[12px] text-[14px] transition-all duration-200 focus:border-[#2563EB] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-white/10 dark:text-white dark:focus:border-[#7bffde] dark:focus:shadow-[0_0_0_3px_rgba(123,255,222,0.12)] w-full"
    const textareaClasses = "min-h-[120px] resize-y border border-[#E5E7EB] rounded-[8px] p-[12px] text-[14px] transition-all duration-200 focus:border-[#2563EB] focus:ring-0 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:border-white/10 dark:text-white dark:focus:border-[#7bffde] dark:focus:shadow-[0_0_0_3px_rgba(123,255,222,0.12)] w-full"
    const labelClasses = "text-[13px] font-medium text-slate-700 block mb-[6px] dark:text-slate-300"

    return (
        <form onSubmit={handleSubmit(onSubmitForm)} className="flex flex-col gap-[26px]">
            {submitError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[8px] p-4">
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium">{submitError}</p>
                </div>
            )}

            <div>
                <h3 className="text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-[0.08em] mb-[16px]">Your Contact Details</h3>
                <div className="flex flex-col gap-[18px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                        <div>
                            <Label htmlFor="firstName" className={labelClasses}>First Name <span className="text-red-500">*</span></Label>
                            <input id="firstName" {...register('firstName')} placeholder="Your first name" className={inputClasses} />
                            {errors.firstName && touchedFields.firstName && <p aria-live="polite" className="text-[12px] text-red-600 dark:text-red-400 mt-1.5 font-medium">{errors.firstName.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="lastName" className={labelClasses}>Last Name <span className="text-red-500">*</span></Label>
                            <input id="lastName" {...register('lastName')} placeholder="Your last name" className={inputClasses} />
                            {errors.lastName && touchedFields.lastName && <p aria-live="polite" className="text-[12px] text-red-600 dark:text-red-400 mt-1.5 font-medium">{errors.lastName.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
                        <div>
                            <Label htmlFor="email" className={labelClasses}>Email <span className="text-red-500">*</span></Label>
                            <input id="email" type="email" {...register('email')} placeholder="your.email@example.com" className={inputClasses} />
                            {errors.email && touchedFields.email && <p aria-live="polite" className="text-[12px] text-red-600 dark:text-red-400 mt-1.5 font-medium">{errors.email.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="phone" className={labelClasses}>Phone <span className="text-red-500">*</span></Label>
                            <input id="phone" {...register('phone')} onChange={handlePhoneChange} placeholder="+94 XX XXX XXXX" className={inputClasses} />
                            {errors.phone && touchedFields.phone && <p aria-live="polite" className="text-[12px] text-red-600 dark:text-red-400 mt-1.5 font-medium">{errors.phone.message}</p>}
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-[#F9FAFB] dark:bg-white/5 p-[14px] rounded-[8px]">
                <h3 className="text-[12px] font-semibold text-[#6B7280] dark:text-slate-400 uppercase tracking-[0.08em] mb-[16px]">Your Inquiry</h3>
                <div>
                    <Label htmlFor="message" className={labelClasses}>Message</Label>
                    <textarea id="message" {...register('message')} placeholder="Tell us about what you want to learn..." className={textareaClasses} />
                    {errors.message && touchedFields.message && <p aria-live="polite" className="text-[12px] text-red-600 dark:text-red-400 mt-1.5 font-medium">{errors.message.message}</p>}
                </div>
            </div>
            <div className="flex justify-end gap-[12px] pt-[8px] border-t border-[#E5E7EB] dark:border-white/10 mt-[4px]">
                <button type="button" onClick={onCancel} disabled={submitting} className="h-[44px] px-[20px] bg-transparent text-[#374151] hover:bg-slate-100 font-medium rounded-[8px] transition-colors dark:text-slate-300 dark:hover:bg-white/10 flex items-center justify-center outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={!isValid || submitting} className="h-[44px] px-[22px] bg-[#111827] text-white hover:bg-[#000000] font-medium rounded-[8px] transition-all disabled:bg-[#D1D5DB] disabled:text-white disabled:shadow-none disabled:cursor-not-allowed shadow-[0_4px_10px_rgba(0,0,0,0.08)] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 flex items-center justify-center outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#111827] dark:focus:ring-white dark:disabled:bg-slate-700 dark:disabled:text-slate-400">{submitting ? 'Submitting...' : 'Submit Inquiry'}</button>
            </div>
        </form>
    )
}

export default function PublicAnnouncementsPage() {
    const router = useRouter()
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showInquiryModal, setShowInquiryModal] = useState(false)
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null)

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const response = await fetch('/api/announcements/landing')
                if (response.ok) {
                    const data = await response.json()
                    
                    // Fetch signed URLs for each announcement
                    const announcementsWithSignedUrls = await Promise.all(
                        data.map(async (announcement: {
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
                        }) => {
                            if (!announcement.featureImageUrl) return announcement;

                            const res = await fetch(
                                `/api/files/signed-url?key=${encodeURIComponent(announcement.featureImageUrl)}`
                            );
                            const signed = await res.json();

                            return {
                                ...announcement,
                                signedUrl: signed.url,
                            };
                        })
                    );

                    setAnnouncements(announcementsWithSignedUrls)
                }
            } catch (error) {
                console.error('Error fetching announcements:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchAnnouncements()
    }, [])

    return (
        <div className="min-h-screen bg-[#f4f6fb] dark:bg-[#040714] text-slate-900 dark:text-white transition-colors">
            <PublicHeader />

            <main>
                {/* Hero Header */}
                <section className="relative overflow-hidden px-6 py-20 pb-12">
                    <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-br from-[#e8eeff] via-[#f4f8ff] to-[#ffffff] dark:from-[#0a1030] dark:via-[#050c1d] dark:to-[#040714] -z-10" />

                    <div className="mx-auto max-w-7xl">
                        <div className="space-y-4 max-w-2xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#0d9488] dark:text-[#7bffde]">Public Board</p>
                            <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl text-slate-900 dark:text-white">
                                Announcements & Programs
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-white/70">
                                Stay informed about the newest healthcare training opportunities, schedule changes, and globally recognized recruitment events.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Grid */}
                <section className="mx-auto max-w-7xl px-6 py-16 pt-0">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d9488]"></div>
                        </div>
                    ) : announcements.length > 0 ? (
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {announcements.map((announcement) => (
                                <div
                                    key={announcement._id}
                                    className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-2 hover:border-[#7bffde]/30 hover:shadow-[0_12px_40px_rgba(123,255,222,0.15)] dark:border-white/20 dark:bg-gradient-to-br dark:from-[#0f1329] dark:via-[#151c3d] dark:to-[#0a1f3b] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] dark:hover:border-[#7bffde]/40 flex flex-col h-full"
                                >
                                    <div className="aspect-video relative mb-4 rounded-xl overflow-hidden flex-shrink-0">
                                        <Image
                                            src={announcement.signedUrl || ''}
                                            alt={announcement.title}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>

                                    <div className="space-y-4 flex flex-col flex-grow">
                                        <div className="flex-grow space-y-3">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#0d9488] dark:group-hover:text-[#7bffde] transition-colors leading-snug">
                                                {announcement.title}
                                            </h3>
                                            <p className="text-[14px] text-slate-600 dark:text-white/80 line-clamp-3 leading-relaxed">
                                                {announcement.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-white/60 mb-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>{new Date(announcement.happeningDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</span>
                                        </div>

                                        <Button
                                            onClick={() => {
                                                setSelectedAnnouncement(announcement)
                                                setShowInquiryModal(true)
                                            }}
                                            className="w-full bg-[#0d9488] dark:bg-[#7bffde] text-white dark:text-slate-900 hover:bg-[#0f766e] dark:hover:bg-[#62f5cf] transition-colors h-[44px] rounded-xl font-semibold mt-auto"
                                        >
                                            Inquire Now
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-white/5 rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Announcements Available</h3>
                            <p className="text-slate-500 dark:text-slate-400">Check back later for updates and training programs.</p>
                        </div>
                    )}
                </section>
            </main>

            <Dialog open={showInquiryModal} onOpenChange={setShowInquiryModal}>
                <DialogContent className="max-w-[620px] w-full p-[24px_28px] rounded-[12px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] border-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-[4%] data-[state=open]:slide-in-from-top-[4%] dark:bg-slate-900 overflow-y-auto max-h-[90vh] transition-all duration-150 ease-out">
                    <DialogHeader className="mb-[24px] text-left">
                        <span className="text-[12px] tracking-[0.08em] text-[#6B7280] font-semibold uppercase block mb-[4px]">INQUIRE ABOUT</span>
                        <DialogTitle className="text-[20px] font-semibold text-[#111827] dark:text-white mt-0">{selectedAnnouncement?.title}</DialogTitle>
                    </DialogHeader>

                    <InquiryForm
                        announcementTitle={selectedAnnouncement?.title || ''}
                        onSuccess={() => {
                            setShowInquiryModal(false)
                            setSelectedAnnouncement(null)
                        }}
                        onCancel={() => {
                            setShowInquiryModal(false)
                            setSelectedAnnouncement(null)
                        }}
                    />
                </DialogContent>
            </Dialog>

            <PublicFooter />
        </div>
    )
}
