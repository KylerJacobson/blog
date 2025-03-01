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
	GetAverageTimeOnSite(since time.Time) (string, error)
	PurgeOldData(before time.Time) error
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
		`INSERT INTO page_views (path, referrer, user_agent, visitor_id, timestamp) 
		VALUES ($1, $2, $3, $4, $5)`,
		pageView.Path, pageView.Referrer, pageView.UserAgent, pageView.VisitorId, time.Now(),
	)
	if err != nil {
		repository.logger.Sugar().Errorf("error recording page view: %v", err)
		return err
	}
	return nil
}

func (r *analyticsRepository) GetTotalViews(since time.Time) (int, error) {
	var count int
	err := r.conn.QueryRow(
		context.TODO(),
		`SELECT COUNT(*) FROM page_views WHERE timestamp >= $1`,
		since,
	).Scan(&count)
	if err != nil {
		r.logger.Sugar().Errorf("error getting total views: %v", err)
		return 0, err
	}
	return count, nil
}

func (r *analyticsRepository) GetUniqueVisitors(since time.Time) (int, error) {
	var count int
	err := r.conn.QueryRow(
		context.TODO(),
		`SELECT COUNT(DISTINCT ip) FROM page_views WHERE timestamp >= $1`,
		since,
	).Scan(&count)
	if err != nil {
		r.logger.Sugar().Errorf("error getting unique visitors: %v", err)
		return 0, err
	}
	return count, nil
}

func (r *analyticsRepository) GetPageViewsByPath(since time.Time) (map[string]int, error) {
	rows, err := r.conn.Query(
		context.TODO(),
		`SELECT path, COUNT(*) as count 
		FROM page_views 
		WHERE timestamp >= $1 
		GROUP BY path 
		ORDER BY count DESC`,
		since,
	)
	if err != nil {
		r.logger.Sugar().Errorf("error getting page views by path: %v", err)
		return nil, err
	}
	defer rows.Close()

	pathCounts := make(map[string]int)
	for rows.Next() {
		var path string
		var count int
		if err := rows.Scan(&path, &count); err != nil {
			r.logger.Sugar().Errorf("error scanning row: %v", err)
			return nil, err
		}
		pathCounts[path] = count
	}

	if err := rows.Err(); err != nil {
		r.logger.Sugar().Errorf("error iterating rows: %v", err)
		return nil, err
	}

	return pathCounts, nil
}

func (r *analyticsRepository) PurgeOldData(before time.Time) error {
	_, err := r.conn.Exec(
		context.TODO(),
		`DELETE FROM page_views WHERE timestamp < $1`,
		before,
	)
	if err != nil {
		r.logger.Sugar().Errorf("error purging old data: %v", err)
		return err
	}
	return nil
}

func (r *analyticsRepository) GetAverageTimeOnSite(since time.Time) (string, error) {
	// This query calculates average session duration by grouping page views by IP and session
	// A session is defined as a sequence of page views from the same IP with less than 30 minutes between views
	query := `
		WITH sessions AS (
			SELECT 
				ip,
				timestamp,
				-- This identifies the start of a new session (when gap > 30 minutes from previous view)
				CASE WHEN
					LAG(timestamp) OVER (PARTITION BY ip ORDER BY timestamp) IS NULL OR
					timestamp - LAG(timestamp) OVER (PARTITION BY ip ORDER BY timestamp) > INTERVAL '30 minutes'
				THEN 1 ELSE 0 END AS new_session
			FROM page_views
			WHERE timestamp >= $1
			ORDER BY ip, timestamp
		),
		session_groups AS (
			SELECT 
				ip,
				timestamp,
				SUM(new_session) OVER (PARTITION BY ip ORDER BY timestamp) AS session_id
			FROM sessions
		),
		session_durations AS (
			SELECT 
				ip,
				session_id,
				MAX(timestamp) - MIN(timestamp) AS duration
			FROM session_groups
			GROUP BY ip, session_id
			-- Only consider sessions with at least 2 page views
			HAVING COUNT(*) > 1
		)
		SELECT 
			COALESCE(
				TO_CHAR(
					MAKE_INTERVAL(
						secs => EXTRACT(EPOCH FROM AVG(duration))
					),
					'MI:SS'
				),
				'0:00'
			) AS avg_time
		FROM session_durations;
	`

	var avgTime string
	err := r.conn.QueryRow(context.TODO(), query, since).Scan(&avgTime)
	if err != nil {
		r.logger.Sugar().Errorf("error calculating average time on site: %v", err)
		return "0:00", err
	}

	return avgTime, nil
}
