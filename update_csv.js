const fs = require('fs');
const path = require('path');

const outputDir = './output';
const csvPath = './course.csv';

// Read all JSON files to create a mapping
const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.json'));

// Create mappings
const courseNameToId = {}; // Map course name to course ID
const courseIdToData = {}; // Map course ID to full data

console.log('Building course mappings...\n');

files.forEach(file => {
    const filePath = path.join(outputDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    courseNameToId[data.name.toLowerCase().trim()] = data.id;
    courseIdToData[data.id] = data;

    console.log(`${data.id}: ${data.name}`);
});

console.log('\nReading course.csv...\n');

// Read CSV
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.trim().split('\n');
const headers = lines[0].split(',');

// Find index of relevant columns
const idIndex = headers.indexOf('id');
const courseIndex = headers.indexOf('course');
const dependenciesIndex = headers.indexOf('dependencies');
const alternativeIndex = headers.indexOf('alternative');

console.log('Updating CSV rows...\n');

// First pass: build mapping from old ID to new ID and row number to new ID
const oldIdToNewId = {};
const rowNumberToNewId = {};

for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const courseName = values[courseIndex].toLowerCase().trim();
    const oldId = values[idIndex];

    // Normalize course name for matching
    const normalizedCourseName = courseName
        .replace('optimization', 'optimisation')
        .replace('multivariable stats', 'multivariate statistics');

    // Find the matching course ID from our JSON files
    let newId = courseNameToId[courseName] || courseNameToId[normalizedCourseName];

    if (!newId) {
        // Try partial matching if exact match fails
        for (const [name, id] of Object.entries(courseNameToId)) {
            const normalizedJsonName = name.replace('introduction to ', '');
            if (normalizedJsonName.includes(normalizedCourseName) ||
                normalizedCourseName.includes(normalizedJsonName)) {
                newId = id;
                break;
            }
        }
    }

    if (newId) {
        oldIdToNewId[oldId] = newId;
        // Map row number (i) to new ID - alternatives might reference row numbers
        rowNumberToNewId[i.toString()] = newId;
    }
}

console.log('Old ID to New ID mapping:');
console.log(oldIdToNewId);
console.log('\n');

// Update rows
const updatedLines = [lines[0]]; // Keep header

for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const courseName = values[courseIndex].toLowerCase().trim();
    const oldId = values[idIndex];

    // Normalize course name for matching (handle UK/US spelling differences)
    const normalizedCourseName = courseName
        .replace('optimization', 'optimisation')
        .replace('multivariable stats', 'multivariate statistics');

    // Find the matching course ID from our JSON files
    let newId = courseNameToId[courseName] || courseNameToId[normalizedCourseName];

    if (!newId) {
        // Try partial matching if exact match fails
        for (const [name, id] of Object.entries(courseNameToId)) {
            const normalizedJsonName = name.replace('introduction to ', '');
            if (normalizedJsonName.includes(normalizedCourseName) ||
                normalizedCourseName.includes(normalizedJsonName)) {
                newId = id;
                break;
            }
        }
    }

    if (newId) {
        console.log(`${oldId} -> ${newId}: ${values[courseIndex]}`);
        values[idIndex] = newId;

        // Update dependencies from JSON data
        if (courseIdToData[newId] && courseIdToData[newId].dependencies.length > 0) {
            // Use dependencies from JSON
            values[dependenciesIndex] = courseIdToData[newId].dependencies.join(';');
        }

        // Update alternatives field (convert old numeric IDs or row numbers to course codes)
        const alternativeValue = values[alternativeIndex].trim();
        if (alternativeValue && alternativeValue !== '') {
            // Try mapping as an old ID first, then as a row number
            let alternativeCourseId = oldIdToNewId[alternativeValue] || rowNumberToNewId[alternativeValue];
            if (alternativeCourseId) {
                values[alternativeIndex] = alternativeCourseId;
                console.log(`  Alternative: ${alternativeValue} -> ${alternativeCourseId}`);
            }
        }
    } else {
        console.log(`⚠ Could not find ID for: ${values[courseIndex]}`);
    }

    updatedLines.push(values.join(','));
}

// Write updated CSV
const updatedCsv = updatedLines.join('\n');
fs.writeFileSync(csvPath, updatedCsv, 'utf8');

console.log(`\n✓ Updated ${updatedLines.length - 1} courses in course.csv`);
console.log('✓ IDs have been updated to course codes (e.g., FEB22002X)');
console.log('✓ Dependencies have been updated to lists of course codes');
