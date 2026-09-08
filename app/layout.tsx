import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'EDVAC · The Stored Program', description: 'Explore memory, instructions, control, and arithmetic in an interactive EDVAC teaching model.' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
