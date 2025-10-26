import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/webpack';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract text from PDF file
 * @param {File} file - PDF file
 * @returns {Promise<string>} - Extracted text
 */
export const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF file');
  }
};

/**
 * Extract text from image using OCR
 * @param {File} file - Image file
 * @returns {Promise<string>} - Extracted text
 */
export const extractTextFromImage = async (file) => {
  try {
    const worker = await createWorker();
    
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    
    return text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image file');
  }
};

/**
 * Parse meal data from extracted text
 * @param {string} text - Extracted text
 * @param {string} startDate - Week start date
 * @returns {Array} - Parsed meal data
 */
export const parseMealData = (text, startDate) => {
  const meals = [];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const mealTypes = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
  
  const startDateObj = new Date(startDate);
  
  // Clean and normalize the text
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s:,.-]/g, '')
    .trim();

  days.forEach((day, dayIndex) => {
    const currentDate = new Date(startDateObj);
    currentDate.setDate(currentDate.getDate() + dayIndex);
    
    mealTypes.forEach(mealType => {
      // Multiple parsing patterns for different formats
      const patterns = [
        // Pattern 1: "Monday Breakfast: item1, item2"
        new RegExp(`${day}\\s*${mealType}\\s*:([^\\n]+)`, 'i'),
        // Pattern 2: "Breakfast Monday: item1, item2"
        new RegExp(`${mealType}\\s*${day}\\s*:([^\\n]+)`, 'i'),
        // Pattern 3: Day section with meals
        new RegExp(`${day}[\\s\\S]*?${mealType}\\s*:([^\\n]+)`, 'i'),
        // Pattern 4: General meal pattern
        new RegExp(`${mealType}\\s*:([^\\n]+)`, 'i')
      ];
      
      let items = [];
      let found = false;
      
      for (const pattern of patterns) {
        const match = cleanText.match(pattern);
        if (match && !found) {
          const itemsText = match[1].trim();
          
          items = itemsText
            .split(/[,;]/)
            .map(item => item.trim())
            .filter(item => item.length > 0 && item.length < 50) // Reasonable item length
            .slice(0, 8) // Limit items per meal
            .map(item => ({
              name: capitalizeWords(item.replace(/^[-•*]\s*/, '')),
              isVeg: !/(chicken|mutton|fish|egg|meat|beef|pork|prawn|crab)/i.test(item),
              allergens: detectAllergens(item)
            }));
          
          found = true;
          break;
        }
      }
      
      // If no items found, try table-based parsing
      if (items.length === 0) {
        items = parseTableFormat(cleanText, day, mealType);
      }
      
      // Add default items if still nothing found
      if (items.length === 0) {
        items = getDefaultMealItems(mealType);
      }
      
      if (items.length > 0) {
        meals.push({
          date: currentDate.toISOString().split('T')[0],
          mealType,
          items,
          dayName: day,
          source: 'extracted'
        });
      }
    });
  });
  
  return meals;
};

/**
 * Parse table format meal data
 * @param {string} text - Text to parse
 * @param {string} day - Day name
 * @param {string} mealType - Meal type
 * @returns {Array} - Meal items
 */
const parseTableFormat = (text, day, mealType) => {
  // Look for table-like structures
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line contains day and meal type
    if (line.toLowerCase().includes(day.toLowerCase()) && 
        line.toLowerCase().includes(mealType.toLowerCase())) {
      
      // Look for items in the same line or next few lines
      const itemsText = line.split(':').slice(1).join(':').trim();
      
      if (itemsText) {
        return itemsText
          .split(/[,;|]/)
          .map(item => item.trim())
          .filter(item => item.length > 0)
          .slice(0, 6)
          .map(item => ({
            name: capitalizeWords(item),
            isVeg: !/(chicken|mutton|fish|egg|meat|beef|pork)/i.test(item),
            allergens: detectAllergens(item)
          }));
      }
    }
  }
  
  return [];
};

/**
 * Get default meal items when extraction fails
 * @param {string} mealType - Meal type
 * @returns {Array} - Default meal items
 */
const getDefaultMealItems = (mealType) => {
  const defaults = {
    'Breakfast': [
      { name: 'Tea/Coffee', isVeg: true, allergens: [] },
      { name: 'Bread & Butter', isVeg: true, allergens: ['gluten'] },
      { name: 'Seasonal Fruit', isVeg: true, allergens: [] }
    ],
    'Lunch': [
      { name: 'Rice', isVeg: true, allergens: [] },
      { name: 'Dal', isVeg: true, allergens: [] },
      { name: 'Vegetable Curry', isVeg: true, allergens: [] },
      { name: 'Roti', isVeg: true, allergens: ['gluten'] }
    ],
    'Snacks': [
      { name: 'Tea', isVeg: true, allergens: [] },
      { name: 'Biscuits', isVeg: true, allergens: ['gluten'] },
      { name: 'Seasonal Fruit', isVeg: true, allergens: [] }
    ],
    'Dinner': [
      { name: 'Rice', isVeg: true, allergens: [] },
      { name: 'Dal', isVeg: true, allergens: [] },
      { name: 'Dry Sabji', isVeg: true, allergens: [] },
      { name: 'Roti', isVeg: true, allergens: ['gluten'] }
    ]
  };
  
  return defaults[mealType] || [];
};

/**
 * Capitalize words in a string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
const capitalizeWords = (str) => {
  return str.replace(/\b\w+/g, word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
};

/**
 * Detect common allergens in food items
 * @param {string} item - Food item name
 * @returns {Array} - List of allergens
 */
const detectAllergens = (item) => {
  const allergens = [];
  const itemLower = item.toLowerCase();
  
  if (/(bread|roti|wheat|flour|pasta)/i.test(itemLower)) {
    allergens.push('gluten');
  }
  if (/(milk|butter|cheese|curd|yogurt|paneer)/i.test(itemLower)) {
    allergens.push('dairy');
  }
  if (/(nut|almond|cashew|peanut)/i.test(itemLower)) {
    allergens.push('nuts');
  }
  if (/(egg)/i.test(itemLower)) {
    allergens.push('eggs');
  }
  
  return allergens;
};

/**
 * Validate file type for extraction
 * @param {File} file - File to validate
 * @returns {boolean} - Whether file is valid
 */
export const isValidFileType = (file) => {
  const validTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/bmp',
    'image/tiff'
  ];
  
  return validTypes.includes(file.type);
};

/**
 * Get appropriate extraction function based on file type
 * @param {File} file - File to process
 * @returns {Function} - Extraction function
 */
export const getExtractionFunction = (file) => {
  if (file.type === 'application/pdf') {
    return extractTextFromPDF;
  } else if (file.type.startsWith('image/')) {
    return extractTextFromImage;
  } else {
    throw new Error('Unsupported file type');
  }
};