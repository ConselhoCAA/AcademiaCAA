import './globals.css';

export const metadata = {
  title: 'Academia CAA | Formação para Transformar Nações',
  description: 'Plataforma de cursos, formação e desenvolvimento de líderes.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
