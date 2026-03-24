"use client"

import React, { useEffect, useState } from 'react'
import { SubscriptionCard, Subscription } from '@/components/subscriptions/SubscriptionCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Loader2, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LandingSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  async function fetchSubscriptions() {
    setLoading(true)
    const res = await fetch('/api/subscriptions')
    const data = await res.json()
    setSubscriptions(data.subscriptions || [])
    setLoading(false)
  }

  function handleSubscribe(sub: Subscription) {
    router.push(`/landing/subscriptions/payment?id=${sub.id}`)
  }

  return (
    <section id="subscriptions" className="bg-gradient-to-b from-[#eef2ff] to-[#f4f6fb] px-4 py-16 dark:from-[#050c1d] dark:to-[#030714] sm:px-6 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8 sm:mb-12">
          <Badge className="mb-4 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-[0.2em] bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800">
            Subscriptions
          </Badge>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl sm:mt-4 lg:text-4xl xl:text-5xl">
            Unlock Premium Learning
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-white/70 max-w-3xl mx-auto sm:mt-4 sm:text-base lg:text-lg">
            Access exclusive content, advanced modules, and certifications by subscribing to our premium plans.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-slate-600 text-sm dark:text-slate-300">
            <Loader2 className="animate-spin h-8 w-8 mr-2 text-teal-600" /> Loading subscriptions...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="h-10 w-10 text-slate-400 dark:text-slate-500 mb-3" />
            <h2 className="text-lg font-semibold mb-1 text-slate-900 dark:text-white">No subscriptions to show yet</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md">
              Subscription plans will appear here once published by the academy.
            </p>
          </div>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map(sub => (
              <div key={sub.id} className="relative group">
                <SubscriptionCard
                  subscription={sub}
                  hideActions
                />
                <Button
                  className="absolute right-4 bottom-4 font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-200/30 dark:shadow-teal-900/30 rounded-xl px-6 py-2"
                  onClick={() => handleSubscribe(sub)}
                  size="lg"
                >
                  Subscribe Now
                </Button>
              </div>
            ))}
          </section>
        )}
      </div>
    </section>
  )
}
