const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

// Text config file path - same location as mediaConfig.json
const TEXT_CONFIG_PATH = path.join(__dirname, "../config/textConfig.json");

// Get current text config
router.get("/config", async (req, res) => {
  try {
    const configData = await fs.readFile(TEXT_CONFIG_PATH, "utf8");
    res.json({
      success: true,
      config: JSON.parse(configData),
    });
  } catch (error) {
    console.error("Error reading text config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to read text config file: " + error.message,
    });
  }
});

// Update text config
router.post("/update-config", async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        message: "Config data is required",
      });
    }

    // Write to text config file
    await fs.writeFile(
      TEXT_CONFIG_PATH,
      JSON.stringify(config, null, 2),
      "utf8"
    );

    console.log("Text config file updated successfully");

    res.json({
      success: true,
      message: "Text config updated successfully!",
    });
  } catch (error) {
    console.error("Error updating text config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update text config: " + error.message,
    });
  }
});

// Download text config endpoint
router.get("/download-config", async (req, res) => {
  try {
    const configData = await fs.readFile(TEXT_CONFIG_PATH, "utf8");
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=textConfig.json"
    );
    res.send(configData);
  } catch (error) {
    console.error("Error downloading text config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download text config",
    });
  }
});

module.exports = router;
