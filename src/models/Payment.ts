// Payment model
export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  status: 'success' | 'failed' | 'pending';
  created_at: Date;
}
