import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Badge,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getAllCryptocurrencies, importCsv, exportCsv } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Layout, // Instead of Dashboard
  TrendingUp,
  TrendingDown,
  BarChart,
  RefreshCw,
  LogOut,
  Database,
  Clock,
  Upload, // Instead of CloudUpload
  Download, // Instead of CloudDownload
} from "react-feather";

// Custom styled components for dashboard
const DashboardCard = ({ title, value, icon, color, subtitle, growth }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="dashboard-card"
    >
      <Card className="shadow-sm h-100 dashboard-stat-card">
        <Card.Body className="d-flex flex-column">
          <div className="d-flex justify-content-between mb-3">
            <h6 className="card-subtitle text-muted">{title}</h6>
            <div className={`icon-box bg-${color}-light`}>{icon}</div>
          </div>
          <div className="mt-2">
            <h3 className="mb-0 fw-bold">
              <CountUp end={value} separator="," duration={1.5} />
            </h3>
            <div className="mt-2 d-flex align-items-center">
              {growth !== undefined && (
                <Badge
                  bg={growth >= 0 ? "success" : "danger"}
                  className="me-2 badge-pill"
                >
                  {growth >= 0 ? "+" : ""}
                  {growth}%
                </Badge>
              )}
              <small className="text-muted">{subtitle}</small>
            </div>
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

const ClusterDistributionChart = ({ cryptocurrencies }) => {
  // Calculate cluster distribution with null/undefined checks
  const clusterCounts = cryptocurrencies.reduce((acc, crypto) => {
    // Fix: Check for both null and undefined with != null
    const cluster =
      crypto && crypto.cluster != null
        ? crypto.cluster.toString()
        : "Unclustered";

    acc[cluster] = (acc[cluster] || 0) + 1;
    return acc;
  }, {});

  const data = Object.keys(clusterCounts).map((cluster) => ({
    name: cluster === "Unclustered" ? "Unclustered" : `Cluster ${cluster}`,
    value: clusterCounts[cluster],
  }));

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#A569BD",
  ];

  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <h5 className="card-title mb-4">Cluster Distribution</h5>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(1)}%`
                }
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Legend />
              <Tooltip
                formatter={(value) => [`${value} cryptocurrencies`, "Count"]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-4">
            <p>No cluster data available</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

const MarketCapChart = ({ cryptocurrencies }) => {
  // Get top 7 by market cap
  const topCryptos = [...cryptocurrencies]
    .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
    .slice(0, 7)
    .map((crypto) => ({
      name: crypto.symbol,
      value: crypto.market_cap / 1000000000, // Convert to billions
    }));

  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <h5 className="card-title mb-4">Top Cryptocurrencies by Market Cap</h5>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={topCryptos}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `$${value}B`} />
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <Tooltip
              formatter={(value) => [`$${value.toFixed(2)}B`, "Market Cap"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
};

const CryptoTable = ({ cryptocurrencies }) => {
  // Get top 5 cryptocurrencies by market cap
  const topCryptos = [...cryptocurrencies]
    .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
    .slice(0, 5);

  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <h5 className="card-title mb-4">Top Cryptocurrencies</h5>
        <div className="table-responsive">
          <table className="table table-borderless crypto-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th>Change 24h</th>
                <th>Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {topCryptos.map((crypto) => (
                <tr key={crypto.id} className="table-row-hover">
                  <td>
                    <div className="symbol-badge">{crypto.symbol}</div>
                  </td>
                  <td>{crypto.name}</td>
                  <td>${crypto.price?.toFixed(2) || "N/A"}</td>
                  <td>
                    <Badge
                      bg={crypto.percent_change_24h >= 0 ? "success" : "danger"}
                      className="price-badge"
                    >
                      {crypto.percent_change_24h >= 0 ? "+" : ""}
                      {crypto.percent_change_24h?.toFixed(2) || 0}%
                    </Badge>
                  </td>
                  <td>${(crypto.market_cap / 1000000000).toFixed(2)}B</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card.Body>
    </Card>
  );
};

const AdminDashboard = () => {
  const [cryptocurrencies, setCryptocurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [file, setFile] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAllCryptocurrencies();
        setCryptocurrencies(response.data.cryptocurrencies);
      } catch (err) {
        setError("Failed to fetch cryptocurrency data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a CSV file to import");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject", "Cryptocurrency Import");

    try {
      const response = await importCsv(formData);
      if (response.data.success) {
        setSuccess(response.data.message || "CSV imported successfully");
        setRefreshTrigger((prev) => prev + 1);
      } else {
        setError(response.data.message || "Error importing CSV file");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Error importing CSV file"
      );
    } finally {
      setLoading(false);
      setFile(null);
      // Reset the file input
      document.getElementById("fileInput").value = "";
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await exportCsv();
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "cryptocurrencies.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess("CSV exported successfully");
    } catch (err) {
      setError("Failed to export CSV file");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  if (loading && cryptocurrencies.length === 0) {
    return (
      <div className="text-center py-5 loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading dashboard data...</p>
      </div>
    );
  }

  // Calculate dashboard metrics
  const totalMarketCap = cryptocurrencies.reduce(
    (sum, crypto) => sum + (crypto.market_cap || 0),
    0
  );
  const totalCoins = cryptocurrencies.length;
  const avgChange =
    cryptocurrencies.reduce(
      (sum, crypto) => sum + (crypto.percent_change_24h || 0),
      0
    ) / totalCoins;
  const clusterCount = new Set(cryptocurrencies.map((c) => c.cluster)).size;

  // Last updated time
  const lastUpdated = new Date().toLocaleString();

  return (
    <div className="dashboard-container">
      <Container fluid className="py-4">
        {/* Header with welcome and actions */}
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm header-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="page-title mb-0">
                      <Layout size={24} className="me-2" />
                      Admin Dashboard
                    </h2>
                    <p className="text-muted mb-0">
                      <Clock size={14} className="me-1" /> Last updated:{" "}
                      {lastUpdated}
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      className="d-flex align-items-center"
                      onClick={handleRefresh}
                    >
                      <RefreshCw size={16} className="me-1" /> Refresh
                    </Button>
                    <Button
                      variant="outline-danger"
                      className="d-flex align-items-center"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} className="me-1" /> Logout
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Alerts */}
        {error && (
          <Row className="mb-4">
            <Col>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setError(null)}
                  className="d-flex align-items-center"
                >
                  <div className="me-2">⚠️</div>
                  {error}
                </Alert>
              </motion.div>
            </Col>
          </Row>
        )}

        {success && (
          <Row className="mb-4">
            <Col>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  variant="success"
                  dismissible
                  onClose={() => setSuccess(null)}
                  className="d-flex align-items-center"
                >
                  <div className="me-2">✅</div>
                  {success}
                </Alert>
              </motion.div>
            </Col>
          </Row>
        )}

        {/* Key Metrics */}
        <Row className="mb-4">
          <Col md={3}>
            <DashboardCard
              title="Total Cryptocurrencies"
              value={totalCoins}
              icon={<Database size={20} color="#6c5ce7" />}
              color="primary"
              subtitle="Unique assets"
            />
          </Col>
          <Col md={3}>
            <DashboardCard
              title="Total Market Cap"
              value={Math.floor(totalMarketCap / 1000000000)}
              icon={<BarChart size={20} color="#00b894" />}
              color="success"
              subtitle="Billion USD"
            />
          </Col>
          <Col md={3}>
            <DashboardCard
              title="Avg. 24h Change"
              value={Math.abs(avgChange).toFixed(2)}
              icon={
                avgChange >= 0 ? (
                  <TrendingUp size={20} color="#00b894" />
                ) : (
                  <TrendingDown size={20} color="#d63031" />
                )
              }
              color={avgChange >= 0 ? "success" : "danger"}
              subtitle="Percent"
              growth={avgChange.toFixed(2)}
            />
          </Col>
          <Col md={3}>
            <DashboardCard
              title="Clusters"
              value={clusterCount}
              icon={<PieChart size={20} color="#a29bfe" />}
              color="info"
              subtitle="Unique groups"
            />
          </Col>
        </Row>

        {/* Import/Export */}
        <Row className="mb-4">
          <Col md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <h5 className="card-title mb-4 d-flex align-items-center">
                    <Upload size={20} className="me-2" /> Import
                    Cryptocurrencies
                  </h5>
                  <Form onSubmit={handleImport}>
                    <Form.Group className="mb-3">
                      <Form.Label>Select CSV File</Form.Label>
                      <div className="custom-file-upload">
                        <Form.Control
                          type="file"
                          accept=".csv"
                          onChange={(e) => setFile(e.target.files[0])}
                          required
                          id="fileInput"
                          className="form-control-file"
                        />
                      </div>
                      <Form.Text className="text-muted">
                        File should be in CSV format with headers
                      </Form.Text>
                    </Form.Group>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loading || !file}
                      className="btn-with-icon"
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="me-2" /> Import CSV
                        </>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
          <Col md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <h5 className="card-title mb-4 d-flex align-items-center">
                    <Download size={20} className="me-2" /> Export
                    Cryptocurrencies
                  </h5>
                  <p>
                    Download all cryptocurrency data as a CSV file for backup or
                    analysis.
                  </p>
                  <Button
                    variant="success"
                    onClick={handleExport}
                    disabled={loading}
                    className="btn-with-icon"
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download size={16} className="me-2" /> Export CSV
                      </>
                    )}
                  </Button>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Charts and Analytics */}
        <Row className="mb-4">
          <Col md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <MarketCapChart cryptocurrencies={cryptocurrencies} />
            </motion.div>
          </Col>
          <Col md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ClusterDistributionChart cryptocurrencies={cryptocurrencies} />
            </motion.div>
          </Col>
        </Row>

        {/* Top Cryptocurrencies Table */}
        <Row>
          <Col>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <CryptoTable cryptocurrencies={cryptocurrencies} />
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminDashboard;
