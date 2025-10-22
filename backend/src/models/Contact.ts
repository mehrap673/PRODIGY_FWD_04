import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
  user: mongoose.Types.ObjectId;
  contact: mongoose.Types.ObjectId;
  createdAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contact: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
contactSchema.index({ user: 1, contact: 1 }, { unique: true });

export default mongoose.model<IContact>('Contact', contactSchema);
