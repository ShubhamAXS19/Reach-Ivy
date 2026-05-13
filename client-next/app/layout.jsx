import './globals.css'

export const metadata = {
  title: 'HelloIvy',
  description: 'AI Essay Brainstormer',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}