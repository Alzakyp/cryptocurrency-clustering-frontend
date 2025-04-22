import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Form,
  Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getAllCryptocurrencies, importCsv, exportCsv } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const AdminDashboard = () => {
  const [cryptocurrencies, setCryptocurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [file, setFile] = useState(null);

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
  }, []);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a CSV file to import");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    // Create FormData and add both the file and a subject field
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subject", "Cryptocurrency Import"); // Add this line

    try {
      const response = await importCsv(formData);
      if (response.data.success) {
        setSuccess(response.data.message || "CSV imported successfully");
        // Refresh the cryptocurrency list
        const refreshResponse = await getAllCryptocurrencies();
        setCryptocurrencies(refreshResponse.data.cryptocurrencies);
      } else {
        setError(response.data.message || "Error importing CSV file");
      }
    } catch (err) {
      console.error("Import error details:", err.response?.data);
      setError(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          "Error importing CSV file"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await exportCsv();

      // Create a blob from the response data
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

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  if (loading && cryptocurrencies.length === 0) {
    return <div className="text-center py-5">Loading...</div>;
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1>Admin Dashboard</h1>
            <div>
              <span className="me-3">Welcome, {currentUser?.username}</span>
              <Button variant="outline-danger" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow mb-4">
            <Card.Body>
              <h3>Import Cryptocurrencies</h3>
              <Form onSubmit={handleImport}>
                <Form.Group className="mb-3">
                  <Form.Label>Select CSV File</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                  />
                </Form.Group>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading || !file}
                >
                  {loading ? "Importing..." : "Import CSV"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow">
            <Card.Body>
              <h3>Export Cryptocurrencies</h3>
              <p>Download all cryptocurrency data as a CSV file.</p>
              <Button
                variant="success"
                onClick={handleExport}
                disabled={loading}
              >
                {loading ? "Exporting..." : "Export CSV"}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow">
            <Card.Body>
              <h3>Cryptocurrency Data</h3>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Symbol</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Price Change 24h</th>
                      <th>Market Cap</th>
                      <th>Cluster</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cryptocurrencies.map((crypto) => (
                      <tr key={crypto.id}>
                        <td>{crypto.id}</td>
                        <td>{crypto.symbol}</td>
                        <td>{crypto.name}</td>
                        <td>${crypto.price?.toFixed(2) || "N/A"}</td>
                        <td>
                          {crypto.price_change_24h
                            ? `${crypto.price_change_24h.toFixed(2)}%`
                            : "N/A"}
                        </td>
                        <td>
                          $
                          {crypto.market_cap
                            ? crypto.market_cap.toLocaleString()
                            : "N/A"}
                        </td>
                        <td>
                          {crypto.cluster !== null ? crypto.cluster : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;
