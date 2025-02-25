package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	m "github.com/KylerJacobson/blog/backend/internal/middleware"
	"github.com/KylerJacobson/blog/backend/internal/services/azure"
	"github.com/KylerJacobson/blog/backend/internal/services/emailer"
	"github.com/KylerJacobson/blog/backend/internal/services/notifications"

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

	apiKey := os.Getenv("SENDGRID_API_KEY")
	if apiKey == "" {
		zapLogger.Sugar().Errorf("SENDGRID_API_KEY not set")
		panic("SENDGRID_API_KEY not set")
	}

	sendGridClient := emailer.NewSendGridClient(apiKey)
	emailer := emailer.NewEmailerService(sendGridClient, &emailer.SendGridEmailFactory{}, "kyler@kylerjacobson.dev", "Kyler Jacobson")
	notifier := notifications.NewNotificationsService(emailer)

	usersRepo := usersRepo.New(dbPool, zapLogger)
	postsRepo := postsRepo.New(dbPool, zapLogger)
	usersApi := users.New(usersRepo, zapLogger)
	postsApi := posts.New(postsRepo, usersRepo, notifier, zapLogger)

	sessionApi := session.New(usersRepo, zapLogger)
	mediaApi := media.New(mediaRepo.New(dbPool, zapLogger), zapLogger, azureClient)

	// ---------------------------- Posts ----------------------------
	mux.HandleFunc("GET /api/posts", m.EnableCORS(postsApi.GetPosts))
	mux.HandleFunc("GET /api/posts/recent", m.EnableCORS(postsApi.GetRecentPosts))
	mux.HandleFunc("GET /api/posts/{id}", m.EnableCORS(postsApi.GetPostById))
	mux.HandleFunc("DELETE /api/posts/{id}", m.EnableCORS(postsApi.DeletePostById))
	mux.HandleFunc("POST /api/posts", m.EnableCORS(postsApi.CreatePost))
	mux.HandleFunc("PUT /api/posts/{id}", m.EnableCORS(postsApi.UpdatePost))

	// ---------------------------- Users ----------------------------
	mux.HandleFunc("POST /api/user", m.EnableCORS(usersApi.CreateUser))
	mux.HandleFunc("GET /api/user", m.EnableCORS(usersApi.GetUserFromSession))
	mux.HandleFunc("GET /api/user/{id}", m.EnableCORS(usersApi.GetUserById))
	mux.HandleFunc("PUT /api/user/{id}", m.EnableCORS(usersApi.UpdateUser))
	mux.HandleFunc("DELETE /api/user/{id}", m.EnableCORS(usersApi.DeleteUserById))

	// ---------------------------- Admin ----------------------------
	mux.HandleFunc("GET /api/user/list", http.HandlerFunc(m.AuthAdminMiddleware(usersApi.ListUsers)))

	// ---------------------------- Session ----------------------------

	mux.HandleFunc("POST /api/session", m.EnableCORS(sessionApi.CreateSession))
	//mux.HandleFunc("POST /api/verifyToken", m.EnableCORS(authorization.VerifyToken))
	mux.HandleFunc("DELETE /api/session", m.EnableCORS(sessionApi.DeleteSession))

	// ---------------------------- Media ----------------------------
	mux.HandleFunc("POST /api/media", m.EnableCORS(mediaApi.UploadMedia))
	mux.HandleFunc("GET /api/media/{id}", m.EnableCORS(mediaApi.GetMediaByPostId))
	mux.HandleFunc("DELETE /api/media/{id}", m.EnableCORS(mediaApi.DeleteMediaByPostId))

	// Serve static files from the React build directory
	fs := http.FileServer(http.Dir("public"))

	// Handle all non-API routes by serving the React app
	mux.HandleFunc("GET /*", m.EnableCORS(func(w http.ResponseWriter, r *http.Request) {
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
}
