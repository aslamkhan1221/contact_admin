
'use client'
// app/conditional-layout.tsx
import './main.css'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { FiHome, FiSettings, FiUser, FiMenu } from 'react-icons/fi'

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let [sidebar, setSidebar] = useState(true)
  const pathname = usePathname()

  if (pathname === '/login') {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}

        <aside className={`w-64 ${sidebar ? "" : "hidden"} bg-white shadow-md `}>

          <div className="p-4 font-bold text-lg border-b">Contact Admin</div>
          <nav className="p-4">
            <ul className="space-y-2 ">
              <li>
                <Link href="/" className="flex items-center gap-3 p-2 rounded hover:bg-gray-200 text-gray-800">
                  <FiHome className="text-xl" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin/contacts" className="flex items-center gap-3 p-2 rounded hover:bg-gray-200 text-gray-800">
                  <FiUser className="text-xl" />
                  Contacts
                </Link>
              </li>
              <li>
                <Link href="/" className="flex items-center gap-3 p-2 rounded hover:bg-gray-200 text-gray-800">
                  <FiSettings className="text-xl" />
                  Settings
                </Link>
              </li>

            </ul>
          </nav>

        </aside>

        {/* Main Content */}
        <main className="flex-1 ">
          <div className="bg-white p-4 font-bold text-lg border-b"><button onClick={() => { setSidebar(!sidebar) }}><FiMenu /></button></div>
          <div className='p-4'>
            <div className="bg-white rounded shadow p-6">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
