package middleware

import (
	"net/http"

	"github.com/KylerJacobson/blog/backend/internal/authorization"
	"github.com/KylerJacobson/blog/backend/internal/handlers/session"
	"github.com/KylerJacobson/blog/backend/internal/httperr"
)

func AuthAdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Check session to see if user is logged in
		if !session.Manager.Exists(r.Context(), "session_token") {
			httperr.Write(w, httperr.New(http.StatusUnauthorized, "Unauthorized", "You are not authorized to access this resource"))
			return
		}
		token := session.Manager.GetString(r.Context(), "session_token")
		claims := authorization.DecodeToken(token)
		if claims.Role != 1 {
			httperr.Write(w, httperr.New(http.StatusForbidden, "Unauthorized", "You are not authorized to access this resource"))
			return
		}
		next(w, r)
	}
}

func EnableCORS(next http.HandlerFunc) http.HandlerFunc {
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
