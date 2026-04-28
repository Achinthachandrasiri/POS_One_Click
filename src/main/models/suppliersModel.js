import mongoose from 'mongoose'

const suppliersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      validate: {
        validator: (v) => /^0\d{9}$/.test(v),
        message: 'Mobile number must be 10 digits, numeric only, and start with 0'
      }
    },
    nicNumber: {
      type: String,
      required: [true, 'NIC number is required'],
      uppercase: true,
      trim: true,
      validate: {
        validator: (v) => /^\d{12}$|^\d{9}V$/i.test(v),
        message: 'NIC must be 12 digits or 10 characters with ending V'
      }
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'suppliers'
  }
)

suppliersSchema.index({ mobileNumber: 1 }, { unique: true, sparse: true, background: true })
suppliersSchema.index({ nicNumber: 1 }, { unique: true, sparse: true, background: true })

const Supplier = mongoose.model('Supplier', suppliersSchema)

export { Supplier }