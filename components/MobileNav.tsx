"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/guides", label: "Guides" },
  { href: "/problems", label: "Fix a Problem" },
  { href: "/cities", label: "Cities" },
  { href: "/ready", label: "Get Ready" },
  { href: "/search", label: "Search" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] transition"
      >
        {open ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 4l12 12M16 4L4 16" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        )}
      </button>

      <nav
        id="mobile-nav-panel"
        aria-label="Mobile navigation"
        className={`absolute inset-x-0 top-full border-b border-[var(--border)] bg-[var(--background)] shadow-lg ${
          open ? "block" : "hidden"
        }`}
      >
        <ul className="container-page flex flex-col py-2">
          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`block px-3 py-3 rounded-lg text-base font-medium transition ${
                    active
                      ? "text-[var(--brand-primary)] bg-[var(--brand-primary)]/5"
                      : "text-[var(--foreground)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5"
                  } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
