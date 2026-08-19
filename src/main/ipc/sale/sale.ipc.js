import { ipcMain } from 'electron'
import { handleCreateSale } from '../../controllers/saleController/saleController'

export const registerSaleIpc = () => {
  ipcMain.handle('sale:create', async (event, data) => {
    return await handleCreateSale(data)
  })
}
