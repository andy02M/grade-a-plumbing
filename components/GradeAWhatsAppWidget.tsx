'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './GradeAWhatsAppWidget.module.css';

/**
 * Use a verified WhatsApp-enabled business number in international format.
 * Example formatting ONLY: 61400111222 (no +, whitespace, or punctuation).
 * Do not assume the normal office landline has WhatsApp access.
 */
type Props = {
  whatsAppNumber?: string;
  onRequestCallback?: () => void;
  businessName?: string;
};

const ISSUE_CHOICES = [
  { label: 'Blocked drain', value: 'blocked drain' },
  { label: 'Hot water issue', value: 'hot water issue' },
  { label: 'Burst pipe', value: 'burst pipe' },
  { label: 'Need a quote', value: 'plumbing quote' },
];

function WhatsAppIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" fill="none">
      <path d="M16 3.25A12.7 12.7 0 0 0 5.05 22.36L3.5 28.5l6.35-1.58A12.75 12.75 0 1 0 16 3.25Z" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" />
      <path d="M11.3 10.7c-.58-.93-1.05-.92-1.47-.33-.54.77-1.1 1.94-.52 3.42 1.2 3.08 4.78 6.3 7.97 7.16 1.24.34 2.29-.04 3.05-.7.63-.57.7-1.26.36-1.48l-2.38-1.1c-.4-.16-.67-.1-.95.25l-.95 1.11c-.18.2-.39.23-.72.06-1.58-.75-3.23-2.13-4.1-3.65-.21-.34-.15-.51.05-.74l.82-.96c.26-.28.23-.57.1-.86l-1.17-2.93Z" fill="currentColor" />
    </svg>
  );
}

export default function GradeAWhatsAppWidget({
  whatsAppNumber,
  onRequestCallback,
  businessName = 'Grade A Plumbing',
}: Props) {
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState<string>('');
  const panelRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const normalized = (whatsAppNumber || '').replace(/\D/g, '');
  const whatsappReady = /^[1-9]\d{7,14}$/.test(normalized);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const message = `Hi ${businessName}, I need help with ${issue || 'a plumbing issue'}. My suburb is: [suburb]. The issue is: [description].`;
  const waUrl = whatsappReady ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : undefined;

  return (
    <div className={styles.root}>
      {open && (
        <section className={styles.panel} ref={panelRef} tabIndex={-1} aria-label="Message Grade A Plumbing" id="gradea-whatsapp-panel">
          <div className={styles.topBar}>
            <div className={styles.brandHeading}>
              <WhatsAppIcon size={30} />
              <div><strong>Message Us Now</strong><span>Chat with {businessName} on WhatsApp</span></div>
            </div>
            <button className={styles.close} aria-label="Close WhatsApp options" type="button" onClick={() => { setOpen(false); launcherRef.current?.focus(); }}>×</button>
          </div>
          <div className={styles.body}>
            <div className={styles.intro}>
              <div className={styles.brandAvatar} aria-hidden="true">GA</div>
              <div><strong>Need help fast?</strong><p>Tell us what's happening and we'll get back to you as soon as possible.</p></div>
            </div>
            <div className={styles.availability}><span>● &nbsp; 24/7 plumbing service</span><span>Response time confirmed on contact</span></div>
            <h3>What do you need help with?</h3>
            <div className={styles.choices} role="group" aria-label="Choose a plumbing issue">
              {ISSUE_CHOICES.map((choice) => (
                <button key={choice.value} type="button" className={`${styles.choice} ${issue === choice.value ? styles.selected : ''}`} onClick={() => setIssue(choice.value)} aria-pressed={issue === choice.value}>
                  {choice.label}
                </button>
              ))}
            </div>
            {waUrl ? (
              <a className={styles.primary} href={waUrl} target="_blank" rel="noopener noreferrer" data-whatsapp-action="whatsapp_click" data-whatsapp-issue={issue || 'unspecified'}><WhatsAppIcon size={20}/> Open WhatsApp Chat <span aria-hidden="true">→</span></a>
            ) : (
              <p className={styles.notice} role="status">WhatsApp chat will be available once a verified business WhatsApp number is configured.</p>
            )}
            {onRequestCallback && <><div className={styles.or}><span>or</span></div><button type="button" className={styles.secondary} data-whatsapp-action="whatsapp_callback_click" onClick={() => {setOpen(false); onRequestCallback();}}>Request a callback</button></>}
            <p className={styles.privacy}>Please avoid sending payment details or sensitive personal information over chat.</p>
          </div>
        </section>
      )}
      <button ref={launcherRef} type="button" className={styles.launcher} aria-expanded={open} aria-controls="gradea-whatsapp-panel" aria-label={open ? 'Close WhatsApp help panel' : 'Open WhatsApp help panel'} onClick={() => { if (!open) window.dispatchEvent(new CustomEvent('site-measurement', { detail: { event: 'whatsapp_open', placement: 'whatsapp_panel' } })); setOpen((previous) => !previous); }}>
        <WhatsAppIcon size={31} />
        {!open && <span className={styles.notificationDot} aria-hidden="true" />}
      </button>
    </div>
  );
}
