export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Matcher
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your game is ready to play!
        </p>
        <a
          href="/experiences"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          View Experiences
        </a>
      </div>
    </div>
  );
} 