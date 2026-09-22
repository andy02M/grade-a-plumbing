import http from "node:http";
import crypto from "node:crypto";

const clientId = process.env.GOOGLE_GBP_CLIENT_ID;
const clientSecret = process.env.GOOGLE_GBP_CLIENT_SECRET;
const redirectUri = "http://127.0.0.1:53682/oauth2callback";

if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_GBP_CLIENT_ID and GOOGLE_GBP_CLIENT_SECRET before running this helper.");
  process.exit(1);
}

const state = crypto.randomBytes(24).toString("hex");
const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authorizationUrl.search = new URLSearchParams({
  access_type: "offline", client_id: clientId, prompt: "consent", redirect_uri: redirectUri,
  response_type: "code", scope: "https://www.googleapis.com/auth/business.manage", state
}).toString();

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", redirectUri);
  if (url.pathname !== "/oauth2callback") return void response.writeHead(404).end("Not found");
  if (url.searchParams.get("state") !== state) {
    response.writeHead(400).end("Invalid OAuth state.");
    return void server.close();
  }

  const code = url.searchParams.get("code");
  if (!code) {
    response.writeHead(400).end(`Google did not return an authorization code: ${url.searchParams.get("error") ?? "unknown error"}`);
    return void server.close();
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, grant_type: "authorization_code", redirect_uri: redirectUri })
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.refresh_token) throw new Error(JSON.stringify(tokens));

    response.writeHead(200, { "Content-Type": "text/plain" }).end("Grade A Plumbing authorization succeeded. Return to the terminal and save the refresh token securely.");
    console.log("\nGOOGLE_GBP_REFRESH_TOKEN=\n" + tokens.refresh_token);
  } catch (error) {
    response.writeHead(500).end("Authorization failed. Check the terminal.");
    console.error(error);
  } finally {
    server.close();
  }
});

server.listen(53682, "127.0.0.1", () => {
  console.log("Add this redirect URI to the Google OAuth client:\n" + redirectUri);
  console.log("\nThen open this URL and approve access:\n\n" + authorizationUrl.toString());
});
