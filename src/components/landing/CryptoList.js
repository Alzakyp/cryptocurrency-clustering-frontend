import React, { useState } from 'react';
import { Accordion, Table, Badge } from 'react-bootstrap';

const CryptoList = ({ cryptosByCluster }) => {
  const [activeCluster, setActiveCluster] = useState(null);

  // Cluster descriptions
  const clusterDescriptions = {
    0: "Mata Uang Kripto Utama (Kapitalisasi Pasar Besar)",
    1: "Mata Uang Kripto Menengah",
    2: "Stablecoin",
    3: "Mata Uang Kripto Volatilitas Tinggi"
  };

  // Cluster colors
  const clusterColors = {
    0: 'primary',
    1: 'success',
    2: 'info',
    3: 'warning',
    'Unclustered': 'dark'
  };
  
  const sortedClusters = Object.keys(cryptosByCluster).sort((a, b) => {
    // Convert to number for sorting (except 'Unclustered')
    const aNum = a === 'Unclustered' ? Infinity : Number(a);
    const bNum = b === 'Unclustered' ? Infinity : Number(b);
    return aNum - bNum;
  });

  return (
    <div>
      <Accordion defaultActiveKey={activeCluster} onSelect={setActiveCluster}>
        {sortedClusters.map((cluster) => {
          // Sort cryptocurrencies by market cap (descending)
          const sortedCryptos = [...cryptosByCluster[cluster]].sort(
            (a, b) => (b.market_cap || 0) - (a.market_cap || 0)
          );

          return (
            <Accordion.Item eventKey={cluster} key={cluster}>
              <Accordion.Header>
                <div className="d-flex w-100 justify-content-between align-items-center">
                  <div>
                    <Badge 
                      bg={clusterColors[cluster !== 'Unclustered' ? cluster : 'Unclustered']} 
                      className="me-2 p-2"
                    >
                      {cluster !== 'Unclustered' ? `Cluster ${cluster}` : cluster}
                    </Badge>
                    {cluster !== 'Unclustered' && 
                      <span className="fw-bold">{clusterDescriptions[cluster]}</span>
                    }
                  </div>
                  <Badge bg="secondary" pill>
                    {sortedCryptos.length} cryptocurrencies
                  </Badge>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <div className="table-responsive">
                  <Table striped bordered hover>
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
                      {sortedCryptos.map((crypto) => (
                        <tr key={crypto.id}>
                          <td>{crypto.symbol}</td>
                          <td>{crypto.name}</td>
                          <td>${crypto.price?.toFixed(6) || 'N/A'}</td>
                          <td>
                            {crypto.percent_change_24h ? (
                              <span className={crypto.percent_change_24h >= 0 ? 'text-success' : 'text-danger'}>
                                {crypto.percent_change_24h.toFixed(2)}%
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td>${(crypto.market_cap / 1000000000).toFixed(2)}B</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </div>
  );
};

export default CryptoList;