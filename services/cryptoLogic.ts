/**
 * Standard configuration matching the Python script.
 */
export const DEFAULT_PASSWORD_LENGTH = 10;
export const MAX_SAFE_LENGTH = 32; // Limit to ensure we have bytes left for character enforcement

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*";

export interface PasswordOptions {
  useUpper: boolean;
  useLower: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  version?: number; // Added version parameter
}

/**
 * Extracts the service name from an account ID.
 * Example: 'user@gmail.com' -> 'google'
 */
export function getServiceName(accountId: string): string {
  if (accountId.includes('@')) {
    const domain = accountId.split('@')[1];
    // Regex matches the Python logic: r'([\w\-]+)\.(com|net|org|io|co\.uk|cn)'
    const match = domain.match(/([\w\-]+)\.(com|net|org|io|co\.uk|cn)/);
    
    if (match) {
      const name = match[1].toLowerCase();
      // Special handling for gmail as per script
      if (name === 'gmail') {
        return 'google';
      }
      return name;
    } else {
      // Fallback per script
      return domain.split('.')[0].toLowerCase();
    }
  }
  return accountId.toLowerCase();
}

/**
 * Generates a deterministic password using HMAC-SHA256.
 * Now supports custom character sets and versioning for rotation.
 */
export async function generatePassword(
  masterKey: string, 
  accountId: string, 
  length: number = DEFAULT_PASSWORD_LENGTH,
  options: PasswordOptions = { useUpper: true, useLower: true, useNumbers: true, useSymbols: true, version: 1 }
): Promise<string> {
  // 0. Build Character Pool based on options
  let allowedChars = "";
  const charTypesToEnsure: string[] = [];

  if (options.useLower) {
    allowedChars += LOWERCASE;
    charTypesToEnsure.push(LOWERCASE);
  }
  if (options.useUpper) {
    allowedChars += UPPERCASE;
    charTypesToEnsure.push(UPPERCASE);
  }
  if (options.useNumbers) {
    allowedChars += DIGITS;
    charTypesToEnsure.push(DIGITS);
  }
  if (options.useSymbols) {
    allowedChars += SYMBOLS;
    charTypesToEnsure.push(SYMBOLS);
  }

  // Safety check: if no characters selected, return empty (UI should prevent this)
  if (allowedChars.length === 0) return "";

  // 1. Build Source String
  const serviceName = getServiceName(accountId);
  const version = options.version || 1;
  
  // Backward compatibility: If version is 1, use original format.
  // If version > 1, append it to change the hash seed.
  let dataToHash = serviceName + accountId;
  if (version > 1) {
    dataToHash += `:${version}`;
  }

  // 2. HMAC-SHA256 Hashing
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(masterKey);
  const dataBytes = encoder.encode(dataToHash);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await window.crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    dataBytes
  );

  const hmacDigest = new Uint8Array(signature);

  // 3. Convert hash digest to base password
  const passwordChars: string[] = [];
  
  // Ensure we don't exceed buffer bounds if length is too high, although UI limits this.
  const safeLength = Math.min(length, hmacDigest.length);

  for (let i = 0; i < safeLength; i++) {
    const charIndex = hmacDigest[i] % allowedChars.length;
    passwordChars.push(allowedChars[charIndex]);
  }

  // 4. Enforce character types (Only enforce types that are selected)
  let currentPasswordStr = passwordChars.join("");
  let digestByteIndex = safeLength;

  for (const charType of charTypesToEnsure) {
    // Check if current password lacks this type
    const hasType = currentPasswordStr.split('').some(c => charType.includes(c));
    
    if (!hasType) {
      // Logic for replacement:
      // 1. Decide position to replace
      // Wrap index usage to prevent overflow if length is high
      if (digestByteIndex >= hmacDigest.length) digestByteIndex = 0; 
      
      const posToReplace = hmacDigest[digestByteIndex] % safeLength;
      digestByteIndex++;

      // 2. Decide new character
      if (digestByteIndex >= hmacDigest.length) digestByteIndex = 0;

      const newCharIndex = hmacDigest[digestByteIndex] % charType.length;
      digestByteIndex++;

      // Execute replacement
      passwordChars[posToReplace] = charType[newCharIndex];
      
      // Update string for next check
      currentPasswordStr = passwordChars.join("");
    }
  }

  return passwordChars.join("");
}

/**
 * Generates a cryptographically secure random password.
 */
export function generateRandomPassword(
  length: number = DEFAULT_PASSWORD_LENGTH,
  options: PasswordOptions = { useUpper: true, useLower: true, useNumbers: true, useSymbols: true }
): string {
  let allowedChars = "";
  if (options.useLower) allowedChars += LOWERCASE;
  if (options.useUpper) allowedChars += UPPERCASE;
  if (options.useNumbers) allowedChars += DIGITS;
  if (options.useSymbols) allowedChars += SYMBOLS;

  if (allowedChars.length === 0) return "";

  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += allowedChars[randomValues[i] % allowedChars.length];
  }

  return password;
}

/**
 * Generates a SHA-256 hash of the master key for verification.
 */
export async function hashMasterKey(masterKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(masterKey);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
