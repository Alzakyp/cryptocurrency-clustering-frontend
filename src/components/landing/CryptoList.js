import React from 'react';
import { Accordion, Table, Badge } from 'react-bootstrap';

const CryptoList = ({ cryptosByCluster }) => {
  const clusterColors = {
    0: 'primary',
    1: 'success',
    2: 'warning',
    3: 'danger',
    4: 'info',
    5: 'secondary',
    'Unclustered': 'dark'
  };

  return (
    <Accordion defaultActiveKey="0">
      {Object.keys(cryptosByCluster).map((cluster, index) => (
        <Accordion.Item key={cluster} eventKey={index.toString()}>
          <Accordion.Header>
            <span>
              Cluster {cluster} 
              <Badge bg={clusterColors[cluster] || 'dark'} className="ms-2">
                {cryptosByCluster[cluster].length} Cryptocurrencies
              </Badge>
            </span>
          </Accordion.Header>
          <Accordion.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Price (USD)</th>
                  <th>24h Change</th>
                  <th>Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {cryptosByCluster[cluster].map((crypto) => (
                  <tr key={crypto.id}>
                    <td>{crypto.symbol}</td>
                    <td>{crypto.name}</td>
                    <td>${crypto.price?.toFixed(2) || 'N/A'}</td>
                    <td>
                      {crypto.price_change_24h ? (
                        <span className={crypto.price_change_24h >= 0 ? 'text-success' : 'text-danger'}>
                          {crypto.price_change_24h.toFixed(2)}%
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td>${crypto.market_cap?.toLocaleString() || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
};

export default CryptoList;