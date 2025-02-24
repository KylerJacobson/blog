package emailer

import (
	"fmt"

	"github.com/KylerJacobson/blog/backend/internal/api/types/posts"
	"github.com/KylerJacobson/blog/backend/internal/api/types/users"
)

// EmailerService handles email composition and sending
type EmailerService struct {
	sender    EmailSender
	factory   EmailFactory
	fromEmail string
	fromName  string
}

func NewEmailerService(
	sender EmailSender,
	factory EmailFactory,
	fromEmail string,
	fromName string,
) *EmailerService {
	return &EmailerService{
		sender:    sender,
		factory:   factory,
		fromEmail: fromEmail,
		fromName:  fromName,
	}
}

func (s *EmailerService) NewPostEmail(user users.User, post posts.PostRequestBody) error {
	email := Email{
		FromName:    s.fromName,
		FromEmail:   s.fromEmail,
		ToName:      user.FirstName + " " + user.LastName,
		ToEmail:     user.Email,
		Subject:     "New Post on kylerjacobson.dev",
		PlainText:   fmt.Sprintf("Read the new post: %s", post.Title),
		HTMLContent: fmt.Sprintf("Hey %s, there is a new post on kylerjacobson.dev. Check out <a href=\"www.kylerjacobson.dev/signin\">%s</a>", user.FirstName, post.Title),
	}

	message, err := s.factory.CreateEmail(email)
	if err != nil {
		return fmt.Errorf("creating email: %w", err)
	}

	_, err = s.sender.Send(message)
	if err != nil {
		return fmt.Errorf("sending email: %w", err)
	}

	return nil
}

func (s *EmailerService) NewUserNotificationEmail(user users.User) error {
	email := Email{
		FromName:    s.fromName,
		FromEmail:   s.fromEmail,
		ToName:      "Kyler Jacobson",
		ToEmail:     "contact@kylerjacobson.dev",
		Subject:     "A new member has joined kylerjacobson.dev",
		PlainText:   fmt.Sprintf("%s %s has created an account on kylerjacobson.dev", user.FirstName, user.LastName),
		HTMLContent: "",
	}

	message, err := s.factory.CreateEmail(email)
	if err != nil {
		return fmt.Errorf("creating email: %w", err)
	}

	_, err = s.sender.Send(message)
	if err != nil {
		return fmt.Errorf("sending email: %w", err)
	}

	return nil
}
