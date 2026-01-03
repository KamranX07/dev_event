import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => {
          // Basic email format validation
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to validate that the referenced event exists
BookingSchema.pre('save', async function (this: IBooking) {
  // Only validate on new bookings or if eventId is modified
  if (this.isNew || this.isModified('eventId')) {
    try {
      // Dynamically import Event model to avoid circular dependency
      const Event = mongoose.model('Event');
      const eventExists = await Event.findById(this.eventId);

      if (!eventExists) {
        throw new Error('Referenced event does not exist');
      }
    } catch (error) {
      if (error instanceof mongoose.Error.MissingSchemaError) {
        // Event model not registered yet, skip validation
        // This allows models to be registered in any order
        return;
      }
      // Re-throw all other errors (including "Referenced event does not exist")
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
});

// Create index on eventId for faster queries
BookingSchema.index({ eventId: 1 });

// Prevent model recompilation in development
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
