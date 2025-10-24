const fs = require('fs');
const path = require('path');

const coursesDir = './courses';
const files = fs.readdirSync(coursesDir).filter(f => f.endsWith('.json'));

console.log(`Checking ${files.length} course files...\n`);

let allValid = true;
const results = [];

files.forEach(file => {
    const filePath = path.join(coursesDir, file);
    const expectedCode = file.replace('.json', '');

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);

        // Find rubriek-kop
        const rubriekKop = data.items.find(item => item.rubriek === 'rubriek-kop');

        if (!rubriekKop) {
            results.push({ file, status: 'ERROR', message: 'No rubriek-kop found' });
            allValid = false;
            return;
        }

        // Find cursus field
        const cursusField = rubriekKop.velden.find(v => v.veld === 'cursus');

        if (!cursusField) {
            results.push({ file, status: 'ERROR', message: 'No cursus field found in rubriek-kop' });
            allValid = false;
            return;
        }

        // Check if waarde matches filename
        if (cursusField.waarde === expectedCode) {
            results.push({ file, status: 'OK', waarde: cursusField.waarde });
        } else {
            results.push({
                file,
                status: 'MISMATCH',
                expected: expectedCode,
                actual: cursusField.waarde
            });
            allValid = false;
        }

    } catch (error) {
        results.push({ file, status: 'ERROR', message: error.message });
        allValid = false;
    }
});

// Print results
results.forEach(result => {
    if (result.status === 'OK') {
        console.log(`✓ ${result.file}: ${result.waarde}`);
    } else if (result.status === 'MISMATCH') {
        console.log(`✗ ${result.file}: Expected "${result.expected}", got "${result.actual}"`);
    } else {
        console.log(`✗ ${result.file}: ${result.message}`);
    }
});

console.log(`\n${allValid ? '✓ All files valid!' : '✗ Some files have issues'}`);
process.exit(allValid ? 0 : 1);
