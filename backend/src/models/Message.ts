import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content?: string;
  image?: string;
  audio?: string;
  type: 'text' | 'image' | 'audio';
  isRead: boolean;
  
  // Reply functionality
  replyTo?: mongoose.Types.ObjectId;
  
  // Edit functionality
  isEdited: boolean;
  editedAt?: Date;
  
  // Reactions functionality
  reactions: Array<{
    user: mongoose.Types.ObjectId;
    emoji: string;
    createdAt: Date;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    audio: {
      type: String,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'audio'],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    
    // NEW: Reply
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    
    // NEW: Edit
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    
    // NEW: Reactions
    reactions: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', messageSchema);
