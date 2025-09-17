// API base URL - your backend server
const API_BASE_URL = "https://mini-feedback-board-apgm.vercel.app/api";

// Utility function to handle API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "An error occurred");
    }

    return data;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// API functions
export const api = {
  // Get all messages
  getMessages: async () => {
    return apiRequest("/messages");
  },

  // Create a new message
  createMessage: async (messageData) => {
    return apiRequest("/messages", {
      method: "POST",
      body: JSON.stringify(messageData),
    });
  },

  // Vote on a message
  vote: async (messageId, voteType) => {
    return apiRequest("/vote", {
      method: "POST",
      body: JSON.stringify({ messageId, voteType }),
    });
  },
};
