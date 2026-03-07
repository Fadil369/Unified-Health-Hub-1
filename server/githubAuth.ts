import { ReplitConnectors } from "@replit/connectors-sdk";

const connectors = new ReplitConnectors();

export async function getGitHubUser(accessToken?: string) {
  const response = await connectors.proxy("github", "/user", {
    method: "GET",
  });
  const data = await response.json();
  return data;
}

export async function getGitHubUserEmails() {
  const response = await connectors.proxy("github", "/user/emails", {
    method: "GET",
  });
  const data = await response.json();
  return data;
}
