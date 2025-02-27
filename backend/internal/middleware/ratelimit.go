package middleware

import (
	"net/http"
	"sync"

	"github.com/KylerJacobson/blog/backend/internal/httperr"
	"github.com/KylerJacobson/blog/backend/logger"
	"golang.org/x/time/rate"
)

type RateLimiter struct {
	ipLimiters map[string]*rate.Limiter
	mu         sync.Mutex
	logger     logger.Logger
}

func NewRateLimiter(logger logger.Logger) *RateLimiter {
	return &RateLimiter{
		ipLimiters: make(map[string]*rate.Limiter),
		logger:     logger,
	}
}
func (rl *RateLimiter) GetLimiter(ip string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	limiter, exists := rl.ipLimiters[ip]
	if !exists {
		// Create a new limiter for this IP:
		// - rate of 5 requests per second
		// - burst capacity of 30
		limiter = rate.NewLimiter(rate.Limit(2), 30)
		rl.ipLimiters[ip] = limiter
	}

	return limiter
}

func (rl *RateLimiter) Limit(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			ip = forwarded
		}

		limiter := rl.GetLimiter(ip)

		if !limiter.Allow() {
			rl.logger.Sugar().Warnf("rate limit exceeded for IP: %s", ip)
			w.Header().Set("Retry-After", "5")
			httperr.Write(w, httperr.New(http.StatusTooManyRequests, "too many requests", "please try again later"))
			return
		}

		next(w, r)
	}
}

func (rl *RateLimiter) StrictLimit(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			ip = forwarded
		}

		// Get rate limiter for this IP (create a one-time stricter limiter)
		limiter := rate.NewLimiter(rate.Limit(0.2), 3) // 1 request per 5 seconds, burst of 3

		if !limiter.Allow() {
			rl.logger.Sugar().Warnf("strict rate limit exceeded for IP: %s", ip)
			w.Header().Set("Retry-After", "10")
			httperr.Write(w, httperr.New(http.StatusTooManyRequests, "too many requests", "please try again later"))
			return
		}

		next(w, r)
	}
}
