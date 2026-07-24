import { useEffect, useState } from 'react'
import { useUserHooks } from '../../hooks/userHooks'

// ─── Design tokens (mirrors GeneralSettings) ─────────────────
const inputCls = (err) =>
  `border-2 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none w-full transition-colors ${
    err
      ? 'border-red-500 focus:border-red-600 bg-red-50'
      : 'border-gray-300 focus:border-[#1a6b7a] text-gray-900'
  }`

const Field = ({ label, error, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
      {label}
      {required && <span className="text-red-500 text-base leading-none">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-xs font-medium text-red-600 flex items-center gap-1">
        <i className="fas fa-exclamation-circle text-[11px]" /> {error}
      </p>
    )}
  </div>
)

const Section = ({ title, icon, children }) => (
  <div className="bg-white border border-gray-200 rounded-2xl mb-4 shadow-sm overflow-hidden">
    <div className="px-5 py-3 border-b bg-gray-50 border-gray-100 flex items-center gap-2">
      {icon && <i className={`fas fa-${icon} text-[#1a6b7a] text-sm`} />}
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
    </div>
    <div className="p-5">{children}</div>
  </div>
)

// ─── Permission modules config ────────────────────────────────
const MODULES = [
  { key: 'dashboard',   label: 'Dashboard',   icon: 'house' },
  { key: 'users',       label: 'Users',        icon: 'user' },
  { key: 'customers',   label: 'Customers',    icon: 'user-plus' },
  { key: 'suppliers',   label: 'Suppliers',    icon: 'users' },
  { key: 'products',    label: 'Products',     icon: 'box' },
  { key: 'brands',      label: 'Brands',       icon: 'tag' },
  { key: 'categories',  label: 'Categories',   icon: 'th-large' },
  { key: 'variations',  label: 'Variations',   icon: 'sliders-h' },
  { key: 'units',       label: 'Units',        icon: 'cube' },
  { key: 'store',       label: 'Store',        icon: 'shopping-cart' },
  { key: 'expenses',    label: 'Expenses',     icon: 'dollar-sign' },
  { key: 'roles',       label: 'Roles',        icon: 'shield-alt' },
  { key: 'settings',    label: 'Settings',     icon: 'cog' },
]

const ACTIONS = ['view', 'create', 'edit', 'delete']

const ACTION_COLORS = {
  view:   { badge: 'bg-blue-50 text-blue-700 border-blue-200',   check: 'accent-blue-600' },
  create: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', check: 'accent-emerald-600' },
  edit:   { badge: 'bg-amber-50 text-amber-700 border-amber-200',  check: 'accent-amber-600' },
  delete: { badge: 'bg-red-50 text-red-700 border-red-200',       check: 'accent-red-600' },
}

const emptyPermissions = () =>
  Object.fromEntries(MODULES.map((m) => [m.key, Object.fromEntries(ACTIONS.map((a) => [a, false]))]))

const normalizeRoleName = (value) => value?.trim().toLowerCase().replace(/[^a-z0-9]/g, '')

// ─── Modal ────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
          <i className="fas fa-times text-sm" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
    </div>
  </div>
)

// ─── Permission grid inside modal ─────────────────────────────
const PermissionGrid = ({ permissions, onChange }) => {
  const toggleAll = (moduleKey, checked) => {
    ACTIONS.forEach((a) => onChange(moduleKey, a, checked))
  }

  const isAllChecked = (moduleKey) =>
    ACTIONS.every((a) => permissions[moduleKey][a])

  const isEverythingChecked = () =>
    MODULES.every((m) => isAllChecked(m.key))

  const toggleEverything = (checked) => {
    MODULES.forEach((m) => toggleAll(m.key, checked))
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-48">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isEverythingChecked()}
                  onChange={(e) => toggleEverything(e.target.checked)}
                  className="w-4 h-4 accent-[#1a6b7a] cursor-pointer"
                />
                <span>Select all</span>
              </label>
            </th>
            <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-8">
              All
            </th>
            {ACTIONS.map((a) => (
              <th key={a} className="px-3 py-3 text-center w-24">
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${ACTION_COLORS[a].badge}`}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODULES.map((mod, i) => (
            <tr
              key={mod.key}
              className={`border-b border-gray-100 last:border-0 transition-colors hover:bg-[#f0f9fb] ${
                i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              }`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#e8f5f8] flex items-center justify-center">
                    <i className={`fas fa-${mod.icon} text-[#1a6b7a] text-xs`} />
                  </div>
                  <span className="font-medium text-gray-800">{mod.label}</span>
                </div>
              </td>
              <td className="px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={isAllChecked(mod.key)}
                  onChange={(e) => toggleAll(mod.key, e.target.checked)}
                  className="w-4 h-4 accent-[#1a6b7a] cursor-pointer"
                />
              </td>
              {ACTIONS.map((action) => (
                <td key={action} className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={permissions[mod.key][action]}
                    onChange={(e) => onChange(mod.key, action, e.target.checked)}
                    className={`w-4 h-4 cursor-pointer ${ACTION_COLORS[action].check}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Role card ────────────────────────────────────────────────
const RoleCard = ({ role, onEdit, onDelete }) => {
  const totalGranted = MODULES.reduce(
    (sum, m) => sum + ACTIONS.filter((a) => role.permissions[m.key][a]).length,
    0
  )
  const total = MODULES.length * ACTIONS.length

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#e8f5f8] flex items-center justify-center">
            <i className="fas fa-shield-alt text-[#1a6b7a] text-sm" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-[15px]">{role.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(role)}
            className="text-xs font-semibold text-[#1a6b7a] border border-[#1a6b7a] px-3 py-1.5 rounded-lg hover:bg-[#f0f9fb] transition-colors flex items-center gap-1.5"
          >
            <i className="fas fa-pen text-[11px]" /> Edit
          </button>
          <button
            onClick={() => onDelete(role._id || role.id)}
            className="text-xs font-semibold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
          >
            <i className="fas fa-trash text-[11px]" /> Delete
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Permissions granted</span>
          <span className="text-xs font-semibold text-gray-700">{totalGranted} / {total}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1a6b7a] rounded-full transition-all"
            style={{ width: `${Math.round((totalGranted / total) * 100)}%` }}
          />
        </div>

        {/* Action badges summary */}
        <div className="flex flex-wrap gap-2 mt-3">
          {ACTIONS.map((action) => {
            const count = MODULES.filter((m) => role.permissions[m.key][action]).length
            return (
              <span
                key={action}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${ACTION_COLORS[action].badge}`}
              >
                {action.charAt(0).toUpperCase() + action.slice(1)}: {count}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
const RolesPermissions = () => {
  const [roles, setRoles] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPerms, setFormPerms] = useState(emptyPermissions())
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [loading, setLoading] = useState(false)
  const { canSeeSuperAdmin } = useUserHooks()

  const visibleRoles = canSeeSuperAdmin
    ? roles
    : roles.filter((role) => normalizeRoleName(role.name) !== 'superadmin')

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    setLoading(true)
    try {
      const res = await window.api.role.getAll()
      if (res?.success) {
        setRoles(res.roles || [])
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingRole(null)
    setFormName('')
    setFormDesc('')
    setFormPerms(emptyPermissions())
    setFieldErrors({})
    setModalOpen(true)
  }

  const openEdit = (role) => {
    setEditingRole(role)
    setFormName(role.name)
    setFormDesc(role.description)
    setFormPerms(JSON.parse(JSON.stringify(role.permissions || emptyPermissions())))
    setFieldErrors({})
    setModalOpen(true)
  }

  const handlePermChange = (mod, action, val) => {
    setFormPerms((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [action]: val },
    }))
  }

  const validate = () => {
    const errs = {}
    if (!formName.trim()) errs.name = 'Role name is required'
    if (normalizeRoleName(formName) === 'superadmin') errs.name = 'Role name "superAdmin" is not approved'
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    const payload = {
      ...(editingRole ? { id: editingRole._id || editingRole.id } : {}),
      name: formName.trim(),
      description: formDesc.trim(),
      permissions: formPerms
    }

    const res = editingRole
      ? await window.api.role.update(payload)
      : await window.api.role.create(payload)

    if (!res?.success) {
      if (res?.fieldErrors) setFieldErrors(res.fieldErrors)
      return
    }

    setModalOpen(false)
    setSuccess(`Role "${formName.trim()}" ${editingRole ? 'updated' : 'created'}.`)
    await loadRoles()
    setTimeout(() => setSuccess(''), 3500)
  }

  const handleDelete = (id) => setDeleteId(id)

  const confirmDelete = async () => {
    const role = roles.find((r) => (r._id || r.id) === deleteId)
    const res = await window.api.role.delete(deleteId)
    if (!res?.success) {
      return
    }

    setSuccess(`Role "${role?.name}" deleted.`)
    setDeleteId(null)
    await loadRoles()
    setTimeout(() => setSuccess(''), 3500)
  }

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[650px]">

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[880px] h-[780px] bg-[#2699aa] opacity-40 rounded-full right-[-200px] bottom-[-200px]" />
          <div className="absolute w-[580px] h-[580px] bg-[#30aabb] opacity-25 rounded-full right-[-120px] bottom-[-120px]" />
          <div className="absolute w-[420px] h-[420px] bg-[#2699aa] opacity-30 rounded-full left-[-80px] top-[-80px]" />
        </div>

        {/* Page header */}
        <div className="relative z-10 mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-white text-[22px] font-bold m-0 flex items-center gap-2">
              <i className="fas fa-shield-alt text-[20px]" /> Roles & Permissions
            </h1>
            <p className="text-[#90bcc4] text-[15px] mt-1">
              Define what each role can view, create, edit, or delete across the system.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-white text-[#1a3d4d] text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#e8f5f8] transition-colors shadow-sm"
          >
            <i className="fas fa-plus text-[#1a6b7a]" /> Create role
          </button>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-[#f0f4f6] w-full px-6 py-6 shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          {/* Success banner */}
          {success && (
            <div className="mb-5 bg-emerald-50 border-2 border-emerald-400 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2">
              <i className="fas fa-circle-check mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Roles grid */}
          <Section title="All roles" icon="shield-alt">
            {loading ? (
              <div className="text-center py-10 text-gray-400">
                <i className="fas fa-spinner fa-spin text-3xl mb-3 block" />
                <p className="text-sm font-medium">Loading roles...</p>
              </div>
            ) : visibleRoles.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <i className="fas fa-shield-alt text-3xl mb-3 block" />
                <p className="text-sm font-medium">No roles yet. Create your first role.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {visibleRoles.map((role) => (
                  <RoleCard key={role._id || role.id} role={role} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </Section>

          {/* Legend */}
          <Section title="Permission types" icon="info-circle">
            <div className="grid grid-cols-4 gap-3">
              {[
                { action: 'view',   desc: 'Read-only access to list and detail screens.' },
                { action: 'create', desc: 'Add new records to this module.' },
                { action: 'edit',   desc: 'Modify existing records.' },
                { action: 'delete', desc: 'Permanently remove records.' },
              ].map(({ action, desc }) => (
                <div key={action} className="flex flex-col gap-1.5">
                  <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full border ${ACTION_COLORS[action].badge}`}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </span>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* ── Create / Edit modal ── */}
      {modalOpen && (
        <Modal
          title={editingRole ? `Edit role — ${editingRole.name}` : 'Create role'}
          onClose={() => setModalOpen(false)}
        >
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Role name" required error={fieldErrors.name}>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); setFieldErrors((p) => { const e = { ...p }; delete e.name; return e }) }}
                  placeholder="e.g. Store Manager"
                  className={inputCls(fieldErrors.name)}
                />
              </Field>
              <Field label="Description">
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. Manages store operations"
                  className={inputCls(false)}
                />
              </Field>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Module permissions
              </p>
              <PermissionGrid permissions={formPerms} onChange={handlePermChange} />
            </div>

            <div className="flex justify-end gap-3 pt-1 pb-1">
              <button
                onClick={() => setModalOpen(false)}
                className="border-2 border-gray-300 text-gray-600 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-[#1a6b7a] border-2 border-[#1a6b7a] text-white text-sm font-bold px-8 py-2.5 rounded-xl hover:bg-[#155f6d] transition-colors flex items-center gap-2"
              >
                <i className="fas fa-save" /> {editingRole ? 'Save changes' : 'Create role'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteId && (
        <Modal title="Delete role" onClose={() => setDeleteId(null)}>
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <i className="fas fa-trash text-red-500 text-xl" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-[15px] mb-1">Are you sure?</p>
              <p className="text-sm text-gray-500">
                Deleting <strong>{visibleRoles.find((r) => (r._id || r.id) === deleteId)?.name}</strong> will remove all its permissions permanently.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="border-2 border-gray-300 text-gray-600 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 border-2 border-red-600 text-white text-sm font-bold px-8 py-2.5 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <i className="fas fa-trash" /> Delete role
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default RolesPermissions