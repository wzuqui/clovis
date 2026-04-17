import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clóvis — O que o Clóvis Code fez pra te surpreender hoje?',
  description: 'Um log coletivo de experiências com o Claude Code',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
