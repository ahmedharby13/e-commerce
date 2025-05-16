import React from 'react';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import NewsLetterBox from '../components/NewsLetterBox';

const About: React.FC = () => {
  return (
    <div>
      <div className="text-2xl text-center pt-8 border-t">
        <Title text1={'ABOUT'} text2={'US'} />
      </div>

      <div className="my-10 flex flex-col md:flex-row gap-16">
        <img className="w-full md:max-w-[450px]" src={assets.about_img} alt="" />
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-gray-600 text-justify">
          <p>
            Welcome to our e-commerce platform, where we bring you the best products from around the world. Our mission is
            to provide you with an exceptional shopping experience, offering high-quality products at competitive prices.
          </p>
          <p>
            We believe in the power of choice and convenience. Our platform is designed to make your shopping experience
            seamless and enjoyable, with a wide range of products to choose from and an easy-to-use interface.
          </p>
          <b className="text-gray-800">Our Mission</b>
          <p>
            Our mission is to revolutionize the way you shop online. We are committed to providing you with the best
            products, exceptional customer service, and a hassle-free shopping experience. We strive to exceed your
            expectations and make your shopping journey memorable.
          </p>
        </div>
      </div>

      <div className="text-xl py-4">
        <Title text1={'WHY'} text2={'CHOOSE US'} />
      </div>

      <div className="flex flex-col md:flex-row text-sm mb-20">
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Quality Assurance:</b>
          <p className="text-gray-600">
            We meticulously select and vet each product to ensure it meets our stringent quality standards. Your
            satisfaction is our top priority.
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Convenience:</b>
          <p className="text-gray-600">
            With our user-friendly interface and hassle-free ordering process, shopping has never been easier. Enjoy a
            seamless shopping experience from the comfort of your home.
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Exceptional Customer Service:</b>
          <p className="text-gray-600">
            Our team of dedicated professionals is here to assist you every step of the way. We are committed to ensuring
            your satisfaction and providing you with the best customer service.
          </p>
        </div>
      </div>

      <NewsLetterBox />
    </div>
  );
};

export default About;