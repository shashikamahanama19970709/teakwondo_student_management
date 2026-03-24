"use client"
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Loader2 } from 'lucide-react'

export default function SubscriptionPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subscriptionId = searchParams.get('id')
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (subscriptionId) {
      fetch(`/api/subscriptions?id=${subscriptionId}`)
        .then(res => res.json())
        .then(data => {
          setSubscription(data.subscription || null)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [subscriptionId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-10 w-10 text-teal-600 mb-4" />
        <div className="text-lg font-medium text-slate-700 dark:text-white">Loading subscription details...</div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-lg font-medium text-red-600 dark:text-red-400">Subscription not found.</div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto py-16 px-4">
      <Card className="shadow-lg border border-teal-200 dark:border-teal-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-teal-700 dark:text-teal-300 mb-2">{subscription.title}</CardTitle>
          <div className="text-slate-600 dark:text-slate-300 text-sm mb-2">{subscription.description}</div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-lg text-slate-900 dark:text-white">Price:</span>
            <span className="text-xl font-bold text-teal-600 dark:text-teal-400">${subscription.price}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-lg text-slate-900 dark:text-white">Duration:</span>
            <span className="text-base font-medium text-slate-700 dark:text-slate-200">{subscription.duration_value} {subscription.duration_type}</span>
          </div>
          <Button className="w-full mt-6" size="lg" onClick={() => alert('Payment integration coming soon!')}>
            Pay & Subscribe
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
