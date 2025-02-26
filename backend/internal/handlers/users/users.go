package users

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/KylerJacobson/blog/backend/logger"

	"github.com/KylerJacobson/blog/backend/internal/api/types/users"
	"github.com/KylerJacobson/blog/backend/internal/authorization"
	users_repo "github.com/KylerJacobson/blog/backend/internal/db/users"
	"github.com/KylerJacobson/blog/backend/internal/handlers/session"
	"github.com/KylerJacobson/blog/backend/internal/httperr"
	pgxv5 "github.com/jackc/pgx/v5"
)

type UsersApi interface {
	CreateUser(w http.ResponseWriter, r *http.Request)
	GetUserById(w http.ResponseWriter, r *http.Request)
	UpdateUser(w http.ResponseWriter, r *http.Request)
	ListUsers(w http.ResponseWriter, r *http.Request)
	DeleteUserById(w http.ResponseWriter, r *http.Request)
	LoginUser(w http.ResponseWriter, r *http.Request)
	GetUserFromSession(w http.ResponseWriter, r *http.Request)
}

type usersApi struct {
	usersRepository users_repo.UsersRepository
	auth            *authorization.AuthService
	logger          logger.Logger
}

func New(usersRepo users_repo.UsersRepository, auth *authorization.AuthService, logger logger.Logger) *usersApi {
	return &usersApi{
		usersRepository: usersRepo,
		auth:            auth,
		logger:          logger,
	}
}

func (u *usersApi) GetUserById(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	val, err := strconv.Atoi(id)
	if err != nil {
		u.logger.Sugar().Errorf("GetPostId parameter was not an integer: %v", err)
		httperr.Write(w, httperr.BadRequest("postId must be an integer", err.Error()))
		return
	}
	user, err := u.usersRepository.GetUserById(val)
	if err != nil {
		if errors.Is(err, pgxv5.ErrNoRows) {
			u.logger.Sugar().Infof("User with id: %d does not exist in the database", val)
			httperr.Write(w, httperr.NotFound("User not found", ""))
			return
		}
		httperr.Write(w, httperr.Internal("failed to get user", err.Error()))
		return
	}
	if user == nil {
		u.logger.Sugar().Infof("user with id %d not found", val)
		w.WriteHeader(http.StatusNotFound)
		return
	}
	b, err := json.Marshal(user)
	if err != nil {
		u.logger.Sugar().Errorf("error marshalling user : %v", err)
		httperr.Write(w, httperr.Internal("failed to get user", err.Error()))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(b)
}

func (u *usersApi) DeleteUserById(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	val, err := strconv.Atoi(id)
	if err != nil {
		u.logger.Sugar().Errorf("Delete user parameter was not an integer: %v", err)
		httperr.Write(w, httperr.BadRequest("postId must be an integer", err.Error()))
		return
	}
	err = u.usersRepository.DeleteUserById(val)
	if err != nil {
		if errors.Is(err, pgxv5.ErrNoRows) {
			u.logger.Sugar().Infof("User with id: %d does not exist in the database", val)
			httperr.Write(w, httperr.NotFound("User not found", ""))
			return
		}
		httperr.Write(w, httperr.Internal("failed to delete user", err.Error()))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (u *usersApi) CreateUser(w http.ResponseWriter, r *http.Request) {
	var accountCreationRequest users.AccountCreationRequest
	err := json.NewDecoder(r.Body).Decode(&accountCreationRequest)
	if err != nil {
		u.logger.Sugar().Errorf("Error decoding the user request body: %v", err)
		httperr.Write(w, httperr.BadRequest("Invalid request body", err.Error()))
		return
	}

	err = validateCreateUserRequest(accountCreationRequest.User)
	if err != nil {
		u.logger.Sugar().Errorf("error validating user create request", err)
		httperr.Write(w, httperr.BadRequest("Invalid request body", err.Error()))
		return
	}

	userId, err := u.usersRepository.CreateUser(accountCreationRequest.User)
	if err != nil {
		u.logger.Sugar().Errorf("error creating user for %s %s : %v", accountCreationRequest.User.FirstName, accountCreationRequest.User.LastName, err)
		httperr.Write(w, httperr.New(http.StatusInternalServerError, "failed to create user", ""))
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id": userId,
	})
}

func validateCreateUserRequest(userRequest users.UserCreate) error {
	var errors []string
	if userRequest.FirstName == "" {
		errors = append(errors, "first name is required")
	}
	if userRequest.LastName == "" {
		errors = append(errors, "last name is required")
	}
	if userRequest.Email == "" {
		errors = append(errors, "email is required")
	}
	if userRequest.Password == "" {
		errors = append(errors, "password is required")
	}
	if len(userRequest.Password) < 8 {
		errors = append(errors, "password must be at least 8 characters long")
	}
	if strings.Contains(userRequest.Email, "@") == false {
		errors = append(errors, "invalid email format")
	}
	if userRequest.AccessRequest != -1 && userRequest.AccessRequest != 0 && userRequest.AccessRequest != 2 {
		errors = append(errors, "access request must be -1, 0 or 2")
	}
	if len(errors) > 0 {
		return fmt.Errorf(strings.Join(errors, ", "))
	}
	return nil
}

func (u *usersApi) LoginUser(w http.ResponseWriter, r *http.Request) {
	var userLoginRequest users.UserLogin
	err := json.NewDecoder(r.Body).Decode(&userLoginRequest)
	if err != nil {
		u.logger.Sugar().Errorf("Error decoding the user request body: %v", err)
		httperr.Write(w, httperr.BadRequest("Invalid request body", err.Error()))
		return
	}
	if userLoginRequest.Email == "" || userLoginRequest.Password == "" {
		u.logger.Sugar().Errorf("error validating user login request: %v", err)
		httperr.Write(w, httperr.BadRequest("Invalid request body", "email and password are required"))
		return
	}
	user, err := u.usersRepository.LoginUser(userLoginRequest)
	if err != nil {
		u.logger.Sugar().Errorf("error logging in user for %s : %v", userLoginRequest.Email, err)
		httperr.Write(w, httperr.Internal("failed to login user", err.Error()))
		return
	}
	if user == nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	b, err := json.Marshal(user)
	if err != nil {
		u.logger.Sugar().Errorf("error marshalling the login user response: %v", err)
		httperr.Write(w, httperr.Internal("failed to login user", err.Error()))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(b)
}

func (u *usersApi) ListUsers(w http.ResponseWriter, r *http.Request) {
	allUsers, err := u.usersRepository.GetAllUsers()
	if err != nil {
		u.logger.Sugar().Errorf("error listing users: %v", err)
		httperr.Write(w, httperr.Internal("failed to list users", err.Error()))
		return
	}
	b, err := json.Marshal(allUsers)
	if err != nil {
		u.logger.Sugar().Errorf("error marshalling the users list: %v", err)
		httperr.Write(w, httperr.Internal("failed to list users", err.Error()))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(b)
}

func (u *usersApi) UpdateUser(w http.ResponseWriter, r *http.Request) {
	var userUpdate users.UserUpdate
	err := json.NewDecoder(r.Body).Decode(&userUpdate)
	if err != nil {
		u.logger.Sugar().Errorf("Error decoding the user request body: %v", err)
		httperr.Write(w, httperr.BadRequest("Invalid request body", err.Error()))
		return
	}

	err = u.validateUpdateUserRequest(r, userUpdate)
	if err != nil {
		u.logger.Sugar().Errorf("error validating user update request: %v", err)
		httperr.Write(w, httperr.BadRequest("Invalid request body", err.Error()))
		return
	}

	err = u.usersRepository.UpdateUser(userUpdate)
	if err != nil {
		if errors.Is(err, pgxv5.ErrNoRows) {
			u.logger.Sugar().Infof("User with id: %s does not exist in the database", userUpdate.Id)
			httperr.Write(w, httperr.NotFound("User not found", ""))
			return
		}
		httperr.Write(w, httperr.Internal("failed to update user", err.Error()))
		return
	}
	w.WriteHeader(http.StatusNoContent)

}

func (u *usersApi) GetUserFromSession(w http.ResponseWriter, r *http.Request) {
	loggedIn := session.Manager.Exists(r.Context(), "session_token")
	if !loggedIn {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	token := session.Manager.GetString(r.Context(), "session_token")
	claims, err := u.auth.ParseToken(token)
	if err != nil {
		u.logger.Sugar().Errorf("error parsing token: %v", err)
		httperr.Write(w, httperr.Unauthorized("invalid or expired token", ""))
		return
	}

	user, err := u.usersRepository.GetUserById(claims.Sub)
	if err != nil {
		if errors.Is(err, pgxv5.ErrNoRows) {
			u.logger.Sugar().Infof("User with id: %d does not exist in the database", claims.Sub)
			httperr.Write(w, httperr.NotFound("User not found", ""))
			return
		}
		httperr.Write(w, httperr.Internal("failed to get user", err.Error()))
		return
	}
	if user == nil {
		u.logger.Sugar().Infof("user with id %d not found", claims.Sub)
		w.WriteHeader(http.StatusNotFound)
		return
	}
	b, err := json.Marshal(user)
	if err != nil {
		u.logger.Sugar().Errorf("error marshalling user : %v", err)
		httperr.Write(w, httperr.Internal("failed to get user", err.Error()))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(b)
}

func (u *usersApi) validateUpdateUserRequest(r *http.Request, userUpdate users.UserUpdate) error {
	// Check path value matches current userID
	errors := []error{}
	id := r.PathValue("id")
	userID, err := strconv.Atoi(id)
	if err != nil {
		u.logger.Sugar().Errorf("Update user parameter was not an integer: %v", err)
		errors = append(errors, err)
	}
	token := session.Manager.GetString(r.Context(), "session_token")
	claims, err := u.auth.ParseToken(token)
	if err != nil {
		u.logger.Sugar().Errorf("error parsing token: %v", err)
		errors = append(errors, err)
	}

	if claims.Sub != userID && claims.Role != 1 {
		u.logger.Sugar().Errorf("user %d attempted to update user %d", claims.Sub, userID)
		errors = append(errors, err)
	}

	// Validate permission escalation / deescalation
	if claims.Sub == authorization.RoleAdmin && userID == 1 && userUpdate.Role != authorization.RoleAdmin {
		u.logger.Sugar().Errorf("user is already an admin, cannot decrease permission: %v", err)
		errors = append(errors, err)
	}
	if claims.Role != 1 && userUpdate.Role == 1 {
		u.logger.Sugar().Errorf("access denied: %v", err)
		errors = append(errors, err)
	}

	// Validate fields
	if userUpdate.FirstName == "" {
		errors = append(errors, fmt.Errorf("first name is required"))
	}
	if userUpdate.LastName == "" {
		errors = append(errors, fmt.Errorf("last name is required"))
	}
	if userUpdate.Email == "" {
		errors = append(errors, fmt.Errorf("email is required"))
	}

	if len(errors) > 0 {
		return fmt.Errorf("validation failed: %v", errors)
	}
	return nil
}
