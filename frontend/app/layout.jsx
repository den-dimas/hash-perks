import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "./(components)/layout/Navbar"; // Adjusted path
import { Web3Provider } from "@/contexts/Web3Context"; // Adjusted path
import { AuthProvider } from "@/contexts/AuthContext"; // Adjusted path

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "HashPerks",
  description: "Web3 Loyalty Program",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          <AuthProvider>
            <Navbar />
            <main className="container mx-auto p-4 md:p-6 min-h-[calc(100vh-6rem)] flex flex-col justify-center">
              {children}
            </main>
          </AuthProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
