import React from 'react';
import LegalPage from '@/components/LegalPage';

const SECTIONS = [
  {
    heading: 'What this app does',
    paragraphs: [
      'CampusFlow AI is a study planner. It lets you record your assignments, subjects, deadlines and priorities, then shows you what needs attention first.',
    ],
  },
  {
    heading: 'Information we hold',
    paragraphs: [
      'When you sign in, we receive the account details your sign-in provides. We also store the study information you enter:',
    ],
    bullets: [
      'Account details: your name, email address and the sign-in identity you use.',
      'Assignment details: title, subject, optional notes, due date, priority and status.',
      'Activity timestamps: when a record was created and when it was last changed.',
    ],
  },
  {
    heading: 'What we do not collect',
    bullets: [
      'No payment or card details — the app has no purchases or subscriptions.',
      'No advertising or analytics trackers, and no data sold or shared with advertisers.',
      'No access to your contacts, photos, camera, microphone, files or location.',
      'No push notifications and no device permissions in this build.',
    ],
  },
  {
    heading: 'Where your data is stored',
    paragraphs: [
      'Your assignments are stored in the app database provided by Base44, the platform that hosts this app. Every record is scoped to the account that created it: those access rules are enforced by the database layer, so one student cannot read, change or delete another student’s assignments.',
    ],
  },
  {
    heading: 'Your control over your data',
    paragraphs: [
      'You can edit or delete any assignment at any time from the My Assignments page, and it is removed immediately. To close your account and remove the study data attached to it, ask the app administrator.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      'This app is intended for students at secondary school level and above. It is not directed at children under 13.',
    ],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: [
      'If this policy changes, the updated version will be published on this page together with a new date.',
    ],
  },
  {
    heading: 'Questions',
    paragraphs: [
      'Questions about this policy or about your data can be raised with the app administrator through the account you sign in with.',
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="17 October 2026">
      <p className="text-sm leading-relaxed text-muted-foreground">
        This policy explains what CampusFlow AI stores, why it stores it, and how you stay in control of it.
      </p>

      {SECTIONS.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="font-heading text-lg font-bold tracking-tight">{section.heading}</h2>
          {(section.paragraphs || []).map((text) => (
            <p key={text} className="text-sm leading-relaxed text-muted-foreground">
              {text}
            </p>
          ))}
          {section.bullets ? (
            <ul className="space-y-2">
              {section.bullets.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </LegalPage>
  );
}
