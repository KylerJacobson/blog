package emailer

import (
	"github.com/KylerJacobson/blog/backend/internal/api/types/posts"
	"github.com/KylerJacobson/blog/backend/internal/api/types/users"
	"github.com/sendgrid/rest"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
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

// EmailSender defines the behavior for sending emails
type EmailSender interface {
	Send(email *mail.SGMailV3) (*rest.Response, error)
}

// EmailFactory creates provider-specific email types
type EmailFactory interface {
	CreateEmail(email Email) (*mail.SGMailV3, error)
}

// Emailer defines the main interface for sending different types of emails
type Emailer interface {
	NewPostEmail(user users.User, post posts.PostRequestBody) error
	NewUserNotificationEmail(user users.User) error
}
