import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { Suspense } from "react";
import Loading from "./rashi/[name]/loading";
import ClientLayout from "./ClientLayout";
import ClientPathname from "./components/ClientPathname"; // Import the client component

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "𝒮𝑜𝒷𝒽𝒶𝑔𝓎𝒶",
  description: "Your trusted astrology consultation platform",
  icons: {
    icon: "/image 1.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={<Loading />}>
          <Header />
          <ClientLayout>
            <main className="min-h-screen">{children}</main>
          </ClientLayout>

         <Footer />
          
      
        </Suspense>
      </body>
    </html>
  );
}
