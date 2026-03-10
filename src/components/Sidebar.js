'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, Receipt, Users, LogOut, Menu, X, ChefHat } from 'lucide-react'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/inventory',  icon: Package,         label: 'Inventory' },
  { href: '/sales',      icon: ShoppingCart,    label: 'Sales' },
  { href: '/expenses',   icon: Receipt,         label: 'Expenses' },
  { href: '/payroll',    icon: Users,           label: 'Payroll' },
]

export default function Sidebar({ children }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#0f0f0f]">
      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-60 z-30 flex flex-col bg-neutral-900 border-r border-neutral-800 transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-neutral-800">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30">
            <ChefHat size={17} className="text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-400/20 to-transparent" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">RestaurantOS</p>
            <p className="text-xs text-gray-500">Management Suite</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative ${
                  active
                    ? 'bg-gradient-to-r from-red-600/25 to-red-600/5 text-red-400 border border-red-600/20'
                    : 'text-gray-500 hover:text-gray-100 hover:bg-neutral-800 border border-transparent'
                }`}>
                <Icon size={16} className="shrink-0" />
                {label}
                {active && (
                  <>
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400 shadow-sm shadow-red-400" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-500 rounded-r-full" />
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-neutral-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all w-full border border-transparent hover:border-red-500/20">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3.5 bg-neutral-900 border-b border-neutral-800 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-md shadow-red-500/20">
              <ChefHat size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">RestaurantOS</span>
          </div>
          <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors">
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-5 md:p-6">{children}</main>
      </div>
    </div>
  )
}