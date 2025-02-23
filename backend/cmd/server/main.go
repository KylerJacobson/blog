package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/KylerJacobson/blog/backend/internal/middleware"
	"github.com/KylerJacobson/blog/backend/internal/services/azure"

	"github.com/KylerJacobson/blog/backend/internal/authorization"
	"github.com/KylerJacobson/blog/backend/internal/db/config"

	mediaRepo "github.com/KylerJacobson/blog/backend/internal/db/media"
	postsRepo "github.com/KylerJacobson/blog/backend/internal/db/posts"
	usersRepo "github.com/KylerJacobson/blog/backend/internal/db/users"
	"github.com/KylerJacobson/blog/backend/internal/handlers/media"
	"github.com/KylerJacobson/blog/backend/internal/handlers/posts"
	"github.com/KylerJacobson/blog/backend/internal/handlers/session"
	"github.com/KylerJacobson/blog/backend/internal/handlers/users"
	"github.com/KylerJacobson/blog/backend/logger"
)

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// w.Header().Set("Access-Control-Allow-Origin", r.Header.Get("Origin"))
		// w.Header().Set("Access-Control-Allow-Credentials", "true")
		// w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		// w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}
func main() {

	env := os.Getenv("ENVIRONMENT")
	zapLogger, err := logger.NewLogger(env)
	if err != nil {
		log.Fatal(err)
	}
	defer zapLogger.Sync()
	dbPool := config.GetDBConn(zapLogger)
	defer dbPool.Close()

	azureClient := azure.NewAzureClient(zapLogger)

	session.Init()

	mux := http.NewServeMux()
	usersApi := users.New(usersRepo.New(dbPool, zapLogger), zapLogger)
	postsApi := posts.New(postsRepo.New(dbPool, zapLogger), zapLogger)

	sessionApi := session.New(usersRepo.New(dbPool, zapLogger), zapLogger)
	mediaApi := media.New(mediaRepo.New(dbPool, zapLogger), zapLogger, azureClient)

	// ---------------------------- Posts ----------------------------
	mux.HandleFunc("GET /api/posts", enableCORS(postsApi.GetPosts))
	mux.HandleFunc("GET /api/posts/recent", enableCORS(postsApi.GetRecentPosts))
	mux.HandleFunc("GET /api/posts/{id}", enableCORS(postsApi.GetPostById))
	mux.HandleFunc("DELETE /api/posts/{id}", enableCORS(postsApi.DeletePostById))
	mux.HandleFunc("POST /api/posts", enableCORS(postsApi.CreatePost))
	mux.HandleFunc("PUT /api/posts/{id}", enableCORS(postsApi.UpdatePost))

	// ---------------------------- Users ----------------------------
	mux.HandleFunc("POST /api/user", enableCORS(usersApi.CreateUser))
	mux.HandleFunc("GET /api/user", enableCORS(usersApi.GetUserFromSession))
	mux.HandleFunc("GET /api/user/{id}", enableCORS(usersApi.GetUserById))
	mux.HandleFunc("PUT /api/user/{id}", enableCORS(usersApi.UpdateUser))
	mux.HandleFunc("DELETE /api/user/{id}", enableCORS(usersApi.DeleteUserById))

	// TODO Create admin route with authorization and update user list

	// ---------------------------- Admin ----------------------------
	mux.HandleFunc("GET /api/user/list", http.HandlerFunc(middleware.AuthAdminMiddleware(usersApi.ListUsers)))

	// ---------------------------- Session ----------------------------

	mux.HandleFunc("POST /api/session", enableCORS(sessionApi.CreateSession))
	mux.HandleFunc("POST /api/verifyToken", enableCORS(authorization.VerifyToken))
	mux.HandleFunc("DELETE /api/session", enableCORS(sessionApi.DeleteSession))

	// ---------------------------- Media ----------------------------
	mux.HandleFunc("POST /api/media", enableCORS(mediaApi.UploadMedia))
	mux.HandleFunc("GET /api/media/{id}", enableCORS(mediaApi.GetMediaByPostId))
	mux.HandleFunc("DELETE /api/media/{id}", enableCORS(mediaApi.DeleteMediaByPostId))

	// Serve static files from the React build directory
	fs := http.FileServer(http.Dir("public"))

	// Handle all non-API routes by serving the React app
	mux.HandleFunc("GET /*", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		// Don't handle API routes here
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		// Serve index.html for all routes to support React Router
		if !strings.Contains(r.URL.Path, ".") {
			http.ServeFile(w, r, "public/index.html")
			return
		}

		// Serve static files (CSS, JS, images, etc.)
		fs.ServeHTTP(w, r)
	}))

	zapLogger.Sugar().Infof("Logging level set to %s", env)
	zapLogger.Sugar().Infof("listening on port: %d", 8080)
	http.ListenAndServe(":8080", session.Manager.LoadAndSave(mux))
	// log.Fatal(http.ListenAndServe(":8080", nil))
}
