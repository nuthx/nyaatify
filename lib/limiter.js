export class RateLimiter {
  constructor() {
    this.tokens = 0;
    this.lastRefill = Date.now();
  }

  async requestPerMinutes(requestsPerMinute) {
    const now = Date.now();
    const tokenRefillRate = requestsPerMinute / 60;
    
    const newTokens = ((now - this.lastRefill) / 1000) * tokenRefillRate;
    this.tokens = Math.min(requestsPerMinute, this.tokens + newTokens);
    
    // If no tokens available, wait for enough tokens
    if (this.tokens < 1) {
      const waitTime = Math.ceil((1 - this.tokens) / tokenRefillRate * 1000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.tokens = 1;
    }
    
    this.tokens--;
    this.lastRefill = now;
  }
}
