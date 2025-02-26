package authorization

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/KylerJacobson/blog/backend/internal/handlers/session"
	"github.com/KylerJacobson/blog/backend/internal/httperr"
	"github.com/KylerJacobson/blog/backend/logger"
	"github.com/golang-jwt/jwt/v5"
)

const (
	RoleNonPrivileged = 0
	RoleAdmin         = 1
	RolePrivileged    = 2
	RoleRequested     = -1
)

var (
	ErrInvalidToken     = errors.New("invalid token")
	ErrExpiredToken     = errors.New("token has expired")
	ErrMissingJwtSecret = errors.New("JWT_SECRET environment variable not set")
	ErrUnauthorized     = errors.New("unauthorized")
)

type UserClaim struct {
	Sub  int `json:"sub"`
	Role int `json:"role"`
	jwt.RegisteredClaims
}

type AuthService struct {
	logger logger.Logger
}

func NewAuthService(logger logger.Logger) *AuthService {
	return &AuthService{
		logger: logger,
	}
}

func (a *AuthService) VerifyToken(w http.ResponseWriter, r *http.Request) {
	token := r.Header.Get("Authorization")
	if strings.HasPrefix(token, "Bearer ") {
		token = strings.TrimPrefix(token, "Bearer ")
	}

	claims, err := a.ParseToken(token)
	if err != nil {
		a.logger.Sugar().Warnf("Token verification failed: %v", err)
		httperr.Write(w, httperr.Unauthorized("Invalid or expired token", ""))
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Token valid for user %d", claims.Sub)
}

func (a *AuthService) ParseToken(token string) (*UserClaim, error) {
	if token == "" {
		return nil, ErrInvalidToken
	}

	key := os.Getenv("JWT_SECRET")
	if key == "" {
		a.logger.Sugar().Error("JWT_SECRET environment variable not set")
		return nil, ErrMissingJwtSecret
	}

	claims := &UserClaim{}
	parsedToken, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(key), nil
	})

	if err != nil {
		a.logger.Sugar().Warnf("Error parsing token: %v", err)
		return nil, ErrInvalidToken
	}

	if !parsedToken.Valid {
		return nil, ErrInvalidToken
	}

	if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, ErrExpiredToken
	}

	return claims, nil
}

func (a *AuthService) CheckPrivilege(r *http.Request) bool {
	token := session.Manager.GetString(r.Context(), "session_token")
	if token == "" {
		return false
	}

	claims, err := a.ParseToken(token)
	if err != nil {
		a.logger.Sugar().Warnf("Token verification failed during privilege check: %v", err)
		return false
	}

	if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
		return false
	}

	if claims.Role == RoleAdmin || claims.Role == RolePrivileged {
		return true
	}
	return false
}
