import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: 'frevelgrube',
  description: 'ich fuge worte zusammen, eine mauer entsteht.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <noscript><style>{'.text-content { opacity: 1; }'}</style></noscript>
        <AuthProvider>
          <div className="page-wrapper">
            <Header />
            <main className="main-content">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
