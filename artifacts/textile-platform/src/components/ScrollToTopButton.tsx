import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const SIZE = 48;          // px — button diameter
const STROKE = 2.5;       // px — ring stroke width
const RADIUS = (SIZE / 2) - STROKE - 1;   // circle radius inside the SVG
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Floating scroll-to-top button.
 * - Hidden until the user scrolls > 300 px.
 * - The outer ring fills clockwise as the user scrolls down the page.
 * - Clicking smoothly scrolls back to the top.
 */
export function ScrollToTopButton() {
  const [scrollPct, setScrollPct] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      setScrollPct(pct);
      setVisible(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initialise on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dashOffset = CIRCUMFERENCE * (1 - scrollPct);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className={`
        fixed bottom-6 right-6 z-50
        w-12 h-12 rounded-full
        bg-white shadow-md
        flex items-center justify-center
        transition-all duration-300 ease-out
        hover:shadow-lg hover:scale-110 active:scale-95
        ${visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"}
      `}
    >
      {/* SVG progress ring */}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        fill="none"
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        {/* track (background ring) */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#e5e7eb"
          strokeWidth={STROKE}
        />
        {/* fill ring — grows as page scrolls */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="hsl(var(--primary))"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 80ms linear" }}
        />
      </svg>

      {/* Arrow icon */}
      <ArrowUp className="w-4 h-4 relative z-10" style={{ color: "hsl(var(--primary))" }} />
    </button>
  );
}
