import mongoose, { Document, Schema } from 'mongoose';

export interface IContactRequest extends Document {
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const contactRequestSchema = new Schema<IContactRequest>(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate requests
contactRequestSchema.index({ from: 1, to: 1 }, { unique: true });

export default mongoose.model<IContactRequest>('ContactRequest', contactRequestSchema);
