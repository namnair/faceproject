import { useEffect, useState } from "react";
import { entries, clear } from "idb-keyval";

const ClearPage = () => {
  const [data, setData] = useState([]);

  // Function to fetch all entries from IndexedDB
  const fetchData = async () => {
    const allEntries = await entries(); // Fetch all key-value pairs
    setData(allEntries); // Update state with the entries
  };

  // Function to clear all data in IndexedDB
  const handleClearData = async () => {
    await clear(); // Clear all data from IndexedDB
    fetchData(); // Refresh the displayed data
  };

  useEffect(() => {
    fetchData(); // Load data when the page is first rendered
  }, []);

  return (
    <div className="min-h-screen bg-[#eeece2] flex flex-col justify-center items-center p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-3xl font-semibold text-center text-[#c05f3c] mb-6">
          Clear IndexedDB Data
        </h1>
        <div className="mb-6">
          <h2 className="text-2xl font-medium text-gray-700 mb-2">
            Stored Data:
          </h2>
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleClearData}
            className="px-6 py-3 bg-[#c05f3c] text-white rounded-lg text-lg font-semibold transition-transform duration-200 hover:scale-105"
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearPage;
