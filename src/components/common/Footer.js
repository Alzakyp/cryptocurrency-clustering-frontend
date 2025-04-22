import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <div className="text-center">
          <p>&copy; {new Date().getFullYear()} Cryptocurrency Clustering. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;