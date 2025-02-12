import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Update Password',
  description: 'Update your password',
}

export default function UpdatePasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 