import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerHooks } from '../../hooks/customerHooks'

const ViewCustomer = () => {
  const navigate = useNavigate()
  const { getAllCustomers, deleteCustomer, loading, error } = useCustomerHooks()
  const [customers, setCustomers] = useState([])

  const loadCustomers = async () => {
    const res = await getAllCustomers()
    if (res?.success) {
      setCustomers(res.customers || [])
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this customer?')
    if (!confirmDelete) return

    const res = await deleteCustomer(id)
    if (res?.success) {
      setCustomers((prev) => prev.filter((customer) => customer._id !== id))
    }
  }

  return (
    <div style={styles.root}>
      <svg style={styles.bgSvg} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="1180" cy="980" rx="680" ry="680" fill="#2699aa" opacity="0.55" />
        <ellipse cx="1220" cy="1020" rx="480" ry="480" fill="#30aabb" opacity="0.30" />
        <ellipse cx="-60" cy="-40" rx="320" ry="320" fill="#0e5a6a" opacity="0.40" />
      </svg>

      <div style={styles.panel}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Customers</h2>
            <p style={styles.subtitle}>Manage customer records</p>
          </div>
          <button style={styles.btnPrimary} onClick={() => navigate('/customers/create')}>
            + Create Customer
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Mobile</th>
                <th style={styles.th}>NIC</th>
                <th style={styles.th}>Address</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && !loading ? (
                <tr>
                  <td style={styles.empty} colSpan={5}>No customers found</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id}>
                    <td style={styles.td}>{customer.name}</td>
                    <td style={styles.td}>{customer.mobileNumber}</td>
                    <td style={styles.td}>{customer.nicNumber}</td>
                    <td style={styles.td}>{customer.address}</td>
                    <td style={styles.td}>
                      <div style={styles.actionWrap}>
                        <button
                          style={{ ...styles.actionBtn, background: '#30aabb' }}
                          onClick={() => navigate(`/customers/edit/${customer._id}`)}
                        >
                          Edit
                        </button>
                        <button
                          style={{ ...styles.actionBtn, background: '#0e5a6a' }}
                          onClick={() => handleDelete(customer._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.footerActions}>
          <button style={styles.btnSecondary} onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#225166',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', sans-serif",
    padding: 16
  },
  bgSvg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  },
  panel: {
    position: 'relative',
    zIndex: 1,
    background: '#fff',
    borderRadius: 4,
    width: '100%',
    maxWidth: 1050,
    padding: 24,
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    margin: 0,
    color: '#1a6b7a'
  },
  subtitle: {
    margin: '5px 0 0',
    color: '#666',
    fontSize: 13
  },
  tableWrap: {
    border: '1px solid #e6eef0',
    borderRadius: 4,
    overflow: 'auto',
    maxHeight: '62vh'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 760
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: 13,
    background: '#f5fbfd',
    color: '#2a5b67',
    borderBottom: '1px solid #dce9ed'
  },
  td: {
    padding: '10px 12px',
    fontSize: 13,
    color: '#333',
    borderBottom: '1px solid #eef3f5'
  },
  empty: {
    padding: 24,
    textAlign: 'center',
    color: '#666',
    fontSize: 13
  },
  actionWrap: {
    display: 'flex',
    gap: 8
  },
  actionBtn: {
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    padding: '6px 10px',
    fontSize: 12,
    cursor: 'pointer'
  },
  btnPrimary: {
    border: 'none',
    borderRadius: 4,
    background: '#2699aa',
    color: '#fff',
    padding: '10px 12px',
    fontSize: 13,
    cursor: 'pointer'
  },
  btnSecondary: {
    border: 'none',
    borderRadius: 4,
    background: '#0e5a6a',
    color: '#fff',
    padding: '10px 12px',
    fontSize: 13,
    cursor: 'pointer'
  },
  error: {
    color: '#c0392b',
    fontSize: 12,
    marginBottom: 10
  },
  footerActions: {
    marginTop: 14,
    display: 'flex',
    justifyContent: 'flex-end'
  }
}

export default ViewCustomer
