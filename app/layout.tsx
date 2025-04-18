import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Mulish } from "next/font/google";
import "./globals.css";
import favicon from "/public/favicon.png";

const mulish = Mulish({
  subsets: ["latin-ext"],
});

export const metadata = {
  title: "Finance.ai",
  description: "Gestor financeiro simples e eficiente",
  icons: [{ rel: "icon", url: favicon.src }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${mulish.className} dark antialiased`}>
        <ClerkProvider
          appearance={{
            baseTheme: dark,
          }}
        >
          <div className="flex h-full flex-col overflow-hidden">{children}</div>
        </ClerkProvider>
      </body>
    </html>
  );
}
