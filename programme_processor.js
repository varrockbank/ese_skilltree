const fs = require('fs');
const path = require('path');

const programmeDir = './programme';
const outputDir = './output';
const csvPath = './course.csv';

console.log('Reading programme category files...\n');

// Read all programme category files
const categories = {};
const categoryFiles = ['core', 'qf', 'or', 'econ', 'marketing', 'extracurricular'];

categoryFiles.forEach(category => {
    const filePath = path.join(programmeDir, `${category}.json`);
    const content = fs.readFileSync(filePath, 'utf8');
    categories[category] = JSON.parse(content);
    console.log(`${category}: ${categories[category].length} courses`);
});

console.log('\nReading course data from output directory...\n');

// Read all course JSON files from output directory
const courseFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.json'));
const courses = {};

courseFiles.forEach(file => {
    const filePath = path.join(outputDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const courseData = JSON.parse(content);
    courses[courseData.id] = courseData;
    console.log(`${courseData.id}: ${courseData.name}`);
});

console.log(`\nTotal courses: ${Object.keys(courses).length}\n`);

// CSV header
const headers = [
    'id', 'course', 'credits', 'block_start', 'block_end', 'premaster',
    'core', 'qf', 'or', 'econ', 'marketing',
    'dependencies', 'extracurricular', 'qf_alternative', 'or_alternative'
];

// Build CSV rows
const rows = [headers.join(',')];

Object.keys(courses).sort().forEach(courseId => {
    const course = courses[courseId];

    // Determine category memberships (check if courseId is in any requirement's requirement array)
    const isCore = categories.core.some(req => req.requirement.includes(courseId));
    const isQf = categories.qf.some(req => req.requirement.includes(courseId));
    const isOr = categories.or.some(req => req.requirement.includes(courseId));
    const isEcon = categories.econ.some(req => req.requirement.includes(courseId));
    const isMarketing = categories.marketing.some(req => req.requirement.includes(courseId));
    const isExtracurricular = categories.extracurricular.some(req => req.requirement.includes(courseId));

    // Find QF alternative (if course is in QF requirement with multiple courses)
    let qfAlternative = '';
    if (isQf) {
        const qfRequirement = categories.qf.find(req => req.requirement.includes(courseId));
        if (qfRequirement && qfRequirement.requirement.length > 1) {
            // Get the other course(s) in this requirement
            const alternatives = qfRequirement.requirement.filter(id => id !== courseId);
            qfAlternative = alternatives.join(';');
        }
    }

    // Find OR alternative (if course is in OR requirement with multiple courses)
    let orAlternative = '';
    if (isOr) {
        const orRequirement = categories.or.find(req => req.requirement.includes(courseId));
        if (orRequirement && orRequirement.requirement.length > 1) {
            // Get the other course(s) in this requirement
            const alternatives = orRequirement.requirement.filter(id => id !== courseId);
            orAlternative = alternatives.join(';');
        }
    }

    // Format dependencies (array to semicolon-separated string)
    const dependencies = course.dependencies && course.dependencies.length > 0
        ? course.dependencies.join(';')
        : '';

    // Build row
    const row = [
        course.id,
        course.name,
        course.credits,
        course.blockStart,
        course.blockEnd,
        course.premaster,
        isCore,
        isQf,
        isOr,
        isEcon,
        isMarketing,
        dependencies,
        isExtracurricular,
        qfAlternative,
        orAlternative
    ];

    rows.push(row.join(','));

    console.log(`${course.id}: core=${isCore}, qf=${isQf}, or=${isOr}, econ=${isEcon}, marketing=${isMarketing}, extra=${isExtracurricular}`);
});

// Write CSV file
const csvContent = rows.join('\n');
fs.writeFileSync(csvPath, csvContent, 'utf8');

console.log(`\n✓ Generated course.csv with ${rows.length - 1} courses`);
console.log('✓ CSV file includes all categories from programme JSONs and course data from output JSONs');
