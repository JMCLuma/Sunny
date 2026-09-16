import { ArrowRight } from "lucide-react";

import { PlaceholderIllustration } from "./placeholder-illustration";

// Sourced from https://jmcusa.org/about ("By the Numbers").
const facts = [
  { stat: "44", label: "Years of impact", detail: "Founded 1982." },
  { stat: "4,000+", label: "Youth served each year", detail: "Coast to coast." },
  { stat: "30+", label: "Camps per year", detail: "Nationwide programming." },
  { stat: "6–25", label: "Ages covered", detail: "Elementary through college." },
];

const cards = [
  { label: "About Jubilee Monuments Corp", image: "/card-programs.jpg" },
  { label: "Volunteer with JMC", image: "/card-involved.jpg" },
  { label: "Contact JMC", image: "/card-contact.jpg" },
];

export function LearnAboutSection() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            About JMC
          </span>
          <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
            Jubilee Monuments Corp at a glance
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            For 44 years, JMC has supported the academic, intellectual, religious, and social
            development of American-Ismaili Muslim youth through programs across the country.
          </p>
        </div>

        <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <dt className="text-3xl font-bold text-primary">{fact.stat}</dt>
              <dd className="mt-1 text-sm font-bold text-foreground">{fact.label}</dd>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{fact.detail}</dd>
            </div>
          ))}
        </dl>

        <div className="mx-auto mt-14 max-w-2xl text-center">
          <h3 className="text-xl font-bold text-foreground">Learn more and get involved</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Explore our mission, meet the people behind our programs, or connect with the JMC team.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {cards.map((card) => (
            <button
              key={card.label}
              type="button"
              className="group relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {card.image ? (
                <img
                  src={card.image}
                  alt={card.label}
                  className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <PlaceholderIllustration className="absolute inset-0 size-full" />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 text-lg font-bold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.5)]">
                {card.label}
                <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
