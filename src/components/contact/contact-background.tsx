function ContactBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base wash — anchors the page tone in each mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-champagne/8 via-transparent to-cashmere/40 dark:from-champagne/12 dark:via-transparent dark:to-espresso/60" />

      {/* Soft gradient orbs */}
      <div className="absolute -left-32 top-0 h-[480px] w-[480px] rounded-full bg-champagne/25 blur-3xl dark:bg-champagne/20" />
      <div className="absolute -right-24 top-1/3 h-[360px] w-[360px] rounded-full bg-cashmere blur-3xl dark:bg-champagne-light/15" />
      <div className="absolute bottom-0 left-1/2 h-[320px] w-[640px] -translate-x-1/2 rounded-full bg-champagne/20 blur-3xl dark:bg-champagne-dark/25" />

      {/* Geometric line pattern */}
      <svg
        className="absolute inset-0 h-full w-full text-champagne-dark/25 dark:text-champagne-light/18"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="contact-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#contact-grid)" />
      </svg>

      {/* Decorative arcs */}
      <svg
        className="absolute -right-16 top-24 hidden h-[420px] w-[420px] text-champagne-dark/40 dark:text-champagne/45 lg:block"
        viewBox="0 0 420 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="210" cy="210" r="180" stroke="currentColor" strokeWidth="1" />
        <circle cx="210" cy="210" r="130" stroke="currentColor" strokeWidth="0.75" strokeDasharray="6 10" />
        <circle cx="210" cy="210" r="80" stroke="currentColor" strokeWidth="0.5" />
        <path
          d="M210 30 C310 90 360 190 330 290"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M60 210 C120 110 220 60 320 90"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.65"
        />
      </svg>

      {/* Abstract connection motif */}
      <svg
        className="absolute left-8 bottom-32 hidden h-48 w-48 text-champagne-dark/45 dark:text-champagne-light/40 xl:block"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="4" fill="currentColor" />
        <circle cx="60" cy="70" r="2.5" fill="currentColor" opacity="0.75" />
        <circle cx="140" cy="85" r="2.5" fill="currentColor" opacity="0.75" />
        <circle cx="85" cy="140" r="2" fill="currentColor" opacity="0.55" />
        <circle cx="130" cy="130" r="2" fill="currentColor" opacity="0.55" />
        <path
          d="M60 70 L100 100 L140 85 M100 100 L85 140 M100 100 L130 130"
          stroke="currentColor"
          strokeWidth="0.75"
          opacity="0.55"
        />
      </svg>

      {/* Bottom edge fade — keeps graphics from clipping harshly */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

export { ContactBackground };
