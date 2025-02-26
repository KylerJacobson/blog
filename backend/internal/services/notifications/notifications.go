package notifications

import (
	"github.com/KylerJacobson/blog/backend/internal/api/types/posts"
	"github.com/KylerJacobson/blog/backend/internal/api/types/users"
	"github.com/KylerJacobson/blog/backend/internal/services/emailer"
)

type Notifier struct {
	emailer emailer.Emailer
}

func NewNotificationsService(emailer emailer.Emailer) *Notifier {
	return &Notifier{
		emailer: emailer,
	}
}

func (s *Notifier) NewPost(user users.User, post posts.PostRequestBody) error {
	return s.emailer.NewPostEmail(user, post)
}
