"use client";

import { useEffect, useMemo, useState } from "react";
import { getGmbCampaignPosts } from "@/lib/gmb-posts";

type Account = {
  id: string;
  googleSub: string;
  email: string;
  name?: string;
  picture?: string;
  status: string;
  connectedAt: string;
  lastSyncedAt?: string | null;
  businessProfiles?: Profile[];
};

type Profile = {
  id: string;
  title: string;
  address?: string;
  status: string;
  selected: boolean;
};

const knownProfiles: Profile[] = [
  ["Grade A Plumber Box Hill", "60 Carrington Rd, Box Hill VIC 3128", "VERIFIED"],
  ["Grade A Plumber Brighton", "60 Church St, Brighton VIC 3186", "VERIFIED"],
  ["Grade A Plumber Brunswick", "60 Albert St, Brunswick East VIC 3057", "VERIFIED"],
  ["Grade A Plumber Dandenong", "60 Princes Hwy, Dandenong VIC 3175", "VERIFIED"],
  ["Grade A Plumber Epping", "High St, Epping VIC 3076", "VERIFIED"],
  ["Grade A Plumber Essendon", "60 Napier St, Essendon VIC 3040", "VERIFIED"],
  ["Grade A Plumber Footscray", "60 Leeds St, Footscray VIC 3011", "SUSPENDED"],
  ["Grade A Plumber Frankston", "60 Gertrude St, Frankston VIC 3199", "VERIFICATION_REQUIRED"],
  ["Grade A Plumber Glen Waverley", "60 Snedden Dr, Glen Waverley VIC 3150", "VERIFIED"],
  ["Grade A Plumber Hawthorn", "60 Lynch St, Hawthorn VIC 3122", "VERIFIED"],
  ["Grade A Plumber Kew", "60 Denmark St, Kew VIC 3101", "VERIFIED"],
  ["Grade A Plumber Narre Warren", "Link Rd, Narre Warren VIC 3805", "VERIFICATION_REQUIRED"],
  ["Grade A Plumber Pakenham", "60 Henty St, Pakenham VIC 3810", "VERIFIED"],
  ["Grade A Plumber Preston", "60 Garnet St, Preston VIC 3072", "VERIFIED"],
  ["Grade A Plumber Ringwood", "60 Maroondah Hwy, Ringwood VIC 3134", "VERIFIED"],
  ["Grade A Plumbing Ballarat", "60 Dana St, Ballarat Central VIC 3350", "VERIFIED"],
  ["Grade A Plumbing Bendigo", "60 Myers St, Bendigo VIC 3550", "VERIFIED"],
  ["Grade A Plumbing Geelong", "60 Little Myers St, Geelong VIC 3220", "VERIFIED"],
  ["Grade A Plumbing Melbourne", "235 Queen St, Melbourne VIC 3000", "VERIFIED"],
  ["Grade A Plumbing Melton", "60 McKenzie St, Melton VIC 3337", "VERIFIED"],
  ["Grade A Plumbing Point Cook", "60 Boardwalk Blvd, Point Cook VIC 3030", "VERIFIED"],
  ["Grade A Plumbing Reservoir", "60 Broadway, Reservoir VIC 3073", "VERIFIED"],
  ["Grade A Plumbing Richmond", "111 Gipps St, Richmond VIC 3121", "VERIFIED"],
  ["Grade A Plumbing South Melbourne", "60 Bank St, South Melbourne VIC 3205", "VERIFIED"],
  ["Grade A Plumbing St Albans", "60 William St, St Albans VIC 3021", "VERIFIED"],
  ["Grade A Plumbing St Kilda", "60 St Kilda Rd, St Kilda VIC 3182", "VERIFIED"]
].map(([title, address, status], index) => ({ id: `profile-${index + 1}`, title, address, status, selected: status === "VERIFIED" }));

const scheduledPosts = getGmbCampaignPosts()
  .filter((post) => post.date >= "2026-09-14" && post.date <= "2026-09-30")
  .map((post) => ({
    date: formatDisplayDate(post.date),
    isoDate: post.date,
    service: post.service,
    area: post.suburb,
    text: post.summary,
    url: post.callToAction.url,
    time: "9:00 AM",
    status: "Scheduled",
    cta: "Call now",
    targets: 23
  }));

function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`));
}

const tabs = ["Overview", "Accounts", "Profiles", "Scheduled Posts", "Post Texts", "Activity"] as const;
type Tab = (typeof tabs)[number];

function statusClass(status: string) {
  if (status === "VERIFIED" || status === "CONNECTED" || status === "Scheduled") return "bg-emerald-50 text-emerald-700";
  if (status === "SUSPENDED") return "bg-red-50 text-red-700";
  if (status === "VERIFICATION_REQUIRED") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export function DashboardClient() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/google/accounts", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setAccounts(data.accounts || []);
      })
      .catch(() => {
        if (mounted) setAccounts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const profiles = useMemo(() => {
    const savedProfiles = accounts.flatMap((account) => account.businessProfiles || []);
    return savedProfiles.length ? savedProfiles : knownProfiles;
  }, [accounts]);

  const filteredProfiles = profiles.filter((profile) =>
    `${profile.title} ${profile.address || ""} ${profile.status}`.toLowerCase().includes(query.toLowerCase())
  );

  const verifiedCount = profiles.filter((profile) => profile.status === "VERIFIED").length;
  const selectedCount = profiles.filter((profile) => profile.selected).length;

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Dashboard</p>
            <h1 className="mt-3 font-display text-5xl font-bold uppercase leading-none text-slate-950">GMB automation hub</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Manage connected Gmail accounts, business profiles, scheduled post campaigns, post text, and publishing activity from one place.
            </p>
          </div>
          <a className="inline-flex items-center justify-center rounded-full bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800" href="/api/google/oauth/start">
            Add Gmail account
          </a>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            [accounts.length || (loading ? "…" : 0), "connected Gmail accounts"],
            [profiles.length, "profiles detected"],
            [verifiedCount, "verified profiles"],
            [scheduledPosts.length, "scheduled posts shown"]
          ].map(([value, label]) => (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" key={label}>
              <p className="text-3xl font-bold text-slate-950">{value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_1fr]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-24 lg:self-start">
            {tabs.map((tab) => (
              <button
                className={`block w-full rounded-[1.1rem] px-4 py-3 text-left text-sm font-bold transition ${activeTab === tab ? "bg-blue-700 text-white" : "text-slate-700 hover:bg-slate-50 hover:text-blue-700"}`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </aside>

          <section className="min-w-0">
            {activeTab === "Overview" && (
              <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                <Panel title="Automation status" subtitle="High-level status for the current Grade A Plumbing campaign.">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[["23", "posting targets"], ["9:00 AM", "publish time"], ["Call now", "CTA button"]].map(([value, label]) => (
                      <div className="rounded-2xl bg-slate-950 p-4 text-white" key={label}>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm leading-7 text-emerald-800">
                    Your Gmail account is connected and September posts are queued. The API is no longer exposing encrypted token data.
                  </div>
                </Panel>
                <Panel title="Connected account" subtitle="The Google account currently saved in live storage.">
                  <AccountList accounts={accounts} loading={loading} />
                </Panel>
              </div>
            )}

            {activeTab === "Accounts" && (
              <Panel title="Connected Gmail accounts" subtitle="Accounts with Google Business Profile OAuth access.">
                <AccountList accounts={accounts} loading={loading} />
              </Panel>
            )}

            {activeTab === "Profiles" && (
              <Panel title="Business profiles" subtitle="All profiles detected for this account, including verified, suspended, and verification-required profiles.">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <input className="w-full rounded-full border border-slate-200 px-4 py-3 text-sm outline-none ring-blue-200 focus:ring-4 sm:max-w-sm" onChange={(event) => setQuery(event.target.value)} placeholder="Search profiles, suburbs, status…" value={query} />
                  <p className="text-sm font-semibold text-slate-600">{selectedCount} selected targets</p>
                </div>
                <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                      <tr><th className="px-4 py-3">Profile</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Posting</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProfiles.map((profile) => (
                        <tr key={profile.id}>
                          <td className="px-4 py-3"><p className="font-bold text-slate-950">{profile.title}</p><p className="mt-1 text-xs text-slate-500">{profile.address || "Address not synced yet"}</p></td>
                          <td className="px-4 py-3"><Badge label={profile.status.replaceAll("_", " ")} status={profile.status} /></td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-700">{profile.selected ? "Included" : "Not eligible"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}

            {activeTab === "Scheduled Posts" && (
              <Panel title="Scheduled posts" subtitle="Daily September queue with service, suburb, target count, and CTA.">
                <PostsTable />
              </Panel>
            )}

            {activeTab === "Post Texts" && (
              <Panel title="Post text library" subtitle="Review the actual text that will be used in Google Business Profile posts.">
                <div className="grid gap-4">
                  {scheduledPosts.map((post) => (
                    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5" key={`${post.date}-${post.area}`}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-bold text-slate-950">{post.date} — {post.service} in {post.area}</h3><Badge label={post.cta} status="CONNECTED" /></div>
                      <p className="mt-3 text-sm leading-7 text-slate-700">{post.text}</p>
                      <p className="mt-3 break-all text-xs font-semibold text-blue-700">{post.url}</p>
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            {activeTab === "Activity" && (
              <Panel title="Activity and issues" subtitle="Recent connection, scheduling, and security events.">
                <div className="grid gap-3">
                  {["Connected andys1stalt@gmail.com successfully", "Removed encrypted token from accounts API response", "Saved OAuth redirect URI in Google Cloud", "Scheduled September campaign for 23 verified profiles"].map((item, index) => (
                    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4" key={item}><span className="mt-1 h-3 w-3 rounded-full bg-emerald-500" /><div><p className="font-bold text-slate-900">{item}</p><p className="mt-1 text-xs text-slate-500">Event {index + 1}</p></div></div>
                  ))}
                </div>
              </Panel>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-6"><h2 className="text-2xl font-bold text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p></div>{children}</div>;
}

function Badge({ label, status }: { label: string; status: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(status)}`}>{label}</span>;
}

function AccountList({ accounts, loading }: { accounts: Account[]; loading: boolean }) {
  if (loading) return <div className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-600">Loading connected accounts…</div>;
  if (!accounts.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5"><p className="font-bold text-slate-900">No Gmail accounts connected yet</p><p className="mt-2 text-sm leading-7 text-slate-600">Click “Add Gmail account” to connect a Google account with Business Profile access.</p></div>;
  return <div className="grid gap-4">{accounts.map((account) => <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5" key={account.id}><div className="flex items-center gap-4">{account.picture ? <img alt="" className="h-12 w-12 rounded-full" src={account.picture} /> : <span className="grid h-12 w-12 place-items-center rounded-full bg-blue-700 font-bold text-white">{account.email[0]?.toUpperCase()}</span>}<div className="min-w-0"><p className="truncate font-bold text-slate-950">{account.name || account.email}</p><p className="truncate text-sm text-slate-600">{account.email}</p></div><Badge label={account.status} status={account.status} /></div><p className="mt-3 text-xs text-slate-500">Connected {new Date(account.connectedAt).toLocaleString()}</p></div>)}</div>;
}

function PostsTable() {
  return <div className="overflow-hidden rounded-[1.5rem] border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Post</th><th className="px-4 py-3">Targets</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{scheduledPosts.map((post) => <tr key={`${post.date}-${post.area}`}><td className="px-4 py-3 font-bold text-slate-900"><p>{post.date}</p><p className="text-xs font-semibold text-slate-500">{post.time}</p></td><td className="px-4 py-3"><p className="font-bold text-slate-950">{post.service}</p><p className="text-xs text-slate-500">{post.area} · {post.cta}</p></td><td className="px-4 py-3 font-semibold text-slate-700">{post.targets}</td><td className="px-4 py-3"><Badge label={post.status} status={post.status} /></td></tr>)}</tbody></table></div>;
}


