// File: ./frontend/app/layout.jsx
import { Inter } from "next/font/google";
import "./globals.css";
import ClientRootLayout from "./_layout"; // Import the client-side layout

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "HashPerks",
  description: "Web3 Loyalty Program",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {" "}
        {/* Apply font class here */}
        <ClientRootLayout>{children}</ClientRootLayout>
      </body>
    </html>
  );
}
