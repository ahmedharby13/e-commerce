import React from 'react';
import poster from '../assets/poster.jpg';

const Hero: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row border border-gray-400">
      <div className="w-full sm-w-1/2 flex items-center justify-center py-10 sm:py-0">
        <div className="text-[#414141]">
          <div className="flex items-center gap-2">
            <div className="w-8 md:w-11 h-[2px] bg-[#414141]"></div>
            <p className="font-medium text-sm md:text-base">OUR BESTSELLERS</p>
          </div>
          <h1 className="prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed">Latest Arrivals</h1>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm md:text-base">SHOP NOW</p>
            <div className="w-8 md:w-11 h-[1px] bg-[#414141]"></div>
          </div>
        </div>
      </div>
      <img className="w-full sm:w-1/2" src={poster} alt="" />
    </div>
  );
};

export default Hero;