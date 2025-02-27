package middleware

import (
	"net/http"
	"os"

	"github.com/KylerJacobson/blog/backend/internal/authorization"
	"github.com/KylerJacobson/blog/backend/internal/handlers/session"
	"github.com/KylerJacobson/blog/backend/internal/httperr"
	"github.com/KylerJacobson/blog/backend/logger"
)

type AuthMiddleware struct {
	authService *authorization.AuthService
	logger      logger.Logger
}

func NewAuthMiddleware(authService *authorization.AuthService, logger logger.Logger) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
		logger:      logger,
	}
}

func (m *AuthMiddleware) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := session.Manager.GetString(r.Context(), "session_token")
		if token == "" {
			m.logger.Sugar().Warn("authentication failed: No token provided")
			httperr.Write(w, httperr.Unauthorized("authentication required", ""))
			return
		}
		_, err := m.authService.ParseToken(token)
		if err != nil {
			m.logger.Sugar().Warnf("authentication failed: %v", err)
			httperr.Write(w, httperr.Unauthorized("invalid or expired token", ""))
			return
		}

		next(w, r)
	}
}

func (m *AuthMiddleware) RequireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := session.Manager.GetString(r.Context(), "session_token")

		claims, err := m.authService.ParseToken(token)
		if err != nil {
			m.logger.Sugar().Warnf("admin authorization failed: %v", err)
			httperr.Write(w, httperr.Unauthorized("authentication required", ""))
			return
		}

		if claims.Role != 1 { // Consider using a constant for this
			m.logger.Sugar().Warnf("admin authorization failed: User %d has insufficient privileges", claims.Sub)
			httperr.Write(w, httperr.Forbidden("insufficient privileges", ""))
			return
		}

		next(w, r)
	}
}

func (m *AuthMiddleware) EnableCORS(next http.HandlerFunc) http.HandlerFunc {
	// Define allowed origins explicitly
	allowedOrigins := map[string]bool{
		"https://kylerjacobson.dev":     true,
		"https://www.kylerjacobson.dev": true,
		"http://localhost:3000":         os.Getenv("ENVIRONMENT") == "dev",
	}

	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Only set CORS headers if the origin is allowed
		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Max-Age", "3600")
		}

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func (m *AuthMiddleware) SecurityHeaders(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Security headers
		w.Header().Set("Content-Security-Policy",
			"default-src 'self'; "+
				"img-src 'self' https://kylerjacobsonmedia.blob.core.windows.net; "+
				"media-src 'self' https://kylerjacobsonmedia.blob.core.windows.net;")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")

		// Additional recommended headers
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

		next(w, r)
	}
}
