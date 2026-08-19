// mainScreen.jsx
// Composes Header + ProductPannel + BillingPannel + PayingPannel into the full POS layout.
// All state/handlers come from usePosHooks() - components below stay pure UI.

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import ProductPannel from "./components/ProductPannel";
import BillingPannel from "./components/BillingPannel";
import PayingPannel from "./components/PayingPannel";
import Calculator from "./components/utils/Calculator";
import ProductVariationModal from './components/utils/ProductVariationModal';
import WarrantyModal from "./components/utils/WarrantyModal";
import SaleConfirmModal from "./components/utils/SaleConfirmModal";
import usePosHooks from "./usePosHooks";

const MainScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // The cash session is handed off from the Dashboard Header when the
  // cashier clicks POS (either an existing active session, or one just opened).
  const session = location.state?.session;

  useEffect(() => {
    // No session in nav state usually means a direct refresh/URL visit.
    // TODO once checkActiveSession is available here too: re-check for an
    // active session on this device before bouncing back, instead of
    // redirecting unconditionally.
    if (!session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, navigate]);

  const pos = usePosHooks(session);

  if (!session) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col border border-slate-500 overflow-hidden">
      <Header
        storeName={pos.storeName}
        currentDateTime={pos.currentDateTime}
        onSaleReturnClick={pos.onSaleReturnClick}
        onHeldBillsClick={pos.onHeldBillsClick}
        heldBillsCount={pos.heldBillsCount}
        onCalculatorClick={pos.onCalculatorClick}
        onClosePosClick={pos.onClosePosClick}
      />

      <div className="grid grid-cols-[53%_47%] grid-rows-[minmax(0,1fr)] bg-white flex-1 min-h-0">
        {/* Left: product discovery */}
        <div className="min-w-0 min-h-0 h-full">
          <ProductPannel
            searchTerm={pos.searchTerm}
            onSearchChange={pos.onSearchChange}
            onScanInput={pos.onScanInput}
            warehouseOptions={pos.warehouseOptions}
            brandOptions={pos.brandOptions}
            categoryOptions={pos.categoryOptions}
            supplierOptions={pos.supplierOptions}
            activeFilters={pos.activeFilters}
            onFilterChange={pos.onFilterChange}
            products={pos.products}
            productsLoading={pos.productsLoading}
            productsError={pos.productsError}
            onProductClick={pos.onProductClick}
            catalogTab={pos.catalogTab}
            onCatalogTabChange={pos.onCatalogTabChange}
            services={pos.services}
            servicesLoading={pos.servicesLoading}
            servicesError={pos.servicesError}
            onServiceClick={pos.onServiceClick}
          />
        </div>

        {/* Right: billing + payment, stacked */}
        <div className="min-w-0 min-h-0 flex flex-col h-full border-l border-slate-500">
          <div className="flex-[4] min-h-0 flex flex-col overflow-hidden">
            <BillingPannel
              customerSearchTerm={pos.customerSearchTerm}
              onCustomerSearchChange={pos.onCustomerSearchChange}
              filteredCustomers={pos.filteredCustomers}
              customersLoading={pos.customersLoading}
              customersError={pos.customersError}
              selectedCustomer={pos.selectedCustomer}
              onSelectCustomer={pos.onSelectCustomer}
              onClearCustomer={pos.onClearCustomer}
              onNewCustomerClick={pos.onNewCustomerClick}
              isCustomerModalOpen={pos.isCustomerModalOpen}
              onCloseCustomerModal={pos.onCloseCustomerModal}
              onCreateCustomer={pos.onCreateCustomer}
              customerFormErrors={pos.customerFormErrors}
              customerFormSubmitting={pos.customerFormSubmitting}
              cartItems={pos.cartItems}
              onIncreaseQty={pos.onIncreaseQty}
              onDecreaseQty={pos.onDecreaseQty}
              onRemoveItem={pos.onRemoveItem}
              onWarrantyClick={pos.onWarrantyClick}
              onQtyChange={pos.onQtyChange}
              subtotal={pos.subtotal}
              totalItems={pos.totalItems}
              discount={pos.discount}
              discountType={pos.discountType}
              onDiscountChange={pos.onDiscountChange}
              onDiscountTypeToggle={pos.onDiscountTypeToggle}
              specialDiscount={pos.specialDiscount}
              isSpecialDiscountUnlocked={pos.isSpecialDiscountUnlocked}
              onSpecialDiscountClick={pos.onSpecialDiscountClick}
              tax={pos.tax}
              taxType={pos.taxType}
              onTaxTypeToggle={pos.onTaxTypeToggle}
              onTaxChange={pos.onTaxChange}
              deliveryFee={pos.deliveryFee}
              onDeliveryFeeChange={pos.onDeliveryFeeChange}
              totalDue={pos.totalDue}
              onClearAll={pos.onReset}
            />
          </div>
          <div className="shrink-0 overflow-y-auto border-t border-slate-500">
            <PayingPannel
              paymentAmounts={pos.paymentAmounts}
              onPaymentAmountChange={pos.onPaymentAmountChange}
              totalPaid={pos.totalPaid}
              dueAmount={pos.dueAmount}
              changeAmount={pos.changeAmount}
              note={pos.note}
              onNoteChange={pos.onNoteChange}
              onHoldBill={pos.onHoldBill}
              onReset={pos.onReset}
              onSaveWithBill={pos.onSaveWithBill}
              onSaveWithoutBill={pos.onSaveWithoutBill}
            />
          </div>
        </div>
      </div>

      <Calculator isOpen={pos.isCalculatorOpen} onClose={pos.onCloseCalculator} />

      <ProductVariationModal
        isOpen={pos.isVariationModalOpen}
        product={pos.variationModalProduct}
        onClose={pos.onCloseVariationModal}
        onConfirm={pos.onConfirmVariationSelection}
      />

      <WarrantyModal
        open={pos.isWarrantyModalOpen}
        onClose={pos.onCloseWarrantyModal}
        cartItem={pos.warrantyModalCartItem}
        warrantyTypes={pos.warrantyTypes}
        warrantyTypesLoading={pos.warrantyTypesLoading}
        warrantyTypesError={pos.warrantyTypesError}
        onConfirm={pos.onConfirmWarranty}
        onRemoveWarranty={pos.onRemoveWarranty}
        submitting={pos.warrantySubmitting}
      />

      <SaleConfirmModal
        isOpen={pos.isSaleConfirmModalOpen}
        pendingSale={pos.pendingSale}
        onClose={pos.onCloseSaleConfirmModal}
        onConfirm={pos.onConfirmSale}
        submitting={pos.saleSubmitting}
        submitError={pos.saleSubmitError}
        fieldErrors={pos.saleFieldErrors}
      />
    </div>
  );
};

export default MainScreen;
