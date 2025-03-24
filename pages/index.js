// components/NavButtons.js

import Link from 'next/link';

const NavButtons = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#eeece2]">
      <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
        Attendance App
      </h2>

      <Link href="/register">
        <button className="w-full sm:w-64 bg-[#c05f3c] hover:bg-[#a14d34] text-white font-extrabold py-3 rounded-lg shadow-md transform transition-all duration-200 ease-in-out hover:scale-105 mb-4">
          Register Student
        </button>
      </Link>

      <Link href="/infer">
        <button className="w-full sm:w-64 bg-[#c05f3c] hover:bg-[#a14d34] text-white font-extrabold py-3 rounded-lg shadow-md transform transition-all duration-200 ease-in-out hover:scale-105 mb-4">
          Take Attendance
        </button>
      </Link>

      <Link href="/dashboard">
        <button className="w-full sm:w-64 bg-[#c05f3c] hover:bg-[#a14d34] text-white font-extrabold py-3 rounded-lg shadow-md transform transition-all duration-200 ease-in-out hover:scale-105 mb-4">
          Dashboard
        </button>
      </Link>

      <Link href="/evals">
        <button className="w-full sm:w-64 bg-[#c05f3c] hover:bg-[#a14d34] text-white font-extrabold py-3 rounded-lg shadow-md transform transition-all duration-200 ease-in-out hover:scale-105 mb-4">
          Evals
        </button>
      </Link>
    </div>
  );
};

export default NavButtons;
