import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Alert, Spinner } from 'react-bootstrap';
import { getAllDatasets, getCryptocurrenciesByDataset } from '../services/api';
import ClusterVisualization from '../components/landing/ClusterVisualization';
import CryptoList from '../components/landing/CryptoList';
import AllCryptoTable from '../components/landing/AllCryptoTable';
import DatasetSelector from '../components/landing/DatasetSelector';
import { kMeansClustering } from '../utils/ClusteringUtils';

const Home = () => {
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [cryptocurrenciesByDataset, setCryptocurrenciesByDataset] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('visualization');

  // Fixed cluster count at 3 to match Python implementation
  const clusterCount = 3;

  // Step 1: Fetch all datasets
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        const response = await getAllDatasets();
        
        if (response.data.success && response.data.datasets.length > 0) {
          const fetchedDatasets = response.data.datasets;
          setDatasets(fetchedDatasets);
          
          // Select the first dataset by default
          if (fetchedDatasets.length > 0 && !selectedDatasetId) {
            setSelectedDatasetId(fetchedDatasets[0].id);
          }
        } else {
          setError('No datasets available. Please upload datasets first.');
        }
      } catch (err) {
        setError('Failed to fetch datasets. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, [selectedDatasetId]); // Re-fetch if selected dataset changes

  // Step 2: Fetch cryptocurrencies for the selected dataset
  useEffect(() => {
    const fetchCryptocurrencies = async () => {
      if (!selectedDatasetId) return;
      
      try {
        setLoading(true);
        
        // Check if we already have this dataset's data
        if (!cryptocurrenciesByDataset[selectedDatasetId]) {
          const response = await getCryptocurrenciesByDataset(selectedDatasetId);
          
          if (response.data.success) {
            // Apply clustering to the dataset
            const clusteredData = kMeansClustering(response.data.cryptocurrencies, clusterCount);
            
            // Update state with the new dataset's clustered data
            setCryptocurrenciesByDataset(prev => ({
              ...prev,
              [selectedDatasetId]: clusteredData
            }));
          } else {
            setError('Failed to fetch cryptocurrency data for the selected dataset.');
          }
        }
      } catch (err) {
        setError('Failed to fetch cryptocurrency data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCryptocurrencies();
  }, [selectedDatasetId, cryptocurrenciesByDataset]);

  const handleDatasetSelect = (datasetId) => {
    setSelectedDatasetId(datasetId);
  };

  // Get selected dataset name
  const getSelectedDatasetName = () => {
    const selectedDataset = datasets.find(d => d.id === selectedDatasetId);
    return selectedDataset ? selectedDataset.filename : '';
  };

  // Group cryptocurrencies by cluster for the selected dataset
  const getCryptosByCluster = () => {
    const cryptocurrencies = cryptocurrenciesByDataset[selectedDatasetId] || [];
    
    return cryptocurrencies.reduce((acc, crypto) => {
      const cluster = crypto.cluster !== null ? crypto.cluster : 'Unclustered';
      if (!acc[cluster]) {
        acc[cluster] = [];
      }
      acc[cluster].push(crypto);
      return acc;
    }, {});
  };

  if (loading && (!datasets.length || !selectedDatasetId)) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading datasets...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="text-center mb-4">Cryptocurrency Clustering Analysis</h1>
          <p className="lead text-center">
            Explore cryptocurrency clusters based on market behavior and metrics.
            <br/>
            <small className="text-muted">Optimal clustering with K=3 based on dataset analysis</small>
          </p>
        </Col>
      </Row>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {datasets.length > 0 && (
        <Row className="mb-4">
          <Col>
            <DatasetSelector 
              datasets={datasets}
              selectedDataset={selectedDatasetId}
              onSelectDataset={handleDatasetSelect}
            />
          </Col>
        </Row>
      )}

      {selectedDatasetId && (
        <>
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm">
                <Card.Body>
                  <h2 className="h4">
                    Dataset: {getSelectedDatasetName()}
                    <span className="badge bg-primary ms-2">
                      {datasets.find(d => d.id === selectedDatasetId)?.crypto_count || 0} cryptocurrencies
                    </span>
                  </h2>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Nav variant="tabs" className="mb-3">
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'visualization'}
                    onClick={() => setActiveTab('visualization')}
                  >
                    Visualization
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'bytables'}
                    onClick={() => setActiveTab('bytables')}
                  >
                    By Cluster
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'alldata'}
                    onClick={() => setActiveTab('alldata')}
                  >
                    All Data
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading cryptocurrency data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'visualization' && (
                <Row className="mb-5">
                  <Col>
                    <Card className="shadow">
                      <Card.Body>
                        <h3 className="mb-4">Cluster Visualization</h3>
                        <ClusterVisualization 
                          data={cryptocurrenciesByDataset[selectedDatasetId] || []}
                        />
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {activeTab === 'bytables' && (
                <Row>
                  <Col>
                    <Card className="shadow">
                      <Card.Body>
                        <h3 className="mb-4">Cryptocurrencies by Cluster</h3>
                        <CryptoList cryptosByCluster={getCryptosByCluster()} />
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {activeTab === 'alldata' && (
                <Row>
                  <Col>
                    <AllCryptoTable cryptocurrencies={cryptocurrenciesByDataset[selectedDatasetId] || []} />
                  </Col>
                </Row>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default Home;