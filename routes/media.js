const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

// Config file now lives in backend
const CONFIG_FILE_PATH = path.join(__dirname, "../config/mediaConfig.json");

// Get current media config
router.get("/config", async (req, res) => {
  try {
    const configData = await fs.readFile(CONFIG_FILE_PATH, "utf8");
    res.json({
      success: true,
      config: JSON.parse(configData),
    });
  } catch (error) {
    console.error("Error reading config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to read config file: " + error.message,
    });
  }
});

// Update media config (no git operations on Railway)
router.post("/update-config", async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        message: "Config data is required",
      });
    }

    // Write to config file
    await fs.writeFile(
      CONFIG_FILE_PATH,
      JSON.stringify(config, null, 2),
      "utf8"
    );

    console.log("Config file updated successfully");

    res.json({
      success: true,
      message: "Config updated! Download it and update your frontend.",
    });
  } catch (error) {
    console.error("Error updating config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update config: " + error.message,
    });
  }
});

// Download config endpoint
router.get("/download-config", async (req, res) => {
  try {
    const configData = await fs.readFile(CONFIG_FILE_PATH, "utf8");
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=mediaConfig.json"
    );
    res.send(configData);
  } catch (error) {
    console.error("Error downloading config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download config",
    });
  }
});

module.exports = router;
