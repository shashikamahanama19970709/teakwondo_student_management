// UserSubscription model
export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_id: string;
  start_date: Date;
  end_date: Date;
  status: 'active' | 'expired' | 'cancelled';
}
