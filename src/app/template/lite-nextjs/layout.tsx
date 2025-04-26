export const metadata = {
    title: "Lite Preview",
  };
  
  export default function LiteLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-gray-50 p-4">
          {children}
        </body>
      </html>
    );
  }
  