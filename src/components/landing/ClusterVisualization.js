import React, { useState } from "react";
import { Scatter } from "react-chartjs-2";
import { Card } from "react-bootstrap";
import {
  Chart as ChartJS,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const ClusterVisualization = ({ data }) => {
  // Keep state variables but they won't be changeable through UI
  const xAxis = "market_cap";
  const yAxis = "percent_change_24h";
  const jitterStrength = "medium";
  const displayDensity = "balanced";
  const useJitter = true;

  // Generate dataset for each cluster
  const colors = [
    "#36A2EB",
    "#FF6384",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
  ];
  const backgroundColors = [
    "rgba(54, 162, 235, 0.5)",
    "rgba(255, 99, 132, 0.5)",
    "rgba(255, 206, 86, 0.5)",
    "rgba(75, 192, 192, 0.5)",
    "rgba(153, 102, 255, 0.5)",
    "rgba(255, 159, 64, 0.5)",
  ];

  // Filter out cryptocurrencies with missing values for selected axes
  const filteredData = data.filter(
    (crypto) => 
      crypto[xAxis] > 0 && 
      crypto[yAxis] !== undefined && 
      crypto[yAxis] !== null
  );

  // Get jitter strength based on setting
  const getJitterAmount = () => {
    switch(jitterStrength) {
      case "low": return 0.05; // 5%
      case "medium": return 0.10; // 10%
      case "high": return 0.20; // 20%
      case "extreme": return 0.35; // 35%
      default: return 0.10;
    }
  };

  // Smart jittering function that adjusts based on data density
  const addJitter = (value, dataPoints, pointIndex) => {
    if (!useJitter) return value;

    // Basic jitter amount based on user selection
    const baseJitter = getJitterAmount();
    
    // For extreme data clustering, use position-based jitter
    // This spreads points out in a pattern rather than randomly
    const pointCount = dataPoints.length;
    const positionFactor = pointCount > 20 ? (pointIndex % 10) / 10 : Math.random();
    const direction = pointIndex % 2 === 0 ? 1 : -1;
    
    // Calculate different jitter for different values
    // Small values need more jitter percentage-wise
    const valueFactor = Math.abs(value) < 1 ? 5 : 1;
    
    // Apply jitter with direction and magnitude
    return value + (value * baseJitter * direction * positionFactor * valueFactor);
  };

  // Apply smart distribution algorithm
  const distributeData = (clusterData) => {
    // Create bins for values to detect overlaps
    const bins = {};
    const binSize = 0.1; // Adjust bin size for overlap detection
    
    const processedData = [...clusterData];
    
    // First pass: identify crowded regions
    processedData.forEach(crypto => {
      const xBin = Math.floor(Math.log10(crypto[xAxis] || 1) / binSize);
      const yBin = Math.floor(Math.log10(Math.abs(crypto[yAxis]) || 1) / binSize); // Use log-scale for binning
      const binKey = `${xBin}_${yBin}`;
      
      if (!bins[binKey]) bins[binKey] = [];
      bins[binKey].push(crypto);
    });
    
    // Second pass: smart jittering based on bin crowding
    processedData.forEach((crypto, index) => {
      const xBin = Math.floor(Math.log10(crypto[xAxis] || 1) / binSize);
      const yBin = Math.floor(Math.log10(Math.abs(crypto[yAxis]) || 1) / binSize);
      const binKey = `${xBin}_${yBin}`;
      
      // Apply more jitter to crowded bins
      const binCount = bins[binKey].length;
      const crowdFactor = binCount > 5 ? (binCount / 5) : 1;
      
      // Apply jitter with smart distribution
      crypto.jittered_x = addJitter(crypto[xAxis] || 0, bins[binKey], index) * crowdFactor;
      crypto.jittered_y = addJitter(crypto[yAxis] || 0, bins[binKey], index) * (displayDensity === "spread" ? 1.2 : 1);
    });
    
    return processedData;
  };

  // Apply distribution strategy to create jittered data
  const jitteredData = distributeData(filteredData);

  // Group by cluster
  const groupedData = jitteredData.reduce((acc, crypto) => {
    const cluster =
      crypto.cluster !== null ? crypto.cluster.toString() : "Unclustered";
    if (!acc[cluster]) {
      acc[cluster] = [];
    }
    acc[cluster].push(crypto);
    return acc;
  }, {});

  // Calculate optimal point radius based on data density
  const calculatePointRadius = (dataPoints) => {
    // Base size on number of points and display density setting
    const baseFactor = displayDensity === "dense" ? 300 : 
                      displayDensity === "balanced" ? 500 : 700;
    
    return baseFactor / Math.sqrt(dataPoints.length);
  };

  const datasets = Object.keys(groupedData).map((cluster, index) => {
    const clusterName =
      cluster === "Unclustered" ? "Unclustered" : `Cluster ${cluster}`;
    const clusterPoints = groupedData[cluster];

    // Determine optimal point size based on number of points in this cluster
    const baseRadius = Math.min(8, calculatePointRadius(clusterPoints));
    const radiusFactor = displayDensity === "dense" ? 0.8 : 
                        displayDensity === "balanced" ? 1 : 1.2;

    return {
      label: `${clusterName} (${clusterPoints.length} coins)`,
      data: clusterPoints.map((crypto) => ({
        x: crypto.jittered_x,
        y: crypto.jittered_y,
        symbol: crypto.symbol,
        name: crypto.name,
        price: crypto.price,
        actual_x: crypto[xAxis],
        actual_y: crypto[yAxis],
        volume: crypto.volume_24h
      })),
      backgroundColor: backgroundColors[index % backgroundColors.length],
      borderColor: colors[index % colors.length],
      borderWidth: 1,
      pointRadius: (ctx) => {
        // Scale based on market cap
        const point = ctx.dataset.data[ctx.dataIndex];
        const marketCapLog = Math.log10(point.actual_x || 1);
        return Math.max(
          baseRadius * 0.7 * radiusFactor,
          Math.min(baseRadius * 1.5 * radiusFactor, marketCapLog * 0.8)
        );
      },
      pointHoverRadius: 10,
    };
  });

  // Add centroids dataset if available
  if (data.centroids) {
    datasets.push({
      label: 'Centroids',
      data: data.centroids.map((centroid, idx) => ({
        x: centroid[0],  // Market Cap
        y: centroid[1],  // Percent Change
        symbol: `Centroid ${idx}`,
        name: `Cluster ${idx} Centroid`,
        actual_x: centroid[0],
        actual_y: centroid[1]
      })),
      backgroundColor: 'rgba(255, 0, 0, 0.8)',
      borderColor: 'rgba(255, 0, 0, 1)',
      borderWidth: 2,
      pointRadius: 15,
      pointStyle: 'crossRot',
      pointHoverRadius: 18,
    });
  }

  const chartData = { datasets };

  const getAxisLabel = (axisName) => {
    switch (axisName) {
      case "market_cap":
        return "Market Cap (USD)";
      case "price_change_24h":
        return "Price Change 24h (USD)";
      case "percent_change_24h":
        return "Price Change 24h (%)";
      case "volume_24h":
        return "Volume 24h (USD)";
      case "circulating_supply":
        return "Circulating Supply";
      case "price":
        return "Price (USD)";
      default:
        return axisName;
    }
  };

  const formatValue = (value, axisName) => {
    if (value === 0) return "0";
    if (value === null || value === undefined) return "N/A";
    if (axisName === "percent_change_24h") return value.toFixed(2) + "%";

    // For currency values
    if (["market_cap", "price_change_24h", "volume_24h", "price"].includes(axisName)) {
      if (value >= 1000000000)
        return "$" + (value / 1000000000).toFixed(1) + "B";
      if (value >= 1000000) return "$" + (value / 1000000).toFixed(1) + "M";
      if (value >= 1000) return "$" + (value / 1000).toFixed(1) + "K";
      return "$" + value.toFixed(2);
    }

    // For other numeric values
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + "B";
    if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
    if (value >= 1000) return (value / 1000).toFixed(1) + "K";
    return value.toFixed(2);
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 10,
        right: 20,
        bottom: 10,
        left: 50,
      },
    },
    scales: {
      x: {
        type: "logarithmic", // Using logarithmic scale for market cap
        position: "bottom",
        title: {
          display: true,
          text: getAxisLabel(xAxis),
          font: {
            size: 16,
            weight: "bold",
          },
        },
        ticks: {
          callback: function (value) {
            return formatValue(value, xAxis);
          },
          font: {
            size: 12,
          },
          maxTicksLimit: 10,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        }
      },
      y: {
        type: "logarithmic", // Changed to logarithmic scale to match Python implementation
        title: {
          display: true,
          text: getAxisLabel(yAxis),
          font: {
            size: 16,
            weight: "bold",
          },
        },
        ticks: {
          callback: function (value) {
            return formatValue(value, yAxis);
          },
          font: {
            size: 12,
          },
          maxTicksLimit: 8,
          autoSkip: true,
          padding: 10,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        afterFit: function (scaleInstance) {
          scaleInstance.width = 100; // Set width of Y-axis to 100px
        }
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        padding: 12,
        displayColors: true,
        callbacks: {
          title: (context) => {
            const point = context[0].raw;
            return `${point.name} (${point.symbol})`;
          },
          label: (context) => {
            const point = context.raw;
            return [
              `Price: $${
                point.price?.toLocaleString(undefined, {
                  maximumFractionDigits: 6,
                }) || "N/A"
              }`,
              `${getAxisLabel(xAxis)}: ${formatValue(point.actual_x, xAxis)}`,
              `${getAxisLabel(yAxis)}: ${formatValue(point.actual_y, yAxis)}`,
              `Volume: $${point.volume?.toLocaleString() || "N/A"}`,
            ];
          },
        },
      },
    },
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <div
          className="chart-container"
          style={{ height: "800px", width: "100%" }}
        >
          <Scatter data={chartData} options={options} />
        </div>
      </Card.Body>
    </Card>
  );
};

export default ClusterVisualization;