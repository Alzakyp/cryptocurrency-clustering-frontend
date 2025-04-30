import * as ss from "simple-statistics";

// Euclidean distance function
const euclideanDistance = (point1, point2, features) => {
  return Math.sqrt(
    features.reduce((sum, feature) => {
      // Handle potential undefined values
      const val1 = point1[feature] || 0;
      const val2 = point2[feature] || 0;
      const diff = val1 - val2;
      return sum + diff * diff;
    }, 0)
  );
};

// Normalize values to 0-1 range
const normalizeData = (data, features) => {
  const normalizedData = JSON.parse(JSON.stringify(data)); // Deep clone to avoid mutations

  features.forEach((feature) => {
    // Find min and max values
    const values = data
      .map((item) => item[feature])
      .filter((val) => val !== null && val !== undefined);

    // Skip normalization if we don't have values for this feature
    if (values.length === 0) return;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    // Normalize each value
    normalizedData.forEach((item) => {
      if (item[feature] !== null && item[feature] !== undefined) {
        item[`${feature}_normalized`] =
          range !== 0 ? (item[feature] - min) / range : 0;
      } else {
        item[`${feature}_normalized`] = 0; // Default for missing data
      }
    });
  });

  return normalizedData;
};

// Find centroids for each cluster using mean of points
const calculateCentroids = (data, assignments, k, features) => {
  const centroids = Array(k)
    .fill()
    .map(() => ({}));
  const counts = Array(k).fill(0);

  // Sum up all points in each cluster
  data.forEach((point, i) => {
    const clusterId = assignments[i];
    counts[clusterId]++;

    features.forEach((feature) => {
      if (!centroids[clusterId][feature]) {
        centroids[clusterId][feature] = 0;
      }
      centroids[clusterId][feature] += point[feature] || 0;
    });
  });

  // Calculate mean for each feature in each cluster
  centroids.forEach((centroid, i) => {
    if (counts[i] > 0) {
      features.forEach((feature) => {
        centroid[feature] /= counts[i];
      });
    }
  });

  return centroids;
};

// K-means clustering algorithm
export const kMeansClustering = (data, k) => {
  if (!data || data.length === 0) {
    console.error("No data provided for clustering");
    return data;
  }

  // Filter out cryptos with missing or invalid values, but keep track of their original indices
  const validDataWithIndices = data
    .map((crypto, index) => ({ crypto, originalIndex: index }))
    .filter(
      (item) =>
        item.crypto.market_cap > 0 &&
        item.crypto.percent_change_24h !== undefined &&
        item.crypto.percent_change_24h !== null
    );

  const validData = validDataWithIndices.map((item) => item.crypto);

  if (validData.length < k) {
    console.error("Not enough valid data points for clustering");
    return data;
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

  // Initialize centroids randomly
  let centroids = [];
  const usedIndices = new Set();

  // Ensure we have enough unique points for centroids
  if (scaledFeatures.length < k) {
    console.error(
      `Not enough unique data points (${scaledFeatures.length}) for ${k} clusters`
    );
    k = Math.min(k, scaledFeatures.length);
  }

  for (let i = 0; i < k; i++) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * scaledFeatures.length);
    } while (usedIndices.has(randomIndex));

    usedIndices.add(randomIndex);
    centroids.push(scaledFeatures[randomIndex]);
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
    oldCentroids = [...centroids];

    // Recalculate centroids
    centroids = clusters.map((cluster) => {
      if (cluster.length === 0) return [0, 0];

      const clusterPoints = cluster.map((index) => scaledFeatures[index]);
      return [
        ss.mean(clusterPoints.map((p) => p[0])),
        ss.mean(clusterPoints.map((p) => p[1])),
      ];
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

  // De-standardize centroids
  const finalCentroids = centroids.map((c) => [
    c[0] * marketCapStd + marketCapMean,
    c[1] * percentChangeStd + percentChangeMean,
  ]);

  // Convert back from log scale for market cap
  const rawCentroids = finalCentroids.map((c) => [
    Math.pow(10, c[0]), // Convert log10(market_cap) back to market_cap
    c[1], // percent_change_24h stays the same
  ]);

  // Assign clusters to original data
  const result = [...data];

  // Initialize all to null cluster
  result.forEach((item) => {
    item.cluster = null;
  });

  // Now correctly map from valid data back to original data using the stored indices
  clusters.forEach((clusterIndices, clusterNumber) => {
    clusterIndices.forEach((validIndex) => {
      const originalIndex = validDataWithIndices[validIndex].originalIndex;
      result[originalIndex].cluster = clusterNumber;
    });
  });

  // Store centroids in the result for visualization
  result.centroids = rawCentroids;

  return result;
};
