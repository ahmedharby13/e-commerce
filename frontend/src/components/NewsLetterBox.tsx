import React from 'react';

const NewsLetterBox: React.FC = () => {
  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('News letter submitted');
  };

  return (
    <div className="text-center">
      <p className="text-2xl font-medium text-gray-800">Subscribe now & get 20% off</p>
      <p className="text-gray-400 mt-3">
        Join our newsletter to stay updated with the latest products, exclusive offers, and special discounts. Don't miss out on our exciting deals!
      </p>
      <form
        onSubmit={submitHandler}
        className="w-full sm:w-1/2 flex items-center gap-3 mx-auto my-6 border pl-3"
      >
        <input
          className="w-full sm:flex-1 outline-none"
          type="email"
          placeholder="Enter your email"
          required
        />
        <button className="text-xs px-10 py-4 bg-black text-white" type="submit">
          SUBSCRIBE
        </button>
      </form>
    </div>
  );
};

export default NewsLetterBox;