package media

import (
	"context"
	"errors"

	media_models "github.com/KylerJacobson/blog/backend/internal/api/types/media"
	"github.com/KylerJacobson/blog/backend/logger"
	pgxV5 "github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MediaRepository interface {
	GetMediaByPostId(postId int) ([]media_models.Post, error)
	UploadMedia(postId int, blobName, contentType string, restricted bool) error
	DeleteMediaByPostId(postId int) error
}

type mediaRepository struct {
	conn   *pgxpool.Pool
	logger logger.Logger
}

func New(conn *pgxpool.Pool, logger logger.Logger) *mediaRepository {
	return &mediaRepository{
		conn:   conn,
		logger: logger,
	}
}

func (repository *mediaRepository) GetMediaByPostId(postId int) ([]media_models.Post, error) {
	rows, err := repository.conn.Query(
		context.TODO(), `SELECT post_id, blob_name, content_type, created_at, restricted FROM media WHERE post_id = $1`, postId,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	media, err := pgxV5.CollectRows(rows, pgxV5.RowToStructByName[media_models.Post])
	if err != nil {
		if errors.Is(err, pgxV5.ErrNoRows) {
			repository.logger.Sugar().Infof("media for post %d does not exist in the database", postId)
			return []media_models.Post{}, nil
		}
		repository.logger.Sugar().Errorf("error getting media for post %d: %v ", postId, err)
		return nil, err

	}
	return media, nil
}

func (repository *mediaRepository) UploadMedia(postId int, blobName, contentType string, restricted bool) error {
	rows, err := repository.conn.Query(
		context.TODO(), `INSERT INTO media (post_id, blob_name, content_type, restricted) VALUES ($1, $2, $3, $4) RETURNING *`, postId, blobName, contentType, restricted,
	)
	if err != nil {
		repository.logger.Sugar().Errorf("error creating adding media to post %d : %v", postId, err)
		return err
	}
	defer rows.Close()
	return nil
}

func (repository *mediaRepository) DeleteMediaByPostId(postId int) error {
	rows, err := repository.conn.Query(
		context.TODO(), `DELETE FROM media WHERE post_id = $1`, postId,
	)
	if err != nil {
		repository.logger.Sugar().Errorf("error deleting media for post %d: %v", postId, err)
		return err
	}
	defer rows.Close()
	return nil
}
