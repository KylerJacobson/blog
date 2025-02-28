package analytics

import (
	"context"
	"time"

	"github.com/KylerJacobson/blog/backend/internal/api/types/analytics"
	"github.com/KylerJacobson/blog/backend/logger"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AnalyticsRepository interface {
	RecordPageView(pageView analytics.PageView) error
	GetTotalViews(since time.Time) (int, error)
	GetUniqueVisitors(since time.Time) (int, error)
	GetPageViewsByPath(since time.Time) (map[string]int, error)
}

type analyticsRepository struct {
	conn   *pgxpool.Pool
	logger logger.Logger
}

func New(conn *pgxpool.Pool, logger logger.Logger) *analyticsRepository {
	return &analyticsRepository{
		conn:   conn,
		logger: logger,
	}
}

func (repository *analyticsRepository) RecordPageView(pageView analytics.PageView) error {
	_, err := repository.conn.Exec(
		context.TODO(),
		`INSERT INTO page_views (path, referrer, user_agent, ip, timestamp) 
		VALUES ($1, $2, $3, $4, $5)`,
		pageView.Path, pageView.Referrer, pageView.UserAgent, pageView.IP, time.Now(),
	)
	if err != nil {
		repository.logger.Sugar().Errorf("error recording page view: %v", err)
		return err
	}
	return nil
}

func (repository *analyticsRepository) GetTotalViews(since time.Time) (int, error) {
	var count int
	err := repository.conn.QueryRow(
		context.TODO(),
		`SELECT COUNT(*) FROM page_views WHERE timestamp >= $1`,
		since,
	).Scan(&count)
	if err != nil {
		repository.logger.Sugar().Errorf("error getting total views: %v", err)
		return 0, err
	}
	return count, nil
}

func (repository *analyticsRepository) GetUniqueVisitors(since time.Time) (int, error) {
	var count int
	err := repository.conn.QueryRow(
		context.TODO(),
		`SELECT COUNT(DISTINCT ip) FROM page_views WHERE timestamp >= $1`,
		since,
	).Scan(&count)
	if err != nil {
		repository.logger.Sugar().Errorf("error getting unique visitors: %v", err)
		return 0, err
	}
	return count, nil
}

func (repository *analyticsRepository) GetPageViewsByPath(since time.Time) (map[string]int, error) {
	rows, err := repository.conn.Query(
		context.TODO(),
		`SELECT path, COUNT(*) as count 
		FROM page_views 
		WHERE timestamp >= $1 
		GROUP BY path 
		ORDER BY count DESC`,
		since,
	)
	if err != nil {
		repository.logger.Sugar().Errorf("error getting page views by path: %v", err)
		return nil, err
	}
	defer rows.Close()

	pathCounts := make(map[string]int)
	for rows.Next() {
		var path string
		var count int
		if err := rows.Scan(&path, &count); err != nil {
			repository.logger.Sugar().Errorf("error scanning row: %v", err)
			return nil, err
		}
		pathCounts[path] = count
	}

	if err := rows.Err(); err != nil {
		repository.logger.Sugar().Errorf("error iterating rows: %v", err)
		return nil, err
	}

	return pathCounts, nil
}
