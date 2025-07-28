// Snowflake ID generator for unique block identifiers
// Format: 64-bit integer with timestamp, user, hour, and random components

class SnowflakeGenerator {
  constructor(userId = 0) {
    this.userId = userId & 0x3FF; // 10 bits for user ID
    this.sequence = 0;
    this.lastTimestamp = -1;
  }

  generate() {
    let timestamp = Date.now();
    
    // If we're in the same millisecond, increment sequence
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & 0xFFF; // 12 bits for sequence
      if (this.sequence === 0) {
        // Wait for next millisecond if sequence overflows
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0;
    }
    
    this.lastTimestamp = timestamp;
    
    // Extract hour for better time-based grouping
    const hour = new Date(timestamp).getHours();
    
    // Build 64-bit ID:
    // 42 bits: timestamp (milliseconds since epoch)
    // 10 bits: user ID
    // 5 bits: hour (0-23)
    // 7 bits: random + sequence
    const id = (
      (BigInt(timestamp) << 22n) |
      (BigInt(this.userId) << 12n) |
      (BigInt(hour) << 7n) |
      BigInt(this.sequence & 0x7F)
    );
    
    return id.toString();
  }
  
  waitNextMillis(lastTimestamp) {
    let timestamp = Date.now();
    while (timestamp <= lastTimestamp) {
      timestamp = Date.now();
    }
    return timestamp;
  }
}

// Global generator instance
let globalGenerator = null;

export function initializeSnowflakeGenerator(userId = 0) {
  globalGenerator = new SnowflakeGenerator(userId);
}

export function generateBlockId() {
  if (!globalGenerator) {
    globalGenerator = new SnowflakeGenerator();
  }
  return globalGenerator.generate();
}

export function getCurrentTimestamp() {
  return new Date().toISOString();
} 