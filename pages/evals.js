import { useState } from "react";

// Function to render objects/arrays as formatted text
const formatValue = (value) => {
  if (typeof value === "object") {
    // If it's an array, display each element in a list-like format
    if (Array.isArray(value)) {
      return (
        <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>
      );
    }
    // If it's an object, recursively render it
    return (
      <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>
    );
  }
  // If it's a number, round it to 4 decimal places
  if (typeof value === "number") {
    return value.toFixed(4);
  }
  return value;
};

export default function Evals() {
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const evaluateModel = async () => {
    setLoading(true);
    setError(null);
    setEvaluation(null);

    try {
      const response = await fetch("https://localhost/evals");
      const data = await response.json();

      if (response.ok) {
        setEvaluation(data);
      } else {
        setError(data.error || "Evaluation failed.");
      }
    } catch (err) {
      setError("Server unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#eeece2] p-6">
      <h1 className="text-3xl font-extrabold mb-6">Model Evaluation</h1>

      <button
        onClick={evaluateModel}
        className="bg-[#c05f3c] hover:bg-[#a14d34] text-white font-extrabold px-6 py-2 rounded-lg shadow-md transition"
        disabled={loading}
      >
        {loading ? "Evaluating..." : "Run Evaluation"}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {evaluation && (
        <div className="bg-[#eeece2] shadow-md rounded-lg p-6 mt-6 w-full max-w-md">
          <h2 className="text-xl font-extrabold mb-4">Evaluation Results</h2>
          {/* Dynamically render all keys in the evaluation object */}
          {Object.keys(evaluation).map((key) => (
            <div key={key} className="mb-2">
              <strong className="">{key.replace(/_/g, " ").toUpperCase()}:</strong>{" "}
              {formatValue(evaluation[key])}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
