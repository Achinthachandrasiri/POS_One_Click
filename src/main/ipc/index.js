import { registerAuthIpc } from './auth/auth.ipc'
import { registerUserIpc } from './user/user.ipc'
import { registerResetPasswordIpc } from './auth/resetPassword.ipc'
import { registerCustomerIpc } from './customer/customer.ipc'
import { registerSupplierIpc } from './supplier/supplier.ipc'
import { registerStoreIpc } from './store/store.ipc'
import { registerBrandIpc } from './product/brand.ipc'
import { registerCategoryIpc } from './product/category.ipc'
import { registerVariationIpc } from './product/variation.ipc'
import { registerUnitIpc } from './product/unit.ipc'
import { registerProductIpc } from './product/product.ipc'
import { registerGRNIpc } from './grn/grn.ipc'
import { registerGRNReturnIpc } from './grn/grnReturn.ipc'

export const registerIpcHandlers = () => {
  registerAuthIpc()
  registerUserIpc()
  registerResetPasswordIpc()
  registerCustomerIpc()
  registerSupplierIpc()
  registerStoreIpc()
  registerBrandIpc()
  registerCategoryIpc()
  registerVariationIpc()
  registerUnitIpc()
  registerProductIpc()
  registerGRNIpc()
  registerGRNReturnIpc()

}
