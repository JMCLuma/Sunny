import { useState } from "react";

import { cn } from "@/lib/utils";

type Camp = {
  name: string;
  // Age range only; omit to hide the badge.
  tag?: string;
  description: string;
  // Drop a file in /public and set its path here to replace the monogram.
  logo?: string;
};

const camps: Camp[] = [
  {
    name: "Camp Mosaic",
    tag: "Ages 6–13",
    description:
      "A week-long summer day camp that builds character, faith, and leadership through hands-on activities.",
    logo: "/camps/mosaic-logo.png",
  },
  {
    name: "Embark",
    tag: "Ages 12–14",
    description:
      "A week-long residential camp for personal growth, leadership, and faith-based exploration.",
    logo: "/camps/embark-logo.png",
  },
  {
    name: "Al-Ummah",
    tag: "Ages 16–17",
    description:
      "A three-week residential camp for high school juniors and seniors, centered on leadership and faith.",
    logo: "/camps/al-ummah-logo.png",
  },
  {
    name: "Camp Olympia",
    tag: "Ages 11–14",
    description:
      "A sports and recreation program that promotes teamwork, discipline, and wellness through friendly competition.",
    logo: "/camps/olympia-logo.png",
  },
  {
    name: "Camp Phoenix",
    tag: "Grades 7–8",
    description: "A residential summer camp for girls in grades 7–8.",
    logo: "/camps/phoenix-logo.png",
  },
  {
    name: "Camp Khidma",
    tag: "Ages 14–16",
    description:
      "A long-weekend leadership program rooted in service and ethics in the Ismaili Muslim tradition.",
  },
  {
    name: "Roots",
    description:
      "A four-day residential program focused on religious education tied to the IIS curriculum.",
    logo: "/camps/roots-logo.png",
  },
  {
    name: "Al-Ilm Retreat",
    description:
      "A three-day immersive retreat that deepens each participant's connection to faith and community.",
    logo: "/camps/al-ilm-logo.png",
  },
  {
    name: "College Retreat",
    description:
      "A weekend for first- and second-year college students, covering faith, career, and wellbeing.",
    logo: "/camps/college-retreat-logo.png",
  },
  {
    name: "College Program on Islam",
    tag: "Ages 18–25",
    description:
      "A week-long residential program for young adults, hosted at a leading university.",
  },
  {
    name: "Changemakers",
    tag: "Ages 15–17",
    description:
      "A residential service-learning and leadership program for youth ready to make an impact.",
    logo: "/camps/changemakers.svg",
  },
];

function monogram(name: string) {
  const words = name
    .replace(/^Camp\s+/i, "")
    .split(/[\s-]+/)
    .filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

function CampCard({ camp }: { camp: Camp }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(camp.logo) && !logoFailed;
  return (
    <article className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm transition-transform group-hover:scale-105",
            showLogo ? "border border-border bg-white" : "border border-primary/20 bg-primary/10",
          )}
        >
          {showLogo ? (
            <img
              src={camp.logo}
              alt={`${camp.name} logo`}
              className="size-full object-contain p-1.5"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span className="text-sm font-bold text-primary">{monogram(camp.name)}</span>
          )}
        </div>
        {camp.tag ? (
          <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {camp.tag}
          </span>
        ) : null}
      </div>
      <h3 className="text-xl font-bold tracking-tight text-foreground">{camp.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {camp.description}
      </p>
    </article>
  );
}

export function CampsSection() {
  return (
    <section id="camps" className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Our Camps
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Explore our camps
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          From day camps to residential retreats, JMC runs programs for every age and stage. Find
          the one that fits.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {camps.map((camp) => (
          <CampCard key={camp.name} camp={camp} />
        ))}
      </div>
    </section>
  );
}
