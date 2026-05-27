import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBrandHooks } from '../../hooks/brandHooks'

const CreateBrand = () => {
  const navigate = useNavigate()
  const { createBrand, loading, error, fieldErrors, setFieldErrors } = useBrandHooks()

  const [success, setSuccess] = useState('')
  const [createdBrand, setCreatedBrand] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    brandName: '',
    image: null,
    imagePath: ''
  })

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    setImageError('')
    setImagePreview(null)

    if (!file) return

    if (!['image/jpeg', 'image/jpg'].includes(file.type)) {
      setImageError('Only JPG/JPEG images are allowed.')
      fileInputRef.current.value = ''
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      setImageError('Image must not exceed 4 MB.')
      fileInputRef.current.value = ''
      return
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      if (img.naturalWidth !== img.naturalHeight) {
        setImageError('Image must have a 1:1 aspect ratio (square).')
        fileInputRef.current.value = ''
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
        setForm((prev) => ({ ...prev, image: file, imagePath: reader.result }))
      }
      reader.readAsDataURL(file)
    }
    img.src = objectUrl
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setImageError('')
    setForm((prev) => ({ ...prev, image: null, imagePath: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')
    setCreatedBrand(null)

    if (imageError) return

    const res = await createBrand({
      brandName: form.brandName,
      ...(form.imagePath ? { image: form.imagePath } : {})
    })

    if (res?.success) {
      setSuccess('Brand created successfully')
      setCreatedBrand(res.data)
      setForm({ brandName: '', image: null, imagePath: '' })
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="relative min-h-full px-8 pt-8 pb-0 overflow-hidden">
      <div className="flex flex-col h-[630px]">

        {/* Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[880px] h-[780px] bg-[#2699aa] opacity-40 rounded-full right-[-200px] bottom-[-200px]" />
          <div className="absolute w-[580px] h-[580px] bg-[#30aabb] opacity-25 rounded-full right-[-120px] bottom-[-120px]" />
          <div className="absolute w-[420px] h-[420px] bg-[#2699aa] opacity-30 rounded-full left-[-80px] top-[-80px]" />
        </div>

        {/* Title */}
        <div className="relative z-10 mb-5">
          <h1 className="text-white text-[22px] font-semibold m-0">Create Brand</h1>
          <p className="text-[#90bcc4] text-[15px] mt-1">
            Enter brand details to create a new brand
          </p>
        </div>

        {/* Card */}
        <div
          className="relative z-10 bg-white w-full px-14 py-10 shadow-xl rounded-t-[20px] overflow-auto"
          style={{ height: 'calc(100% - 70px)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="flex gap-6 items-start">

              {/* Brand Name */}
              <div className="flex-1">
                <label className="text-sm text-gray-700">Brand Name</label>
                <input
                  type="text"
                  name="brandName"
                  value={form.brandName}
                  onChange={handleChange}
                  placeholder="Enter brand name"
                  className="w-full border-b border-gray-300 focus:border-teal-600 outline-none py-1 bg-transparent"
                />
                {fieldErrors.brandName && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.brandName}</p>
                )}
              </div>

              {/* Brand Image */}
              <div className="flex-1">
                <label className="text-sm text-gray-700">
                  Brand Image{' '}
                  <span className="text-gray-400 text-xs">(JPG · 1:1 ratio · max 4 MB)</span>
                </label>

                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 w-full h-[120px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 transition-colors"
                  >
                    <svg
                      className="w-8 h-8 text-gray-400 mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4l4 4"
                      />
                    </svg>
                    <p className="text-xs text-gray-400">Click to upload image</p>
                  </div>
                ) : (
                  <div className="mt-2 relative w-[120px] h-[120px]">
                    <img
                      src={imagePreview}
                      alt="Brand preview"
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {imageError && (
                  <p className="text-red-600 text-xs mt-1">{imageError}</p>
                )}
              </div>
            </div>

            {error && <p className="text-red-600 text-xs">{error}</p>}
            {success && <p className="text-green-600 text-xs">{success}</p>}

            {createdBrand?.brandName && (
              <div className="bg-gray-100 p-3 rounded text-xs">
                <p className="text-gray-600">Brand Created:</p>
                <p className="font-mono text-gray-900">{createdBrand.brandName}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/products/brands')}
                className="bg-[#0e5a6a] text-white text-md px-6 py-3 rounded hover:opacity-90"
              >
                View Brands
              </button>

              <button
                type="submit"
                disabled={loading || !!imageError}
                className="bg-[#2699aa] text-white text-md px-6 py-3 rounded hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save Brand'}
              </button>
            </div>

          </form>

          <p className="text-xs text-gray-500 mt-6 text-center">
            Powered by <strong>Alpha Devs</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

export default CreateBrand
