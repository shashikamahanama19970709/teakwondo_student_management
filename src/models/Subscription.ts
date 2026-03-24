
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscription extends Document {
  title: string;
  description: string;
  certificate_flag: boolean;
  price: number;
  duration_type: 'daily' | 'weekly' | 'monthly';
  duration_value: number;
  status: 'active' | 'inactive';
  created_at: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  certificate_flag: { type: Boolean, default: false },
  price: { type: Number, required: true },
  duration_type: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  duration_value: { type: Number, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  created_at: { type: Date, default: Date.now }
});

export const Subscription: Model<ISubscription> = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
