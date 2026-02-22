import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kisan Shyok Portal | Government of India',
  description: 'Official portal for farmer registration, scheme access and application tracking',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* OLD GOV STYLE → minimal font loading */}
        <link
          href="https://fonts.googleapis.com/css2?family=Arial&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="gov-body">
        {children}
      </body>
    </html>
  )
}