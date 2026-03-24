import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Edit, Trash2, Sliders, CheckCircle, XCircle } from 'lucide-react'

export interface Subscription {
  id: string
  title: string
  description: string
  certificate_flag: boolean
  price: number
  duration_type: 'daily' | 'weekly' | 'monthly'
  duration_value: number
  status: 'active' | 'inactive'
  created_at: string
}


interface Props {
  subscription: Subscription
  onEdit?: (sub: Subscription) => void
  onDelete?: (sub: Subscription) => void
  hideActions?: boolean
}

export function SubscriptionCard({ subscription, onEdit, onDelete, hideActions }: Props) {
  return (
    <Card className="relative group">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="truncate text-lg">{subscription.title}</CardTitle>
          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
            {subscription.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-sm text-muted-foreground truncate">
          {subscription.description}
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="outline">{subscription.duration_value} {subscription.duration_type}</Badge>
          <Badge variant="outline">${subscription.price}</Badge>
          <Badge variant={subscription.certificate_flag ? 'default' : 'secondary'}>
            {subscription.certificate_flag ? <CheckCircle className="inline h-4 w-4 mr-1" /> : <XCircle className="inline h-4 w-4 mr-1" />}
            Certificate
          </Badge>
        </div>
        {!hideActions && (
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => onEdit && onEdit(subscription)}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete && onDelete(subscription)}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
