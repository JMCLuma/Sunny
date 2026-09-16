import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

const CONTACT_EMAIL = "info@jubileemonuments.org";

// Copy transcribed from the approved terms.html mockup. The mockup already
// corrects the live site's numbering bug (jmcusa.org/terms ships two sections
// numbered "5"); here numbering is derived from array order, so it cannot drift.
const sections: LegalSection[] = [
  {
    title: "Acceptance of Terms",
    body: (
      <p>
        By accessing or using the Jubilee Monuments Corp. camp portal (&ldquo;Portal&rdquo;), you
        agree to be bound by these Terms &amp; Conditions (&ldquo;Terms&rdquo;). If you do not
        agree, you may not use the Portal. We reserve the right to update these Terms at any time,
        and your continued use constitutes acceptance of any changes.
      </p>
    ),
  },
  {
    title: "Eligibility",
    body: (
      <p>
        The Portal is intended for parents, legal guardians, campers, healthcare professionals, and
        camp staff associated with Jubilee Monuments Corp. camp programs. You must be at least 18
        years old to create an account. By registering on behalf of a minor, you represent that you
        are their parent or legal guardian.
      </p>
    ),
  },
  {
    title: "Account Responsibilities",
    body: (
      <p>
        You are responsible for maintaining the confidentiality of your login credentials and for
        all activity that occurs under your account. You agree to notify us immediately of any
        unauthorized use. Jubilee Monuments Corp. is not liable for losses arising from unauthorized
        access to your account.
      </p>
    ),
  },
  {
    title: "Camp Program Participation",
    body: (
      <p>
        Participation in camp programs is subject to completion of all required forms, including
        health forms, waivers, travel information, and payment. Jubilee Monuments Corp. reserves the
        right to deny participation if required documentation is not completed by the applicable
        deadlines.
      </p>
    ),
  },
  {
    title: "Health Data & HIPAA Consent",
    body: (
      <p>
        By submitting health forms through this Portal, you consent to the collection, use, and
        storage of Protected Health Information (PHI) as described in our Privacy Policy. PHI will
        be handled in accordance with the Health Insurance Portability and Accountability Act
        (HIPAA). You acknowledge that authorized camp staff and healthcare professionals may access
        PHI to ensure the safety and well-being of campers. You may revoke this consent at any time
        by contacting us in writing; however, revocation does not apply to PHI already disclosed in
        reliance on your prior consent.
      </p>
    ),
  },
  {
    title: "Limitation of Liability",
    body: (
      <p>
        To the fullest extent permitted by law, Jubilee Monuments Corp., its directors, employees,
        and affiliates shall not be liable for any indirect, incidental, special, consequential, or
        punitive damages arising from your use of the Portal or participation in camp programs. Our
        total liability shall not exceed the fees paid by you for the applicable camp session.
      </p>
    ),
  },
  {
    title: "Assumption of Risk",
    body: (
      <p>
        Camp activities involve inherent risks, including but not limited to physical injury,
        illness, and exposure to outdoor elements. By enrolling a camper, you acknowledge and
        voluntarily assume these risks. The waiver signed through this Portal constitutes your
        informed consent.
      </p>
    ),
  },
  {
    title: "Payment & Refund Policy",
    body: (
      <p>
        Program fees are due by the deadlines specified for each camp session. Refund requests must
        be submitted in writing at least 30 days before the camp start date for a full refund.
        Requests made 15&ndash;29 days prior are eligible for a 50% refund. No refunds are issued
        for requests made fewer than 15 days before the start date or for no-shows. Financial
        assistance decisions are made at the sole discretion of Jubilee Monuments Corp.
      </p>
    ),
  },
  {
    title: "Intellectual Property",
    body: (
      <p>
        All content, branding, and materials on the Portal are the intellectual property of Jubilee
        Monuments Corp. You may not reproduce, distribute, or create derivative works from Portal
        content without prior written consent.
      </p>
    ),
  },
  {
    title: "Termination",
    body: (
      <p>
        We reserve the right to suspend or terminate your account at any time for violation of these
        Terms or for conduct that we deem harmful to other users, camp operations, or Jubilee
        Monuments Corp. Upon termination, your right to use the Portal ceases immediately.
      </p>
    ),
  },
  {
    // NOTE: the mockup and the live site both say New York, while JMC is
    // headquartered in Houston, TX. Left verbatim on purpose -- changing a
    // governing-law clause is a decision for JMC, not a frontend fix.
    title: "Governing Law",
    body: (
      <p>
        These Terms are governed by and construed in accordance with the laws of the State of New
        York, without regard to conflict of law principles. Any disputes shall be resolved in the
        courts located in New York County, New York.
      </p>
    ),
  },
  {
    title: "Contact",
    body: (
      <p>
        If you have questions about these Terms, please contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

export const Route = createFileRoute("/_public/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Luma by Jubilee Monuments Corp" },
      {
        name: "description",
        content:
          "Terms and conditions governing use of the Jubilee Monuments Corp. camp portal, including eligibility, HIPAA consent, and refund policy.",
      },
    ],
  }),
  component: Terms,
});

function Terms() {
  return <LegalPage title="Terms & Conditions" lastUpdated="March 11, 2026" sections={sections} />;
}
