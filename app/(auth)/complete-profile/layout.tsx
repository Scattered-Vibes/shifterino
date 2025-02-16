import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Complete Profile',
  description: 'Complete your profile to continue',
}

export default function CompleteProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 