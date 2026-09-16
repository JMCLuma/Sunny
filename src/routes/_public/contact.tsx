import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { SiteFooter } from "@/components/landing/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Camp list from the approved contact.html mockup. This is the corrected
// roster -- the live site still lists placeholders ("Sample Camp 1") and
// split sessions ("Al-Ummah Camp 1 / 2", "Embark 1 / 2").
const CAMPS = [
  "Camp Mosaic",
  "Camp Phoenix",
  "Camp Embark",
  "Camp Olympia",
  "Camp Khidma",
  "Changemakers",
  "Camp Roots",
  "Camp Al-Ummah",
  "Al-Ilm Retreat",
  "College Retreat",
  "College Program on Islam",
] as const;

const fieldClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      *
    </span>
  );
}

export const Route = createFileRoute("/_public/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Luma by Jubilee Monuments Corp" },
      {
        name: "description",
        content:
          "Questions about a JMC camp? Send us a message and we'll route it to the right team.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    // Honeypot: real people never fill a hidden field. Bots do. Pretend the
    // send succeeded so the bot has nothing to learn from the response.
    if (data["website"]) {
      setSubmitted(true);
      return;
    }

    setSubmitting(true);
    // TODO(backend): POST to the contact endpoint (Supabase function or email
    // relay) and route by `data.camp`. Until that exists the form validates and
    // shows the success state, but the message is not delivered anywhere.
    console.warn("Contact form submitted — no backend wired up yet.", data);
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Contact Us</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Have a question? Select the camp you need help with and we&rsquo;ll route your message
            to the right team.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:py-16">
        {submitted ? (
          <div
            role="status"
            className="rounded-xl border border-border bg-card p-8 text-center shadow-sm"
          >
            <h2 className="text-xl font-bold text-foreground">Message sent!</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Thanks for reaching out &mdash; our team will get back to you soon.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <h2 className="text-lg font-bold text-foreground">Send Us a Message</h2>

            {/*
              Honeypot. Hidden from sighted users, screen readers, and the tab
              order -- only automated submissions ever populate it.
            */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input id="contact-website" name="website" type="text" tabIndex={-1} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-name">
                Full Name <RequiredMark />
              </Label>
              <Input id="contact-name" name="name" autoComplete="name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">
                Email <RequiredMark />
              </Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-camp">
                Camp <RequiredMark />
              </Label>
              <select id="contact-camp" name="camp" required defaultValue="" className={fieldClass}>
                <option value="" disabled>
                  Select a camp
                </option>
                {CAMPS.map((camp) => (
                  <option key={camp} value={camp}>
                    {camp}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-subject">
                Subject <RequiredMark />
              </Label>
              <Input id="contact-subject" name="subject" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-message">
                Message <RequiredMark />
              </Label>
              <Textarea id="contact-message" name="message" rows={6} required />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Fields marked with an asterisk (<span className="text-destructive">*</span>) are
                required.
              </p>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send Message"}
              </Button>
            </div>
          </form>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
