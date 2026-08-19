// NOTE: kept as a named import to match your original file exactly — I have
// NOT verified whether productsModel.js actually exports `Product` as a
// named export or a default export. Confirm before running this; if it's
// actually a default export, this needs to change to
// `import Product from '../../models/productsModel'`.
import { Product } from '../../models/productsModel'

const withSession = (query, session) => (session ? query.session(session) : query)

export const deductStock = async (target, session) => {
  const { product_id, variation_id, batch_number, batch_tracking, qty } = target

  if (!batch_tracking) {
    const result = await withSession(
      Product.findOneAndUpdate(
        { _id: product_id, 'variations._id': variation_id, 'variations.stock': { $gte: qty } },
        { $inc: { 'variations.$.stock': -qty } },
        { new: true }
      ),
      session
    )
    return !!result
  }

  const result = await withSession(
    Product.findOneAndUpdate(
      { _id: product_id, 'variations._id': variation_id },
      { $inc: { 'variations.$[v].batches.$[b].stock': -qty } },
      {
        arrayFilters: [
          { 'v._id': variation_id },
          { 'b.batch_number': batch_number, 'b.stock': { $gte: qty } }
        ],
        new: true
      }
    ),
    session
  )
  return !!result
}

export const reverseStock = async (target, session) => {
  const { product_id, variation_id, batch_number, batch_tracking, qty } = target

  if (!batch_tracking) {
    await withSession(
      Product.findOneAndUpdate(
        { _id: product_id, 'variations._id': variation_id },
        { $inc: { 'variations.$.stock': qty } }
      ),
      session
    )
    return
  }

  await withSession(
    Product.findOneAndUpdate(
      { _id: product_id, 'variations._id': variation_id },
      { $inc: { 'variations.$[v].batches.$[b].stock': qty } },
      { arrayFilters: [{ 'v._id': variation_id }, { 'b.batch_number': batch_number }] }
    ),
    session
  )
}

// Service lines carry no `product_id` and aren't stocked — they're skipped
// entirely here rather than attempting (and failing) a stock lookup against
// the Product collection for something that was never a product.
export const deductStockForItems = async (items, session) => {
  const applied = []

  for (const item of items) {
    if (!item.product_id) continue // service line — nothing to deduct

    const target = {
      product_id: item.product_id,
      variation_id: item.variation_id,
      batch_number: item.batch_tracking ? item.batch_number : null,
      batch_tracking: !!item.batch_tracking,
      qty: item.qty
    }

    const deducted = await deductStock(target, session)
    if (!deducted) {
      return {
        success: false,
        error: `Insufficient stock for "${item.product_name}"${target.batch_number ? ` (batch ${target.batch_number})` : ''}. It may also no longer exist.`,
        applied
      }
    }

    applied.push(target)
  }

  return { success: true, applied }
}

export const reverseStockForAppliedItems = async (applied, session) => {
  for (const target of applied) {
    await reverseStock(target, session)
  }
}
