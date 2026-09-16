import type { ReactNode } from "react";

import { SiteFooter } from "@/components/landing/site-footer";

export type LegalSection = {
  title: string;
  body: ReactNode;
};

type LegalPageProps = {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
};

/**
 * Shared shell for /terms and /privacy.
 *
 * Section numbers are derived from the array index rather than written into
 * the copy, which is what keeps them from drifting -- the original site had
 * two sections both numbered "5" because the numbers were hardcoded.
 */
export function LegalPage({ title, lastUpdated, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <ol className="space-y-10">
          {sections.map((section, index) => (
            <li key={section.title}>
              <h2 className="text-lg font-bold text-foreground">
                <span className="text-primary">{index + 1}.</span> {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_li]:pl-1 [&_strong]:font-bold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                {section.body}
              </div>
            </li>
          ))}
        </ol>
      </main>

      <SiteFooter />
    </div>
  );
}
