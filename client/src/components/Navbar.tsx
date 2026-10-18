import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";

const navLinks = ["Home", "Services", "Work", "Process", "Support", "Contact"];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id.toLowerCase());
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        paddingTop: scrolled ? "0.75rem" : "1.25rem",
        paddingBottom: scrolled ? "0.75rem" : "1.25rem",
      }}
    >
      <div
        className="mx-auto max-w-7xl px-6 flex items-center justify-between transition-all duration-500"
        style={{
          background: scrolled ? "rgba(8,8,12,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          borderRadius: scrolled ? "1rem" : "0",
          border: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
          padding: scrolled ? "0.75rem 1.5rem" : undefined,
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#4285F4] via-[#EA4335] to-[#34A853] opacity-90" />
            <div className="absolute inset-[2px] rounded-[6px] bg-[#08080c] flex items-center justify-center">
              <span
                className="text-white font-bold text-xs"
                style={{ fontFamily: "Manrope" }}
              >
                P
              </span>
            </div>
          </div>
          <span
            className="text-white font-semibold text-[15px] tracking-tight"
            style={{ fontFamily: "Manrope" }}
          >
            Pixelerion
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link}
              onClick={() => scrollTo(link)}
              className="px-4 py-2 text-sm text-[#9898a8] hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
              style={{ fontFamily: "Inter" }}
            >
              {link}
            </button>
          ))}
        </div>

        {/* Customer Portal button */}
        <Link
          to="/portal/login"
          className="hidden md:flex items-center relative px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
          style={{ fontFamily: "Manrope", background: "rgba(19,19,24,0.9)" }}
        >
          <span className="absolute inset-0 rounded-xl btn-portal-border pointer-events-none" />
          Customer Portal
        </Link>

        {/* Mobile menu btn */}
        <button
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          className="md:hidden text-[#9898a8] hover:text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span
              className={`block h-0.5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`}
            />
            <span
              className={`block h-0.5 bg-current transition-all ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
            />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mx-4 mt-2 glass rounded-2xl p-4">
          {navLinks.map((link) => (
            <button
              key={link}
              onClick={() => scrollTo(link)}
              className="block w-full text-left px-4 py-3 text-sm text-[#9898a8] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {link}
            </button>
          ))}
          <Link
            to="/portal/login"
            onClick={() => setMenuOpen(false)}
            className="block mt-2 px-4 py-3 text-center text-sm font-medium text-white rounded-xl bg-gradient-to-r from-[#4285F4] to-[#34A853]"
          >
            Customer Portal
          </Link>
        </div>
      )}
    </nav>
  );
}
