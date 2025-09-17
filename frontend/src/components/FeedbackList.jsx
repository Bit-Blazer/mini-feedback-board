import { useState, useEffect } from "react";
import { api } from "../utils/api";

function FeedbackList({ refreshTrigger }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch messages from API
  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getMessages();
      setMessages(response.data.messages);
    } catch (err) {
      setError("Failed to load messages. Please try again.");
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchMessages();
  }, [refreshTrigger]);

  const handleVote = async (messageId, voteType) => {
    try {
      // Optimistically update UI
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                [voteType === "upvote" ? "upvotes" : "downvotes"]:
                  msg[voteType === "upvote" ? "upvotes" : "downvotes"] + 1,
              }
            : msg
        )
      );

      // Make API call
      await api.vote(messageId, voteType);

      // Show subtle success feedback
      const button = document.querySelector(
        `[data-vote="${messageId}-${voteType}"]`
      );
      if (button) {
        button.style.transform = "scale(1.1)";
        setTimeout(() => {
          button.style.transform = "scale(1)";
        }, 200);
      }

      // Refresh data to get accurate counts
      setTimeout(() => fetchMessages(), 500);
    } catch (err) {
      console.error("Error voting:", err);
      // Revert optimistic update on error
      fetchMessages();

      // Show error message
      const errorDiv = document.createElement("div");
      errorDiv.className =
        "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md z-50";
      errorDiv.textContent = "Failed to record vote. Please try again.";
      document.body.appendChild(errorDiv);

      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 3000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Community Feedback
        </h2>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-gray-600">Loading messages...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Community Feedback
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 font-medium">Error loading messages</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
          <button onClick={fetchMessages} className="mt-3 btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Community Feedback (0)
        </h2>
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No feedback yet
          </h3>
          <p className="text-gray-600">Be the first to share your thoughts!</p>
        </div>
      </div>
    );
  }

  // Messages list
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Community Feedback ({messages.length})
      </h2>

      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="bg-white rounded-lg shadow-md p-6">
            {/* Header with name, rating, and date */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                  {message.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {message.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(message.created_at)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg">{renderStars(message.rating)}</div>
                <p className="text-sm text-gray-500">{message.rating}/5</p>
              </div>
            </div>
            {/* Message content */}
            <p className="text-gray-700 mb-4">{message.message}</p>
            {/* Voting buttons */}
            <div className="flex items-center space-x-4">
              <button
                data-vote={`${message.id}-upvote`}
                onClick={() => handleVote(message.id, "upvote")}
                className="flex items-center space-x-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-md transition-all duration-200"
              >
                <span className="text-lg">👍</span>
                <span className="font-medium">{message.upvotes}</span>
              </button>

              <button
                data-vote={`${message.id}-downvote`}
                onClick={() => handleVote(message.id, "downvote")}
                className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
              >
                <span className="text-lg">👎</span>
                <span className="font-medium">{message.downvotes}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeedbackList;