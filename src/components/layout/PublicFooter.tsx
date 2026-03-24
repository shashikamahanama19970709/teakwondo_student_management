import Link from 'next/link'
import {
    Heart,
    Facebook,
    Instagram,
    MessageCircle,
    Youtube,
    MapPin,
    Phone,
    Mail
} from 'lucide-react'

export function PublicFooter() {
    return (
        <footer className="bg-slate-900 text-white">
            <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 shadow-lg">
                                <Heart className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">Help Line Academy</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            Government-registered vocational training institute specializing in healthcare education.
                            TVEC Reg No: P03/0174 • SLFEB Approved.
                        </p>
                        <div className="flex space-x-4">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-red-400 transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-red-400 transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-red-400 transition-colors">
                                <MessageCircle className="h-5 w-5" />
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-red-400 transition-colors">
                                <Youtube className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/about" className="text-slate-300 hover:text-red-400 transition-colors">About Us</Link></li>
                            
                        </ul>
                    </div>

                    {/* Our Courses */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Our Courses</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/courses/caregiver-nvq-3" className="text-slate-300 hover:text-red-400 transition-colors">Caregiver NVQ Level 3</Link></li>
                            <li><Link href="/courses/caregiver-nvq-4" className="text-slate-300 hover:text-red-400 transition-colors">Caregiver NVQ Level 4</Link></li>
                            <li><Link href="/courses/israel-caregiver" className="text-slate-300 hover:text-red-400 transition-colors">Israel Caregiver Course</Link></li>
                            <li><Link href="/courses/first-aid-bls" className="text-slate-300 hover:text-red-400 transition-colors">First Aid & BLS</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Get In Touch</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-300">
                                    327/B2, Piliyandala Road,<br />
                                    Madagama Junction,<br />
                                    Bandaragama
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-red-500 flex-shrink-0" />
                                <a href="tel:+94715465556" className="text-slate-300 hover:text-red-400 transition-colors">
                                    +94 71 546 5556
                                </a>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-red-500 flex-shrink-0" />
                                <a href="mailto:info@helplineacademy.lk" className="text-slate-300 hover:text-red-400 transition-colors">
                                    info@helplineacademy.lk
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-800 mt-8 pt-8 text-center">
                    <p className="text-slate-400 text-sm">
                        2026 Help Line Academy | Powered by FlexNode | All rights reserved
                    </p>
                </div>
            </div>
        </footer>
    )
}
