package emailer

import (
	"github.com/sendgrid/rest"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

// SendGridClient implements EmailSender interface for SendGrid
type SendGridClient struct {
	client *sendgrid.Client
}

// NewSendGridClient creates a new SendGrid client
func NewSendGridClient(apiKey string) *SendGridClient {
	return &SendGridClient{
		client: sendgrid.NewSendClient(apiKey),
	}
}

// Send implements EmailSender.Send for SendGrid
func (s *SendGridClient) Send(email *mail.SGMailV3) (*rest.Response, error) {
	return s.client.Send(email)
}

// SendGridEmailFactory implements EmailFactory for SendGrid
type SendGridEmailFactory struct{}

// CreateEmail implements EmailFactory.CreateEmail for SendGrid
func (f *SendGridEmailFactory) CreateEmail(email Email) (*mail.SGMailV3, error) {
	from := mail.NewEmail(email.FromName, email.FromEmail)
	to := mail.NewEmail(email.ToName, email.ToEmail)
	return mail.NewSingleEmail(from, email.Subject, to, email.PlainText, email.HTMLContent), nil
}
