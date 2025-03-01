package analytics

import "time"

type PageView struct {
	ID        string    `json:"id" db:"id"`
	Path      string    `json:"path" db:"path"`
	Referrer  string    `json:"referrer" db:"referrer"`
	UserAgent string    `json:"userAgent" db:"user_agent"`
	VisitorId string    `json:"visitorId" db:"visitor_id"`
	Timestamp time.Time `json:"timestamp" db:"timestamp"`
}

type AnalyticsSummary struct {
	TotalViews     int            `json:"totalViews"`
	UniqueVisitors int            `json:"uniqueVisitors"`
	PathCounts     map[string]int `json:"pathCounts"`
	AvgTimeOnSite  string         `json:"avgTimeOnSite"`
}
