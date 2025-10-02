const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dgbxypivn",
  api_key: "413778576816479", // Get from dashboard
  api_secret: "YJZUtSY7DmLekfFMBNs2ih02y8I", // Get from dashboard
});

// Original config structure with filenames
const originalConfig = {
  adventure: {
    videos: {
      heroVideo:
        "https://res.cloudinary.com/dgbxypivn/video/upload/v1758704847/fture_life_hero_video_web_244fps_and_720p_wmmcf6.mp4",
      heroVideoMobile:
        "https://res.cloudinary.com/dgbxypivn/video/upload/v1758705234/mobile_version_720p_24_fps_qv4lbc.mp4",
    },
    images: {
      homeImage: "home1.png",
      mainImage: "sunset2.png",
      fallbackImage: "Future life img.png",
      sunsetImage: "sunset1.jpg",
      storyImages: [
        "adventure1.png",
        "adventure2.png",
        "adventure3.png",
        "adventure4.png",
        "adventure5.png",
        "adventure6.png",
        "adventure7.png",
        "adventure8.png",
        "adventure9.png",
      ],
      galleryImages: [
        "1.png",
        "2.jpeg",
        "3.png",
        "5.jpeg",
        "6.jpeg",
        "10.jpeg",
        "11.png",
        "12.jpeg",
      ],
      blogImages: [
        "blog1.jpeg",
        "blog5.jpeg",
        "blog6.jpeg",
        "blog3.jpeg",
        "blog4.jpeg",
        "blog2.jpeg",
      ],
      packageImages: {
        package1: "1.png",
        package2: "two.png",
        package3: "4.jpeg",
      },
    },
  },
  nuanu: {
    images: {
      frame1: "Frame1.png",
      frameSmall: "Framesmall.png",
      frame3: "Frame3.png",
      frame4: "Frame4.png",
      frame5: "Frame5.png",
      frame7: "Frame7.png",
      frame8: "Frame 8.png",
      frame9: "Frame 9.png",
      frame10: "Frame 10.png",
    },
  },
};

async function getCloudinaryUrl(filename) {
  try {
    // Search for the resource by filename
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "", // Search all folders
      max_results: 500,
    });

    // Find matching resource
    const resource = result.resources.find((r) => {
      const resourceFilename = r.public_id.split("/").pop();
      const cleanFilename = filename.replace(/\.[^/.]+$/, ""); // Remove extension
      return (
        resourceFilename === cleanFilename ||
        resourceFilename === filename ||
        r.public_id.includes(cleanFilename)
      );
    });

    if (resource) {
      return resource.secure_url;
    } else {
      console.warn(`Warning: Could not find Cloudinary URL for ${filename}`);
      return filename; // Keep original if not found
    }
  } catch (error) {
    console.error(`Error fetching URL for ${filename}:`, error.message);
    return filename;
  }
}

async function replaceWithCloudinaryUrls(obj) {
  if (Array.isArray(obj)) {
    return Promise.all(obj.map((item) => replaceWithCloudinaryUrls(item)));
  } else if (typeof obj === "object" && obj !== null) {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = await replaceWithCloudinaryUrls(value);
    }
    return newObj;
  } else if (typeof obj === "string" && !obj.startsWith("http")) {
    // It's a filename, get Cloudinary URL
    return await getCloudinaryUrl(obj);
  }
  return obj;
}

async function generateConfig() {
  console.log("Fetching Cloudinary URLs for all images...\n");

  const newConfig = await replaceWithCloudinaryUrls(originalConfig);

  // Save to file
  fs.writeFileSync(
    "mediaConfig-cloudinary.json",
    JSON.stringify(newConfig, null, 2)
  );

  console.log("\n✓ Config generated: mediaConfig-cloudinary.json");
  console.log("\nNext steps:");
  console.log("1. Copy this file to backend/config/mediaConfig.json");
  console.log("2. Copy this file to frontend/src/config/mediaConfig.json");
  console.log("3. Deploy both backend and frontend");
}

generateConfig().catch(console.error);
