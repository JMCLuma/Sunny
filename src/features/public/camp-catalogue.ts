/**
 * Presentation for each camp on the public site.
 *
 * The descriptions, age badges and logos are the ones already on the landing
 * page — this is the same content, keyed by program slug so a camp page and a
 * camp card cannot describe the same camp differently. Operational facts
 * (sessions, dates, who may apply) come from the repository; only the words
 * and the picture live here.
 */

export type CampInterest = "leadership" | "faith" | "outdoors" | "service" | "sports" | "academics";

export interface CampProfile {
  /** Matches `Program.slug`. */
  readonly slug: string;
  readonly name: string;
  readonly ageLabel: string | null;
  readonly description: string;
  readonly logo: string | null;
  readonly interests: readonly CampInterest[];
  readonly residential: boolean;
}

export const CAMP_INTEREST_LABELS: Readonly<Record<CampInterest, string>> = {
  leadership: "Leadership",
  faith: "Faith & ethics",
  outdoors: "Outdoors",
  service: "Service",
  sports: "Sports",
  academics: "Learning",
};

export const CAMPS: readonly CampProfile[] = [
  {
    slug: "mosaic",
    name: "Camp Mosaic",
    ageLabel: "Ages 6–13",
    description:
      "A week-long summer day camp that builds character, faith, and leadership through hands-on activities.",
    logo: "/camps/mosaic-logo.png",
    interests: ["leadership", "faith"],
    residential: false,
  },
  {
    slug: "embark",
    name: "Embark",
    ageLabel: "Ages 12–14",
    description:
      "A week-long residential camp for personal growth, leadership, and faith-based exploration.",
    logo: "/camps/embark-logo.png",
    interests: ["leadership", "outdoors", "faith"],
    residential: true,
  },
  {
    slug: "al-ummah",
    name: "Al-Ummah",
    ageLabel: "Ages 16–17",
    description:
      "A three-week residential camp for high school juniors and seniors, centered on leadership and faith.",
    logo: "/camps/al-ummah-logo.png",
    interests: ["leadership", "faith"],
    residential: true,
  },
  {
    slug: "olympia",
    name: "Camp Olympia",
    ageLabel: "Ages 11–14",
    description:
      "A sports and recreation program that promotes teamwork, discipline, and wellness through friendly competition.",
    logo: "/camps/olympia-logo.png",
    interests: ["sports"],
    residential: false,
  },
  {
    slug: "khidma",
    name: "Camp Khidma",
    ageLabel: "Ages 14–16",
    description:
      "A long-weekend leadership program rooted in service and ethics in the Ismaili Muslim tradition.",
    logo: null,
    interests: ["service", "leadership", "faith"],
    residential: true,
  },
  {
    slug: "roots",
    name: "Roots",
    ageLabel: null,
    description:
      "A four-day residential program focused on religious education tied to the IIS curriculum.",
    logo: "/camps/roots-logo.png",
    interests: ["faith", "academics"],
    residential: true,
  },
  {
    slug: "al-ilm",
    name: "Al-Ilm Retreat",
    ageLabel: null,
    description:
      "A three-day immersive retreat that deepens each participant's connection to faith and community.",
    logo: "/camps/al-ilm-logo.png",
    interests: ["faith", "academics"],
    residential: true,
  },
  {
    slug: "cpoi",
    name: "College Program on Islam",
    ageLabel: "Ages 18–25",
    description:
      "A week-long residential program for young adults, hosted at a leading university.",
    logo: "/camps/college-retreat-logo.png",
    interests: ["academics", "faith"],
    residential: true,
  },
];

const BY_SLUG = new Map(CAMPS.map((camp) => [camp.slug, camp]));

export function getCampProfile(slug: string): CampProfile | null {
  return BY_SLUG.get(slug) ?? null;
}

/** First letters, used when a camp has no logo file. */
export function campMonogram(name: string): string {
  const words = name
    .replace(/^Camp\s+/i, "")
    .split(/[\s-]+/)
    .filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}
