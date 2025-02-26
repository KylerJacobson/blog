package config

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/KylerJacobson/blog/backend/logger"
	"github.com/jackc/pgx/v5/pgxpool"
)

func GetDBConn(logger logger.Logger) *pgxpool.Pool {

	user := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	db := os.Getenv("POSTGRES_DB")
	host := os.Getenv("POSTGRES_HOST")
	port := os.Getenv("POSTGRES_PORT")
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s", user, password, host, port, db)

	logger.Sugar().Infof("Trying to connect to database %s", connStr)

	config, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		logger.Sugar().Errorf("Unable to parse connection string: %v", err)
		os.Exit(1)
	}
	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = 1 * time.Hour
	config.MaxConnIdleTime = 30 * time.Minute
	config.HealthCheckPeriod = 1 * time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		logger.Sugar().Errorf("Unable to connect to database: %v", err)
		os.Exit(1)
	}

	if err := pool.Ping(context.Background()); err != nil {
		logger.Sugar().Errorf("Unable to ping database: %v", err)
		os.Exit(1)
	}

	return pool
}
