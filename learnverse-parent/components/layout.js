import Header from "./header";
import Footer from "./footer";

export default function Layout({ children }) {
  return (
    <>
      <Header />

      {/* FIX: Add padding to prevent overlap */}
      <main className="pt-[77px]" style={{ minHeight: "80vh" }}>
        {children}
      </main>

      <Footer />
    </>
  );
}
