import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter } from "@/components/landing/site-footer";
import { Button } from "@/components/ui/button";

/*
 * CONTENT STATUS -- needs a review pass before launch.
 *
 * There is no approved about.html mockup (unlike terms/privacy/contact), so
 * this page was rebuilt from jmcusa.org/about. Headings, stats, EIN, address,
 * and email are verified against that source. The connecting prose is a
 * faithful reconstruction, not a verbatim transcription -- have JMC confirm
 * the wording.
 *
 * Stats intentionally match learn-about-section.tsx on the landing page
 * (44 years / 4,000+ / 30+ / ages 6-25). The live site's About page still
 * says "40 Years" while also saying "founded in 1982", which contradicts
 * itself; the landing-page numbers are the correct ones.
 */

const CONTACT_EMAIL = "info@jubileemonuments.org";

const facts = [
  { stat: "44", label: "Years of impact", detail: "Founded 1982." },
  { stat: "4,000+", label: "Youth served each year", detail: "Coast to coast." },
  { stat: "30+", label: "Camps per year", detail: "Nationwide programming." },
  { stat: "6–25", label: "Ages covered", detail: "Elementary through college." },
];

const operations = [
  {
    title: "Full-time residential staff",
    detail:
      "Counselors, senior staff, and program facilitators live on site for the length of each session, providing mentorship and round-the-clock care.",
  },
  {
    title: "Health & safety compliance",
    detail:
      "State licensing, workers' compensation insurance, and health protocols are maintained for every program we run.",
  },
  {
    title: "Transportation logistics",
    detail:
      "A small year-round team coordinates travel, sites, and catering so families and volunteers can focus on the experience itself.",
  },
];

export const Route = createFileRoute("/_public/about")({
  head: () => ({
    meta: [
      { title: "About JMC — Luma by Jubilee Monuments Corp" },
      {
        name: "description",
        content:
          "Jubilee Monuments Corp is a 501(c)(3) nonprofit founded in 1982, dedicated to the academic, intellectual, religious, and social development of American-Ismaili Muslim youth.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Est. 1982 &middot; 501(c)(3) Nonprofit
          </span>
          <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            About Jubilee Monuments Corp
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Jubilee Monuments Corp (JMC) is a 501(c)(3) nonprofit organization founded in 1982 and
            headquartered in Houston, Texas. Over the last 44 years, JMC has evolved into a national
            nonprofit dedicated to the academic, intellectual, religious, and social development of
            American-Ismaili Muslim youth.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/donate">Support Our Work</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            By the numbers
          </h2>
          <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <dt className="text-3xl font-bold text-primary">{fact.stat}</dt>
                <dd className="mt-1 text-sm font-bold text-foreground">{fact.label}</dd>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {fact.detail}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              What We Do
            </span>
            <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
              Transformative camp experiences that build leadership, friendships, and purpose.
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                Every year, JMC brings together thousands of young people for transformative camp
                experiences that build leadership, friendships, and purpose. Programs are designed
                for distinct age groups &mdash; elementary through college &mdash; each with its own
                focus, and they run year-round with the heaviest concentration in the summer.
              </p>
              <p>
                JMC serves youth from coast to coast. Individual camps host between 50 and 100+
                participants per session, with staff-to-camper ratios maintained throughout. We are
                committed to making these experiences accessible regardless of financial
                circumstances, and we maintain a robust subsidy process for families who need
                support.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            How We Operate
          </span>
          <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
            Volunteer-driven. Mission-obsessed.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            JMC is a largely volunteer-driven organization. Behind the scenes, a small team manages
            licensing, compliance, transportation, and financial stewardship. In 2026 we are
            launching Luma, our own platform for registration, health tracking, payments, incident
            reporting, and family communication.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {operations.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Governance &amp; Transparency
            </span>
            <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
              Accountable in every direction.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Jubilee Monuments Corp operates under an active Board of Directors with oversight from
              senior leadership. The organization maintains required state licensing, workers&rsquo;
              compensation insurance, and nonprofit tax-exempt status. Financial operations follow
              structured approval workflows, with established vendor partnerships for
              transportation, sites, and catering.
            </p>
            <p className="mt-5 text-sm text-muted-foreground">
              <span className="font-bold text-foreground">EIN:</span> 52-1395130
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Contact Us
          </span>
          <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
            We&rsquo;d love to hear from you.
          </h2>
          <address className="mt-6 space-y-0.5 text-sm not-italic leading-relaxed text-muted-foreground">
            <p className="font-bold text-foreground">Jubilee Monuments Corp</p>
            <p>2323 Allen Parkway</p>
            <p>Houston, TX 77019</p>
          </address>
          <p className="mt-4 text-sm text-muted-foreground">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/donate">Donate to JMC</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/contact">Send a message</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
