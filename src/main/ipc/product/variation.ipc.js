import { ipcMain } from 'electron'
import {
	createVariation,
	getVariations,
	updateVariation,
	deleteVariation
} from '../../controllers/productsController/variationController'

export const registerVariationIpc = () => {
	ipcMain.handle('variation:create', async (_, data) => {
		try {
			return await createVariation(data)
		} catch (err) {
			console.error('IPC variation:create error:', err)
			return { success: false, error: 'Failed to create variation' }
		}
	})

	ipcMain.handle('variation:getAll', async () => {
		try {
			return await getVariations()
		} catch (err) {
			console.error('IPC variation:getAll error:', err)
			return { success: false, error: 'Failed to fetch variations' }
		}
	})

	ipcMain.handle('variation:getById', async (_, id) => {
		try {
			return await getVariations({ id })
		} catch (err) {
			console.error('IPC variation:getById error:', err)
			return { success: false, error: 'Failed to fetch variation' }
		}
	})

	ipcMain.handle('variation:update', async (_, data) => {
		try {
			return await updateVariation(data)
		} catch (err) {
			console.error('IPC variation:update error:', err)
			return { success: false, error: 'Failed to update variation' }
		}
	})

	ipcMain.handle('variation:delete', async (_, id) => {
		try {
			return await deleteVariation({ id })
		} catch (err) {
			console.error('IPC variation:delete error:', err)
			return { success: false, error: 'Failed to delete variation' }
		}
	})
}
