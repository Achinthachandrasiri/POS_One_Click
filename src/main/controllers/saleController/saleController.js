import mongoose from 'mongoose'
import Sale from '../../models/saleModel'
import CashSession from '../../models/cashSessionModel'
import { Customer } from '../../models/customersModel'
import {
  generateInvoiceNumber,
  getNextSaleNumberOfDay,
  verifyAndRecomputeSale,
  validatePaymentSum,
  buildReceiptPayload
} from './saleHelpers'
import { deductStockForItems, reverseStockForAppliedItems } from './saleStockService'
import { validateSaleFields } from './saleValidation'

const PAYMENT_TYPE_TO_CASH_SESSION_FIELD = {
  cash: 'cash_payment',
  card: 'card_payment',
  bank_transfer: 'bank_transfer_payment',
  cheque: 'cheque_payment'
}

const withSession = (query, session) => (session ? query.session(session) : query)

const makeSaleError = (code, message) => {
  const error = new Error(message)
  error.saleErrorCode = code
  return error
}

const isTransactionsUnsupportedError = (error) =>
  typeof error?.message === 'string' &&
  error.message.includes('Transaction numbers are only allowed on a replica set member or mongos')

const executeSaleCreation = async (data, session) => {
  const appliedStock = []

  try {
    const cashSession = await withSession(CashSession.findById(data.cash_session_id), session)
    if (!cashSession || cashSession.status !== 'open') {
      throw makeSaleError('CASH_SESSION_INVALID', 'Cash session is not open or does not exist.')
    }
    if (String(cashSession.device_id) !== String(data.device_id)) {
      throw makeSaleError('DEVICE_MISMATCH', 'This cash session does not belong to this device.')
    }

    const cashierName = cashSession.opened_by_name

    let customer = null
    if (data.customer_id) {
      customer = await withSession(Customer.findById(data.customer_id), session)
      if (!customer) {
        throw makeSaleError('CUSTOMER_NOT_FOUND', 'Customer not found.')
      }
    }

    // Product lines never carry a per-line store_id from the renderer (the
    // cart only tracks a single sale-wide store from the store dropdown) —
    // inject it here before it hits schema validation, rather than leaving
    // it unset and failing the required-field check on save.
    const itemsWithStore = (data.items || []).map((item) =>
      item.product_id ? { ...item, store_id: item.store_id || data.store_id } : item
    )

    // The frontend (saleCalculations.js) is the single source of truth for
    // the money math the cashier saw on screen. Rather than maintain a
    // second, divergent formula here, this recomputes the same formula
    // server-side and VERIFIES the submitted figures match — catching both
    // tampering and any future drift between frontend/backend logic, without
    // ever trusting client-submitted subtotal/profit/total figures directly.
    const verification = verifyAndRecomputeSale({ ...data, items: itemsWithStore })
    if (!verification.valid) {
      throw makeSaleError(
        'TOTALS_MISMATCH',
        `Submitted totals do not match recalculated totals (${verification.mismatches.join(', ')}). Please refresh and try again.`
      )
    }

    const lineItems = verification.recomputedItems
    const { subtotal, totalProfit, totalAmount, discountAmount } = verification.totals

    const stockResult = await deductStockForItems(lineItems, session)
    if (!stockResult.success) {
      appliedStock.push(...stockResult.applied)
      throw makeSaleError('STOCK_ERROR', stockResult.error)
    }
    appliedStock.push(...stockResult.applied)

    const paymentCheck = validatePaymentSum(data.payments, totalAmount, data.payment_status)
    if (!paymentCheck.valid) {
      throw makeSaleError('PAYMENT_MISMATCH', paymentCheck.error)
    }

    const amountGiven = data.amount_given || 0
    const changeAmount = amountGiven > totalAmount ? amountGiven - totalAmount : 0
    const now = new Date()

    const invoiceNumber = generateInvoiceNumber(data.store_code || 'STR')
    const saleNumberOfDay = await getNextSaleNumberOfDay(data.store_id, now, session)

    const saleDocs = await Sale.create(
      [
        {
          invoice_number: invoiceNumber,
          sale_number_of_day: saleNumberOfDay,
          sale_date: now,
          device_timestamp: data.device_timestamp || now,
          time_source: data.time_source || 'device',
          store_id: data.store_id,
          device_id: data.device_id,
          cash_session_id: data.cash_session_id,
          cashier_id: cashSession.opened_by_id,
          cashier_name: cashierName,
          customer_id: customer ? customer._id : null,
          customer_name: customer ? customer.name : null,
          discount: data.discount,
          service_charge: data.service_charge,
          special_discount: data.special_discount,
          delivery_fee: data.delivery_fee || 0,
          payment_status: data.payment_status,
          payments: data.payments || [],
          credit_recovery_deadline: data.credit_recovery_deadline || null,
          note: data.note || '',
          subtotal,
          total_amount: totalAmount,
          amount_given: amountGiven,
          change_amount: changeAmount,
          due_amount: paymentCheck.dueAmount || 0,
          total_profit: totalProfit,
          items: lineItems
        }
      ],
      { session: session || undefined }
    )
    const sale = saleDocs[0]

    if (customer && paymentCheck.dueAmount > 0) {
      customer.due_amount = (customer.due_amount || 0) + paymentCheck.dueAmount
      await customer.save({ session: session || undefined })
    }

    const cashDeltaByType = {}
    ;(data.payments || []).forEach((p) => {
      const field = PAYMENT_TYPE_TO_CASH_SESSION_FIELD[p.type]
      if (field) {
        cashDeltaByType[field] = (cashDeltaByType[field] || 0) + (p.value || 0)
      }
    })
    Object.entries(cashDeltaByType).forEach(([field, amount]) => {
      cashSession[field] = (cashSession[field] || 0) + amount
    })
    cashSession.total_sales_value = (cashSession.total_sales_value || 0) + totalAmount
    cashSession.total_discounts = (cashSession.total_discounts || 0) + discountAmount
    await cashSession.save({ session: session || undefined })

    // Serialize ONCE here and reuse the plain object for both `sale` and
    // the receipt. buildReceiptPayload was previously called with the raw
    // Mongoose `sale` document — fields like discount/service_charge/
    // special_discount/payments are Mongoose subdocument instances (they
    // carry prototype methods, not plain objects), and Electron's IPC
    // structured-clone algorithm cannot serialize a class instance across
    // the bridge. That's what "Error: An object could not be cloned" was:
    // not a data problem, just handing a non-plain object to structured
    // clone. Passing the already-JSON-flattened `plainSale` into
    // buildReceiptPayload instead guarantees every field it reads is a
    // plain object/array/primitive by the time it crosses the IPC bridge.
    const plainSale = JSON.parse(JSON.stringify(sale))

    return {
      success: true,
      message: 'Sale completed successfully',
      sale: plainSale,
      receipt: buildReceiptPayload(plainSale)
    }
  } catch (error) {
    if (!session && appliedStock.length > 0) {
      await reverseStockForAppliedItems(appliedStock, null)
    }
    throw error
  }
}

const translateSaleError = (error) => {
  console.error('Create sale error:', error)

  if (error.saleErrorCode) {
    return { success: false, error: error.message }
  }
  if (error.code === 11000) {
    return { success: false, error: 'Invoice number collision, please try again.' }
  }
  if (error.name === 'ValidationError') {
    const fieldErrors = {}
    Object.keys(error.errors).forEach((key) => {
      fieldErrors[key] = error.errors[key].message
    })
    return { success: false, fieldErrors }
  }
  return { success: false, error: 'Something went wrong while creating the sale. Please try again.' }
}

export const handleCreateSale = async (data) => {
  const errors = validateSaleFields(data)
  if (Object.keys(errors).length > 0) {
    return { success: false, fieldErrors: errors }
  }

  const session = await mongoose.startSession()

  try {
    session.startTransaction()
    const result = await executeSaleCreation(data, session)
    await session.commitTransaction()
    return result
  } catch (error) {
    await session.abortTransaction().catch(() => {})

    if (isTransactionsUnsupportedError(error)) {
      try {
        return await executeSaleCreation(data, null)
      } catch (fallbackError) {
        return translateSaleError(fallbackError)
      }
    }

    return translateSaleError(error)
  } finally {
    session.endSession()
  }
}
