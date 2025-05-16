import React from 'react';

const Footer: React.FC = () => {
  return (
    <div>
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        <div>
          <h1 className="text-3xl logo font-bold">EVOQUE</h1>
          <p className="w-full md:w-2/3 text-gray-600 text-justify">
            Welcome to our EVOQUE a luxury fashion store! We offer a wide range of products to meet all your needs. Stay
            connected with us for the latest updates and exclusive offers. Thank you for shopping with us!
          </p>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>Home</li>
            <li>About us</li>
            <li>Delivery</li>
            <li>Privacy policy</li>
          </ul>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>+20-1234567890</li>
            <li>support@evoque.com</li>
          </ul>
        </div>
      </div>

      <div>
        <hr />
        <p className="py-5 text-sm text-center">Copyright 2025@ EVOQUE - All Rights Reserved.</p>
      </div>
    </div>
  );
};

export default Footer;