import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { getAllCryptocurrencies } from '../services/api';
import ClusterVisualization from '../components/landing/ClusterVisualization';
import CryptoList from '../components/landing/CryptoList';

const Home = () => {
  const [cryptocurrencies, setCryptocurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAllCryptocurrencies();
        setCryptocurrencies(response.data.cryptocurrencies);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch cryptocurrency data');
        setLoading(false);
        console.error(err);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-center py-5">Loading...</div>;
  if (error) return <div className="text-center py-5 text-danger">{error}</div>;

  // Group cryptocurrencies by cluster
  const cryptosByCluster = cryptocurrencies.reduce((acc, crypto) => {
    const cluster = crypto.cluster !== null ? crypto.cluster : 'Unclustered';
    if (!acc[cluster]) {
      acc[cluster] = [];
    }
    acc[cluster].push(crypto);
    return acc;
  }, {});

  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col>
          <h1 className="text-center mb-4">Cryptocurrency Clustering Analysis</h1>
          <p className="lead text-center">
            Explore different cryptocurrency clusters based on market behavior and metrics.
          </p>
        </Col>
      </Row>

      <Row className="mb-5">
        <Col>
          <Card className="shadow">
            <Card.Body>
              <h2 className="mb-4">Cluster Visualization</h2>
              <ClusterVisualization data={cryptocurrencies} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow">
            <Card.Body>
              <h2 className="mb-4">Cryptocurrencies by Cluster</h2>
              <CryptoList cryptosByCluster={cryptosByCluster} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;