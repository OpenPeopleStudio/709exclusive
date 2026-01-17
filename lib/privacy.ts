export function isPrivacyStrict(): boolean {
  return process.env.PRIVACY_STRICT_LOGGING === 'true'
}

export function redactErrorMessage(message: string, fallback = 'Request failed'): string {
  return isPrivacyStrict() ? fallback : message
}
