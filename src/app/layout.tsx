import type { Metadata } from 'next'
import { DM_Sans, DM_Mono, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
})
const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['400', '500'],
})
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['700', '800'],
})

export const metadata: Metadata = {
  title: 'Proyecto Vivo · Demo',
  description: 'El project manager que todo despacho necesita. Agente IA para despachos de arquitectura e ingeniería en México.',
  openGraph: {
    title: 'Proyecto Vivo · Demo',
    description: 'El project manager que todo despacho necesita.',
    type: 'website',
    locale: 'es_MX',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Proyecto Vivo · Demo',
    description: 'El project manager que todo despacho necesita.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`dark ${dmSans.variable} ${dmMono.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-[#0C1F35] text-[#F8FAFB]">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
