const baseUrl = process.env.BUILT_IN_FORGE_API_URL;
const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
if (!baseUrl || !apiKey) throw new Error("Missing built-in Forge configuration");
const endpoint = `${baseUrl.replace(/\/$/, "")}/webdevtoken.v1.WebDevService/CreateHeartbeatJob`;
const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    accept: "application/json",
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
    "connect-protocol-version": "1",
  },
  body: JSON.stringify({
    name: "rfq-deadline-alerts-owner",
    cronExpression: "0 0 */2 * * *",
    callbackPath: "/api/scheduled/rfq-deadlines",
    callbackMethod: "POST",
    callbackPayload: "{}",
    description: "Materialize approaching and overdue RFQ deadline alerts for the project owner",
  }),
});
const body = await response.text();
if (!response.ok) throw new Error(`Heartbeat create failed (${response.status}): ${body}`);
const result = JSON.parse(body);
console.log(JSON.stringify(result));
