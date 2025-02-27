package posts

import (
	"context"

	post_models "github.com/KylerJacobson/blog/backend/internal/api/types/posts"
	"github.com/KylerJacobson/blog/backend/logger"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostsRepository interface {
	GetRecentPosts() ([]post_models.Post, error)
	GetRecentPublicPosts() ([]post_models.Post, error)
	GetPostById(postId int) (*post_models.Post, error)
	DeletePostById(postId int) error
	CreatePost(post post_models.PostRequestBody, userId int) (int, error)
	UpdatePost(post post_models.PostRequestBody, postId, userId int) (*post_models.PostRequestBody, error)
}

type postsRepository struct {
	conn   *pgxpool.Pool
	logger logger.Logger
}

func New(conn *pgxpool.Pool, logger logger.Logger) *postsRepository {
	return &postsRepository{
		conn:   conn,
		logger: logger,
	}
}

func (repository *postsRepository) GetRecentPosts() ([]post_models.Post, error) {
	rows, err := repository.conn.Query(
		context.TODO(), `SELECT post_id, title, content, user_id, created_at, updated_at, restricted FROM posts ORDER BY created_at DESC LIMIT 10;`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts, err := pgx.CollectRows(rows, pgx.RowToStructByName[post_models.Post])
	if err != nil {
		repository.logger.Sugar().Errorf("error getting recent posts from the database: %v", err)
		return nil, err
	}
	return posts, nil
}

func (repository *postsRepository) GetRecentPublicPosts() ([]post_models.Post, error) {
	rows, err := repository.conn.Query(
		context.TODO(), `SELECT post_id, title, content, user_id, created_at, updated_at, restricted FROM posts WHERE restricted = false ORDER BY created_at DESC LIMIT 10`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts, err := pgx.CollectRows(rows, pgx.RowToStructByName[post_models.Post])
	if err != nil {
		repository.logger.Sugar().Errorf("error getting recent public posts from the database: %v ", err)
		return nil, err
	}
	return posts, nil
}

func (repository *postsRepository) GetPostById(id int) (*post_models.Post, error) {

	rows, err := repository.conn.Query(
		context.TODO(), `SELECT post_id, title, content, user_id, created_at, updated_at, restricted FROM posts WHERE post_id = $1`, id,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	post, err := pgx.CollectOneRow(rows, pgx.RowToStructByName[post_models.Post])
	if err != nil {
		repository.logger.Sugar().Errorf("error getting post %d: %v ", id, err)
		return nil, err
	}
	return &post, nil
}

func (repository *postsRepository) DeletePostById(id int) error {
	rows, err := repository.conn.Query(
		context.TODO(), `DELETE FROM posts WHERE post_id = $1`, id,
	)
	if err != nil {
		return err
	}
	defer rows.Close()
	return nil
}

func (repository *postsRepository) CreatePost(post post_models.PostRequestBody, id int) (int, error) {
	rows, err := repository.conn.Query(
		context.TODO(), `INSERT INTO posts (title, content, restricted, user_id) VALUES ($1, $2, $3, $4) RETURNING post_id`, post.Title, post.Content, post.Restricted, id,
	)
	if err != nil {
		repository.logger.Sugar().Errorf("error creating post(%s) : %v", post.Title, err)
		return 0, err
	}
	newPost, err := pgx.CollectRows(rows, pgx.RowToStructByName[post_models.CreatedPost])
	if err != nil {
		repository.logger.Sugar().Errorf("error returning postId for post(%s) : %v", post.Title, err)
		return 0, err
	}
	defer rows.Close()
	return newPost[0].PostId, nil
}

func (repository *postsRepository) UpdatePost(post post_models.PostRequestBody, postId, userId int) (*post_models.PostRequestBody, error) {
	rows, err := repository.conn.Query(
		context.TODO(), `UPDATE posts SET title = $1, content = $2, restricted = $3, user_id = $4 WHERE post_id = $5 RETURNING title, content, restricted`, post.Title, post.Content, post.Restricted, userId, postId,
	)
	if err != nil {
		repository.logger.Sugar().Errorf("error updating post %s - %v", post.Title, err)
		return nil, err
	}
	defer rows.Close()
	updatedPost, err := pgx.CollectRows(rows, pgx.RowToStructByName[post_models.PostRequestBody])
	if err != nil {
		repository.logger.Sugar().Errorf("error updating post %s - %v", post.Title, err)
		return nil, err
	}
	return &updatedPost[0], nil
}
