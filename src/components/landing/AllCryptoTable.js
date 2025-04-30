import React, { useState } from 'react';
import { Table, Badge, Pagination, Form, InputGroup, Button, Card } from 'react-bootstrap';
import { FaInfoCircle, FaSearch, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

const AllCryptoTable = ({ cryptocurrencies }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('market_cap');
  const [sortDirection, setSortDirection] = useState('desc');
  const [expandedReasons, setExpandedReasons] = useState({});
  
  const clusterColors = {
    0: 'primary',    // Mata Uang Kripto Utama
    1: 'success',    // Mata Uang Kripto Menengah
    2: 'info',       // Stablecoin
    3: 'warning',    // Mata Uang Kripto Volatilitas Tinggi
    'Unclustered': 'dark'
  };

  const clusterNames = {
    0: "Mata Uang Kripto Utama",
    1: "Mata Uang Kripto Menengah",
    2: "Stablecoin",
    3: "Mata Uang Kripto Volatilitas Tinggi",
    'Unclustered': "Tidak Terklasifikasi"
  };

  // Filtered cryptocurrencies
  const filteredCryptos = cryptocurrencies.filter(crypto => 
    (crypto.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    crypto.symbol?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort cryptocurrencies
  const sortedCryptos = [...filteredCryptos].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];
    
    if (valueA === null || valueA === undefined) valueA = sortDirection === 'asc' ? Number.MAX_VALUE : Number.MIN_VALUE;
    if (valueB === null || valueB === undefined) valueB = sortDirection === 'asc' ? Number.MAX_VALUE : Number.MIN_VALUE;
    
    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });

  // Paginate cryptocurrencies
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCryptos = sortedCryptos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCryptos.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Format cluster reason
  const formatReason = (reason, crypto) => {
    // Menambahkan penjelasan dalam bahasa Indonesia berdasarkan nomor kluster
    const getClusterDescription = (clusterNumber) => {
      switch(Number(clusterNumber)) {
        case 0:
          return {
            name: "Mata Uang Kripto Utama",
            description: "Cryptocurrency ini masuk ke dalam kluster mata uang kripto utama karena memiliki kapitalisasi pasar yang sangat besar (di atas $10 miliar) dan menjadi acuan di pasar."
          };
        case 1:
          return {
            name: "Mata Uang Kripto Menengah", 
            description: "Cryptocurrency ini tergolong dalam mata uang kripto dengan kapitalisasi pasar menengah, biasanya memiliki likuiditas yang cukup baik dan sudah cukup dikenal di pasar."
          };
        case 2:
          return {
            name: "Stablecoin",
            description: "Cryptocurrency ini adalah stablecoin, yang dirancang untuk memiliki harga yang stabil dengan perubahan harga minimal, biasanya dikaitkan dengan mata uang fiat seperti USD."
          };
        case 3:
          return {
            name: "Mata Uang Kripto Volatilitas Tinggi",
            description: "Cryptocurrency ini memiliki perubahan harga yang sangat fluktuatif, menunjukkan volatilitas tinggi dan pergerakan harga yang signifikan dalam jangka pendek."
          };
        default:
          return {
            name: "Tidak Terklasifikasi",
            description: "Cryptocurrency ini belum dapat diklasifikasikan ke dalam salah satu kategori utama."
          };
      }
    };

    const clusterInfo = getClusterDescription(crypto.cluster);
    
    // Tambahkan informasi spesifik tentang cryptocurrency
    let marketCapInfo = "";
    if (crypto.market_cap >= 100000000000) {
      marketCapInfo = `Kapitalisasi pasar sangat besar (${(crypto.market_cap/1000000000).toFixed(2)} miliar USD)`;
    } else if (crypto.market_cap >= 10000000000) {
      marketCapInfo = `Kapitalisasi pasar besar (${(crypto.market_cap/1000000000).toFixed(2)} miliar USD)`;
    } else if (crypto.market_cap >= 1000000000) {
      marketCapInfo = `Kapitalisasi pasar menengah (${(crypto.market_cap/1000000000).toFixed(2)} miliar USD)`;
    } else {
      marketCapInfo = `Kapitalisasi pasar kecil (${(crypto.market_cap/1000000).toFixed(2)} juta USD)`;
    }

    let volatilityInfo = "";
    if (crypto.percent_change_24h === 0 || Math.abs(crypto.percent_change_24h) < 0.1) {
      volatilityInfo = "Pergerakan harga sangat stabil (perubahan 24 jam hampir 0%)";
    } else if (Math.abs(crypto.percent_change_24h) > 5) {
      volatilityInfo = `Volatilitas tinggi (perubahan 24 jam: ${crypto.percent_change_24h.toFixed(2)}%)`;
    } else {
      volatilityInfo = `Volatilitas normal (perubahan 24 jam: ${crypto.percent_change_24h.toFixed(2)}%)`;
    }

    return (
      <div>
        <div><strong>Tipe Kluster:</strong> {clusterInfo.name}</div>
        <div className="mt-2 text-muted">{clusterInfo.description}</div>
        <div className="mt-2">
          <div><strong>Faktor Utama:</strong></div>
          <ul className="mt-1 mb-0 ps-3">
            <li>{marketCapInfo}</li>
            <li>{volatilityInfo}</li>
            {crypto.volume_24h > 0 && 
              <li>Volume 24 jam: ${(crypto.volume_24h/1000000000).toFixed(2)} miliar USD</li>
            }
          </ul>
        </div>
      </div>
    );
  };
  
  // Toggle expanded reason
  const toggleReasonExpand = (id) => {
    setExpandedReasons(prev => ({...prev, [id]: !prev[id]}));
  };

  // Get cluster summary
  const clusterCounts = cryptocurrencies.reduce((acc, crypto) => {
    const cluster = crypto.cluster !== null ? crypto.cluster : 'Unclustered';
    acc[cluster] = (acc[cluster] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card className="shadow-sm mb-4">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3>Semua Cryptocurrency</h3>
            <p className="text-muted">
              Menampilkan {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCryptos.length)} dari {filteredCryptos.length} cryptocurrency
            </p>
          </div>
          
          <div className="d-flex">
            <InputGroup className="me-3" style={{width: "300px"}}>
              <InputGroup.Text><FaSearch /></InputGroup.Text>
              <Form.Control
                placeholder="Cari berdasarkan nama atau simbol"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <Button 
                  variant="outline-secondary" 
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                >
                  Hapus
                </Button>
              )}
            </InputGroup>
            
            <Form.Select 
              value={itemsPerPage} 
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{width: "80px"}}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Form.Select>
          </div>
        </div>

        {/* Cluster legend */}
        <div className="mb-4">
          <h5>Keterangan Kluster:</h5>
          <div className="d-flex flex-wrap">
            <Badge bg="primary" className="me-3 mb-2 p-2">
              Kluster 0: Mata Uang Kripto Utama ({clusterCounts[0] || 0})
            </Badge>
            <Badge bg="success" className="me-3 mb-2 p-2">
              Kluster 1: Mata Uang Kripto Menengah ({clusterCounts[1] || 0})
            </Badge>
            <Badge bg="info" className="me-3 mb-2 p-2">
              Kluster 2: Stablecoin ({clusterCounts[2] || 0})
            </Badge>
            <Badge bg="warning" className="me-3 mb-2 p-2">
              Kluster 3: Mata Uang Kripto Volatilitas Tinggi ({clusterCounts[3] || 0})
            </Badge>
          </div>
        </div>
        
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th onClick={() => handleSort('symbol')} style={{cursor: 'pointer'}}>
                  Simbol {sortField === 'symbol' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                </th>
                <th onClick={() => handleSort('name')} style={{cursor: 'pointer'}}>
                  Nama {sortField === 'name' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                </th>
                <th onClick={() => handleSort('price')} style={{cursor: 'pointer'}}>
                  Harga (USD) {sortField === 'price' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                </th>
                <th onClick={() => handleSort('percent_change_24h')} style={{cursor: 'pointer'}}>
                  Perubahan 24j {sortField === 'percent_change_24h' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                </th>
                <th onClick={() => handleSort('market_cap')} style={{cursor: 'pointer'}}>
                  Kapitalisasi Pasar {sortField === 'market_cap' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                </th>
                <th onClick={() => handleSort('cluster')} style={{cursor: 'pointer'}}>
                  Kluster {sortField === 'cluster' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                </th>
                <th>Alasan</th>
              </tr>
            </thead>
            <tbody>
              {currentCryptos.map((crypto) => (
                <tr key={crypto.id}>
                  <td>{crypto.symbol}</td>
                  <td>{crypto.name}</td>
                  <td>${crypto.price?.toFixed(6) || 'N/A'}</td>
                  <td>
                    {crypto.percent_change_24h !== undefined && crypto.percent_change_24h !== null ? (
                      <span className={crypto.percent_change_24h >= 0 ? 'text-success' : 'text-danger'}>
                        {crypto.percent_change_24h.toFixed(2)}%
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td>${(crypto.market_cap / 1000000000).toFixed(2)}B</td>
                  <td>
                    <Badge bg={clusterColors[crypto.cluster !== null ? crypto.cluster : 'Unclustered']} className="p-2">
                      Kluster {crypto.cluster}
                    </Badge>
                  </td>
                  <td>
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => toggleReasonExpand(crypto.id)} 
                      className="p-0 text-decoration-none"
                    >
                      <FaInfoCircle className="me-1" />
                      {expandedReasons[crypto.id] ? 'Sembunyikan Alasan' : 'Lihat Alasan'}
                    </Button>
                    {expandedReasons[crypto.id] && (
                      <div className="mt-2 p-2 bg-light border rounded">
                        {formatReason(crypto.clusterReason, crypto)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination>
              <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
              <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
              
              {currentPage > 2 && <Pagination.Item onClick={() => handlePageChange(1)}>1</Pagination.Item>}
              {currentPage > 3 && <Pagination.Ellipsis />}
              
              {currentPage > 1 && <Pagination.Item onClick={() => handlePageChange(currentPage - 1)}>{currentPage - 1}</Pagination.Item>}
              <Pagination.Item active>{currentPage}</Pagination.Item>
              {currentPage < totalPages && <Pagination.Item onClick={() => handlePageChange(currentPage + 1)}>{currentPage + 1}</Pagination.Item>}
              
              {currentPage < totalPages - 2 && <Pagination.Ellipsis />}
              {currentPage < totalPages - 1 && <Pagination.Item onClick={() => handlePageChange(totalPages)}>{totalPages}</Pagination.Item>}
              
              <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
              <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
            </Pagination>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default AllCryptoTable;