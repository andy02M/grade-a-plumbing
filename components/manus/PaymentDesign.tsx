import styles from "./PaymentDesign.module.css";
import { PHONE, PHONE_LINK } from "./data";

const methods = [
  { icon: "card", name: "Card payment", text: "Pay by card. Confirm accepted cards with our team." },
  { icon: "cash", name: "Cash", text: "Pay directly to your plumber when the job is completed." },
  { icon: "bank", name: "Bank transfer", text: "Bank transfer available. Ask our team for payment details." },
  { icon: "payid", name: "PayID", text: "PayID available where confirmed by our team." },
];
const reminders = [
  { icon: "card", title: "Payment due", text: "Immediately on completion" },
  { icon: "shield", title: "Need more time?", text: "Discuss terms before work begins" },
  { icon: "clock", title: "After-hours attendance", text: "From 4 pm, subject to availability" },
  { icon: "shield", title: "Payment options", text: "Confirm your preferred method" },
];

export function PaymentDesign() {
  return (
    <>
      <section className={styles.hero} aria-labelledby="payment-title">
        <div className={styles.shell}>
          <p className={styles.eyebrow}>PAYMENT INFORMATION</p>
          <h1 id="payment-title">Payment Options for<br />Your Plumbing Job</h1>
          <p className={styles.lead}>We accept a range of payment methods to make things simple and convenient. Payment is required immediately on completion unless alternative terms have been agreed in advance.</p>
          <div className={styles.layout}>
            <div className={styles.methods}>
              {methods.map(method => (
                <article className={styles.method} key={method.icon}>
                  <img src={`/assets/payment/icon-${method.icon}.svg`} width={49} height={49} alt="" />
                  <h2>{method.name}</h2>
                  <p>{method.text}</p>
                </article>
              ))}
            </div>
            <aside className={styles.help}>
              <h2><span aria-hidden="true">?</span> Questions about payment?</h2>
              <p>Speak with our team about your preferred payment method or payment arrangements.</p>
              <a href={PHONE_LINK} className={styles.call}>Call {PHONE}</a>
              <a href="/contact/" className={styles.contact}>Contact our team <span aria-hidden="true">&rarr;</span></a>
            </aside>
          </div>
        </div>
      </section>
      <section className={styles.reminders} aria-label="Payment at a glance">
        <div className={`${styles.shell} ${styles.reminderGrid}`}>
          {reminders.map(item => <div className={styles.reminder} key={item.title}>
            <img src={`/assets/payment/icon-${item.icon}.svg`} width={32} height={32} alt="" />
            <p><strong>{item.title}</strong><span>{item.text}</span></p>
          </div>)}
        </div>
      </section>
    </>
  );
}
