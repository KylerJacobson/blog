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
