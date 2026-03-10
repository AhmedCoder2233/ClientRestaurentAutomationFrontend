'use client'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1a1a', color: '#e5e5e5', border: '1px solid #333', fontSize: '14px' },
            success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}