const SECRET_ASSIGNMENT_PATTERN = /\b([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY|ACCESS_KEY|PRIVATE_KEY|CONNECTION_STRING)[A-Z0-9_]*)\s*[:=]\s*([^\s'\"`]+)/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._\-+/=]+/gi;
const GITHUB_TOKEN_PATTERN = /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g;
const GENERIC_LONG_TOKEN_PATTERN = /\b[A-Za-z0-9_\-]{32,}\b/g;

function redactText(value: string): string {
  return value
    .replace(SECRET_ASSIGNMENT_PATTERN, "$1=[REDACTED]")
    .replace(BEARER_PATTERN, "Bearer [REDACTED]")
    .replace(GITHUB_TOKEN_PATTERN, "[REDACTED_TOKEN]")
    .replace(GENERIC_LONG_TOKEN_PATTERN, (match) => {
      if (/^[0-9]+$/.test(match)) {
        return match;
      }

      return "[REDACTED_TOKEN]";
    });
}

export function redactSensitiveValues<T>(value: T): T {
  if (typeof value === "string") {
    return redactText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveValues(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, redactSensitiveValues(entry)])
    ) as T;
  }

  return value;
}
