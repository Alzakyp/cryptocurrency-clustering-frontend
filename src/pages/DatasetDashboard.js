import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Badge,
  Modal,
  Alert,
  Spinner,
  Tabs,
  Tab
} from "react-bootstrap";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Database,
  Clock,
  Plus,
  FileText,
  Server
} from "react-feather";
import { 
  getAllDatasets, 
  uploadDataset, 
  deleteDataset, 
  importFromDataset,
  getDatasetContent,
  previewDataset
} from "../services/api";
import { formatDistance } from "date-fns";

const DatasetDashboard = () => {
  // State variables
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [file, setFile] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [activeTab, setActiveTab] = useState("datasets");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load datasets on component mount
  useEffect(() => {
    fetchDatasets();
  }, [refreshTrigger]);

  // Fetch datasets from API
  const fetchDatasets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAllDatasets();
      if (response.data.success) {
        setDatasets(response.data.datasets);
      } else {
        setError("Failed to load datasets");
      }
    } catch (err) {
      setError(`Error: ${err.response?.data?.message || "Failed to connect to server"}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle dataset upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await uploadDataset(formData);
      if (response.data.success) {
        setSuccess("Dataset uploaded successfully");
        setShowUploadModal(false);
        setFile(null);
        // Reset form
        document.getElementById("fileUploadForm").reset();
        // Refresh datasets
        setRefreshTrigger(prev => prev + 1);
      } else {
        setError(response.data.message || "Failed to upload dataset");
      }
    } catch (err) {
      setError(`Upload failed: ${err.response?.data?.message || "Unknown error"}`);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Handle dataset delete confirmation
  const confirmDelete = (dataset) => {
    setSelectedDataset(dataset);
    setShowDeleteModal(true);
  };

  // Handle dataset deletion
  const handleDelete = async () => {
    if (!selectedDataset) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await deleteDataset(selectedDataset.id);
      if (response.data.success) {
        setSuccess(`Dataset "${selectedDataset.filename}" deleted successfully`);
        setShowDeleteModal(false);
        // Remove from state
        setDatasets(datasets.filter(d => d.id !== selectedDataset.id));
      } else {
        setError(response.data.message || "Failed to delete dataset");
      }
    } catch (err) {
      setError(`Deletion failed: ${err.response?.data?.message || "Unknown error"}`);
      console.error(err);
    } finally {
      setLoading(false);
      setSelectedDataset(null);
    }
  };

  // Handle import from dataset
  const handleImport = async (datasetId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await importFromDataset(datasetId);
      if (response.data.success) {
        setSuccess(`Successfully imported cryptocurrencies from dataset`);
        // Refresh datasets to update the crypto count
        setRefreshTrigger(prev => prev + 1);
      } else {
        setError(response.data.message || "Failed to import cryptocurrencies");
      }
    } catch (err) {
      setError(`Import failed: ${err.response?.data?.message || "Unknown error"}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle dataset download
  const handleDownload = async (datasetId, filename) => {
    try {
      const response = await getDatasetContent(datasetId);
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Download failed: ${err.response?.data?.message || "Unknown error"}`);
      console.error(err);
    }
  };

  // Handle dataset preview
  const handlePreview = async (datasetId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await previewDataset(datasetId);
      if (response.data.success) {
        setPreviewData(response.data.preview);
        setShowPreviewModal(true);
      } else {
        setError(response.data.message || "Failed to preview dataset");
      }
    } catch (err) {
      setError(`Preview failed: ${err.response?.data?.message || "Unknown error"}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDatasets = datasets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(datasets.length / itemsPerPage);

  // Pagination controls
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="dashboard-container">
      <Container fluid className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm header-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="page-title mb-0">
                      <Database size={24} className="me-2" />
                      Dataset Management
                    </h2>
                    <p className="text-muted mb-0">
                      <Clock size={14} className="me-1" /> 
                      Last updated: {new Date().toLocaleString()}
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="primary"
                      className="d-flex align-items-center"
                      onClick={() => setShowUploadModal(true)}
                    >
                      <Plus size={16} className="me-1" /> Upload New Dataset
                    </Button>
                    <Button
                      variant="outline-primary"
                      className="d-flex align-items-center"
                      onClick={handleRefresh}
                    >
                      <RefreshCw size={16} className="me-1" /> Refresh
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

        {/* Dashboard Stats */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="shadow-sm dashboard-stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-2">Total Datasets</h6>
                    <h2 className="mb-0 fw-bold">{datasets.length}</h2>
                  </div>
                  <div className="icon-box bg-primary-light">
                    <FileText size={24} color="#6c5ce7" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm dashboard-stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-2">Total Cryptocurrencies</h6>
                    <h2 className="mb-0 fw-bold">
                      {datasets.reduce((total, dataset) => total + (dataset.crypto_count || 0), 0)}
                    </h2>
                  </div>
                  <div className="icon-box bg-success-light">
                    <Server size={24} color="#00b894" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm dashboard-stat-card h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-2">Largest Dataset</h6>
                    <h2 className="mb-0 fw-bold">
                      {datasets.length > 0 
                        ? Math.max(...datasets.map(d => d.crypto_count || 0))
                        : 0}
                    </h2>
                  </div>
                  <div className="icon-box bg-info-light">
                    <Database size={24} color="#a29bfe" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Body>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="mb-4"
                >
                  <Tab eventKey="datasets" title="All Datasets">
                    {loading && datasets.length === 0 ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3">Loading datasets...</p>
                      </div>
                    ) : (
                      <>
                        <div className="table-responsive">
                          <Table hover className="crypto-table">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Filename</th>
                                <th>Uploaded</th>
                                <th>Crypto Count</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentDatasets.length > 0 ? (
                                currentDatasets.map((dataset) => (
                                  <tr key={dataset.id}>
                                    <td>#{dataset.id}</td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <FileText size={16} className="me-2" color="#6c5ce7" />
                                        {dataset.filename}
                                      </div>
                                    </td>
                                    <td>
                                      <div className="d-flex flex-column">
                                        <span>{new Date(dataset.uploaded_at).toLocaleDateString()}</span>
                                        <small className="text-muted">
                                          {formatDistance(new Date(dataset.uploaded_at), new Date(), { addSuffix: true })}
                                        </small>
                                      </div>
                                    </td>
                                    <td>
                                      <Badge bg={dataset.crypto_count > 0 ? "success" : "secondary"} className="badge-pill">
                                        {dataset.crypto_count} cryptocurrencies
                                      </Badge>
                                    </td>
                                    <td>
                                      <div className="d-flex gap-2">
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={() => handlePreview(dataset.id)}
                                          title="Preview dataset"
                                        >
                                          <Eye size={14} />
                                        </Button>
                                        <Button
                                          variant="outline-success"
                                          size="sm"
                                          onClick={() => handleDownload(dataset.id, dataset.filename)}
                                          title="Download dataset"
                                        >
                                          <Download size={14} />
                                        </Button>
                                        <Button
                                          variant="outline-info"
                                          size="sm"
                                          onClick={() => handleImport(dataset.id)}
                                          title="Import cryptocurrencies"
                                          disabled={dataset.crypto_count > 0}
                                        >
                                          <Server size={14} />
                                        </Button>
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() => confirmDelete(dataset)}
                                          title="Delete dataset"
                                        >
                                          <Trash2 size={14} />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="text-center py-4">
                                    No datasets found. Upload a new dataset to get started.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        {datasets.length > itemsPerPage && (
                          <div className="d-flex justify-content-center mt-4">
                            <ul className="pagination">
                              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                <button
                                  className="page-link"
                                  onClick={() => paginate(currentPage - 1)}
                                  disabled={currentPage === 1}
                                >
                                  Previous
                                </button>
                              </li>
                              {[...Array(totalPages)].map((_, index) => (
                                <li
                                  key={index}
                                  className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                                >
                                  <button
                                    className="page-link"
                                    onClick={() => paginate(index + 1)}
                                  >
                                    {index + 1}
                                  </button>
                                </li>
                              ))}
                              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                <button
                                  className="page-link"
                                  onClick={() => paginate(currentPage + 1)}
                                  disabled={currentPage === totalPages}
                                >
                                  Next
                                </button>
                              </li>
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload New Dataset</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form id="fileUploadForm" onSubmit={handleUpload}>
            <Form.Group className="mb-3">
              <Form.Label>Select CSV File</Form.Label>
              <div className="custom-file-upload">
                <Form.Control
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  required
                  className="form-control-file"
                />
              </div>
              <Form.Text className="text-muted">
                File should be in CSV format with headers
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpload} 
            disabled={uploading || !file}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={14} className="me-2" />
                Upload Dataset
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDataset && (
            <>
              <p>Are you sure you want to delete the dataset <strong>{selectedDataset.filename}</strong>?</p>
              <Alert variant="warning">
                <strong>Warning:</strong> This will also delete all associated cryptocurrencies ({selectedDataset.crypto_count}).
                This action cannot be undone.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              "Delete Dataset"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Preview Modal */}
      <Modal 
        show={showPreviewModal} 
        onHide={() => setShowPreviewModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Dataset Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewData ? (
            <div className="table-responsive">
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    {previewData.columns?.map((column, idx) => (
                      <th key={idx}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.data?.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-3">
              <p>No preview data available</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DatasetDashboard;