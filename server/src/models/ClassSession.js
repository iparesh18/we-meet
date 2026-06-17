import mongoose from 'mongoose';

const classSessionSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Swastik Class' },
    classCode: { type: String, required: true, unique: true, index: true },
    roomName: { type: String, required: true },
    hostKey: { type: String, required: true },
    inviteLink: { type: String, required: true },
    privateHostLink: { type: String, required: true },
    isLive: { type: Boolean, default: true },
    isLocked: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

classSessionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ClassSession = mongoose.model('ClassSession', classSessionSchema);
