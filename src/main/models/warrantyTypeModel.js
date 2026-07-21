import mongoose from 'mongoose';

const { Schema } = mongoose;

const warrantyTypeSchema = new Schema(
  {
    warranty_name: {
      type: String,
      required: true,
      trim: true,
    },
    coverage_type: {
      type: String,
      enum: ['repair', 'replacement', 'refund', 'repair_or_replacement'],
      required: true,
    },
    terms: {
      type: String,
      trim: true,
      default: '',
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

const WarrantyType = mongoose.model('WarrantyType', warrantyTypeSchema);

export default WarrantyType;
