package authorization

import (
	"errors"
	"net/http"

	"github.com/KylerJacobson/blog/backend/internal/handlers/session"
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

func (a *AuthService) CheckPrivilege(r *http.Request) bool {
	role := session.Manager.GetInt(r.Context(), "user_role")

	if role == RoleAdmin || role == RolePrivileged {
		return true
	}
	return false
}
