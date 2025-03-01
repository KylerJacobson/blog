package analytics

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/KylerJacobson/blog/backend/internal/api/types/analytics"
	analytics_repo "github.com/KylerJacobson/blog/backend/internal/db/analytics"
	"github.com/KylerJacobson/blog/backend/internal/httperr"
	"github.com/KylerJacobson/blog/backend/logger"
)

type AnalyticsApi interface {
	RecordPageView(w http.ResponseWriter, r *http.Request)
	GetSummary(w http.ResponseWriter, r *http.Request)
}

type analyticsApi struct {
	analyticsRepository analytics_repo.AnalyticsRepository
	logger              logger.Logger
}

func New(analyticsRepo analytics_repo.AnalyticsRepository, logger logger.Logger) *analyticsApi {
	return &analyticsApi{
		analyticsRepository: analyticsRepo,
		logger:              logger,
	}
}

func (a *analyticsApi) RecordPageView(w http.ResponseWriter, r *http.Request) {
	// Parse the request body
	var pageViewRequest struct {
		Path     string `json:"path"`
		Referrer string `json:"referrer"`
	}

	err := json.NewDecoder(r.Body).Decode(&pageViewRequest)
	if err != nil {
		a.logger.Sugar().Errorf("error decoding page view request: %v", err)
		// For analytics endpoints, we'll just return 200 OK to avoid affecting user experience
		w.WriteHeader(http.StatusOK)
		return
	}

	// Create the page view record
	pageView := analytics.PageView{
		Path:      pageViewRequest.Path,
		Referrer:  pageViewRequest.Referrer,
		UserAgent: r.UserAgent(),
		IP:        hashIP(getClientIP(r)),
		Timestamp: time.Now(),
	}

	// Record the page view
	err = a.analyticsRepository.RecordPageView(pageView)
	if err != nil {
		a.logger.Sugar().Errorf("error recording page view: %v", err)
		// For analytics endpoints, we still return 200 OK
		w.WriteHeader(http.StatusOK)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (a *analyticsApi) GetSummary(w http.ResponseWriter, r *http.Request) {
	// Parse time range from query parameter (default to 7 days)
	rangeParam := r.URL.Query().Get("range")
	var since time.Time

	switch rangeParam {
	case "1d":
		since = time.Now().AddDate(0, 0, -1)
	case "30d":
		since = time.Now().AddDate(0, 0, -30)
	case "all":
		since = time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC)
	default: // "7d" or any other value
		since = time.Now().AddDate(0, 0, -7)
	}

	// Get analytics data
	totalViews, err := a.analyticsRepository.GetTotalViews(since)
	if err != nil {
		a.logger.Sugar().Errorf("error getting total views: %v", err)
		httperr.Write(w, httperr.Internal("error getting analytics data", ""))
		return
	}

	uniqueVisitors, err := a.analyticsRepository.GetUniqueVisitors(since)
	if err != nil {
		a.logger.Sugar().Errorf("error getting unique visitors: %v", err)
		httperr.Write(w, httperr.Internal("error getting analytics data", ""))
		return
	}

	pathCounts, err := a.analyticsRepository.GetPageViewsByPath(since)
	if err != nil {
		a.logger.Sugar().Errorf("error getting page views by path: %v", err)
		httperr.Write(w, httperr.Internal("error getting analytics data", ""))
		return
	}

	avgTimeOnSite, err := a.analyticsRepository.GetAverageTimeOnSite(since)
	if err != nil {
		a.logger.Sugar().Errorf("error getting average time on site: %v", err)
		// Continue with the other data even if this fails
		avgTimeOnSite = "0:00"
	}
	// Prepare the response
	summary := analytics.AnalyticsSummary{
		TotalViews:     totalViews,
		UniqueVisitors: uniqueVisitors,
		PathCounts:     pathCounts,
		AvgTimeOnSite:  avgTimeOnSite,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summary)
}

func (a *analyticsApi) PurgeOldData(w http.ResponseWriter, r *http.Request) {
	err := a.analyticsRepository.PurgeOldData(time.Now().AddDate(0, 0, -90))
	if err != nil {
		a.logger.Sugar().Errorf("error purging old data: %v", err)
		httperr.Write(w, httperr.Internal("error purging old data", ""))
		return
	}

	w.WriteHeader(http.StatusOK)
}

// Helper function to get the client's IP address
func getClientIP(r *http.Request) string {
	ip := r.Header.Get("X-Forwarded-For")
	if ip == "" {
		ip = r.RemoteAddr
	}
	return ip
}

func hashIP(ip string) string {
	// Add a salt for better security
	salt := os.Getenv("IP_HASH_SALT")
	h := sha256.New()
	h.Write([]byte(ip + salt))
	return fmt.Sprintf("%x", h.Sum(nil))
}
