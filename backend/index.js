// Import required packages
const express = require("express");
const cors = require("cors");

// Create Express application
const app = express();
require("dotenv").config();

// Set port (use environment variable or default to 3001)
const PORT = process.env.PORT || 3001;
const supabase = require("./config/database");
// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
// Input validation helper
const validateMessageInput = (data) => {
  const errors = [];

  // Check required fields
  if (!data.name || data.name.trim() === "") {
    errors.push("Name is required");
  }

  if (!data.message || data.message.trim() === "") {
    errors.push("Message is required");
  }

  // Validate data types and ranges
  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    errors.push("Rating must be between 1 and 5");
  }

  // Validate string lengths
  if (data.name && data.name.length > 100) {
    errors.push("Name must be less than 100 characters");
  }

  if (data.message && data.message.length > 1000) {
    errors.push("Message must be less than 1000 characters");
  }

  return errors;
};
// POST - Create new message
app.post("/api/messages", async (req, res) => {
  try {
    // Extract data from request body
    const { name, message, rating = 5 } = req.body;

    // Validate input data
    const validationErrors = validateMessageInput({ name, message, rating });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        status: "error",
        errors: validationErrors,
      });
    }

    // Prepare data for database insertion
    const newMessage = {
      name: name.trim(),
      message: message.trim(),
      rating: parseInt(rating),
      upvotes: 0,
      downvotes: 0,
    };

    // Insert into database
    const { data, error } = await supabase
      .from("messages")
      .insert([newMessage])
      .select(); // Return the inserted data

    // Handle database errors
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        message: "Failed to create message",
        status: "error",
        error: error.message,
      });
    }

    // Return successful response
    res.status(201).json({
      message: "Message created successfully",
      status: "success",
      data: {
        message: data[0], // Return the created message
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      message: "Internal server error",
      status: "error",
      error: error.message,
    });
  }
});

// Vote validation helper
const validateVoteInput = (data) => {
  const errors = [];

  // Check required fields
  if (!data.messageId) {
    errors.push("Message ID is required");
  }

  if (!data.voteType) {
    errors.push("Vote type is required");
  }

  // Validate vote type
  if (data.voteType && !["upvote", "downvote"].includes(data.voteType)) {
    errors.push('Vote type must be either "upvote" or "downvote"');
  }

  return errors;
};

// POST - Vote on a message
app.post("/api/vote", async (req, res) => {
  try {
    // Extract data from request body
    const { messageId, voteType } = req.body;

    // Validate input data
    const validationErrors = validateVoteInput({ messageId, voteType });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        status: "error",
        errors: validationErrors,
      });
    }

    // First, get the current message to check if it exists
    const { data: currentMessage, error: fetchError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single(); // Get single record

    if (fetchError || !currentMessage) {
      return res.status(404).json({
        message: "Message not found",
        status: "error",
        error: "No message found with the provided ID",
      });
    }

    // Prepare the update based on vote type
    let updateData = {};
    if (voteType === "upvote") {
      updateData.upvotes = currentMessage.upvotes + 1;
    } else {
      updateData.downvotes = currentMessage.downvotes + 1;
    }

      // Update the message in database
      const { data, error } = await supabase
        .from("messages")
        .update(updateData)
        .eq("id", messageId)
        .select(); // Return updated data

      // Handle database errors
      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({
          message: "Failed to update vote",
          status: "error",
          error: error.message,
        });
      }

      // Return successful response
      res.json({
        message: `${voteType} recorded successfully`,
        status: "success",
        data: {
          message: data[0], // Return updated message
          voteType: voteType,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({
        message: "Internal server error",
        status: "error",
        error: error.message,
      });
    }
});
// GET all messages
app.get("/api/messages", async (req, res) => {
  try {
    // Fetch all messages from database, ordered by creation date (newest first)
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    // Handle database errors
    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        message: "Failed to fetch messages",
        status: "error",
        error: error.message,
      });
    }

    // Return successful response with messages
    res.json({
      message: "Messages retrieved successfully",
      status: "success",
      data: {
        messages: data,
        count: data.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      message: "Internal server error",
      status: "error",
      error: error.message,
    });
  }
});

// Basic route to test server is working
app.get("/", (req, res) => {
  res.json({
    message: "Mini Feedback Board API is running!",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.get("/api/hello", (req, res) => {
  res.json({
    message: "Hello from the Mini Feedback Board API!",
    status: "success",
    data: {
      version: "1.0.0",
      endpoints: [
        "GET /api/hello",
        "GET /api/messages (coming soon)",
        "POST /api/messages (coming soon)",
        "POST /api/vote (coming soon)"
      ],
    },
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints available at http://localhost:${PORT}/api/hello`);
});