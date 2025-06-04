import { Inter } from "next/font/google"; // Still needed for font definition
import ClientRootLayout from "./_layout"; // Import the actual client layout component

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// Metadata export for the Server Component
export const metadata = {
  title: "HashPerks | Modern Loyalty Rewards",
  description: "Decentralized Loyalty Rewards Platform on the Blockchain",
};

// This is the root layout for the application.
// It renders the ClientRootLayout which contains all the client-side logic and providers.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Apply the font to the body here, as it's a server component. */}
      {/* The actual client-side layout will be rendered inside. */}
      <body className={`${inter.className} bg-slate-50`}>
        <ClientRootLayout>{children}</ClientRootLayout>
      </body>
    </html>
  );
}
