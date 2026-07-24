const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  auth: {
    login: (data) => ipcRenderer.invoke('auth:login', data),
    bootstrapTempAdmin: () => ipcRenderer.invoke('auth:bootstrapTempAdmin'),
    sendOtp: (data) => ipcRenderer.invoke('auth:sendOtp', data),
    verifyOtp: (data) => ipcRenderer.invoke('auth:verifyOtp', data),
    changePassword: (data) => ipcRenderer.invoke('auth:changePassword', data)
  },
  user: {
    create: (data) => ipcRenderer.invoke('user:create', data),
    getAll: (role) => ipcRenderer.invoke('user:getAll', role),
    getById: (id) => ipcRenderer.invoke('user:getById', id),
    update: (data) => ipcRenderer.invoke('user:update', data),
    delete: (id) => ipcRenderer.invoke('user:delete', id),
    unlock: (id) => ipcRenderer.invoke('user:unlock', id)
  },
  customer: {
    create: (data) => ipcRenderer.invoke('customer:create', data),
    getAll: () => ipcRenderer.invoke('customer:getAll'),
    getById: (id) => ipcRenderer.invoke('customer:getById', id),
    update: (data) => ipcRenderer.invoke('customer:update', data),
    delete: (id) => ipcRenderer.invoke('customer:delete', id)
  },
  supplier: {
    create: (data) => ipcRenderer.invoke('supplier:create', data),
    getAll: () => ipcRenderer.invoke('supplier:getAll'),
    getById: (id) => ipcRenderer.invoke('supplier:getById', id),
    update: (data) => ipcRenderer.invoke('supplier:update', data),
    delete: (id) => ipcRenderer.invoke('supplier:delete', id)
  },
  store: {
    create: (data) => ipcRenderer.invoke('store:create', data),
    getAll: () => ipcRenderer.invoke('store:getAll'),
    getById: (id) => ipcRenderer.invoke('store:getById', id),
    update: (data) => ipcRenderer.invoke('store:update', data),
    delete: (id) => ipcRenderer.invoke('store:delete', id)
  },
  brand: {
    create: (data) => ipcRenderer.invoke('brand:create', data),
    getAll: () => ipcRenderer.invoke('brand:getAll'),
    getById: (id) => ipcRenderer.invoke('brand:getById', id),
    update: (data) => ipcRenderer.invoke('brand:update', data),
    delete: (id) => ipcRenderer.invoke('brand:delete', id)
  },
  category: {
    create: (data) => ipcRenderer.invoke('category:create', data),
    getAll: () => ipcRenderer.invoke('category:getAll'),
    getById: (id) => ipcRenderer.invoke('category:getById', id),
    update: (data) => ipcRenderer.invoke('category:update', data),
    delete: (id) => ipcRenderer.invoke('category:delete', id)
  },
  role: {
    getAll: () => ipcRenderer.invoke('role:getAll'),
    create: (data) => ipcRenderer.invoke('role:create', data),
    update: (data) => ipcRenderer.invoke('role:update', data),
    delete: (id) => ipcRenderer.invoke('role:delete', id)
  },
  variation: {
    create: (data) => ipcRenderer.invoke('variation:create', data),
    getAll: () => ipcRenderer.invoke('variation:getAll'),
    getById: (id) => ipcRenderer.invoke('variation:getById', id),
    update: (data) => ipcRenderer.invoke('variation:update', data),
    delete: (id) => ipcRenderer.invoke('variation:delete', id)
  },
  unit: {
    create: (data) => ipcRenderer.invoke('unit:create', data),
    getAll: () => ipcRenderer.invoke('unit:getAll'),
    getById: (id) => ipcRenderer.invoke('unit:getById', id),
    update: (data) => ipcRenderer.invoke('unit:update', data),
    delete: (id) => ipcRenderer.invoke('unit:delete', id)
  },
  product: {
    create: (data) => ipcRenderer.invoke('product:create', data),
    getAll: () => ipcRenderer.invoke('product:getAll'),
    getById: (id) => ipcRenderer.invoke('product:getById', id),
    update: (data) => ipcRenderer.invoke('product:update', data),
    delete: (id) => ipcRenderer.invoke('product:delete', id),
    updateStatus: (data) => ipcRenderer.invoke('product:updateStatus', data)
  },
  settings: {
    getGeneral: () => ipcRenderer.invoke('settings:getGeneral'),
    saveGeneral: (data) => ipcRenderer.invoke('settings:saveGeneral', data),
    getMail: () => ipcRenderer.invoke('settings:getMail'),
    saveMail: (data) => ipcRenderer.invoke('settings:saveMail', data),
  }
})

contextBridge.exposeInMainWorld('electronAPI', {
  setFullScreen: (flag) => ipcRenderer.send('set-fullscreen', flag)
})
