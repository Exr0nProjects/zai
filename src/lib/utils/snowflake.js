// Snowflake ID generator for unique block identifiers
// Format: 64-bit integer with Linux epoch timestamp + random bits

export function generateBlockId() {
  // Get Linux epoch timestamp (seconds since 1970-01-01)
  const epochSeconds = Math.floor(Date.now() / 1000);
  
  // Generate 32 bits of random data for collision resistance
  const randomBits = Math.floor(Math.random() * 0x100000000); // 32-bit random number
  
  // Build 64-bit ID using BigInt for full precision:
  // 32 bits: Linux epoch timestamp (seconds)
  // 32 bits: random data for collision resistance
  const id = (BigInt(epochSeconds) << 32n) | BigInt(randomBits);
  
  return id.toString();
}

export function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Utility function to extract timestamp from snowflake ID for debugging/sorting
export function extractTimestampFromId(id) {
  const bigIntId = BigInt(id);
  const epochSeconds = Number(bigIntId >> 32n);
  return epochSeconds * 1000; // Convert to milliseconds for JavaScript Date
} 