import mongoose from 'mongoose';

const { Schema } = mongoose;

const serviceSchema = new Schema(
  {
    service_name: {
      type: String,
      required: true,
      trim: true,
    },
    service_code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Categories',
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    cost: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    tax_rate: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    added_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

// Helpful indexes for filtering/search patterns used elsewhere in the app
serviceSchema.index({ store_id: 1, status: 1 });
serviceSchema.index({ category: 1 });

const Service = mongoose.model('Service', serviceSchema);

export default Service;
