import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

const CONTACT_EMAIL = "info@jubileemonuments.org";

// Copy transcribed from the approved privacy.html mockup.
const sections: LegalSection[] = [
  {
    title: "Information We Collect",
    body: (
      <>
        <p>We collect the following categories of information through the Portal:</p>
        <ul>
          <li>
            <strong>Personal identifiers:</strong> name, email address, phone number, mailing
            address
          </li>
          <li>
            <strong>Child/camper information:</strong> name, date of birth, emergency contacts
          </li>
          <li>
            <strong>Protected Health Information (PHI):</strong> medical history, allergies,
            medications, immunization records, dietary restrictions, and behavioral health notes
          </li>
          <li>
            <strong>Travel information:</strong> arrival/departure details, transportation
            preferences
          </li>
          <li>
            <strong>Payment information:</strong> processed securely through third-party payment
            processors; we do not store full credit card numbers
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "How We Use Your Information",
    body: (
      <>
        <p>We use the information we collect for the following purposes:</p>
        <ul>
          <li>Camp enrollment, administration, and communication with families</li>
          <li>
            Health and safety management during camp programs, including medical treatment
            coordination
          </li>
          <li>Compliance with legal and regulatory obligations, including HIPAA and COPPA</li>
          <li>
            Improving Portal functionality and user experience (using anonymized, aggregate data
            only)
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "How We Share Information",
    body: (
      <>
        <p>We do not sell your personal information. We may share information with:</p>
        <ul>
          <li>
            Authorized camp staff and healthcare professionals who require access for camper safety
            and care (subject to HIPAA minimum necessary standard)
          </li>
          <li>
            Third-party service providers who assist with Portal operations, subject to Business
            Associate Agreements (BAAs) that require HIPAA-compliant data handling
          </li>
          <li>
            Law enforcement or regulatory agencies when required by law, court order, or to protect
            the safety of campers
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "HIPAA Compliance",
    body: (
      <>
        <p>
          Jubilee Monuments Corp. is committed to protecting the privacy and security of Protected
          Health Information (PHI) in accordance with the Health Insurance Portability and
          Accountability Act (HIPAA). Our HIPAA compliance program includes:
        </p>
        <ul>
          <li>
            <strong>Administrative safeguards:</strong> workforce training, access management
            policies, designated Privacy and Security Officers, and regular risk assessments
          </li>
          <li>
            <strong>Physical safeguards:</strong> secure storage facilities, workstation security
            controls, and restricted physical access to systems containing PHI
          </li>
          <li>
            <strong>Technical safeguards:</strong> encryption of PHI at rest and in transit
            (AES-256/TLS 1.2+), role-based access controls, automatic session timeout after 15
            minutes of inactivity, and comprehensive audit logging
          </li>
          <li>
            <strong>Minimum necessary standard:</strong> access to PHI is limited to the minimum
            amount needed for each authorized purpose
          </li>
          <li>
            <strong>Business Associate Agreements (BAAs):</strong> all third-party vendors with
            access to PHI are bound by HIPAA-compliant BAAs
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Breach Notification",
    body: (
      <p>
        In the event of a breach of unsecured PHI, Jubilee Monuments Corp. will notify affected
        individuals, the U.S. Department of Health and Human Services (HHS), and, where required,
        the media, in accordance with HIPAA Breach Notification Rule requirements (45 CFR
        &sect;&sect; 164.400&ndash;414). Notifications will be provided without unreasonable delay
        and no later than 60 days following discovery of the breach.
      </p>
    ),
  },
  {
    title: "Data Retention & Deletion",
    body: (
      <p>
        We retain personal information and PHI for as long as necessary to fulfill the purposes
        described in this policy, comply with legal obligations, and resolve disputes. PHI is
        retained for a minimum of six (6) years as required by HIPAA (45 CFR &sect; 164.530(j)). You
        may request deletion of your personal data by contacting us; however, certain records may be
        retained as required by law.
      </p>
    ),
  },
  {
    title: "Children's Privacy (COPPA)",
    body: (
      <p>
        The Portal collects information about minors solely for the purpose of camp enrollment and
        safety. All such information is provided by a parent or legal guardian. We do not knowingly
        collect personal information directly from children under 13 without verifiable parental
        consent. If you believe we have inadvertently collected such information, please contact us
        immediately for removal. We comply with the Children&rsquo;s Online Privacy Protection Act
        (COPPA).
      </p>
    ),
  },
  {
    title: "Your Rights",
    body: (
      <>
        <p>
          Under applicable law, including HIPAA, you have the following rights regarding your
          information:
        </p>
        <ul>
          <li>
            <strong>Right to access:</strong> request a copy of your personal data and PHI
          </li>
          <li>
            <strong>Right to amendment:</strong> request correction of inaccurate or incomplete PHI
          </li>
          <li>
            <strong>Right to an accounting of disclosures:</strong> request a record of how your PHI
            has been shared
          </li>
          <li>
            <strong>Right to request restrictions:</strong> ask us to limit how we use or disclose
            your PHI
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </>
    ),
  },
  {
    title: "Cookies & Tracking",
    body: (
      <p>
        The Portal uses essential cookies for authentication and session management. We do not use
        advertising or third-party tracking cookies. Analytics data is collected in aggregate form
        to improve the Portal experience.
      </p>
    ),
  },
  {
    title: "Contact Information",
    body: (
      <p>
        For questions or concerns about this Privacy Policy or our HIPAA compliance practices,
        please contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

export const Route = createFileRoute("/_public/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy & HIPAA Compliance — Luma by Jubilee Monuments Corp" },
      {
        name: "description",
        content:
          "How Jubilee Monuments Corp. collects, uses, and protects personal information and Protected Health Information, including HIPAA and COPPA compliance.",
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy & HIPAA Compliance"
      lastUpdated="March 11, 2026"
      sections={sections}
    />
  );
}
