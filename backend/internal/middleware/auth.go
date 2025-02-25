package middleware

import (
	"net/http"

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
			m.logger.Sugar().Warn("Authentication failed: No token provided")
			httperr.Write(w, httperr.Unauthorized("authentication required", ""))
			return
		}
		_, err := m.authService.ParseToken(token)
		if err != nil {
			m.logger.Sugar().Warnf("Authentication failed: %v", err)
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
			m.logger.Sugar().Warnf("Admin authorization failed: %v", err)
			httperr.Write(w, httperr.Unauthorized("authentication required", ""))
			return
		}

		if claims.Role != 1 { // Consider using a constant for this
			m.logger.Sugar().Warnf("Admin authorization failed: User %d has insufficient privileges", claims.Sub)
			httperr.Write(w, httperr.Forbidden("insufficient privileges", ""))
			return
		}

		next(w, r)
	}
}

func (m *AuthMiddleware) EnableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", r.Header.Get("Origin"))
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}
