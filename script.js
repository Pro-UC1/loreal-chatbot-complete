// Simple chatbot with user context and user-only history
// This code is beginner-friendly and uses only browser JavaScript

// Store only user messages for history
let userHistory = [];
// Store conversation context (user name and past questions)
let userContext = {
  name: null,
  questions: [],
};

// Get DOM elements
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const chatHistoryDiv = document.getElementById("chatHistory");
const userInput = document.getElementById("userInput");

/* Set initial welcome message */
const welcomeMsg = document.createElement("div");
welcomeMsg.textContent =
  "👋 Hello! I’m your L’Oréal shopping assistant. Ask me about makeup, skincare, haircare, fragrances, or routines!";
welcomeMsg.className = "msg ai";
chatWindow.appendChild(welcomeMsg);

/* Replace with your deployed Cloudflare Worker URL */
const WORKER_URL = "https://holy-sound-7357.rneha2729.workers.dev";

/* Store the conversation history */
let messages = [
  {
    role: "system",
    content:
      "You are a shopping assistant for L’Oréal, a site that helps users find L’Oréal’s extensive range of products—makeup, skincare, haircare, and fragrances—as well as provide personalized routines and recommendations. You provide expert recommendations based on the user's needs, preferences, and budget, keeping responses clear, helpful, and friendly.",
  },
];

// Array to store chat history
let chatHistory = [];

/* Function to add a message to the chat window */
function addMessage(sender, text) {
  // Show in chat window
  const msgDiv = document.createElement("div");
  msgDiv.className = sender === "user" ? "user-msg" : "bot-msg";
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom

  // If the sender is the user, add to userHistory and context
  if (sender === "user") {
    userHistory.push(text);
    userContext.questions.push(text);
    updateHistory();
  }

  // Add to history
  chatHistory.push({ sender, text });
  updateHistory();
}

/* Function to display the latest user question above the bot's response */
function showLatestQuestion(question) {
  // Remove any previous latest-question display
  const old = document.getElementById("latestQuestion");
  if (old) {
    old.remove();
  }
  // Create a new element for the latest question
  const latestDiv = document.createElement("div");
  latestDiv.id = "latestQuestion";
  latestDiv.className = "latest-question";
  // Insert above the bot's response (at the end of chatWindow)
  chatWindow.appendChild(latestDiv);
}

/* Function to update the chat history display (only user messages) */
function updateHistory() {
  // Show all messages in chatHistory
  chatHistoryDiv.innerHTML = "<h3>Your Message History</h3>";
  userHistory.forEach((msg, idx) => {
    const p = document.createElement("p");
    p.textContent = `${idx + 1}. ${msg}`;
    chatHistoryDiv.appendChild(p);
  });
}

/* Function to simulate a bot reply using context */
function getBotReply(message) {
  // If we don't know the user's name, ask for it
  if (!userContext.name) {
    if (/my name is (\w+)/i.test(message)) {
      // Extract name from message
      const match = message.match(/my name is (\w+)/i);
      userContext.name = match[1];
      return `Nice to meet you, ${userContext.name}! How can I help you today?`;
    } else {
      return "Hi! What's your name?";
    }
  }

  // Example: Use context for a more natural reply
  if (/recommend/i.test(message)) {
    return `Sure, ${userContext.name}! Can you tell me your skin type or what you're looking for?`;
  }

  // If user says "history", show their past questions
  if (/history/i.test(message)) {
    if (userContext.questions.length > 1) {
      return `Here are your past questions: ${userContext.questions
        .slice(0, -1)
        .join("; ")}`;
    } else {
      return "You haven't asked any questions yet!";
    }
  }

  // Default reply
  return `Thanks for your message, ${userContext.name}! I'll get back to you soon.`;
}

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  // Add user's message to chat and history
  addMessage("user", message);
  messages.push({ role: "user", content: message });

  // Show the latest question above the bot's response
  showLatestQuestion(message);

  // Clear the input field
  userInput.value = "";

  // Show a loading message
  addMessage("ai", "Thinking...");

  try {
    // Send the full conversation history to the Cloudflare Worker
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await response.json();

    // Remove the loading message
    chatWindow.lastChild.remove();

    // Get the assistant's reply and add it to chat and history
    let aiReply;
    if (data.choices?.[0]?.message?.content) {
      aiReply = data.choices[0].message.content;
    } else if (data.error?.message) {
      aiReply = `Error: ${data.error.message}`;
    } else {
      aiReply = "Sorry, I couldn't get a response.";
    }
    addMessage("ai", aiReply);
    messages.push({ role: "assistant", content: aiReply });
  } catch (err) {
    // Remove the loading message and show an error
    chatWindow.lastChild.remove();
    addMessage("ai", "Sorry, there was an error connecting to the assistant.");
  }
});
