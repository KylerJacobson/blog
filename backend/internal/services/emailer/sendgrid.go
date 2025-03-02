package emailer

import (
	"github.com/KylerJacobson/blog/backend/internal/httperr"
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
func (s *SendGridClient) Send(email Email) error {
	from := mail.NewEmail(email.FromName, email.FromEmail)
	to := mail.NewEmail(email.ToName, email.ToEmail)
	mail := mail.NewSingleEmail(from, email.Subject, to, email.PlainText, email.HTMLContent)

	resp, err := s.client.Send(mail)
	if err != nil {
		return err
	}
	if resp.StatusCode >= 400 {
		return httperr.New(resp.StatusCode, "error sending email", "")
	}
	return nil
}
