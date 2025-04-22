import React from 'react';
import { Scatter } from 'react-chartjs-2';
import { Card } from 'react-bootstrap';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const ClusterVisualization = ({ data }) => {
  // Generate dataset for each cluster
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
  
  const groupedData = data.reduce((acc, crypto) => {
    const cluster = crypto.cluster !== null ? crypto.cluster : 'Unclustered';
    if (!acc[cluster]) {
      acc[cluster] = [];
    }
    acc[cluster].push(crypto);
    return acc;
  }, {});
  
  const datasets = Object.keys(groupedData).map((cluster, index) => {
    return {
      label: `Cluster ${cluster}`,
      data: groupedData[cluster].map(crypto => ({
        x: crypto.price_change_24h || 0, 
        y: crypto.market_cap || 0,
        symbol: crypto.symbol,
        name: crypto.name
      })),
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length]
    };
  });
  
  const chartData = {
    datasets
  };
  
  const options = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Price Change 24h (%)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Market Cap (USD)'
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = context.raw;
            return `${point.name} (${point.symbol}): Price Change: ${point.x}%, Market Cap: $${point.y}`;
          }
        }
      }
    }
  };
  
  return (
    <Card>
      <Card.Body>
        <Scatter data={chartData} options={options} height={400} />
      </Card.Body>
    </Card>
  );
};

export default ClusterVisualization;