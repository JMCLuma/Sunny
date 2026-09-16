import { createFileRoute } from "@tanstack/react-router";

import { HeroSection } from "@/components/landing/hero-section";
import { LearnAboutSection } from "@/components/landing/learn-about-section";
import { CampsSection } from "@/components/landing/camps-section";
import { SiteFooter } from "@/components/landing/site-footer";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
//
// Lives under the pathless `_public` layout (which renders SiteHeader); the
// URL is still "/" and the page content is unchanged.
export const Route = createFileRoute("/_public/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <CampsSection />
      <LearnAboutSection />
      <SiteFooter />
    </div>
  );
}
