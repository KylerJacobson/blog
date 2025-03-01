import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Container, Row, Col } from 'react-bootstrap';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1d'); // '1d', '7d', '30d', 'all'

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/analytics/summary?range=${timeRange}`, {
          withCredentials: true,
        });
        setAnalytics(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const handleRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  const purgeAnalytics = async () => {
    try {
        const response = await axios.post(`/api/analytics/purge`, {
            withCredentials: true,
        });
        if (response.status !== 200) {
            console.error("Failed to purge analytics data");
            alert("Failed to purge analytics data");
        }
    } catch (error) {
        console.error("Failed to purge analytics data");
        alert("Failed to purge analytics data");
    }
};

  if (loading) return <div className="text-center my-5">Loading analytics...</div>;
  if (error) return <div className="text-center my-5 text-aurora-red">{error}</div>;

  return (
    <Container className="my-5">
      <h1 className="mb-4">Blog Analytics</h1>
      
      <div className="mb-4">
        <select 
          value={timeRange} 
          onChange={handleRangeChange}
          className="form-select w-auto"
        >
          <option value="1d">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
        <div className="mt-3">
          <button onClick={purgeAnalytics} className="btn btn-danger">Purge Old Analytics</button>
        </div>
       
      </div>
      

      <Row>
        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Body className="text-center">
              <h3>{analytics?.totalViews || 0}</h3>
              <p className="text-muted">Total Page Views</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Body className="text-center">
              <h3>{analytics?.uniqueVisitors || 0}</h3>
              <p className="text-muted">Unique Visitors</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Body className="text-center">
              <h3>{analytics?.avgTimeOnSite || '0:00'}</h3>
              <p className="text-muted">Avg. Time on Site</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4 shadow-sm">
        <Card.Header>Most Popular Pages</Card.Header>
        <Card.Body>
          <table className="table">
            <thead>
              <tr>
                <th>Path</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.pathCounts && Object.entries(analytics.pathCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([path, count]) => (
                  <tr key={path}>
                    <td>{path}</td>
                    <td>{count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AnalyticsDashboard;