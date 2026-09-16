export function HeroSection() {
  return (
    <section className="relative isolate flex min-h-[70vh] items-center overflow-hidden">
      <img
        src="/hero-camp.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 size-full object-cover object-top"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/45 to-black/60"
      />
      <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
          Camps &amp; Programs for Personal Growth and Community
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
          Luma is the Jubilee Monuments Corp portal where families, participants, and staff explore
          programs, submit applications, and manage camp details in one place.
        </p>
        <button
          type="button"
          className="mt-8 inline-block w-full rounded-lg bg-primary px-10 py-4 text-lg font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:w-auto"
        >
          Apply Now!
        </button>
      </div>
    </section>
  );
}
