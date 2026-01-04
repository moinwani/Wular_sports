// Rate Limiting Middleware for Vercel Serverless Functions
// Implements IP-based and user-based rate limiting
// Following OWASP best practices

// In-memory store for rate limiting (for serverless functions)
// In production, consider using Redis or similar for distributed rate limiting
const rateLimitStore = new Map();

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  // Window size in milliseconds (15 minutes)
  windowMs: 15 * 60 * 1000,
  // Maximum requests per window
  maxRequests: 100,
  // Maximum requests per IP per window
  maxRequestsPerIP: 50,
  // Block duration after exceeding limit (in milliseconds)
  blockDuration: 15 * 60 * 1000, // 15 minutes
};

/**
 * Get client IP address from request
 */
function getClientIP(req) {
  // Check various headers for IP (considering proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip'];
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to connection remote address
  return req.headers['x-client-ip'] || 'unknown';
}

/**
 * Clean up old entries from rate limit store
 */
function cleanupStore() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > RATE_LIMIT_CONFIG.windowMs + RATE_LIMIT_CONFIG.blockDuration) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limit for a given identifier (IP or user)
 */
function checkRateLimit(identifier, maxRequests) {
  const now = Date.now();
  const key = identifier;
  
  // Cleanup old entries periodically (every 100 requests)
  if (rateLimitStore.size > 1000) {
    cleanupStore();
  }
  
  if (!rateLimitStore.has(key)) {
    // First request - initialize
    rateLimitStore.set(key, {
      count: 1,
      windowStart: now,
      blockedUntil: null,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  const data = rateLimitStore.get(key);
  
  // Check if currently blocked
  if (data.blockedUntil && now < data.blockedUntil) {
    const retryAfter = Math.ceil((data.blockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
      resetTime: data.blockedUntil,
    };
  }
  
  // Reset window if expired
  if (now - data.windowStart > RATE_LIMIT_CONFIG.windowMs) {
    data.count = 1;
    data.windowStart = now;
    data.blockedUntil = null;
    rateLimitStore.set(key, data);
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  // Check if limit exceeded
  if (data.count >= maxRequests) {
    // Block for specified duration
    data.blockedUntil = now + RATE_LIMIT_CONFIG.blockDuration;
    rateLimitStore.set(key, data);
    const retryAfter = Math.ceil(RATE_LIMIT_CONFIG.blockDuration / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
      resetTime: data.blockedUntil,
    };
  }
  
  // Increment counter
  data.count++;
  rateLimitStore.set(key, data);
  
  return {
    allowed: true,
    remaining: maxRequests - data.count,
    resetTime: data.windowStart + RATE_LIMIT_CONFIG.windowMs,
  };
}

/**
 * Rate limiting middleware
 */
function rateLimit(req, res, next) {
  const clientIP = getClientIP(req);
  const userIdentifier = req.headers['x-user-id'] || clientIP; // User-based if available
  
  // Check IP-based rate limit
  const ipLimit = checkRateLimit(`ip:${clientIP}`, RATE_LIMIT_CONFIG.maxRequestsPerIP);
  
  if (!ipLimit.allowed) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: ipLimit.retryAfter,
      resetTime: new Date(ipLimit.resetTime).toISOString(),
    });
  }
  
  // Check user-based rate limit (if user identifier available)
  if (userIdentifier !== clientIP) {
    const userLimit = checkRateLimit(`user:${userIdentifier}`, RATE_LIMIT_CONFIG.maxRequests);
    
    if (!userLimit.allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: userLimit.retryAfter,
        resetTime: new Date(userLimit.resetTime).toISOString(),
      });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxRequests);
    res.setHeader('X-RateLimit-Remaining', userLimit.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(userLimit.resetTime).toISOString());
  }
  
  // Add IP rate limit headers
  res.setHeader('X-RateLimit-Limit-IP', RATE_LIMIT_CONFIG.maxRequestsPerIP);
  res.setHeader('X-RateLimit-Remaining-IP', ipLimit.remaining);
  res.setHeader('X-RateLimit-Reset-IP', new Date(ipLimit.resetTime).toISOString());
  
  // Continue to next middleware or handler
  // Note: In Vercel serverless functions, we don't use express-style next()
  // Instead, we return a result object that the handler checks
  return { allowed: true };
}

module.exports = rateLimit;

