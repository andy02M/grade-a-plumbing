"use client";
import { useMemo, useState } from "react";
import type { ProfileDraft, ProfileSettings } from "@/lib/automation-profiles";
type Account = { id: string; email: string; name?: string; status: string };
const days = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const plumberServices = [
  "Plumbing leak detection",
  "Plumbing pipe repair",
  "Shower installation",
  "Tap installation",
  "Tap repair",
  "Toilet installation",
  "Toilet repair",
  "Water heater installation",
  "Drain cleaning",
  "Outdoor plumbing system repair",
  "Plumbing leak repair",
  "Pool plumbing repair",
  "Sewer cleaning",
  "Sewer repair",
  "Shower repair",
  "Sump pump installation",
  "Sump pump repair",
  "Waste disposal installation",
  "Waste disposal repair",
  "Water heater repair",
  "Water tank installation",
  "Water tank repair",
];
const attributeLabels = [
  "Identifies as women-owned",
  "LGBTQ+ friendly",
  "Offers repair services",
  "Cash only",
  "Accepts credit cards",
  "American Express",
  "China Union Pay",
  "Diners Club",
  "Discover",
  "JCB",
  "Mastercard",
  "VISA",
  "Accepts NFC mobile payments",
  "Offers online estimates",
];
const blank: ProfileSettings = {
  title: "",
  categoryName: "Plumber",
  categoryLabel: "Plumber",
  phone: "",
  websiteUri: "",
  description: "",
  businessType: "SERVICE_AREA",
  regionCode: "AU",
  addressLine: "",
  city: "",
  state: "VIC",
  postalCode: "",
  serviceAreas: [],
  days: [...days],
  opens: "00:00",
  closes: "23:59",
  allDay: true,
  verificationAddress: {
    addressLine: "",
    city: "",
    state: "VIC",
    postalCode: "",
  },
  chatEnabled: false,
  chatPhone: "",
  services: [...plumberServices],
  customServices: [],
  openingDate: "",
  attributes: Object.fromEntries(
    attributeLabels.map((label) => [label, false]),
  ),
  shopFrontPhoto: "",
  workPhotos: [],
};
async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(
    path,
    body === undefined
      ? { cache: "no-store" }
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || "Request failed.");
  return j;
}
async function runner<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`http://127.0.0.1:53683${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok || j.error || j.ok === false)
    throw new Error(j.error || "Start the local browser runner first.");
  return j;
}
export function BrowserProfileCreator({
  accounts,
  drafts,
  onSaved,
}: {
  accounts: Account[];
  drafts: ProfileDraft[];
  onSaved: () => Promise<void>;
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [settings, setSettings] = useState<ProfileSettings>(blank);
  const [draftId, setDraftId] = useState("");
  const [areas, setAreas] = useState("");
  const [custom, setCustom] = useState("");
  const [workPhotos, setWorkPhotos] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const account = accounts.find((a) => a.id === accountId);
  const selectedServices = useMemo(
    () => new Set(settings.services || []),
    [settings.services],
  );
  function update<K extends keyof ProfileSettings>(
    key: K,
    value: ProfileSettings[K],
  ) {
    setSettings((old) => ({ ...old, [key]: value }));
  }
  function hydrate(d: ProfileDraft) {
    setDraftId(d.id);
    setAccountId(d.googleAccountId);
    setSettings({ ...blank, ...d.settings });
    setAreas(d.settings.serviceAreas.map((a) => a.placeName).join("\n"));
    setCustom((d.settings.customServices || []).join("\n"));
    setWorkPhotos((d.settings.workPhotos || []).join("\n"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const normalized = {
        ...settings,
        serviceAreas: areas
          .split("\n")
          .map((v) => v.trim())
          .filter(Boolean)
          .slice(0, 20)
          .map((placeName) => ({ placeName, placeId: "" })),
        customServices: custom
          .split("\n")
          .map((v) => v.trim())
          .filter(Boolean),
        workPhotos: workPhotos
          .split("\n")
          .map((v) => v.trim())
          .filter(Boolean)
          .slice(0, 200),
      };
      const { draft } = await api<{ draft: ProfileDraft }>(
        "/api/automation/profile-drafts",
        {
          id: draftId || undefined,
          googleAccountId: accountId,
          accountName: "browser",
          settings: normalized,
        },
      );
      setDraftId(draft.id);
      setSettings(draft.settings);
      await onSaved();
      setMessage("Template saved. It is ready for browser creation.");
      return draft;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  async function run() {
    let draft = drafts.find((d) => d.id === draftId);
    if (!draft) draft = await save();
    if (!draft || !account) return;
    if (
      !confirm(
        `Create “${draft.settings.title}” on ${account.email}? This starts a real Google Business Profile creation flow.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await runner("/create-profile", {
        email: account.email,
        draftId: draft.id,
        settings: draft.settings,
      });
      setMessage(
        "Edge opened and profile creation started. Keep the window open; the runner stops safely if Google requests manual action.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not start browser creation.",
      );
    } finally {
      setBusy(false);
    }
  }
  const va = settings.verificationAddress || blank.verificationAddress!;
  return (
    <div className="auto-two-columns">
      <section className="auto-panel">
        <div className="auto-panel-heading">
          <h2>Create a Google Business Profile</h2>
          <p>
            Save a reusable template, then run it in the signed-in Edge profile.
          </p>
        </div>
        {error && (
          <p className="auto-error-text" role="alert">
            {error}
          </p>
        )}
        {message && <div className="auto-alert success">{message}</div>}
        <label className="auto-field">
          <span>Gmail account</span>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">Choose an account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.email}
              </option>
            ))}
          </select>
        </label>
        <div className="auto-form-grid">
          <label className="auto-field">
            <span>Business name</span>
            <input
              value={settings.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </label>
          <label className="auto-field">
            <span>Google category</span>
            <input
              value={settings.categoryLabel}
              placeholder="Plumber"
              onChange={(e) =>
                setSettings({
                  ...settings,
                  categoryLabel: e.target.value,
                  categoryName: e.target.value,
                })
              }
            />
          </label>
        </div>
        <label className="auto-field">
          <span>Can customers visit this business location?</span>
          <select
            value={settings.businessType}
            onChange={(e) =>
              update(
                "businessType",
                e.target.value as ProfileSettings["businessType"],
              )
            }
          >
            <option value="STOREFRONT">
              Yes — Address Based Business
            </option>
            <option value="SERVICE_AREA">
              No — Service Area Based Business
            </option>
          </select>
          <small>
            This matches Google’s Yes/No location question. Address Based shows the
            address publicly; Service Area Based hides it.
          </small>
        </label>
        {settings.businessType !== "SERVICE_AREA" && (
          <>
            <label className="auto-field">
              <span>Public street address</span>
              <input
                value={settings.addressLine}
                onChange={(e) => update("addressLine", e.target.value)}
              />
            </label>
            <div className="auto-form-grid">
              <label className="auto-field">
                <span>Suburb</span>
                <input
                  value={settings.city}
                  onChange={(e) => update("city", e.target.value)}
                />
              </label>
              <label className="auto-field">
                <span>Postcode</span>
                <input
                  value={settings.postalCode}
                  onChange={(e) => update("postalCode", e.target.value)}
                />
              </label>
            </div>
          </>
        )}
        {settings.businessType !== "STOREFRONT" && (
          <label className="auto-field">
            <span>Service areas — one suburb per line (maximum 20)</span>
            <textarea
              rows={7}
              value={areas}
              onChange={(e) => setAreas(e.target.value)}
            />
            <small>
              {areas.split("\n").filter((v) => v.trim()).length}/20 areas
            </small>
          </label>
        )}
        <div className="auto-form-grid">
          <label className="auto-field">
            <span>Phone number</span>
            <input
              value={settings.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </label>
          <label className="auto-field">
            <span>Website</span>
            <input
              value={settings.websiteUri}
              onChange={(e) => update("websiteUri", e.target.value)}
            />
          </label>
        </div>
        <label className="auto-inline-check">
          <input
            type="checkbox"
            checked={settings.chatEnabled || false}
            onChange={(e) => update("chatEnabled", e.target.checked)}
          />
          Enable customer SMS chat
        </label>
        {settings.chatEnabled && (
          <label className="auto-field">
            <span>Chat phone</span>
            <input
              value={settings.chatPhone || ""}
              onChange={(e) => update("chatPhone", e.target.value)}
            />
          </label>
        )}
        <label className="auto-field">
          <span>Hidden postal address for verification</span>
          <input
            value={va.addressLine}
            onChange={(e) =>
              update("verificationAddress", {
                ...va,
                addressLine: e.target.value,
              })
            }
          />
        </label>
        <div className="auto-form-grid">
          <label className="auto-field">
            <span>Suburb</span>
            <input
              value={va.city}
              onChange={(e) =>
                update("verificationAddress", { ...va, city: e.target.value })
              }
            />
          </label>
          <label className="auto-field">
            <span>Postcode</span>
            <input
              value={va.postalCode}
              onChange={(e) =>
                update("verificationAddress", {
                  ...va,
                  postalCode: e.target.value,
                })
              }
            />
          </label>
        </div>
        <div className="auto-note">
          The runner chooses “Verify later”. Google may still require the owner
          to complete verification separately.
        </div>
        <label className="auto-field">
          <span>Business description (750 characters)</span>
          <textarea
            rows={6}
            maxLength={750}
            value={settings.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </label>
        <label className="auto-inline-check">
          <input
            type="checkbox"
            checked={settings.allDay}
            onChange={(e) => update("allDay", e.target.checked)}
          />
          Open 24 hours, seven days
        </label>
        <label className="auto-field">
          <span>Opening date</span>
          <input
            type="date"
            value={settings.openingDate || ""}
            onChange={(e) => update("openingDate", e.target.value)}
          />
        </label>
        <label className="auto-field">
          <span>Shop-front/default photo path</span>
          <input
            value={settings.shopFrontPhoto || ""}
            placeholder="C:\\Photos\\logo.jpg"
            onChange={(e) => update("shopFrontPhoto", e.target.value)}
          />
        </label>
        <label className="auto-field">
          <span>Work photo paths — one per line (up to 200)</span>
          <textarea
            rows={6}
            value={workPhotos}
            onChange={(e) => setWorkPhotos(e.target.value)}
          />
          <small>Use local file paths accessible to this computer.</small>
        </label>
        <div className="auto-toolbar">
          <button
            className="auto-button"
            disabled={busy}
            onClick={() => void save()}
          >
            Save template
          </button>
          <button
            className="auto-button primary"
            disabled={busy || !accountId}
            onClick={() => void run()}
          >
            {busy ? "Working…" : "Run browser creation"}
          </button>
        </div>
      </section>
      <div>
        <section className="auto-panel">
          <div className="auto-panel-heading">
            <h2>Services</h2>
            <p>
              Plumber defaults are selected. The runner also selects new Google
              suggestions it finds.
            </p>
          </div>
          <div className="auto-chips">
            {plumberServices.map((service) => (
              <label key={service}>
                <input
                  type="checkbox"
                  checked={selectedServices.has(service)}
                  onChange={() =>
                    update(
                      "services",
                      selectedServices.has(service)
                        ? [...selectedServices].filter((v) => v !== service)
                        : [...selectedServices, service],
                    )
                  }
                />
                {service}
              </label>
            ))}
          </div>
          <label className="auto-field">
            <span>Custom services — one per line</span>
            <textarea
              rows={5}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </label>
        </section>
        <section className="auto-panel">
          <div className="auto-panel-heading">
            <h2>Post-creation attributes</h2>
            <p>Applied through Edit profile after onboarding.</p>
          </div>
          {attributeLabels.map((label) => (
            <label className="auto-inline-check" key={label}>
              <input
                type="checkbox"
                checked={settings.attributes?.[label] || false}
                onChange={(e) =>
                  update("attributes", {
                    ...(settings.attributes || {}),
                    [label]: e.target.checked,
                  })
                }
              />
              {label}
            </label>
          ))}
        </section>
        <section className="auto-panel">
          <div className="auto-panel-heading">
            <h2>Saved templates</h2>
            <p>Reuse a setup on another Gmail account.</p>
          </div>
          {drafts.map((d) => (
            <article className="auto-template-card" key={d.id}>
              <b>{d.settings.title || "Untitled"}</b>
              <p>
                {d.settings.categoryLabel} ·{" "}
                {d.settings.businessType.replaceAll("_", " ").toLowerCase()}
              </p>
              <button className="auto-button" onClick={() => hydrate(d)}>
                Load template
              </button>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
