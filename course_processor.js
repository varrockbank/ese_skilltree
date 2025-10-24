/**
 * Transform raw course JSON data to processed format
 */

// Extract course ID (cursus) from raw JSON
function extractCourseId(rawJson) {
    try {
        const rubriekKop = rawJson.items.find(item => item.rubriek === 'rubriek-kop');
        if (!rubriekKop || !rubriekKop.velden) {
            return null;
        }

        const idField = rubriekKop.velden.find(field => field.veld === 'cursus');
        if (!idField) {
            return null;
        }

        return idField.waarde;
    } catch (error) {
        console.error('Error extracting course ID:', error);
        return null;
    }
}

// Extract course name (cursus_korte_naam) from raw JSON
function extractCourseName(rawJson) {
    try {
        const rubriekKop = rawJson.items.find(item => item.rubriek === 'rubriek-kop');
        if (!rubriekKop || !rubriekKop.velden) {
            return null;
        }

        const nameField = rubriekKop.velden.find(field => field.veld === 'cursus_korte_naam');
        if (!nameField) {
            return null;
        }

        return nameField.waarde;
    } catch (error) {
        console.error('Error extracting course name:', error);
        return null;
    }
}

// Extract URL from raw JSON
function extractUrl(rawJson) {
    try {
        const rubriekKop = rawJson.items.find(item => item.rubriek === 'rubriek-kop');
        if (!rubriekKop || !rubriekKop.velden) {
            return null;
        }

        const urlField = rubriekKop.velden.find(field => field.veld === 'deeplink_detailscherm_extern');
        if (!urlField) {
            return null;
        }

        return urlField.waarde;
    } catch (error) {
        console.error('Error extracting URL:', error);
        return null;
    }
}

// Extract study credits from raw JSON
function extractStudyCredits(rawJson) {
    try {
        const rubriekZoek = rawJson.items.find(item => item.rubriek === 'rubriek-zoek');
        if (!rubriekZoek || !rubriekZoek.velden) {
            return null;
        }

        const creditsField = rubriekZoek.velden.find(field => field.titel === 'Study points');
        if (!creditsField) {
            return null;
        }

        // Parse the value (e.g., "4 EC" -> 4)
        const match = creditsField.waarde.match(/(\d+)/);
        if (match) {
            return parseInt(match[1], 10);
        }

        return null;
    } catch (error) {
        console.error('Error extracting study credits:', error);
        return null;
    }
}

// Extract dependencies (prerequisites) from raw JSON
function extractDependencies(rawJson) {
    try {
        const rubriekInhoud = rawJson.items.find(item => item.rubriek === 'rubriek-inhoud');
        if (!rubriekInhoud || !rubriekInhoud.velden) {
            return [];
        }

        const contentField = rubriekInhoud.velden.find(field => field.veld === 'item-inhoud-1');
        if (!contentField || !contentField.waarde) {
            return [];
        }

        const content = contentField.waarde;

        // Remove HTML tags
        const textContent = content.replace(/<[^>]*>/g, ' ');

        // Split by common separators that indicate "downstream" courses
        const prerequisiteSection = textContent.split(/and is required for|is required for/i)[0];

        // Extract all course codes in the prerequisite section
        const courseCodePattern = /FEB\d{5}[A-Z\d]/g;
        const matches = prerequisiteSection.match(courseCodePattern);

        if (matches) {
            // Remove duplicates
            const uniqueCodes = [...new Set(matches)];
            return uniqueCodes;
        }

        return [];
    } catch (error) {
        console.error('Error extracting dependencies:', error);
        return [];
    }
}

// Extract block information from raw JSON
function extractBlock(rawJson) {
    try {
        const rubriekInschrijven = rawJson.items.find(item => item.rubriek === 'rubriek-inschrijven');
        if (!rubriekInschrijven || !rubriekInschrijven.velden) {
            return { blockStart: null, blockEnd: null };
        }

        const enrollmentTable = rubriekInschrijven.velden.find(field => field.veld === 'tabel-inschrijfperiodes');
        if (!enrollmentTable || !enrollmentTable.waarde || !Array.isArray(enrollmentTable.waarde)) {
            return { blockStart: null, blockEnd: null };
        }

        const firstPeriod = enrollmentTable.waarde[0];
        if (!firstPeriod || !firstPeriod.omschrijving) {
            return { blockStart: null, blockEnd: null };
        }

        const omschrijving = firstPeriod.omschrijving;

        // Check if it's a range (e.g., "Block BLOK4 until Block BLOK5")
        const rangeMatch = omschrijving.match(/Block\s+(\S+)\s+until\s+Block\s+(\S+)/);
        if (rangeMatch) {
            return {
                blockStart: rangeMatch[1],
                blockEnd: rangeMatch[2]
            };
        }

        // Check if it's a single block (e.g., "Block BLOK2")
        const singleMatch = omschrijving.match(/Block\s+(\S+)/);
        if (singleMatch) {
            return {
                blockStart: singleMatch[1],
                blockEnd: singleMatch[1]
            };
        }

        return { blockStart: null, blockEnd: null };
    } catch (error) {
        console.error('Error extracting block:', error);
        return { blockStart: null, blockEnd: null };
    }
}

// Determine if course is a premaster course (ends with 'S')
function isPremaster(courseId) {
    if (!courseId || courseId === 'Unknown') {
        return false;
    }
    return courseId.endsWith('S');
}

/**
 * Transform raw JSON to processed format
 * @param {Object} rawJson - Raw course JSON data
 * @returns {Object} Processed course data
 */
function transform(rawJson) {
    const courseId = extractCourseId(rawJson);
    const courseName = extractCourseName(rawJson);
    const studyCredits = extractStudyCredits(rawJson);
    const blockInfo = extractBlock(rawJson);
    const url = extractUrl(rawJson);
    const dependencies = extractDependencies(rawJson);
    const premaster = isPremaster(courseId);

    return {
        id: courseId || 'Unknown',
        name: courseName || 'Unknown',
        credits: studyCredits !== null ? studyCredits : 'Unknown',
        blockStart: blockInfo.blockStart || 'Unknown',
        blockEnd: blockInfo.blockEnd || 'Unknown',
        url: url || 'Unknown',
        dependencies: dependencies,
        premaster: premaster
    };
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { transform };
}
