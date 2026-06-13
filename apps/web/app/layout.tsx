import './globals.css';
import { AuthProvider } from '../components/AuthProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OpenDev',
  description: 'An AI-powered software development platform for building, hosting, deploying, and publishing apps.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
