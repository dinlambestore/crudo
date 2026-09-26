import "./globals.css";

export const metadata = {
  title: "CRUDO — Indumentaria",
  description: "Tienda online de indumentaria",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
