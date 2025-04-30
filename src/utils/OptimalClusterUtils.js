import * as ss from "simple-statistics";
import { kMeansClustering } from "./ClusteringUtils";

/**
 * Computes the WCSS (Within-Cluster Sum of Squares) for a range of k values
 * Implementation of the Elbow Method to find optimal k
 * @param {Array} data - Cryptocurrency data array
 * @param {Number} maxK - Maximum number of clusters to test
 * @returns {Array} Array of WCSS values for each k
 */
export const elbowMethod = (data, maxK = 10) => {
  // Ensure data has values
  if (!data || data.length === 0) {
    console.error("No data provided for elbow method");
    return [];
  }

  // Filter out cryptos with missing values
  const validData = data.filter(
    (crypto) =>
      crypto.market_cap > 0 &&
      crypto.percent_change_24h !== undefined &&
      crypto.percent_change_24h !== null
  );

  if (validData.length < 2) {
    console.error("Not enough valid data points for clustering");
    return [];
  }

  // Extract features for clustering
  const features = validData.map((crypto) => [
    Math.log10(crypto.market_cap), // Use log scale for market cap
    crypto.percent_change_24h, // Use percent change as is
  ]);

  // Standardize features
  const marketCapValues = features.map((f) => f[0]);
  const percentChangeValues = features.map((f) => f[1]);

  const marketCapMean = ss.mean(marketCapValues);
  const marketCapStd = ss.standardDeviation(marketCapValues);

  const percentChangeMean = ss.mean(percentChangeValues);
  const percentChangeStd = ss.standardDeviation(percentChangeValues);

  const scaledFeatures = features.map((f) => [
    (f[0] - marketCapMean) / marketCapStd,
    (f[1] - percentChangeMean) / percentChangeStd,
  ]);

  // Calculate WCSS for different k values
  const wcss = [];
  const minK = 1;
  
  for (let k = minK; k <= maxK; k++) {
    // Skip if k is too large for the dataset
    if (k >= scaledFeatures.length) {
      console.warn(`k=${k} is too large for the dataset size (${scaledFeatures.length})`);
      break;
    }
    
    // Initialize centroids randomly
    const centroids = [];
    const usedIndices = new Set();
    
    for (let i = 0; i < k; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * scaledFeatures.length);
      } while (usedIndices.has(randomIndex));

      usedIndices.add(randomIndex);
      centroids.push([...scaledFeatures[randomIndex]]);
    }
    
    // K-means algorithm
    const maxIterations = 100;
    let iterations = 0;
    let clusters;
    let oldCentroids;
    
    do {
      // Assign each point to nearest centroid
      clusters = Array.from({ length: k }, () => []);
      
      scaledFeatures.forEach((point, index) => {
        let minDistance = Infinity;
        let clusterIndex = 0;
        
        centroids.forEach((centroid, i) => {
          const distance = Math.sqrt(
            Math.pow(point[0] - centroid[0], 2) +
            Math.pow(point[1] - centroid[1], 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            clusterIndex = i;
          }
        });
        
        clusters[clusterIndex].push(index);
      });
      
      // Store old centroids for convergence check
      oldCentroids = JSON.parse(JSON.stringify(centroids));
      
      // Recalculate centroids
      centroids.forEach((_, i) => {
        if (clusters[i].length === 0) {
          centroids[i] = [0, 0];
        } else {
          const clusterPoints = clusters[i].map((idx) => scaledFeatures[idx]);
          centroids[i] = [
            ss.mean(clusterPoints.map((p) => p[0])),
            ss.mean(clusterPoints.map((p) => p[1]))
          ];
        }
      });
      
      iterations++;
    } while (
      iterations < maxIterations &&
      centroids.some(
        (centroid, i) =>
          Math.sqrt(
            Math.pow(centroid[0] - oldCentroids[i][0], 2) +
            Math.pow(centroid[1] - oldCentroids[i][1], 2)
          ) > 0.001
      )
    );
    
    // Calculate WCSS (Within-Cluster Sum of Squares)
    let sumWCSS = 0;
    
    clusters.forEach((cluster, clusterIdx) => {
      cluster.forEach((pointIdx) => {
        const point = scaledFeatures[pointIdx];
        const centroid = centroids[clusterIdx];
        sumWCSS += Math.pow(point[0] - centroid[0], 2) + Math.pow(point[1] - centroid[1], 2);
      });
    });
    
    wcss.push(sumWCSS);
  }
  
  return wcss;
};

/**
 * Calculates silhouette scores for a range of k values
 * Implementation of the Silhouette Method to find optimal k
 * @param {Array} data - Cryptocurrency data array
 * @param {Number} maxK - Maximum number of clusters to test
 * @returns {Array} Array of silhouette scores for each k
 */
export const silhouetteMethod = (data, maxK = 10) => {
  // Ensure data has values
  if (!data || data.length === 0) {
    console.error("No data provided for silhouette method");
    return [];
  }

  // Filter out cryptos with missing values
  const validData = data.filter(
    (crypto) =>
      crypto.market_cap > 0 &&
      crypto.percent_change_24h !== undefined &&
      crypto.percent_change_24h !== null
  );

  if (validData.length < 3) { // Need at least 3 points for meaningful silhouette
    console.error("Not enough valid data points for clustering");
    return [];
  }

  // Extract features for clustering
  const features = validData.map((crypto) => [
    Math.log10(crypto.market_cap), // Use log scale for market cap
    crypto.percent_change_24h, // Use percent change as is
  ]);

  // Standardize features
  const marketCapValues = features.map((f) => f[0]);
  const percentChangeValues = features.map((f) => f[1]);

  const marketCapMean = ss.mean(marketCapValues);
  const marketCapStd = ss.standardDeviation(marketCapValues);

  const percentChangeMean = ss.mean(percentChangeValues);
  const percentChangeStd = ss.standardDeviation(percentChangeValues);

  const scaledFeatures = features.map((f) => [
    (f[0] - marketCapMean) / marketCapStd,
    (f[1] - percentChangeMean) / percentChangeStd,
  ]);
  
  // Calculate silhouette scores for different k values
  const silhouetteScores = [];
  const minK = 2; // Silhouette requires at least 2 clusters
  
  for (let k = minK; k <= maxK; k++) {
    // Skip if k is too large for the dataset
    if (k >= scaledFeatures.length) {
      console.warn(`k=${k} is too large for the dataset size (${scaledFeatures.length})`);
      break;
    }
    
    // Run k-means to get clusters
    const centroids = [];
    const usedIndices = new Set();
    
    // Initialize centroids randomly
    for (let i = 0; i < k; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * scaledFeatures.length);
      } while (usedIndices.has(randomIndex));

      usedIndices.add(randomIndex);
      centroids.push([...scaledFeatures[randomIndex]]);
    }
    
    // K-means algorithm
    const maxIterations = 100;
    let iterations = 0;
    let clusters;
    let oldCentroids;
    
    do {
      // Assign each point to nearest centroid
      clusters = Array.from({ length: k }, () => []);
      
      scaledFeatures.forEach((point, index) => {
        let minDistance = Infinity;
        let clusterIndex = 0;
        
        centroids.forEach((centroid, i) => {
          const distance = Math.sqrt(
            Math.pow(point[0] - centroid[0], 2) +
            Math.pow(point[1] - centroid[1], 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            clusterIndex = i;
          }
        });
        
        clusters[clusterIndex].push(index);
      });
      
      // Store old centroids for convergence check
      oldCentroids = JSON.parse(JSON.stringify(centroids));
      
      // Recalculate centroids
      centroids.forEach((_, i) => {
        if (clusters[i].length === 0) {
          centroids[i] = [0, 0];
        } else {
          const clusterPoints = clusters[i].map((idx) => scaledFeatures[idx]);
          centroids[i] = [
            ss.mean(clusterPoints.map((p) => p[0])),
            ss.mean(clusterPoints.map((p) => p[1]))
          ];
        }
      });
      
      iterations++;
    } while (
      iterations < maxIterations &&
      centroids.some(
        (centroid, i) =>
          Math.sqrt(
            Math.pow(centroid[0] - oldCentroids[i][0], 2) +
            Math.pow(centroid[1] - oldCentroids[i][1], 2)
          ) > 0.001
      )
    );
    
    // Calculate cluster assignments for each point
    const clusterAssignments = scaledFeatures.map(point => {
      let minDistance = Infinity;
      let clusterIndex = 0;
        
      centroids.forEach((centroid, i) => {
        const distance = Math.sqrt(
          Math.pow(point[0] - centroid[0], 2) +
          Math.pow(point[1] - centroid[1], 2)
        );
          
        if (distance < minDistance) {
          minDistance = distance;
          clusterIndex = i;
        }
      });
      
      return clusterIndex;
    });
    
    // Calculate silhouette score
    let totalSilhouette = 0;
    let validPoints = 0;
    
    // For each point, calculate its silhouette
    scaledFeatures.forEach((point, pointIndex) => {
      const pointCluster = clusterAssignments[pointIndex];
      
      // Check if cluster has other points
      if (clusters[pointCluster].length <= 1) {
        return; // Skip points in singleton clusters
      }
      
      // Calculate a(i) - average distance to points in same cluster
      let totalDistanceInCluster = 0;
      let countInCluster = 0;
      
      clusters[pointCluster].forEach(otherPointIndex => {
        if (otherPointIndex !== pointIndex) {
          const otherPoint = scaledFeatures[otherPointIndex];
          const distance = Math.sqrt(
            Math.pow(point[0] - otherPoint[0], 2) +
            Math.pow(point[1] - otherPoint[1], 2)
          );
          totalDistanceInCluster += distance;
          countInCluster++;
        }
      });
      
      const a = countInCluster > 0 ? totalDistanceInCluster / countInCluster : 0;
      
      // Calculate b(i) - minimum average distance to points in different clusters
      let minAverageDistance = Infinity;
      
      for (let otherClusterIndex = 0; otherClusterIndex < k; otherClusterIndex++) {
        if (otherClusterIndex !== pointCluster && clusters[otherClusterIndex].length > 0) {
          let totalDistanceToCluster = 0;
          
          clusters[otherClusterIndex].forEach(otherPointIndex => {
            const otherPoint = scaledFeatures[otherPointIndex];
            const distance = Math.sqrt(
              Math.pow(point[0] - otherPoint[0], 2) +
              Math.pow(point[1] - otherPoint[1], 2)
            );
            totalDistanceToCluster += distance;
          });
          
          const averageDistance = totalDistanceToCluster / clusters[otherClusterIndex].length;
          minAverageDistance = Math.min(minAverageDistance, averageDistance);
        }
      }
      
      const b = minAverageDistance;
      
      // Calculate silhouette
      let silhouette;
      if (a === 0 && b === 0) {
        silhouette = 0;
      } else if (a === 0) {
        silhouette = 1;
      } else if (b === Infinity) {
        silhouette = -1;
      } else {
        silhouette = (b - a) / Math.max(a, b);
      }
      
      // Add to total
      totalSilhouette += silhouette;
      validPoints++;
    });
    
    // Calculate average silhouette score
    const avgSilhouette = validPoints > 0 ? totalSilhouette / validPoints : 0;
    silhouetteScores.push(avgSilhouette);
  }
  
  return silhouetteScores;
};

/**
 * Determines the optimal k using the Elbow Method
 * @param {Array} wcssValues - Array of WCSS values from the elbow method
 * @returns {Number} The optimal k value
 */
export const findOptimalKElbow = (wcssValues) => {
  if (!wcssValues || wcssValues.length < 3) {
    return 3; // Default to 3 if not enough data points
  }
  
  // Calculate the "elbow" point using the maximum curvature method
  let maxCurvature = 0;
  let optimalK = 3; // Default
  
  for (let i = 1; i < wcssValues.length - 1; i++) {
    // Calculate approximate curvature using finite differences
    const prev = wcssValues[i-1];
    const curr = wcssValues[i];
    const next = wcssValues[i+1];
    
    // First derivative using central difference
    const firstDeriv1 = curr - prev;
    const firstDeriv2 = next - curr;
    
    // Second derivative using central difference
    const secondDeriv = firstDeriv2 - firstDeriv1;
    
    // Curvature approximation (simplified)
    const curvature = Math.abs(secondDeriv / Math.pow((1 + Math.pow(firstDeriv1, 2)), 1.5));
    
    if (curvature > maxCurvature) {
      maxCurvature = curvature;
      optimalK = i + 1; // +1 because i is 0-indexed but k starts at 1
    }
  }
  
  return optimalK;
};

/**
 * Determines the optimal k using the Silhouette Method
 * @param {Array} silhouetteScores - Array of silhouette scores
 * @returns {Number} The optimal k value
 */
export const findOptimalKSilhouette = (silhouetteScores) => {
  if (!silhouetteScores || silhouetteScores.length < 1) {
    return 3; // Default to 3 if no scores
  }
  
  // Find the k with maximum silhouette score
  let maxScore = -Infinity;
  let optimalK = 3; // Default
  
  silhouetteScores.forEach((score, index) => {
    if (score > maxScore) {
      maxScore = score;
      optimalK = index + 2; // +2 because silhouette starts at k=2 and index is 0-based
    }
  });
  
  return optimalK;
};

/**
 * Determines the optimal k by combining both methods
 * @param {Array} data - Cryptocurrency data array
 * @param {Number} maxK - Maximum number of clusters to test
 * @returns {Object} Object containing the optimal k and analysis details
 */
export const determineOptimalK = (data, maxK = 10) => {
  // Run both methods
  const wcssValues = elbowMethod(data, maxK);
  const silhouetteScores = silhouetteMethod(data, maxK);
  
  // Get optimal k from each method
  const elbowK = findOptimalKElbow(wcssValues);
  const silhouetteK = findOptimalKSilhouette(silhouetteScores);
  
  // Combine results (prefer silhouette if it gives a reasonable answer)
  let finalK;
  let method;
  
  // Favor silhouette if it's between 2 and 8, otherwise use elbow
  if (silhouetteK >= 2 && silhouetteK <= 8) {
    finalK = silhouetteK;
    method = 'silhouette';
  } else {
    finalK = elbowK;
    method = 'elbow';
  }
  
  // Provide the results
  return {
    optimalK: finalK,
    method: method,
    analysis: {
      elbow: {
        k: elbowK,
        wcssValues: wcssValues,
      },
      silhouette: {
        k: silhouetteK,
        scores: silhouetteScores,
      }
    }
  };
};

/**
 * Runs clustering with automatic k selection
 * @param {Array} data - Cryptocurrency data array
 * @param {Number} maxK - Maximum number of clusters to test
 * @returns {Object} Object containing clustered data and optimal k details
 */
export const runOptimalClustering = (data, maxK = 10) => {
  // Determine optimal k
  const kAnalysis = determineOptimalK(data, maxK);
  const optimalK = kAnalysis.optimalK;
  
  // Run clustering with optimal k
  const clusteredData = kMeansClustering(data, optimalK);
  
  return {
    data: clusteredData,
    analysis: kAnalysis
  };
};