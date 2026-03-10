// ============================================================
// MODAL — src/components/Modal.js
// ============================================================
'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', h)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', h)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="
        bg-neutral-900 border border-neutral-800 w-full sm:max-w-md
        rounded-t-2xl sm:rounded-2xl shadow-2xl
        animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95
        duration-200
      ">
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h2 className="font-semibold text-white text-sm">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-neutral-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}