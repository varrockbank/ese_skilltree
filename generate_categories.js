const fs = require('fs');
const path = require('path');

const csvPath = './course.csv';
const programmeDir = './programme';

// Ensure programme directory exists
if (!fs.existsSync(programmeDir)) {
    fs.mkdirSync(programmeDir);
}

console.log('Reading course.csv...\n');

// Read CSV
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.trim().split('\n');
const headers = lines[0].split(',');

// Find column indices
const idIndex = headers.indexOf('id');
const coreIndex = headers.indexOf('core');
const qfIndex = headers.indexOf('qf');
const orIndex = headers.indexOf('or');
const econIndex = headers.indexOf('econ');
const marketingIndex = headers.indexOf('marketing');
const extracurricularIndex = headers.indexOf('extracurricular');

// Initialize category arrays
const categories = {
    core: [],
    qf: [],
    or: [],
    econ: [],
    marketing: [],
    extracurricular: []
};

// Parse rows and categorize courses
for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const courseId = values[idIndex];

    // Check each category (true/false values in CSV)
    // Each course becomes a requirement object with a requirement array
    if (values[coreIndex] === 'true') {
        categories.core.push({ requirement: [courseId] });
    }
    if (values[qfIndex] === 'true') {
        categories.qf.push({ requirement: [courseId] });
    }
    if (values[orIndex] === 'true') {
        categories.or.push({ requirement: [courseId] });
    }
    if (values[econIndex] === 'true') {
        categories.econ.push({ requirement: [courseId] });
    }
    if (values[marketingIndex] === 'true') {
        categories.marketing.push({ requirement: [courseId] });
    }
    if (values[extracurricularIndex] === 'true') {
        categories.extracurricular.push({ requirement: [courseId] });
    }
}

// Handle alternatives for QF: FEB22017X and FEB21020X are alternatives
// Find and merge these into a single requirement
const qfFinanceIndex = categories.qf.findIndex(req => req.requirement[0] === 'FEB22017X');
const qfMicroIndex = categories.qf.findIndex(req => req.requirement[0] === 'FEB21020X');

if (qfFinanceIndex !== -1 && qfMicroIndex !== -1) {
    // Merge into one requirement with both courses as alternatives
    categories.qf[qfFinanceIndex].requirement.push('FEB21020X');
    // Remove the separate requirement for FEB21020X
    categories.qf.splice(qfMicroIndex, 1);
    console.log('Note: FEB22017X and FEB21020X merged as alternative requirement for QF\n');
}

// Write JSON files
console.log('Generating category JSON files...\n');

Object.keys(categories).forEach(category => {
    const filename = path.join(programmeDir, `${category}.json`);
    const content = JSON.stringify(categories[category], null, 2);
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`✓ ${filename}: ${categories[category].length} courses`);
    console.log(`  ${categories[category].join(', ')}\n`);
});

console.log('✓ All category JSON files generated in programme/ directory!');
