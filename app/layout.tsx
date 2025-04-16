import { SocketProvider } from "@/components/SocketProvider";
import "./globals.css";

export const metadata = {
  title: "echo | Messaging App",
  description: "Chat instantly with Echo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="overflow-x-hidden dark">
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  );
}
