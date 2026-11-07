export function env(name: string): string {
  const value = (process.env[name] || "").trim();
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export const appUrl = () => env("APP_URL").replace(/\/+$/, "");
