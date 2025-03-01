package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/KylerJacobson/blog/backend/internal/authorization"
	"github.com/KylerJacobson/blog/backend/internal/middleware"
	"github.com/KylerJacobson/blog/backend/internal/services/azure"
	"github.com/KylerJacobson/blog/backend/internal/services/emailer"
	"github.com/KylerJacobson/blog/backend/internal/services/notifications"

	analytics_repo "github.com/KylerJacobson/blog/backend/internal/db/analytics"
	"github.com/KylerJacobson/blog/backend/internal/db/config"

	mediaRepo "github.com/KylerJacobson/blog/backend/internal/db/media"
	postsRepo "github.com/KylerJacobson/blog/backend/internal/db/posts"
	usersRepo "github.com/KylerJacobson/blog/backend/internal/db/users"
	"github.com/KylerJacobson/blog/backend/internal/handlers/analytics"
	"github.com/KylerJacobson/blog/backend/internal/handlers/media"
	"github.com/KylerJacobson/blog/backend/internal/handlers/posts"
	"github.com/KylerJacobson/blog/backend/internal/handlers/session"
	"github.com/KylerJacobson/blog/backend/internal/handlers/users"
	"github.com/KylerJacobson/blog/backend/logger"
)

func main() {
	// Setup logger
	env := os.Getenv("ENVIRONMENT")
	zapLogger, err := logger.NewLogger(env)
	if err != nil {
		log.Fatal(err)
	}
	defer zapLogger.Sync()

	// Setup database connection
	dbPool := config.GetDBConn(zapLogger)
	defer dbPool.Close()

	// Setup Azure client
	azureClient := azure.NewAzureClient(zapLogger)

	// Setup SendGrid client
	apiKey := os.Getenv("SENDGRID_API_KEY")
	if apiKey == "" {
		zapLogger.Sugar().Errorf("SENDGRID_API_KEY not set")
		panic("SENDGRID_API_KEY not set")
	}
	sendGridClient := emailer.NewSendGridClient(apiKey)

	// Setup notifications service
	emailer := emailer.NewEmailerService(sendGridClient, &emailer.SendGridEmailFactory{}, "kyler@kylerjacobson.dev", "Kyler Jacobson")
	notifier := notifications.NewNotificationsService(emailer)

	// Setup session manager
	session.Init()

	// Setup HTTP server
	mux := http.NewServeMux()

	// Setup Middleware
	authService := authorization.NewAuthService(zapLogger)
	am := middleware.NewAuthMiddleware(authService, zapLogger)
	rl := middleware.NewRateLimiter(zapLogger)

	// Setup API handlers
	usersRepo := usersRepo.New(dbPool, zapLogger)
	postsRepo := postsRepo.New(dbPool, zapLogger)
	analyticsRepo := analytics_repo.New(dbPool, zapLogger)
	analyticsApi := analytics.New(analyticsRepo, zapLogger)
	usersApi := users.New(usersRepo, authService, zapLogger)
	postsApi := posts.New(postsRepo, usersRepo, notifier, authService, zapLogger)
	sessionApi := session.New(usersRepo, zapLogger)
	mediaApi := media.New(mediaRepo.New(dbPool, zapLogger), authService, zapLogger, azureClient)

	// ---------------------------- Posts ----------------------------
	mux.HandleFunc("GET /api/posts", am.SecurityHeaders(am.EnableCORS(rl.Limit(postsApi.GetPosts))))
	mux.HandleFunc("GET /api/posts/recent", am.SecurityHeaders(am.EnableCORS(rl.Limit(postsApi.GetRecentPosts))))
	mux.HandleFunc("GET /api/posts/{id}", am.SecurityHeaders(am.EnableCORS(rl.Limit(postsApi.GetPostById))))
	mux.HandleFunc("DELETE /api/posts/{id}", am.SecurityHeaders(am.EnableCORS(rl.Limit(am.RequireAdmin(postsApi.DeletePostById)))))
	mux.HandleFunc("POST /api/posts", am.SecurityHeaders(am.EnableCORS(rl.Limit(am.RequireAdmin(postsApi.CreatePost)))))
	mux.HandleFunc("PUT /api/posts/{id}", am.SecurityHeaders(am.EnableCORS(rl.Limit(am.RequireAdmin(postsApi.UpdatePost)))))

	// ---------------------------- Users ----------------------------
	mux.HandleFunc("POST /api/user", am.SecurityHeaders(am.EnableCORS(rl.Limit(usersApi.CreateUser))))
	mux.HandleFunc("GET /api/user", am.SecurityHeaders(am.EnableCORS(rl.Limit(usersApi.GetUserFromSession))))
	mux.HandleFunc("GET /api/user/{id}", am.SecurityHeaders(am.EnableCORS(rl.Limit(usersApi.GetUserById))))
	mux.HandleFunc("PUT /api/user/{id}", am.SecurityHeaders(am.EnableCORS(rl.Limit(usersApi.UpdateUser))))
	mux.HandleFunc("DELETE /api/user/{id}", am.SecurityHeaders(am.EnableCORS(rl.Limit(usersApi.DeleteUserById))))

	// ---------------------------- Admin ----------------------------
	mux.HandleFunc("GET /api/user/list", am.SecurityHeaders(am.EnableCORS(rl.Limit(am.RequireAdmin(usersApi.ListUsers)))))

	// ---------------------------- Session ----------------------------

	mux.HandleFunc("POST /api/session", am.SecurityHeaders(am.EnableCORS(rl.StrictLimit(sessionApi.CreateSession))))
	mux.HandleFunc("DELETE /api/session", am.SecurityHeaders(am.EnableCORS(rl.Limit(sessionApi.DeleteSession))))

	// ---------------------------- Media ----------------------------
	mux.HandleFunc("POST /api/media", am.SecurityHeaders(am.EnableCORS(rl.Limit(am.RequireAdmin(mediaApi.UploadMedia)))))
	mux.HandleFunc("GET /api/media/{id}", am.SecurityHeaders(am.EnableCORS(rl.Limit(mediaApi.GetMediaByPostId))))
	mux.HandleFunc("DELETE /api/media/{id}", am.SecurityHeaders(am.EnableCORS(rl.Limit(am.RequireAdmin(mediaApi.DeleteMediaByPostId)))))

	// ---------------------------- Analytics ----------------------------
	// Route for recording page views (doesn't need authentication)
	mux.HandleFunc("POST /api/analytics/pageview", am.SecurityHeaders(am.EnableCORS(rl.Limit(analyticsApi.RecordPageView))))

	// Route for getting analytics summary (admin only)
	mux.HandleFunc("GET /api/analytics/summary", am.SecurityHeaders(am.EnableCORS(rl.Limit(am.RequireAdmin(analyticsApi.GetSummary)))))

	// Optional: Add a route for data retention/cleanup (admin only)
	mux.HandleFunc("POST /api/analytics/purge", am.SecurityHeaders(am.EnableCORS(rl.Limit(am.RequireAdmin(analyticsApi.PurgeOldData)))))

	// Serve static files from the React build directory
	fs := http.FileServer(http.Dir("public"))

	// Handle all non-API routes by serving the React app
	mux.HandleFunc("GET /*", am.SecurityHeaders(am.EnableCORS(func(w http.ResponseWriter, r *http.Request) {
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
	})))

	zapLogger.Sugar().Infof("Logging level set to %s", env)
	zapLogger.Sugar().Infof("listening on port: %d", 8080)
	http.ListenAndServe(":8080", session.Manager.LoadAndSave(mux))
}
