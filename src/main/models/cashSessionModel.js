const mongoose = require('mongoose');

const cashSessionSchema = new mongoose.Schema({
  store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  session_number: { type: Number, required: true },

  // device details
  device_id: { type: String, required: true },
  device_name: { type: String },

  // opened by (flat, snapshot from session)
  opened_by_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opened_by_email: { type: String },
  opened_by_name: { type: String },
  opening_time: { type: Date, required: true, default: Date.now },
  opening_cash: { type: Number, required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },

  //Closed by
  closed_by_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  closed_by_email: { type: String },
  closed_by_name: { type: String },
  closing_time: { type: Date },

  expected_cash: { type: Number },
  actual_cash: { type: Number },
  variance: { type: Number },
  variance_note: { type: String },

  //Cash summary
  total_sales_value: { type: Number, default: 0 },
  total_discounts: { type: Number, default: 0 },
  cash_payment: { type: Number, default: 0 },
  card_payment: { type: Number, default: 0 },
  bank_transfer_payment: { type: Number, default: 0 },
  cheque_payment: { type: Number, default: 0 },
  approved_by_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_by_email: { type: String }
}, { timestamps: true });

cashSessionSchema.index({ status: 1, device_id: 1 });

cashSessionSchema.index({ status: 1, opened_by_id: 1 });

cashSessionSchema.index({ store_id: 1, opening_time: 1 });

const CashSession = mongoose.model('CashSession', cashSessionSchema);

export default CashSession;
