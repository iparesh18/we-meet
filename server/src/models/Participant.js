import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession', index: true },
    classCode: { type: String, required: true, index: true },
    name: { type: String, required: true },
    socketId: { type: String, default: null },
    livekitIdentity: { type: String, default: null },
    deviceId: { type: String, default: null, index: true },
    status: {
      type: String,
      enum: ['waiting', 'admitted', 'rejected', 'removed', 'left'],
      default: 'waiting',
      index: true,
    },
    requestedAt: { type: Date, default: Date.now },
    admittedAt: { type: Date, default: null },
    removedAt: { type: Date, default: null },
    leftAt: { type: Date, default: null },
  },
  { timestamps: true }
);

participantSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Participant = mongoose.model('Participant', participantSchema);
