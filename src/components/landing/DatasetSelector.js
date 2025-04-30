import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';

const DatasetSelector = ({ datasets, selectedDataset, onSelectDataset }) => {
  return (
    <div className="dataset-selector mb-4">
      <h5 className="mb-3">Select Dataset for Analysis:</h5>
      <ButtonGroup>
        {datasets.map(dataset => (
          <Button 
            key={dataset.id}
            variant={selectedDataset === dataset.id ? "primary" : "outline-primary"}
            onClick={() => onSelectDataset(dataset.id)}
          >
            {dataset.filename}
            <span className="ms-2 badge bg-light text-dark">
              {dataset.crypto_count} cryptos
            </span>
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
};

export default DatasetSelector;