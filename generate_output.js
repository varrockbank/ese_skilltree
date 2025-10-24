const fs = require('fs');
const path = require('path');
const { transform } = require('./course_processor.js');

const inputDir = './input';
const outputDir = './output';

// Get all JSON files from input directory
const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));

console.log(`Processing ${files.length} course files...\n`);

files.forEach(file => {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);

    try {
        // Read raw JSON
        const rawData = fs.readFileSync(inputPath, 'utf8');
        const rawJson = JSON.parse(rawData);

        // Transform
        const transformedJson = transform(rawJson);

        // Write to output
        fs.writeFileSync(outputPath, JSON.stringify(transformedJson, null, 2), 'utf8');

        console.log(`✓ ${file}: ${transformedJson.id} - ${transformedJson.name}`);
    } catch (error) {
        console.error(`✗ ${file}: ${error.message}`);
    }
});

console.log(`\n✓ Generated ${files.length} transformed files in ${outputDir}/`);
