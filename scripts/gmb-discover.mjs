const clientId = process.env.GOOGLE_GBP_CLIENT_ID;
const clientSecret = process.env.GOOGLE_GBP_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_GBP_REFRESH_TOKEN;

if (!clientId || !clientSecret || !refreshToken) {
  console.error("Set GOOGLE_GBP_CLIENT_ID, GOOGLE_GBP_CLIENT_SECRET and GOOGLE_GBP_REFRESH_TOKEN first.");
  process.exit(1);
}

const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token", refresh_token: refreshToken })
});
const tokenData = await tokenResponse.json();
if (!tokenResponse.ok || !tokenData.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(tokenData)}`);

async function googleGet(url) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${tokenData.access_token}`, "X-GOOG-API-FORMAT-VERSION": "2" } });
  const data = await response.json();
  if (!response.ok) throw new Error(`${url}: ${JSON.stringify(data)}`);
  return data;
}

const accountData = await googleGet("https://mybusinessaccountmanagement.googleapis.com/v1/accounts");
for (const account of accountData.accounts ?? []) {
  const locationData = await googleGet(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,metadata`);
  console.log(`\n${account.accountName ?? "Business account"} (${account.name})`);
  for (const location of locationData.locations ?? []) console.log(`  ${location.title ?? "Unnamed location"}: ${location.name}`);
}
