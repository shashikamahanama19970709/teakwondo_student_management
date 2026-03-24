
"use client"
// Admin Subscriptions Page (scaffold)
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Plus, Loader2, Sliders } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { SubscriptionCard, Subscription } from '@/components/subscriptions/SubscriptionCard'

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    certificate_flag: false,
    price: '',
    duration_type: 'monthly',
    duration_value: '',
    status: 'active'
  })
  const [submitting, setSubmitting] = useState(false)

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

  function handleEdit(sub: Subscription) {
    setForm({
      title: sub.title,
      description: sub.description,
      certificate_flag: sub.certificate_flag,
      price: String(sub.price),
      duration_type: sub.duration_type,
      duration_value: String(sub.duration_value),
      status: sub.status
    })
    setModalOpen(true)
  }

  function handleDelete(sub: Subscription) {
    // TODO: Implement delete logic
    alert('Delete not implemented in demo')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        duration_value: Number(form.duration_value)
      })
    })
    setSubmitting(false)
    setModalOpen(false)
    setForm({
      title: '',
      description: '',
      certificate_flag: false,
      price: '',
      duration_type: 'monthly',
      duration_value: '',
      status: 'active'
    })
    fetchSubscriptions()
  }

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Subscription
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sliders className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subscriptions found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by adding your first subscription
              </p>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Subscription
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map(sub => (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Modal for Add/Edit Subscription */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-semibold mb-4">Add Subscription</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.certificate_flag}
                    onChange={e => setForm(f => ({ ...f, certificate_flag: e.target.checked }))}
                    id="certificate_flag"
                  />
                  <label htmlFor="certificate_flag" className="text-sm">Certificate Available</label>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Price</label>
                    <input
                      type="number"
                      className="w-full border rounded px-3 py-2"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Duration Value</label>
                    <input
                      type="number"
                      className="w-full border rounded px-3 py-2"
                      value={form.duration_value}
                      onChange={e => setForm(f => ({ ...f, duration_value: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration Type</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={form.duration_type}
                    onChange={e => setForm(f => ({ ...f, duration_type: e.target.value as any }))}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
