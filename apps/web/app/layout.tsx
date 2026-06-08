import './globals.css';
import { AuthProvider } from '../components/AuthProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Media',
  description: 'A full social media platform for creators, communities, live streams, and moderation teams.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
