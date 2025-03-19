// scripts.js

var screenshot = null;
var name = null;
var email = null;
var reward = null;

document.addEventListener("DOMContentLoaded", function () {
  let startButton = document.getElementById("start-button");
  if (startButton) {
    startButton.addEventListener("click", startChat);
  }

  // If there's a saved chat state in localStorage, restore it
  if (localStorage.getItem("chatState")) {
    restoreChat();
  }
});

let chatStarted = false;
let chatHistory = [];

/**
 * Saves the current chat state to localStorage so
 * refreshing won't lose our conversation.
 */
function saveChatState() {
  localStorage.setItem("chatState", JSON.stringify(chatHistory));
}

/**
 * Restores chat state from localStorage, if it exists
 */
function restoreChat() {
  let savedChat = localStorage.getItem("chatState");
  if (savedChat) {
    chatHistory = JSON.parse(savedChat);
    chatHistory.forEach((entry) => {
      addMessage(entry.text, "bot");
      if (entry.options.length > 0) {
        addButton(entry.options, entry.callback);
      }
    });
  }
}

document.getElementById("chat-header").style.display = "block";
/**
 * Main entry point when user clicks "Start"
 * 1) Hide the start button
 * 2) Show the chat header and chat box
 * 3) Ask for the user's Name
 */
function startChat() {
  if (chatStarted) return;
  chatStarted = true;

  document.getElementById("start-button").style.display = "none";
  document.getElementById("chat-header").style.display = "block";
  document.getElementById("chat-box").style.display = "block";

  askQuestion("Please enter your Full Name:", [], askForEmail, "name");
}

/**
 * Generic function to display a bot message, possibly with multiple-choice
 * options or a typed input. When done, it calls 'callback'.
 */
function askQuestion(text, options = [], callback = null, type = "text") {
  addMessage(text, "bot");
  chatHistory.push({ text, options, callback });
  saveChatState();

  if (options.length > 0) {
    // If we have multiple choice buttons
    addButton(options, callback);
  } else {
    // If we want typed input
    enableUserInput(callback, type);
  }

  showGoBackButton();
}

/**
 * Displays the text input and send button to capture open-ended user input.
 * 'type' can be "name" or "email" to store those in global variables.
 */
function enableUserInput(nextStep, type = "text") {
  let userInput = document.getElementById("user-input");
  let sendButton = document.getElementById("send-button");

  userInput.style.display = "block";
  sendButton.style.display = "block";
  userInput.focus();

  sendButton.onclick = function () {
    let inputText = userInput.value.trim();

    if (inputText) {
      // Email validation
      if (type === "email" && !validateEmail(inputText)) {
        addMessage(
          "❌ Invalid email address. Please enter a valid email.",
          "bot"
        );
        return;
      }

      if (type === "name") {
        name = inputText;
      } else if (type === "email") {
        email = inputText;
      }

      addMessage("✅ You: " + inputText, "user");
      userInput.value = "";
      userInput.style.display = "none";
      sendButton.style.display = "none";

      if (nextStep) nextStep(inputText);
    }
  };
}

// Function to validate email format
function validateEmail(email) {
  let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Renders a single message bubble (bot or user)
 */
function addMessage(text, sender) {
  let chatBox = document.getElementById("chat-box");
  let msg = document.createElement("div");
  msg.classList.add(
    "chat-message",
    sender === "user" ? "user-message" : "bot-message"
  );
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  saveChatState();
}

/**
 * Renders multiple-choice buttons (if the question is not typed input)
 */
function addButton(options, callback) {
  let chatBox = document.getElementById("chat-box");
  let buttonContainer = document.createElement("div");
  buttonContainer.classList.add("button-container");

  options.forEach((option) => {
    let button = document.createElement("button");
    button.textContent = option.text;
    button.classList.add("chat-button");
    button.onclick = function () {
      addMessage("You: " + option.text, "user");
      buttonContainer.remove();
      if (callback) callback(option.value);
    };
    buttonContainer.appendChild(button);
  });

  chatBox.appendChild(buttonContainer);
  chatBox.scrollTop = chatBox.scrollHeight;
  saveChatState();
}

/**
 * Shows a "Go Back" button so the user can revert the last step if desired
 */
function showGoBackButton() {
  let chatBox = document.getElementById("chat-box");
  let existingBackButton = document.getElementById("go-back-button");
  if (existingBackButton) existingBackButton.remove();

  // Only show "Go Back" if there's more than one step in chatHistory
  if (chatHistory.length > 1) {
    let backButton = document.createElement("button");
    backButton.textContent = "Go Back";
    backButton.id = "go-back-button";
    backButton.classList.add("chat-button");

    backButton.onclick = function () {
      goBack();
    };

    // Add a slight delay so the new message appears first
    setTimeout(() => {
      chatBox.appendChild(backButton);
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 500);
  }
}

/**
 * Reverts the conversation to the previous step
 */
function goBack() {
  if (chatHistory.length > 1) {
    chatHistory.pop(); // Remove current question
    let lastStep = chatHistory.pop(); // Get the previous question
    document.getElementById("chat-box").innerHTML = ""; // Clear the chat box

    // Rebuild the chat up to the now-latest step
    chatHistory.forEach((entry) => {
      addMessage(entry.text, "bot");
      if (entry.options.length > 0) {
        addButton(entry.options, entry.callback);
      }
    });

    // Re-ask the last question
    if (lastStep.options.length > 0) {
      askQuestion(lastStep.text, lastStep.options, lastStep.callback);
    } else {
      askQuestion(lastStep.text, [], lastStep.callback);
    }
  }
  saveChatState();
}

/**
 * After capturing user's name, we ask for the email
 */
function askForEmail(providedName) {
  localStorage.setItem("userName", providedName);
  askQuestion(
    "Please enter your Email Address:",
    [],
    checkExistingReward,
    "email"
  );
}

/**
 * Once we have name & email, check if user already claimed a reward
 * If yes, skip the review flow. If no, proceed to ask "Google or Facebook".
 */

function checkExistingReward(providedEmail) {
  let projectName = "bengal";
  let normalizedEmail = providedEmail.trim().toLowerCase();

  // Store the email in localStorage for later use
  localStorage.setItem("userEmail", normalizedEmail);

  // Clear corrupted data if exists
  if (typeof localStorage.getItem(projectName + "_claimedData") === "object") {
    localStorage.removeItem(projectName + "_claimedData");
  }

  // Safe JSON parsing
  let claimedData = {};
  try {
    claimedData = JSON.parse(
      localStorage.getItem(projectName + "_claimedData") || "{}"
    );
  } catch (e) {
    console.error("Error parsing claim data:", e);
    localStorage.removeItem(projectName + "_claimedData");
    claimedData = {};
  }

  // Check if this email has claimed a reward within the last 30 days
  if (claimedData[normalizedEmail]) {
    let lastClaimTime = claimedData[normalizedEmail];
    let currentTime = Date.now();
    let thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    if (currentTime - lastClaimTime < thirtyDays) {
      // Calculate remaining days
      let remainingDays = Math.ceil(
        (thirtyDays - (currentTime - lastClaimTime)) / (1000 * 60 * 60 * 24)
      );

      // Show message about waiting and stop the flow
      addMessage(
       "You have already claimed a reward. Please check your previous email from us to see when you're eligible to play again",
        "bot"
      );

      // Hide input elements
      document.getElementById("user-input").style.display = "none";
      document.getElementById("send-button").style.display = "none";

      return; // Stop the flow here
    }
  }

  // If valid (either never claimed or claimed more than 30 days ago), proceed to review platform selection
  askReviewPlatform();
}
function claimReward() {
  let projectName = "bengal";
  let normalizedEmail = localStorage.getItem("userEmail").trim().toLowerCase();
  let currentTime = Date.now();

  // Get existing data or create empty object
  let claimedData = {};
  try {
    claimedData = JSON.parse(
      localStorage.getItem(projectName + "_claimedData") || "{}"
    );
  } catch (e) {
    console.error("Error parsing claim data:", e);
    claimedData = {};
  }

  // Update claim time with current timestamp
  claimedData[normalizedEmail] = currentTime;

  // Save back to localStorage
  localStorage.setItem(
    projectName + "_claimedData",
    JSON.stringify(claimedData)
  );

  // Continue with reward process
  addMessage("🎉 Congratulations!  Remember to check your  email/spam within the next 12 hours.", "bot");
}
function askReviewPlatform() {
  // Logic to ask for a review
  // Once the review is completed, call claimReward
  let providedEmail = localStorage.getItem("userEmail");
  claimReward(providedEmail);
}

// Function to store the reward for "Bengal"
function storeReward(reward) {
  let projectName = "bengal"; // Ensure this matches checkExistingReward
  localStorage.setItem(projectName + "_email", providedEmail);
}

/**
 * Ask user which platform they'd like to leave the review on
 */
function askReviewPlatform() {
  askQuestion(
    "Where would you like to leave your review? (Please take a screenshot after submitting!)",
    [
      { text: "Google", value: "google" },
      { text: "Facebook", value: "facebook" },
    ],
    handleReviewPlatform
  );
}

/**
 * Open the chosen platform in a new tab, then prompt user to upload screenshot
 */
function handleReviewPlatform(platform) {
  localStorage.setItem("reviewPlatform", platform);
  saveChatState();

  if (platform === "google") {
    window.open(
      "https://www.google.com/search?si=APYL9btvhO6SAb8jF9HqTZMMa7vs_teLnZaEVrJZwRKFIIKjoaEhpZkUFr0_P4pC4F-mTiYBKe4jjozDkkUB6ms5hjfd09U2BU7prC1rYZS7wdJy8Hm_fBw_7xP3fZaad-pm4wcFlLgh&hl=en-GB&q=star+of+bengal+reviews&shndl=30&shem=lcuae&source=sh/x/loc/osrp/m5/4&kgs=ee4f2837c8c9e522",
      "_blank"
    );
  } else if (platform === "facebook") {
    window.open(
      "https://www.facebook.com/thestarofbengalbangor/reviews",
      "_blank"
    );
  }

  // Wait a few seconds, then ask user to upload screenshot
  setTimeout(() => askForScreenshot(), 3000);
}

/**
 * Prompt user to upload the screenshot of their review
 */
function askForScreenshot() {
  askQuestion("Once you've left your review, upload a screenshot here.");
  addFileUploadOption();
}

/**
 * Renders a file input for uploading screenshot
 */
function addFileUploadOption() {
  let chatBox = document.getElementById("chat-box");
  let uploadContainer = document.createElement("div");
  uploadContainer.classList.add("upload-container");

  let fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.classList.add("file-input");

  fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      screenshot = file;
      addMessage("You uploaded: " + file.name, "user");

      uploadContainer.remove();
      setTimeout(() => {
        // Show a button to trigger the spinning wheel
        showSpinnerButton();
      }, 1000);
    }
  });

  uploadContainer.appendChild(fileInput);
  chatBox.appendChild(uploadContainer);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Hide the normal text input & send button
  document.getElementById("user-input").style.display = "none";
  document.getElementById("send-button").style.display = "none";

  saveChatState();
}

/**
 * Display a "Spin the Wheel!" button after user uploads a screenshot
 */
function showSpinnerButton() {
  addMessage("Awesome! Ready to spin for your reward?", "bot");

  let chatBox = document.getElementById("chat-box");
  let spinButton = document.createElement("button");
  spinButton.textContent = "Spin the Wheel!";
  spinButton.classList.add("chat-button");
  spinButton.onclick = function () {
    spinButton.remove();
    showSpinningAnimation(); // Our custom spinning wheel
  };

  chatBox.appendChild(spinButton);
  chatBox.scrollTop = chatBox.scrollHeight;
  saveChatState();
}

/**
 * Show the spinning wheel for 2 seconds, then giveReward()
 */
function showSpinningAnimation() {
  let chatBox = document.getElementById("chat-box");

  // Create a container for the wheel
  let wheelContainer = document.createElement("div");
  wheelContainer.classList.add("wheel-container");

  // Create the wheel itself
  let wheel = document.createElement("div");
  wheel.classList.add("wheel"); // We'll define .wheel in CSS with a spin animation

  // Add the wheel to the container, and container to chat
  wheelContainer.appendChild(wheel);
  chatBox.appendChild(wheelContainer);
  chatBox.scrollTop = chatBox.scrollHeight;

  // After 2 seconds, reveal reward
  setTimeout(() => {
    giveReward(wheelContainer, wheel);
  }, 2000);
}

/**
 * Stop the wheel animation, pick a random reward, show it in bold above the wheel,
 * and show "We've emailed your voucher..." below the wheel.
 */
function giveReward(wheelContainer, wheel) {
  // Stop the spin by removing the spin animation
  wheel.style.animation = "none";

  // Randomly pick a reward
  let rewards = ["Saag Alo or Veg Curry or Saag Bhaji", "Naan Bread", "Onion Bhaji", "Chicken or Veg Pakora"];
  let chosenReward = rewards[Math.floor(Math.random() * rewards.length)];
  reward = chosenReward;

  // Display bold reward message above the wheel
  let rewardMessage = document.createElement("div");
  rewardMessage.classList.add("reward-message");
  rewardMessage.innerHTML = `<strong>CONGRATULATIONS!</strong> You have won <strong>${chosenReward}</strong>!`;
  wheelContainer.insertBefore(rewardMessage, wheel);

  // Display the “voucher emailed” message below the wheel
  let voucherMsg = document.createElement("div");
  voucherMsg.classList.add("voucher-message");
  voucherMsg.textContent =
    "Your review will be validated, and your voucher will be emailed to you within 12 hours.";
  wheelContainer.appendChild(voucherMsg);

  // Save to localStorage so user doesn't get multiple rewards
  localStorage.setItem("userReward", chosenReward);

  // -- Example of sending data to your Google Apps Script or server --
  if (screenshot) {
    const file = screenshot;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async function () {
      const base64String = reader.result.split(",")[1]; // remove "data:image/..."

      const formData = new URLSearchParams();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("reward", reward);
      formData.append("image", base64String);
      formData.append("filename", file.name);
      formData.append("mimeType", file.type);

      try {
        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbx90HpeJZ7fdyh0v0S37tS3R9GB7jvwDm6dt-vtwr9SN2X_RBrjx9HI8aCxx4SUsN2w/exec",
          { method: "POST", body: formData }
        );

        const result = await response.json();
        if (!result.success) {
          console.error(result.error);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
  }
  claimReward(email);
  // Done updating the chat
  saveChatState();
}
