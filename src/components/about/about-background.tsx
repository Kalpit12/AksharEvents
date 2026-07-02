function AboutBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-champagne/10 via-transparent to-cashmere/35 dark:from-champagne/14 dark:via-transparent dark:to-espresso/55" />

      <div className="absolute -right-20 -top-16 h-[420px] w-[420px] rounded-full bg-champagne/30 blur-3xl dark:bg-champagne/22" />
      <div className="absolute -left-24 top-1/4 h-[380px] w-[380px] rounded-full bg-cashmere blur-3xl dark:bg-champagne-light/12" />
      <div className="absolute bottom-12 right-1/4 h-[280px] w-[560px] rounded-full bg-champagne/18 blur-3xl dark:bg-champagne-dark/20" />

      <svg
        className="absolute inset-0 h-full w-full text-champagne-dark/20 dark:text-champagne-light/14"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="about-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M 56 0 L 0 0 0 56" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#about-grid)" />
      </svg>

      <svg
        className="absolute -left-12 top-32 hidden h-[380px] w-[380px] text-champagne-dark/35 dark:text-champagne/40 lg:block"
        viewBox="0 0 380 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="190" cy="190" r="160" stroke="currentColor" strokeWidth="1" />
        <circle cx="190" cy="190" r="110" stroke="currentColor" strokeWidth="0.75" strokeDasharray="5 9" />
        <path
          d="M190 30 C290 100 340 200 300 310"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      <svg
        className="absolute right-12 bottom-40 hidden h-40 w-40 text-champagne-dark/40 dark:text-champagne-light/35 xl:block"
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="80" cy="80" r="3" fill="currentColor" />
        <circle cx="40" cy="55" r="2" fill="currentColor" opacity="0.7" />
        <circle cx="115" cy="65" r="2" fill="currentColor" opacity="0.7" />
        <circle cx="65" cy="115" r="1.5" fill="currentColor" opacity="0.55" />
        <path
          d="M40 55 L80 80 L115 65 M80 80 L65 115"
          stroke="currentColor"
          strokeWidth="0.75"
          opacity="0.5"
        />
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

export { AboutBackground };
