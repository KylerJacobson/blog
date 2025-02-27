package session

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/KylerJacobson/blog/backend/internal/api/types/users"
	users_repo "github.com/KylerJacobson/blog/backend/internal/db/users"
	"github.com/KylerJacobson/blog/backend/internal/httperr"
	"github.com/KylerJacobson/blog/backend/logger"
	"github.com/alexedwards/scs/v2"
	"github.com/golang-jwt/jwt/v5"
)

var Manager *scs.SessionManager

type UserClaim struct {
	Sub  int `json:"sub"`
	Role int `json:"role"`
	jwt.RegisteredClaims
}

type SessionApi interface {
	CreateSession(w http.ResponseWriter, r *http.Request)
	DeleteSession(w http.ResponseWriter, r *http.Request)
}
type sessionApi struct {
	usersRepository users_repo.UsersRepository
	logger          logger.Logger
}

func New(usersRepo users_repo.UsersRepository, logger logger.Logger) *sessionApi {
	return &sessionApi{
		usersRepository: usersRepo,
		logger:          logger,
	}
}

func Init() {
	Manager = scs.New()
	Manager.Lifetime = 3 * time.Hour
	Manager.IdleTimeout = 20 * time.Minute
	Manager.Cookie.HttpOnly = true
	Manager.Cookie.Persist = true
	Manager.Cookie.Secure = true
	if os.Getenv("ENVIRONMENT") == "prod" {
		Manager.Cookie.Domain = "kylerjacobson.dev"
		Manager.Cookie.SameSite = http.SameSiteStrictMode
	}
}

func (sessionApi *sessionApi) CreateSession(w http.ResponseWriter, r *http.Request) {
	var userLoginFormRequest users.UserLoginForm
	err := json.NewDecoder(r.Body).Decode(&userLoginFormRequest)
	if err != nil {
		sessionApi.logger.Sugar().Errorf("error decoding the user request body: %v", err)
		httperr.Write(w, httperr.BadRequest("error decoding the user request body", ""))
		return
	}
	user, err := sessionApi.usersRepository.LoginUser(userLoginFormRequest.FormData)
	if err != nil {
		sessionApi.logger.Sugar().Errorf("error logging in user for %s : %v", userLoginFormRequest.FormData.Email, err)
		httperr.Write(w, httperr.Internal("error logging in user", ""))
		return
	}
	if user == nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	id, err := strconv.Atoi(user.Id)
	if err != nil {
		sessionApi.logger.Sugar().Errorf("error converting user id to int: %v", err)
		httperr.Write(w, httperr.Internal("internal server error", ""))
		return
	}

	Manager.Put(r.Context(), "user_id", id)
	Manager.Put(r.Context(), "user_role", user.Role)

	w.WriteHeader(http.StatusOK)
}

func (sessionApi *sessionApi) DeleteSession(w http.ResponseWriter, r *http.Request) {
	Manager.Destroy(r.Context())
	w.WriteHeader(http.StatusOK)
}
