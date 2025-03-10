function doPost(e) {
    try {
      var folderId = "1qY1iib6jV0ZWKJd33pbCvySnWFyfAKhq"; 
      var sheetId = "1IsuoPiFss24v-suaX-HY78m0C4HTXryjeXEdOQiK_aY";  
      getFolder();
      var folder = DriveApp.getFolderById(folderId);
      var sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
      
      // Access the first element of each parameter array
      var name = e.parameters.name[0];
      var email = e.parameters.email[0];
      var reward = e.parameters.reward[0];
      var filename = e.parameters.filename[0];
      
      // Get the current month and year
      var currentDate = new Date();
      var currentMonth = currentDate.getMonth() + 1; // Months are 0-indexed in JavaScript
      var currentYear = currentDate.getFullYear();
  
      // Read all existing data from the sheet
      var data = sheet.getDataRange().getValues();
      
      // Check if the user already has a reward in the current month
      var hasRewardThisMonth = data.some(function(row) {
        var rowEmail = row[2]; // Email is in the second column
        var rowDate = new Date(row[0]); // Timestamp is in the sixth column
        var rowMonth = rowDate.getMonth() + 1;
        var rowYear = rowDate.getFullYear();
        
        return rowEmail === email && rowMonth === currentMonth && rowYear === currentYear;
      });
  
      if (hasRewardThisMonth) {
        // If the user already has a reward this month, send a message
        return ContentService.createTextOutput(JSON.stringify({ 
          success: false, 
          error: "You have already received a reward this month and cannot receive another one." 
        })).setMimeType(ContentService.MimeType.JSON);
      }
  
      var blob = Utilities.newBlob(Utilities.base64Decode(e.parameters.image), e.parameters.mimeType, e.parameters.filename);
      var file = folder.createFile(blob);
      
      var fileUrl = file.getUrl();
      var timestamp = new Date();
  
      // Generate a unique voucher number immediately
      var voucherNumber = generateVoucherNumber();
  
      // Calculate the voucher expiry date (30 days from now)
      var expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
  
      // Append data to Google Sheet
      sheet.appendRow([timestamp, e.parameters.name[0], e.parameters.email[0], e.parameters.reward[0], fileUrl, voucherNumber, expiryDate, "Available"]);
      
      // Send an email to the user with their reward
      var subject = "Your Reward Details";
      var body = `
        Hello ${name},
  
        Thank you for participating! Here are your reward details:
  
        Reward: ${reward}
        
        Best regards,
        Your Team
      `;
  
      //MailApp.sendEmail(email, subject, body);
  
      // Store the email, reward, and voucher number in Script Properties for the delayed email
      var scriptProperties = PropertiesService.getScriptProperties();
      scriptProperties.setProperty(email, JSON.stringify({
        reward: reward,
        voucherNumber: voucherNumber,
        timestamp: timestamp.toISOString()
      }));
  
      return ContentService.createTextOutput(JSON.stringify({ success: true, fileUrl: fileUrl }))
                           .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  
  function getFolder() {
    try {
      var folderId = "1qY1iib6jV0ZWKJd33pbCvySnWFyfAKhq"; 
      var folder = DriveApp.getFolderById(folderId);
      Logger.log("Folder Name: " + folder.getName());
    } catch (e) {
      Logger.log("Error: " + e.toString());
    }
  }
  
  // Function to generate a unique voucher number
  function generateVoucherNumber() {
    var chars = "0123456789";
    var voucherNumber = "";
    for (var i = 0; i < 10; i++) { // 10-character voucher number
      voucherNumber += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return voucherNumber;
  }
  
  // Function to send the voucher email after 12 hours
  function sendVoucherEmail() {
  
    var scriptProperties = PropertiesService.getScriptProperties();
    var properties = scriptProperties.getProperties();
    Logger.log(properties)
    
    
    for (var email in properties) {
      var data = JSON.parse(properties[email]);
      var timestamp = new Date(data.timestamp);
      var now = new Date();
  
      // Check if 12 hours have passed since the record was added
      if (now - timestamp >= 60 * 60 * 12 * 1000) {
        var reward = data.reward;
        var voucherNumber = data.voucherNumber;
  
        // Send the voucher email
        var voucherSubject = "Your Reward and Voucher Details";
        var voucherBody = `
          Hello,
          
          Thank you for participating! Here are your reward and voucher details:
  
          Reward: ${reward}
          Voucher Number: ${voucherNumber}
  
          Best regards,
          Your Team
        `;
  
       // MailApp.sendEmail(email, voucherSubject, voucherBody);
  
        // Remove the email from Script Properties after sending the voucher email
        scriptProperties.deleteProperty(email);
      }
    }
  }
  
  function debugTest(){
    var now = new Date();
    Utilities.sleep(3000);
    var now2 = new Date();
    Logger.log(now - now2);
    
  }
  
  // Function to check for expired vouchers and update their status
  function checkExpiredVouchers() {
    var sheetId = "1IsuoPiFss24v-suaX-HY78m0C4HTXryjeXEdOQiK_aY";  // Change this
    var sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    var data = sheet.getDataRange().getValues();
  
    var now = new Date();
  
    // Start from row 2 to skip the header row
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var expiryDate = new Date(row[6]); // Expiry Date is in the 8th column
      var validityStatus = row[7]; // Validity Status is in the 9th column
  
      // Check if the voucher is expired and its status is still "Available"
      if (now > expiryDate && validityStatus === "Available") {
        // Update the status to "Expired"
        sheet.getRange(i + 1, 8).setValue("Expired");
      }
    }
  }
