package posts

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/KylerJacobson/blog/backend/internal/api/types/posts"
	post_models "github.com/KylerJacobson/blog/backend/internal/api/types/posts"
	"github.com/KylerJacobson/blog/backend/internal/authorization"
	posts_repo "github.com/KylerJacobson/blog/backend/internal/db/posts"
	users_repo "github.com/KylerJacobson/blog/backend/internal/db/users"
	"github.com/KylerJacobson/blog/backend/internal/handlers/session"
	"github.com/KylerJacobson/blog/backend/internal/httperr"
	"github.com/KylerJacobson/blog/backend/internal/services/notifications"
	"github.com/KylerJacobson/blog/backend/logger"
	v5 "github.com/jackc/pgx/v5"
)

type PostsApi interface {
	GetRecentPosts(w http.ResponseWriter, r *http.Request)
	GetRecentPublicPosts(w http.ResponseWriter, r *http.Request)
	GetPostById(w http.ResponseWriter, r *http.Request)
	DeletePostById(w http.ResponseWriter, r *http.Request)
	CreatePost(w http.ResponseWriter, r *http.Request)
}

type postsApi struct {
	postsRepository posts_repo.PostsRepository
	usersRepository users_repo.UsersRepository
	notifier        *notifications.Notifier
	auth            *authorization.AuthService
	logger          logger.Logger
}

func New(postsRepo posts_repo.PostsRepository, usersRepo users_repo.UsersRepository, notifier *notifications.Notifier, auth *authorization.AuthService, logger logger.Logger) *postsApi {
	return &postsApi{
		postsRepository: postsRepo,
		usersRepository: usersRepo,
		notifier:        notifier,
		auth:            auth,
		logger:          logger,
	}
}

func (p *postsApi) GetRecentPosts(w http.ResponseWriter, r *http.Request) {
	posts, err := p.postsRepository.GetRecentPosts()
	if err != nil {
		p.logger.Sugar().Errorf("error getting all recent posts : %v", err)
		httperr.Write(w, httperr.Internal("error getting all recent posts", ""))
		return
	}
	b, err := json.Marshal(posts)
	if err != nil {
		p.logger.Sugar().Errorf("error unmarshalling recent posts : %v", err)
		httperr.Write(w, httperr.Internal("error getting all recent posts", ""))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(b)

}

func (p *postsApi) GetPosts(w http.ResponseWriter, r *http.Request) {
	var posts []post_models.Post
	var err error

	privileged := p.auth.CheckPrivilege(r)
	if privileged {
		posts, err = p.postsRepository.GetRecentPosts()
		if err != nil {
			p.logger.Sugar().Errorf("error getting all recent posts : %v", err)
			httperr.Write(w, httperr.Internal("error getting all recent posts", ""))
			return
		}
	} else {
		posts, err = p.postsRepository.GetRecentPublicPosts()
		if err != nil {
			p.logger.Sugar().Errorf("error getting all recent public posts : %v", err)
			httperr.Write(w, httperr.Internal("error getting all recent public posts", ""))
			return
		}
	}
	b, err := json.Marshal(posts)
	if err != nil {
		p.logger.Sugar().Errorf("error unmarshalling recent public posts : %v", err)
		httperr.Write(w, httperr.Internal("error getting posts", ""))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(b)
}

func (p *postsApi) GetRecentPublicPosts(w http.ResponseWriter, r *http.Request) {
	posts, err := p.postsRepository.GetRecentPublicPosts()
	if err != nil {
		httperr.Write(w, httperr.Internal("error getting all recent public posts", ""))
		return
	}
	b, err := json.Marshal(posts)
	if err != nil {
		p.logger.Sugar().Errorf("error unmarshalling recent public posts : %v", err)
		httperr.Write(w, httperr.Internal("error getting all recent public posts", ""))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(b)
}

func (p *postsApi) GetPostById(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	val, err := strconv.Atoi(id)
	if err != nil {
		p.logger.Sugar().Errorf("GetPostId parameter was not an integer: %v", err)
		httperr.Write(w, httperr.BadRequest("postId must be an integer", ""))
		return
	}
	post, err := p.postsRepository.GetPostById(val)
	if err != nil {
		if errors.Is(err, v5.ErrNoRows) {
			p.logger.Sugar().Warnf("post %d does not exist in the database", val)
			httperr.Write(w, httperr.NotFound("post not found", ""))
			return
		}
		httperr.Write(w, httperr.Internal("error getting post by id", ""))
		return
	}
	b, err := json.Marshal(post)
	if err != nil {
		p.logger.Sugar().Errorf("error unmarshalling post %d - %v", id, err)
		httperr.Write(w, httperr.Internal("error getting post by id", ""))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(b)
}

func (p *postsApi) DeletePostById(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	val, err := strconv.Atoi(id)
	if err != nil {
		p.logger.Sugar().Errorf("DeletePostById parameter was not an integer: %v", err)
		httperr.Write(w, httperr.BadRequest("postId must be an integer", ""))
		return
	}
	err = p.postsRepository.DeletePostById(val)
	if err != nil {
		if errors.Is(err, v5.ErrNoRows) {
			p.logger.Sugar().Warnf("post %d does not exist in the database", val)
			httperr.Write(w, httperr.NotFound("post not found", ""))
			return
		}
		httperr.Write(w, httperr.Internal("error deleting post by id", ""))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (p *postsApi) NotifyOnNewPost(post posts.PostRequestBody) error {
	users, err := p.usersRepository.GetAllUsersWithEmailNotification()
	if err != nil {
		p.logger.Sugar().Errorf("error getting all users with email notification: %v", err)
		return err
	}
	for _, user := range users {
		if post.Restricted && user.Role != 2 {
			continue
		}
		p.logger.Sugar().Infof("notifying user %s of new post", user.Email)
		err := p.notifier.NewPost(user, post)
		if err != nil {
			p.logger.Sugar().Errorf("error notifying user %s of new post: %v", user.Email, err)
			return err
		}
	}
	return nil
}

func (p *postsApi) CreatePost(w http.ResponseWriter, r *http.Request) {

	token := session.Manager.GetString(r.Context(), "session_token")

	claims, err := p.auth.ParseToken(token)
	if err != nil {
		p.logger.Sugar().Errorf("error parsing token: %v", err)
		httperr.Write(w, httperr.Unauthorized("invalid or expired token", ""))
		return
	}

	var post post_models.FrontendPostRequest

	err = json.NewDecoder(r.Body).Decode(&post)
	if err != nil {
		p.logger.Sugar().Errorf("error decoding the post request body: %v", err)
		httperr.Write(w, httperr.Internal("error decoding post request body", ""))
		return
	}

	err = validatePost(post.PostRequestBody)
	if err != nil {
		p.logger.Sugar().Errorf("the post was not formatter correctly: %v", err)
		httperr.Write(w, httperr.BadRequest("post was not formatted correctly", ""))
		return
	}

	postId, err := p.postsRepository.CreatePost(post.PostRequestBody, claims.Sub)
	if err != nil {
		p.logger.Sugar().Errorf("error creating post (%s) : %v", post.Title, err)
		httperr.Write(w, httperr.Internal("error creating post", ""))
		return
	}

	err = p.NotifyOnNewPost(post.PostRequestBody)
	if err != nil {
		p.logger.Sugar().Errorf("error notifying users of new post (%s) : %v", post.Title, err)
		httperr.Write(w, httperr.Internal("error notifying users of new post", ""))
		return
	}

	w.WriteHeader(http.StatusOK)
	b, _ := json.Marshal(postId)
	w.Write(b)
}

func (p *postsApi) UpdatePost(w http.ResponseWriter, r *http.Request) {
	token := session.Manager.GetString(r.Context(), "session_token")

	claims, err := p.auth.ParseToken(token)
	if err != nil {
		p.logger.Sugar().Errorf("error parsing token: %v", err)
		httperr.Write(w, httperr.Unauthorized("invalid or expired token", ""))
		return
	}

	var post post_models.FrontendPostRequest
	id := r.PathValue("id")
	postId, err := strconv.Atoi(id)
	if err != nil {
		p.logger.Sugar().Errorf("UpdatePost parameter was not an integer: %v", err)
		httperr.Write(w, httperr.BadRequest("postId must be an integer", ""))
		return
	}
	err = json.NewDecoder(r.Body).Decode(&post)
	if err != nil {
		p.logger.Sugar().Errorf("error decoding the post request body: %v", err)
		httperr.Write(w, httperr.Internal("error decoding post request body", ""))
		return
	}
	err = validatePost(post.PostRequestBody)
	if err != nil {
		p.logger.Sugar().Errorf("the post was not formatter correctly: %v", err)
		httperr.Write(w, httperr.BadRequest("post was not formatted correctly", ""))
		return
	}
	updatedPost, err := p.postsRepository.UpdatePost(post.PostRequestBody, postId, claims.Sub)
	if err != nil {
		p.logger.Sugar().Errorf("error updating post (%s) : %v", post.Title, err)
		httperr.Write(w, httperr.Internal("error updating post", ""))
		return
	}
	w.WriteHeader(http.StatusOK)
	b, err := json.Marshal(updatedPost)
	if err != nil {
		p.logger.Sugar().Errorf("error unmarshalling updated post (%s) : %v", post.Title, err)
		httperr.Write(w, httperr.Internal("error updating post", ""))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(b)

}

func validatePost(post post_models.PostRequestBody) error {
	if len(post.Title) < 1 {
		return fmt.Errorf("post title must not be empty")
	}
	if len(post.Content) < 1 {
		return fmt.Errorf("post content must not be empty")
	}
	return nil
}
