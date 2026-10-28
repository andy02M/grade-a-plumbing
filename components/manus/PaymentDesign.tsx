import styles from "./PaymentDesign.module.css";
import { PHONE, PHONE_LINK } from "./data";

const methods = [
  { icon: "card", name: "Card payment", text: "Pay by card. Confirm your preferred card with our team before your visit." },
  { icon: "cash", name: "Cash", text: "Pay directly to your plumber when the job is completed." },
  { icon: "bank", name: "Bank transfer", text: "Ask our team for payment details and include your job or invoice reference." },
  { icon: "payid", name: "PayID", text: "Convenient PayID payments, where available. Confirm with our team first." },
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
        <div className={`container ${styles.inner}`}>
          <p className={styles.eyebrow}>PAYMENT INFORMATION</p>
          <h1 id="payment-title">Payment options for<br />your plumbing job</h1>
          <p className={styles.lead}>Choose a convenient way to pay for your plumbing service. Payment is required immediately after the job is completed, unless alternative terms have been agreed with our team beforehand.</p>
          <div className={styles.layout}>
            <div className={styles.methods}>
              {methods.map(method => (
                <article className={styles.method} key={method.icon}>
                  <img src={`/assets/payment/icon-${method.icon}.svg`} width={52} height={52} alt="" />
                  <h2>{method.name}</h2>
                  <p>{method.text}</p>
                </article>
              ))}
            </div>
            <aside className={styles.help}>
              <h2><span aria-hidden="true">?</span> Questions about payment?</h2>
              <p>Talk to our team about your preferred payment method or discuss an arrangement that suits your circumstances.</p>
              <a href={PHONE_LINK} className={styles.call}>Call {PHONE}</a>
              <a href="/contact/" className={styles.contact}>Contact our team <span aria-hidden="true">&rarr;</span></a>
            </aside>
          </div>
        </div>
      </section>
      <section className={styles.reminders} aria-label="Payment at a glance">
        <div className={`container ${styles.reminderGrid}`}>
          {reminders.map(item => <div className={styles.reminder} key={item.title}>
            <img src={`/assets/payment/icon-${item.icon}.svg`} width={32} height={32} alt="" />
            <p><strong>{item.title}</strong><span>{item.text}</span></p>
          </div>)}
        </div>
      </section>
    </>
  );
}
