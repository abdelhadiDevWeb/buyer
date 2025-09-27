/**
 * Image Replacement Script
 * 
 * This script helps download real images from Unsplash and Pexels to replace placeholder images.
 * 
 * Instructions:
 * 1. Run this script with Node.js
 * 2. It will download images to the appropriate directories
 * 3. Images will maintain the same filenames for seamless replacement
 */

import fs from 'fs';
import path from 'path';
import https from 'https';


// const writeFileAsync = promisify(fs.writeFile);
// const mkdirAsync = promisify(fs.mkdir);

// Image categories and their corresponding Unsplash/Pexels collections
const imageCategories = {
  auction: 'https://api.unsplash.com/photos/random?query=auction+items&count=20',
  category: 'https://api.unsplash.com/photos/random?query=categories&count=10',
  banner: 'https://api.unsplash.com/photos/random?query=auction+banner&count=5',
  blog: 'https://api.unsplash.com/photos/random?query=blog&count=10',
  store: 'https://api.unsplash.com/photos/random?query=store&count=10',
  profile: 'https://api.unsplash.com/photos/random?query=profile&count=20',
};

// Directories to replace images
const directories = [
  'public/assets/img/home1',
  'public/assets/img/home2',
  'public/assets/img/home3',
  'public/assets/img/home4',
  'public/assets/img/home5',
  'public/assets/img/home6',
  'public/assets/img/home7',
  'public/assets/img/inner-pages',
];

// Function to download an image
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image, status code: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded: ${filepath}`);
        resolve(filepath);
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file if there was an error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Function to replace images in a directory
async function replaceImagesInDirectory(directory, images) {
  try {
    const fullPath = path.resolve(process.cwd(), directory);
    const files = fs.readdirSync(fullPath).filter(file => 
      file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg')
    );

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(fullPath, file);
      
      // Skip SVG files as they're typically logos or icons
      if (file.endsWith('.svg')) continue;
      
      // Choose an appropriate image based on filename
      let categoryKey = 'auction'; // default
      
      if (file.includes('category')) categoryKey = 'category';
      else if (file.includes('banner')) categoryKey = 'banner';
      else if (file.includes('blog')) categoryKey = 'blog';
      else if (file.includes('store')) categoryKey = 'store';
      else if (file.includes('author') || file.includes('profile')) categoryKey = 'profile';
      
      // Use modulo to cycle through available images if we have more files than images
      const imageIndex = i % images[categoryKey].length;
      const imageUrl = images[categoryKey][imageIndex];
      
      await downloadImage(imageUrl, filePath);
      console.log(`Replaced ${file} with real image`);
    }
  } catch (error) {
    console.error(`Error replacing images in ${directory}:`, error);
  }
}

// Main function to fetch images and replace them
async function replaceAllImages() {
  // You would need to add your Unsplash API key here
  const UNSPLASH_API_KEY = 'YOUR_UNSPLASH_API_KEY';
  
  console.log('Starting image replacement process...');
  
  // Fetch image URLs from Unsplash
  const images = {};
  for (const [category, url] of Object.entries(imageCategories)) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_API_KEY}`
        }
      });
      
      const data = await response.json();
      images[category] = data.map(item => item.urls.regular);
      
      console.log(`Fetched ${images[category].length} images for ${category}`);
    } catch (error) {
      console.error(`Error fetching ${category} images:`, error);
      images[category] = [];
    }
  }
  
  // Process each directory
  for (const directory of directories) {
    await replaceImagesInDirectory(directory, images);
  }
  
  console.log('Image replacement complete!');
}

// Instructions for using this script
console.log(`
===============================================
MAZADCLICK IMAGE REPLACEMENT SCRIPT
===============================================

This script will download real images from Unsplash and replace 
the placeholder images in your project.

BEFORE RUNNING:
1. Get an Unsplash API key from https://unsplash.com/developers
2. Replace YOUR_UNSPLASH_API_KEY in the script with your actual key
3. Make sure you have Node.js installed

TO RUN:
node replaceImages.js

NOTE: This will modify your image files. Consider making a backup first.
`);

// Uncomment to run the script
// replaceAllImages().catch(console.error);

export { replaceAllImages }; 