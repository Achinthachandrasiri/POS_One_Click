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
    getAll: () => ipcRenderer.invoke('user:getAll'),
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
  }
})

contextBridge.exposeInMainWorld('electronAPI', {
  setFullScreen: (flag) => ipcRenderer.send('set-fullscreen', flag)
})
