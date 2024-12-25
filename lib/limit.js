export class RateLimiter {
  constructor() {
    this.tokens = 0;
    this.lastRefill = 0;
  }

  async wait(requestsPerWindow, windowSeconds) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const timePassed = now - this.lastRefill;
    
    // If it's the first call or a time window has passed, reset tokens
    if (this.lastRefill === 0 || timePassed >= windowMs) {
      this.tokens = requestsPerWindow;
      this.lastRefill = now;
    }
    
    // If no tokens available, wait until next time window
    if (this.tokens <= 0) {
      const waitTime = windowMs - timePassed;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.tokens = requestsPerWindow;
      this.lastRefill = Date.now();
    }
    
    this.tokens--;
  }
}
