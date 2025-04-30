import React, { useState } from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { createCryptocurrency, updateCryptocurrency } from '../../services/api';

const CryptoForm = ({ datasets, crypto = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    symbol: crypto?.symbol || '',
    name: crypto?.name || '',
    price: crypto?.price || '',
    price_change_24h: crypto?.price_change_24h || '',
    percent_change_24h: crypto?.percent_change_24h || '',
    market_cap: crypto?.market_cap || '',
    volume_24h: crypto?.volume_24h || '',
    circulating_supply: crypto?.circulating_supply || '',
    dataset_id: crypto?.dataset_id || (datasets.length > 0 ? datasets[0].id : '')
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Create form data from state
      const data = { ...formData };
      
      // Convert numerical fields
      data.price = parseFloat(data.price);
      data.price_change_24h = parseFloat(data.price_change_24h);
      data.percent_change_24h = parseFloat(data.percent_change_24h);
      data.market_cap = parseFloat(data.market_cap);
      data.volume_24h = parseFloat(data.volume_24h);
      data.circulating_supply = parseFloat(data.circulating_supply);
      data.dataset_id = parseInt(data.dataset_id);
      
      let response;
      if (crypto?.id) {
        // Update existing crypto
        response = await updateCryptocurrency(crypto.id, data);
      } else {
        // Create new crypto
        response = await createCryptocurrency(data);
      }
      
      if (response.data.success) {
        if (onSuccess) onSuccess(response.data);
      } else {
        setError(response.data.message || 'Operation failed');
      }
    } catch (err) {
      setError(`Error: ${err.response?.data?.message || 'Unknown error occurred'}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Symbol</Form.Label>
            <Form.Control
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              required
              placeholder="BTC-USD"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Bitcoin USD"
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Price (USD)</Form.Label>
            <Form.Control
              type="number"
              step="0.00000001"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              placeholder="0.00"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Dataset</Form.Label>
            <Form.Select
              name="dataset_id"
              value={formData.dataset_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Dataset</option>
              {datasets.map(dataset => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.filename}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Price Change 24h</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              name="price_change_24h"
              value={formData.price_change_24h}
              onChange={handleChange}
              placeholder="0.00"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Percent Change 24h (%)</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              name="percent_change_24h"
              value={formData.percent_change_24h}
              onChange={handleChange}
              placeholder="0.00"
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Market Cap (USD)</Form.Label>
            <Form.Control
              type="number"
              name="market_cap"
              value={formData.market_cap}
              onChange={handleChange}
              placeholder="0"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>24h Volume (USD)</Form.Label>
            <Form.Control
              type="number"
              name="volume_24h"
              value={formData.volume_24h}
              onChange={handleChange}
              placeholder="0"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Circulating Supply</Form.Label>
            <Form.Control
              type="number"
              name="circulating_supply"
              value={formData.circulating_supply}
              onChange={handleChange}
              placeholder="0"
            />
          </Form.Group>
        </Col>
      </Row>
      
      <div className="d-flex justify-content-end gap-2 mt-4">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {crypto?.id ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            crypto?.id ? 'Update Cryptocurrency' : 'Create Cryptocurrency'
          )}
        </Button>
      </div>
    </Form>
  );
};

export default CryptoForm;