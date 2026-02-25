import "./globals.css";
import Footer from "@/components/layout/Footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-govLight">
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}