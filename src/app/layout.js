import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import I18nProvider from "@/components/I18nProvider"

export const metadata = {
  title: "MediCare Hospital - Management System",
  description: "Professional hospital management system for patients, doctors, and administrators",
  generator: "v0.app",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="font-sans antialiased">
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
