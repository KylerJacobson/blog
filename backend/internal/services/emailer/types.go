package emailer

import (
	"github.com/KylerJacobson/blog/backend/internal/api/types/posts"
	"github.com/KylerJacobson/blog/backend/internal/api/types/users"
)

// Email represents a provider-independent email message
type Email struct {
	FromName    string
	FromEmail   string
	ToName      string
	ToEmail     string
	Subject     string
	PlainText   string
	HTMLContent string
}

type EmailClient interface {
	Send(email Email) error
}

// Emailer defines the main interface for sending different types of emails
type Emailer interface {
	NewPostEmail(user users.User, post posts.PostRequestBody) error
	NewUserNotificationEmail(user users.User) error
}
