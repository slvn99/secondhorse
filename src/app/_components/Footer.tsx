"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { useEffect, useRef } from "react";

export default function Footer() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const setVar = () => {
      const h = el.offsetHeight;
      document.documentElement.style.setProperty("--footer-height", `${h}px`);
    };
    // initial
    requestAnimationFrame(setVar);
    // observe
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    // window resize (fonts/layout can reflow)
    const onResize = () => setVar();
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <footer
      ref={ref}
      className="fixed bottom-0 inset-x-0 z-[900] border-t border-neutral-800 bg-neutral-900/80 backdrop-blur text-neutral-300"
    >
      <div className="mx-auto flex flex-col sm:flex-row sm:h-12 max-w-6xl items-center justify-center sm:justify-between px-3 text-xs sm:text-sm py-2 gap-1 sm:gap-0">
        <div className="flex items-center gap-2">
          <span>SLVN</span>
          <span className="text-neutral-500">•</span>
          <span>&copy; {new Date().getFullYear()}</span>
          <span className="hidden sm:inline text-neutral-500">•</span>
          <span className="hidden sm:inline">All rights reserved</span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <a href="mailto:info@samvannoord.nl" className="hover:text-white transition-colors">
            info@samvannoord.nl
          </a>
          <a href="tel:+31628147619" className="hover:text-white transition-colors">
            +31 6 - 2814 7619
          </a>
          <a
            href="https://www.linkedin.com/in/sam-van-noord-slvn/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
            title="LinkedIn"
            className="inline-flex items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs hover:bg-neutral-700"
          >
            <FontAwesomeIcon icon={faLinkedin as IconProp} className="h-3.5 w-3.5" />
          </a>
        </div>
        {/* Mobile contact row */}
        <div className="flex sm:hidden items-center gap-3 mt-1">
          <a href="mailto:info@samvannoord.nl" className="hover:text-white transition-colors">
            info@samvannoord.nl
          </a>
          <span className="text-neutral-500">•</span>
          <a href="tel:+31628147619" className="hover:text-white transition-colors">
            +31 6 - 2814 7619
          </a>
        </div>
        {/* Mobile rights text */}
        <div className="sm:hidden text-[11px] text-neutral-400">
          All rights reserved
        </div>
      </div>
    </footer>
  );
}
