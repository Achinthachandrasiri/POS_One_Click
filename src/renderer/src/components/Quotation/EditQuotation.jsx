import { useEditQuotation } from '../../hooks/useEditQuotation'
import {
  Field, Section, inputCls, selectCls, DiscountField,
  ProductSearchBar, ProductsTable, BatchSelectModal
} from './QuotationFormShared'

const money = (n) => `Rs ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

const EditQuotation = () => {
  const {
    navigate,
    form,
    locked,
    allProducts,
    dropdowns,
    fieldErrors,
    error,
    batchModal,
    pageLoading,
    saving,
    updateForm,
    handleAddProduct,
    removeProductLine,
    updateProductLine,
    toggleWholesale,
    onSelectVariation,
    openManageBatches,
    closeBatchModal,
    handleBatchModalSave,
    subtotal,
    totals,
    grandTotal,
    handleSubmit
  } = useEditQuotation()

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <style>{`
        @keyframes grnErrorFlash {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); background-color: transparent; }
          15%, 60% { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.35); background-color: rgba(254, 226, 226, 0.6); }
        }
        .grn-error-flash { animation: grnErrorFlash 1.6s ease-out; border-radius: 0.75rem; }
      `}</style>
      <div className="flex flex-col h-[630px]">

        {/* Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[880px] h-[780px] bg-[#2699aa] opacity-40 rounded-full right-[-200px] bottom-[-200px]" />
          <div className="absolute w-[580px] h-[580px] bg-[#30aabb] opacity-25 rounded-full right-[-120px] bottom-[-120px]" />
          <div className="absolute w-[420px] h-[420px] bg-[#2699aa] opacity-30 rounded-full left-[-80px] top-[-80px]" />
        </div>

        {/* Title */}
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-semibold m-0">Edit Quotation</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">Update quotation details for this quotation</p>
        </div>

        {/* Card */}
        <div className="relative z-10 bg-white w-full px-10 py-10 shadow-xl rounded-t-[20px] overflow-auto" style={{ height: 'calc(100% - 70px)' }}>

          {pageLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <i className="fas fa-spinner fa-spin text-2xl mb-3 text-[#1a6b7a]" />
              <p className="text-sm font-medium">Loading quotation…</p>
            </div>
          ) : !form ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <i className="fas fa-triangle-exclamation text-3xl text-red-400 mb-3" />
              <p className="text-sm font-semibold text-gray-700">{error || 'Could not load this quotation.'}</p>
              <button
                type="button"
                onClick={() => navigate('/dashboard/quotation')}
                className="mt-4 border-2 border-gray-300 text-gray-600 text-sm font-semibold px-6 py-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Back to quotations
              </button>
            </div>
          ) : (
            <>
              {(error || Object.keys(fieldErrors).length > 0) && (
                <div className="mb-5 bg-red-50 border-2 border-red-400 text-red-700 text-sm rounded-xl px-4 py-3">
                  <div className="flex items-start gap-2 font-medium">
                    <i className="fas fa-exclamation-triangle mt-0.5" />
                    <span>{error || 'Please fix the highlighted issues before saving.'}</span>
                  </div>
                </div>
              )}

              {/* ── Quotation details ── */}
              <Section title="Quotation details" icon="file-invoice-dollar">
                <div className="grid grid-cols-4 gap-2">
                  <Field label="Store" name="store_id">
                    <div className={`${inputCls(false)} bg-gray-50 text-gray-500 cursor-not-allowed flex items-center gap-2`}>
                      <i className="fas fa-lock text-[10px] text-gray-400" />
                      {locked.storeName}
                    </div>
                  </Field>
                  <Field label="Customer" name="customer_id" required error={fieldErrors.customer_id}>
                    <select value={form.customer_id} onChange={(e) => updateForm('customer_id', e.target.value)} className={selectCls(fieldErrors.customer_id)}>
                      <option value="">Select customer</option>
                      {dropdowns.customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Quotation number" name="quotation_number" required error={fieldErrors.quotation_number}>
                    <input
                      type="text"
                      value={form.quotation_number}
                      onChange={(e) => updateForm('quotation_number', e.target.value)}
                      placeholder="e.g. QUO-2026-0042"
                      className={inputCls(fieldErrors.quotation_number)}
                    />
                  </Field>
                  <Field label="Date" name="date" required error={fieldErrors.date}>
                    <input type="date" value={form.date} onChange={(e) => updateForm('date', e.target.value)} className={inputCls(fieldErrors.date)} />
                  </Field>
                </div>
              </Section>

              {/* ── Products ── */}
              <Section title="Products to quote" icon="boxes-stacked" accent>
                <div className="mb-4" data-field-key="products">
                  <ProductSearchBar allProducts={allProducts} onAdd={handleAddProduct} storeId={form.store_id} loadingProducts={false} />
                  {fieldErrors.products && (
                    <p className="text-xs font-medium text-red-600 flex items-center gap-1 mt-2">
                      <i className="fas fa-exclamation-circle text-[11px]" />{fieldErrors.products}
                    </p>
                  )}
                </div>

                <ProductsTable
                  lines={form.products}
                  onRemove={removeProductLine}
                  onChange={updateProductLine}
                  onToggleWholesale={toggleWholesale}
                  onSelectVariation={onSelectVariation}
                  onManageBatches={openManageBatches}
                  fieldErrors={fieldErrors}
                />
              </Section>

              {/* ── Summary ── */}
              <Section title="Summary" icon="calculator">
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <Field label="Discount" name="discount_value" error={fieldErrors.discount_value}>
                    <DiscountField
                      discountType={form.discount_type}
                      discountValue={form.discount_value}
                      onTypeChange={(v) => updateForm('discount_type', v)}
                      onValueChange={(v) => updateForm('discount_value', v)}
                      valueError={fieldErrors.discount_value}
                    />
                  </Field>
                  <Field label="Tax (%)" name="tax" error={fieldErrors.tax}>
                    <input
                      type="number" min="0" step="0.01"
                      value={form.tax}
                      onChange={(e) => updateForm('tax', e.target.value)}
                      placeholder="0"
                      className={inputCls(fieldErrors.tax)}
                    />
                  </Field>
                  <Field label="Shipping" name="shipping" error={fieldErrors.shipping}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rs</span>
                      <input
                        type="number" min="0" step="0.01"
                        value={form.shipping}
                        onChange={(e) => updateForm('shipping', e.target.value)}
                        placeholder="0.00"
                        className={`${inputCls(fieldErrors.shipping)} pl-8`}
                      />
                    </div>
                  </Field>
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold text-gray-700">{money(subtotal)}</span>
                  </div>
                  {totals.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Discount</span>
                      <span className="font-semibold text-red-500">− {money(totals.discountAmount)}</span>
                    </div>
                  )}
                  {totals.taxAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Tax</span>
                      <span className="font-semibold text-gray-700">+ {money(totals.taxAmount)}</span>
                    </div>
                  )}
                  {totals.shippingAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Shipping</span>
                      <span className="font-semibold text-gray-700">+ {money(totals.shippingAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm font-semibold text-gray-600">Grand total</span>
                    <span className="text-lg font-bold text-[#1a6b7a]">{money(grandTotal)}</span>
                  </div>
                </div>
              </Section>

              <BatchSelectModal
                open={!!batchModal}
                mode={batchModal?.mode}
                productName={batchModal?.productName}
                productCode={batchModal?.productCode}
                structure={batchModal?.structure}
                variationOptions={batchModal?.variationOptions || []}
                singleExistingBatches={batchModal?.singleExistingBatches || []}
                initialVariationId={batchModal?.variationId}
                initialBatches={batchModal?.batches}
                onCancel={closeBatchModal}
                onSave={handleBatchModalSave}
                fieldErrors={fieldErrors}
                fieldKeyPrefix={batchModal?.lineIdx != null ? `products[${batchModal.lineIdx}]` : ''}
              />

              {/* ── Action buttons ── */}
              <div className="flex justify-end gap-3 pt-2 pb-6">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/quotation')}
                  className="border-2 border-gray-300 text-gray-600 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-sm font-bold px-8 py-2.5 rounded-xl hover:bg-[#155f6d] disabled:opacity-60 transition-colors flex items-center gap-2"
                >
                  {saving ? (<><i className="fas fa-spinner fa-spin" /> Saving…</>) : (<><i className="fas fa-save" /> Save Changes</>)}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default EditQuotation
