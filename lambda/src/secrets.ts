import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({});
const SECRET_NAME = process.env.SECRET_NAME!;

let cachedSecrets: Record<string, string> | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getSecrets(): Promise<Record<string, string>> {
  if (cachedSecrets && Date.now() < cacheExpiry) {
    return cachedSecrets;
  }

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: SECRET_NAME })
  );

  if (!response.SecretString) {
    throw new Error("Secret value is empty");
  }

  cachedSecrets = JSON.parse(response.SecretString);
  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return cachedSecrets!;
}

export async function getSecret(key: string): Promise<string> {
  const secrets = await getSecrets();
  const value = secrets[key];
  if (!value) {
    throw new Error(`Secret key "${key}" not found`);
  }
  return value;
}
