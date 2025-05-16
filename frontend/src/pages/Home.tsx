import React from 'react';
import Hero from '../components/Hero';
import LatesCollection from '../components/LatesCollection';
import BestSeller from '../components/BestSeller';
import OurPolicies from '../components/OurPolicies';
import NewsLetterBox from '../components/NewsLetterBox';

const Home: React.FC = () => {
  return (
    <div>
      <Hero />
      <LatesCollection />
      <BestSeller />
      <OurPolicies />
      <NewsLetterBox />
    </div>
  );
};

export default Home;