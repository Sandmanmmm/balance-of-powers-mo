function MinimalApp() {
  return (
    <div className="min-h-screen bg-white text-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-blue-600">
          Balance of Powers - Working Version! 🎮
        </h1>
        <div className="space-y-4">
          <p className="text-lg text-gray-700">
            ✅ React is rendering properly
          </p>
          <p className="text-lg text-gray-700">
            ✅ Tailwind CSS is working with basic colors
          </p>
          <p className="text-lg text-gray-700">
            ✅ The development server is running successfully
          </p>
        </div>
        
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            Ready to load the full game!
          </h2>
          <p className="text-blue-700 mb-4">
            The core infrastructure is working. We can now gradually add back the game components.
          </p>
          <button 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => alert('Ready to restore the full app!')}
          >
            Restore Full Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default MinimalApp;
