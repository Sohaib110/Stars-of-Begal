function checkExistingReward(providedEmail) {
    sessionStorage.setItem("userEmail", providedEmail);
  
    let projectName = "bengal"; // Unique project identifier
    let claimedEmail = localStorage.getItem(projectName + "_userEmail");
  
    if (claimedEmail === providedEmail) {
      addMessage("It looks like you've already claimed a reward previously!", "bot");
      addMessage("Thank you for visiting again!", "bot");
      return;
    }
  
    // Otherwise, move on to the review step
    askReviewPlatform();
  }
  
  function claimReward(providedEmail) {
    let projectName = "bengal"; // Unique project identifier
    let normalizedEmail = providedEmail.trim().toLowerCase(); // Normalize email
    let currentTime = Date.now(); // Current timestamp in milliseconds
    let thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  
    let claimedData = JSON.parse(localStorage.getItem(projectName + "_claimedData")) || {};
  
    if (claimedData[normalizedEmail]) {
      let lastClaimTime = claimedData[normalizedEmail];
  
      if (currentTime - lastClaimTime < thirtyDays) {
        let remainingDays = Math.ceil((thirtyDays - (currentTime - lastClaimTime)) / (1000 * 60 * 60 * 24));
        addMessage(`You have already claimed your reward. Try again in ${remainingDays} days.`, "bot");
        return;
      }
    }
  
    // Update claim time and allow claiming
    claimedData[normalizedEmail] = currentTime;
    localStorage.setItem(projectName + "_claimedData", JSON.stringify(claimedData));
  
    addMessage("Congratulations! You've claimed your reward!", "bot");
  }