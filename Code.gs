// ==================== CONFIGURATION ====================
const SPREADSHEET_ID = '1iwFpQ3KN9SK257kO0Wy5cwB52QMqabkPbq565F7bbB4'; // <-- REPLACE WITH YOUR ACTUAL ID
const PASS_MIN = 3;        // Each skill must be ≥ 3
const PASS_TOTAL = 20;     // Total must be ≥ 20 (6 skills × 3.33 average)
const LEVEL_ORDER = ['Duckling', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6'];

// ============================================================
// LOGO URL
// ============================================================
const LOGO_URL = 'https://lh3.googleusercontent.com/d/1dp5d8laT4CGShz-z69Q5y3dDYsfbORJA';

// ============================================================
// SOCIAL MEDIA LINKS
// ============================================================
const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/peterhillswimming',
  twitter: 'https://x.com/phill2806'
};

// ============================================================
// CERTIFICATE TEMPLATES - Google Slides File IDs
// ============================================================
const CERTIFICATE_TEMPLATES = {
  'Duckling': '17x9AbiBKcX2uMzoewO5vnI-NLnjJH4oXK_0txwfVphw',
  'Level 1': '1TxRtW9-W8CpnuyBGgHWZbcURU4h5SNgyq2AO07FD0r4',
  'Level 2': '1aJFBJKF9QMf3rIaHXr0ON4AztL5yDIAylDUkuJLlwGo',
  'Level 3': '1zINqpfpZKH66OsBXAsQXeapZ_GHukyusLX86b9VBuw4',
  'Level 4': '1jZ0tSYbNvPHB0yI2LoRBi-bpc556GX5Z3CallazK4no',
  'Level 5': '1GmdOjA95Lu5OJLbFrB8OxfwdVUmONq14WxJOaHopfEE',
  'Level 6': '1U2uXEedWO_rtcMIu7wLc-Fx_1rz9NATtyK40FPDI-fU'
};

// ============================================================

const ACHIEVEMENTS = {
  FIRST_ASSESS: '🌟 First Splash',
  HALFWAY: '💪 Halfway Hero (3 skills)',
  FULL_HOUSE: '🏆 Full House (all 6 skills)',
  ALL_PASS: '🥉 Bronze Pass (all skills ≥3)',
  TOTAL_PASS: '🥈 Silver Pass (total ≥20)',
  PERFECT_SCORE: '🥇 Gold Star (all 5s)',
  PROMOTION: '🚀 Level Up!',
  HIGHEST_LEVEL: '👑 Master Swimmer'
};

// ==================== DOGET ====================
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Peter Hill Swimming - Progress Tracker')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==================== HELPERS ====================
function getSheet_(name) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return ss.getSheetByName(name);
  } catch (e) {
    Logger.log('❌ Error opening sheet: ' + e.message);
    return null;
  }
}

function getHeaders_(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  return data.length > 0 ? data[0] : [];
}

function getRows_(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  return data.length > 1 ? data.slice(1) : [];
}

function normalizeLevel(level) {
  const levelStr = String(level).trim();
  if (/^\d+$/.test(levelStr)) {
    return 'Level ' + levelStr;
  }
  if (/^Level\d+$/.test(levelStr)) {
    return levelStr.replace('Level', 'Level ');
  }
  return levelStr;
}

// ==================== GET UNIQUE DAYS FROM CLASSES ====================
function getAvailableDays() {
  try {
    const sheet = getSheet_('Classes');
    if (!sheet) {
      Logger.log('❌ Classes sheet not found!');
      return [];
    }
    
    const headers = getHeaders_(sheet);
    const rows = getRows_(sheet);
    const dayIdx = headers.indexOf('Day');
    
    if (dayIdx === -1) {
      Logger.log('❌ Day column not found in Classes sheet');
      return [];
    }
    
    const days = new Set();
    rows.forEach(row => {
      const day = String(row[dayIdx] || '').trim();
      if (day) days.add(day);
    });
    
    const sortedDays = Array.from(days).sort();
    Logger.log('✅ Available days: ' + JSON.stringify(sortedDays));
    return sortedDays;
  } catch (e) {
    Logger.log('❌ Error in getAvailableDays: ' + e.message);
    return [];
  }
}

// ==================== GET TEACHER NAME ====================
function getTeacherName(teacherId) {
  try {
    if (!teacherId) return 'Not assigned';
    
    const sheet = getSheet_('Teachers');
    if (!sheet) {
      Logger.log('❌ Teachers sheet not found!');
      return 'Unknown';
    }
    
    const headers = getHeaders_(sheet);
    const rows = getRows_(sheet);
    const idIdx = headers.indexOf('TeacherID');
    const firstIdx = headers.indexOf('FirstName');
    const lastIdx = headers.indexOf('LastName');
    
    if (idIdx === -1 || firstIdx === -1 || lastIdx === -1) {
      return 'Unknown';
    }
    
    const teacher = rows.find(r => String(r[idIdx]).trim() === String(teacherId).trim());
    if (teacher) {
      return String(teacher[firstIdx]).trim() + ' ' + String(teacher[lastIdx]).trim();
    }
    return 'Unknown';
  } catch (e) {
    Logger.log('❌ Error in getTeacherName: ' + e.message);
    return 'Unknown';
  }
}

// ==================== GET CLASS DETAILS ====================
function getClassDetails(classId) {
  try {
    if (!classId) return null;
    
    const sheet = getSheet_('Classes');
    if (!sheet) {
      Logger.log('❌ Classes sheet not found!');
      return null;
    }
    
    const headers = getHeaders_(sheet);
    const rows = getRows_(sheet);
    const idIdx = headers.indexOf('ClassID');
    const levelIdx = headers.indexOf('LevelName');
    const dayIdx = headers.indexOf('Day');
    const timeIdx = headers.indexOf('Time');
    const teacherIdx = headers.indexOf('TeacherID');
    
    if (idIdx === -1) return null;
    
    const classRow = rows.find(r => String(r[idIdx]).trim() === String(classId).trim());
    if (!classRow) return null;
    
    const teacherName = getTeacherName(classRow[teacherIdx]);
    
    return {
      level: String(classRow[levelIdx] || '').trim(),
      day: String(classRow[dayIdx] || '').trim(),
      time: String(classRow[timeIdx] || '').trim(),
      teacherId: String(classRow[teacherIdx] || '').trim(),
      teacherName: teacherName
    };
  } catch (e) {
    Logger.log('❌ Error in getClassDetails: ' + e.message);
    return null;
  }
}

// ==================== GENERATE CERTIFICATE PDF - ROBUST VERSION ====================
function generateCertificatePdf(pupilName, levelName) {
  try {
    Logger.log('📄 ===== STARTING CERTIFICATE GENERATION =====');
    Logger.log('📄 Pupil: ' + pupilName);
    Logger.log('📄 Level: ' + levelName);
    
    const normalizedLevel = normalizeLevel(levelName);
    Logger.log('📄 Normalized level: ' + normalizedLevel);
    
    const templateId = CERTIFICATE_TEMPLATES[normalizedLevel];
    Logger.log('📄 Template ID: ' + templateId);
    
    if (!templateId) {
      Logger.log('❌ No certificate template configured for level: ' + normalizedLevel);
      return null;
    }
    
    // Try to get the template file
    let templateFile = null;
    
    Logger.log('📄 Method 1: Trying DriveApp.getFileById()...');
    try {
      templateFile = DriveApp.getFileById(templateId);
      if (templateFile) {
        Logger.log('✅ Method 1 successful! File found: ' + templateFile.getName());
        Logger.log('   MIME Type: ' + templateFile.getMimeType());
        Logger.log('   File Size: ' + templateFile.getSize() + ' bytes');
      }
    } catch (e1) {
      Logger.log('⚠️ Method 1 failed: ' + e1.message);
    }
    
    if (!templateFile) {
      Logger.log('❌ Could not find template file for level: ' + normalizedLevel);
      return null;
    }
    
    // Create a copy of the template
    Logger.log('📄 Creating copy of template...');
    const tempFileName = 'Certificate_' + pupilName.replace(/\s/g, '_') + '_' + normalizedLevel.replace(/\s/g, '_') + '_' + new Date().getTime();
    let tempFile;
    try {
      tempFile = templateFile.makeCopy(tempFileName);
      Logger.log('✅ Temporary file created: ' + tempFileName);
      Logger.log('   Temp File ID: ' + tempFile.getId());
    } catch (e) {
      Logger.log('❌ Error creating copy: ' + e.message);
      return null;
    }
    
    // Open the presentation
    let tempPresentation;
    try {
      tempPresentation = SlidesApp.openById(tempFile.getId());
      Logger.log('✅ Presentation opened successfully');
    } catch (e) {
      Logger.log('❌ Error opening presentation: ' + e.message);
      try { tempFile.setTrashed(true); } catch(trashError) {}
      return null;
    }
    
    // Get the first slide
    const slides = tempPresentation.getSlides();
    if (slides.length === 0) {
      Logger.log('❌ No slides found in template');
      try { tempFile.setTrashed(true); } catch(trashError) {}
      return null;
    }
    const slide = slides[0];
    Logger.log('✅ Found ' + slides.length + ' slide(s) in template');
    
    // Format the date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    Logger.log('📄 Date: ' + dateStr);
    
    // Replace placeholders in all text boxes
    let replacementsFound = 0;
    const shapes = slide.getShapes();
    Logger.log('📄 Found ' + shapes.length + ' shape(s) in slide');
    
    shapes.forEach((shape, index) => {
      try {
        if (shape.getText()) {
          let text = shape.getText().asString();
          let modified = false;
          
          if (text.includes('{PUPIL_NAME}')) {
            text = text.replace(/{PUPIL_NAME}/g, pupilName);
            modified = true;
            replacementsFound++;
            Logger.log('✅ Replaced {PUPIL_NAME} with: ' + pupilName + ' (Shape ' + index + ')');
          }
          if (text.includes('{LEVEL}')) {
            text = text.replace(/{LEVEL}/g, normalizedLevel);
            modified = true;
            replacementsFound++;
            Logger.log('✅ Replaced {LEVEL} with: ' + normalizedLevel + ' (Shape ' + index + ')');
          }
          if (text.includes('{DATE}')) {
            text = text.replace(/{DATE}/g, dateStr);
            modified = true;
            replacementsFound++;
            Logger.log('✅ Replaced {DATE} with: ' + dateStr + ' (Shape ' + index + ')');
          }
          
          if (modified) {
            shape.getText().setText(text);
          }
        }
      } catch (shapeError) {
        Logger.log('⚠️ Error processing shape ' + index + ': ' + shapeError.message);
      }
    });
    
    if (replacementsFound === 0) {
      Logger.log('⚠️ No placeholders found in the template for level: ' + normalizedLevel);
      Logger.log('⚠️ Make sure your template has text boxes with: {PUPIL_NAME}, {LEVEL}, {DATE}');
    } else {
      Logger.log('✅ Total replacements made: ' + replacementsFound);
    }
    
    // Save the presentation
    try {
      tempPresentation.saveAndClose();
      Logger.log('✅ Presentation saved and closed');
    } catch (e) {
      Logger.log('❌ Error saving presentation: ' + e.message);
      try { tempFile.setTrashed(true); } catch(trashError) {}
      return null;
    }
    
    // Convert to PDF
    let pdfBlob;
    try {
      pdfBlob = tempFile.getBlob();
      Logger.log('✅ PDF blob created, size: ' + pdfBlob.getBytes().length + ' bytes');
    } catch (e) {
      Logger.log('❌ Error creating PDF: ' + e.message);
      try { tempFile.setTrashed(true); } catch(trashError) {}
      return null;
    }
    
    // Delete the temporary file
    try {
      tempFile.setTrashed(true);
      Logger.log('✅ Temporary file deleted');
    } catch (e) {
      Logger.log('⚠️ Could not delete temporary file: ' + e.message);
    }
    
    // Return the PDF
    const fileName = pupilName.replace(/\s/g, '_') + '_' + normalizedLevel.replace(/\s/g, '_') + '_Certificate.pdf';
    const result = pdfBlob.setName(fileName);
    Logger.log('✅ ===== CERTIFICATE GENERATION SUCCESSFUL =====');
    Logger.log('📎 Filename: ' + fileName);
    Logger.log('📎 File size: ' + pdfBlob.getBytes().length + ' bytes');
    return result;
    
  } catch (e) {
    Logger.log('❌ ===== CERTIFICATE GENERATION FAILED =====');
    Logger.log('❌ Error: ' + e.message);
    Logger.log('❌ Stack trace: ' + e.stack);
    return null;
  }
}

// ==================== TEACHERS ====================
function getTeachers() {
  try {
    const sheet = getSheet_('Teachers');
    if (!sheet) {
      Logger.log('❌ Teachers sheet not found!');
      return [];
    }
    const data = getRows_(sheet);
    if (data.length === 0) {
      Logger.log('⚠️ No teacher data found');
      return [];
    }
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[1]) {
        result.push({
          id: String(row[0]).trim(),
          name: String(row[1]).trim() + ' ' + String(row[2] || '').trim()
        });
      }
    }
    Logger.log('✅ Found ' + result.length + ' teachers');
    return result;
  } catch (e) {
    Logger.log('❌ Error in getTeachers: ' + e.message);
    return [];
  }
}

// ==================== CLASSES ====================
function getClasses(day, teacherId) {
  try {
    const sheet = getSheet_('Classes');
    if (!sheet) {
      Logger.log('❌ Classes sheet not found!');
      return [];
    }
    
    const headers = getHeaders_(sheet);
    const rows = getRows_(sheet);
    
    if (rows.length === 0) {
      Logger.log('⚠️ No classes found in sheet');
      return [];
    }
    
    const idIdx = headers.indexOf('ClassID');
    const levelIdx = headers.indexOf('LevelName');
    const dayIdx = headers.indexOf('Day');
    const timeIdx = headers.indexOf('Time');
    const teacherIdx = headers.indexOf('TeacherID');
    
    Logger.log('📋 Classes headers: ' + JSON.stringify(headers));
    
    return rows
      .filter(r => {
        const classDay = r[dayIdx] ? String(r[dayIdx]).trim() : '';
        const classTeacher = r[teacherIdx] ? String(r[teacherIdx]).trim() : '';
        const matchDay = !day || classDay === day;
        const matchTeacher = !teacherId || classTeacher === teacherId;
        return matchDay && matchTeacher && r[idIdx];
      })
      .map(r => {
        let timeValue = r[timeIdx] ? String(r[timeIdx]).trim() : '';
        if (timeValue.includes('T')) {
          const match = timeValue.match(/(\d{2}:\d{2})/);
          if (match) timeValue = match[1];
        }
        if (!isNaN(timeValue) && timeValue.length < 5) {
          const hours = Math.floor(parseFloat(timeValue) * 24);
          const minutes = Math.round((parseFloat(timeValue) * 24 - hours) * 60);
          timeValue = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
        }
        
        return {
          id: String(r[idIdx]).trim(),
          level: String(r[levelIdx]).trim(),
          day: String(r[dayIdx]).trim(),
          time: timeValue,
          teacherId: String(r[teacherIdx]).trim()
        };
      });
  } catch (e) {
    Logger.log('❌ Error in getClasses: ' + e.message);
    return [];
  }
}

// ==================== PUPILS ====================
function getPupilsByClass(classId) {
  try {
    const sheet = getSheet_('Pupils');
    if (!sheet) {
      Logger.log('❌ Pupils sheet not found!');
      return [];
    }
    
    const headers = getHeaders_(sheet);
    const rows = getRows_(sheet);
    
    if (rows.length === 0) {
      Logger.log('⚠️ No pupils found in sheet');
      return [];
    }
    
    const idIdx = headers.indexOf('PupilID');
    const firstIdx = headers.indexOf('FirstName');
    const lastIdx = headers.indexOf('LastName');
    const classIdx = headers.indexOf('ClassID');
    const levelIdx = headers.indexOf('CurrentLevel');
    
    Logger.log('📋 Pupils headers: ' + JSON.stringify(headers));
    Logger.log('📋 Looking for classId: ' + classId);
    
    const classSheet = getSheet_('Classes');
    const cHeaders = getHeaders_(classSheet);
    const cRows = getRows_(classSheet);
    const cIdIdx = cHeaders.indexOf('ClassID');
    const cLevelIdx = cHeaders.indexOf('LevelName');
    
    let targetLevel = '';
    if (classId) {
      const classRow = cRows.find(r => String(r[cIdIdx]).trim() === String(classId).trim());
      if (classRow) {
        targetLevel = String(classRow[cLevelIdx]).trim();
        Logger.log('📋 Target level from class: ' + targetLevel);
      }
    }
    
    // IMPORTANT: a pupil's assigned ClassID is the source of truth for which
    // specific class they belong to — two classes can share the same level
    // (e.g. two "Level 2" sessions on different days), so matching by level
    // alone would pull in every same-level pupil regardless of which actual
    // class they're enrolled in. Level is only used as a fallback for pupils
    // who haven't been assigned a ClassID yet, so they aren't invisible.
    const result = rows
      .filter(r => {
        if (!classId) return true;

        const pupilClass = String(r[classIdx] || '').trim();
        if (pupilClass) {
          return pupilClass === String(classId).trim();
        }

        // No ClassID on record for this pupil — fall back to matching by level
        // so newly-added/unassigned pupils still show up somewhere.
        const pupilLevel = String(r[levelIdx] || '').trim();
        return pupilLevel === targetLevel || normalizeLevel(pupilLevel) === targetLevel;
      })
      .map(r => ({
        id: String(r[idIdx]).trim(),
        name: String(r[firstIdx] || '').trim() + ' ' + String(r[lastIdx] || '').trim()
      }));
    
    Logger.log('✅ Found ' + result.length + ' pupils');
    return result;
  } catch (e) {
    Logger.log('❌ Error in getPupilsByClass: ' + e.message);
    return [];
  }
}

function getPupilsByLevel(levelName) {
  try {
    const sheet = getSheet_('Pupils');
    if (!sheet) {
      Logger.log('❌ Pupils sheet not found!');
      return [];
    }
    
    const headers = getHeaders_(sheet);
    const rows = getRows_(sheet);
    const lIdx = headers.indexOf('CurrentLevel');
    const idIdx = headers.indexOf('PupilID');
    const firstIdx = headers.indexOf('FirstName');
    const lastIdx = headers.indexOf('LastName');
    const classIdx = headers.indexOf('ClassID');
    
    Logger.log('📋 Looking for pupils in level: ' + levelName);
    
    return rows
      .filter(r => {
        const pupilLevel = String(r[lIdx] || '').trim();
        const normalizedPupilLevel = normalizeLevel(pupilLevel);
        const match = normalizedPupilLevel === levelName || pupilLevel === levelName;
        return match;
      })
      .map(r => ({
        id: String(r[idIdx]).trim(),
        firstName: String(r[firstIdx] || '').trim(),
        lastName: String(r[lastIdx] || '').trim(),
        level: String(r[lIdx] || '').trim(),
        classId: String(r[classIdx] || '').trim()
      }));
  } catch (e) {
    Logger.log('❌ Error in getPupilsByLevel: ' + e.message);
    return [];
  }
}

// ==================== SKILLS ====================
function getSkillsForLevel(levelName) {
  try {
    const sheet = getSheet_('Skills');
    if (!sheet) {
      Logger.log('❌ Skills sheet not found!');
      return [];
    }
    const headers = getHeaders_(sheet);
    const rows = getRows_(sheet);
    
    if (rows.length === 0) {
      Logger.log('⚠️ No skills found');
      return [];
    }
    
    const levelIdx = headers.indexOf('LevelName');
    const numIdx = headers.indexOf('SkillNumber');
    const descIdx = headers.indexOf('SkillDescription');
    
    return rows
      .filter(r => String(r[levelIdx]).trim() === levelName)
      .sort((a, b) => Number(a[numIdx]) - Number(b[numIdx]))
      .map(r => ({
        number: Number(r[numIdx]),
        description: String(r[descIdx]).trim()
      }));
  } catch (e) {
    Logger.log('❌ Error in getSkillsForLevel: ' + e.message);
    return [];
  }
}

// ==================== WEEK PLAN ====================
// NOTE: SkillNumber column in the WeekPlan sheet can now hold a SINGLE number
// (e.g. "2") OR a COMMA-SEPARATED LIST of numbers (e.g. "2,4,5") so that a
// single week can focus on more than one skill. Both formats are supported
// for backwards compatibility with existing data.
function getWeekPlan(levelName, weekNumber) {
  try {
    const sheet = getSheet_('WeekPlan');
    if (!sheet) {
      Logger.log('❌ WeekPlan sheet not found!');
      return { skills: [], outline: '', skillDescriptions: [] };
    }
    const headers = getHeaders_(sheet);
    const rows = getRows_(sheet);
    
    if (rows.length === 0) {
      return { skills: [], outline: '', skillDescriptions: [] };
    }
    
    const lIdx = headers.indexOf('LevelName');
    const wIdx = headers.indexOf('WeekNumber');
    const sIdx = headers.indexOf('SkillNumber');
    const oIdx = headers.indexOf('LessonOutline');
    
    const filtered = rows.filter(r => String(r[lIdx]).trim() === levelName && Number(r[wIdx]) === Number(weekNumber));

    // Parse skill numbers from every matching row, supporting both a single
    // number per row (legacy) and a comma-separated list in one row (new).
    let skills = [];
    filtered.forEach(r => {
      const raw = String(r[sIdx] || '').trim();
      if (!raw) return;
      raw.split(',').forEach(part => {
        const n = Number(String(part).trim());
        if (!isNaN(n) && n > 0) skills.push(n);
      });
    });
    // De-duplicate while preserving order
    skills = skills.filter((n, idx) => skills.indexOf(n) === idx);

    const outline = filtered.length > 0 ? String(filtered[0][oIdx] || '').trim() : 'No outline planned for this week.';
    
    // Get skill descriptions
    const skillDescriptions = [];
    if (skills.length > 0) {
      const skillsSheet = getSheet_('Skills');
      if (skillsSheet) {
        const sH = getHeaders_(skillsSheet);
        const sRows = getRows_(skillsSheet);
        const sLevelIdx = sH.indexOf('LevelName');
        const sNumIdx = sH.indexOf('SkillNumber');
        const sDescIdx = sH.indexOf('SkillDescription');
        const levelSkills = sRows.filter(r => String(r[sLevelIdx]).trim() === levelName);
        skills.forEach(num => {
          const match = levelSkills.find(r => Number(r[sNumIdx]) === num);
          if (match) skillDescriptions.push(String(match[sDescIdx]).trim());
        });
      }
    }
    
    Logger.log('📋 Week ' + weekNumber + ' skills: ' + JSON.stringify(skills));
    return { skills, outline, skillDescriptions };
  } catch (e) {
    Logger.log('❌ Error in getWeekPlan: ' + e.message);
    return { skills: [], outline: '', skillDescriptions: [] };
  }
}

// ==================== SAVE WEEK PLAN (supports multiple skills) ====================
// skillNumbers: array of integers, e.g. [1, 3, 4]
// This replaces ANY existing WeekPlan rows for this level+week with a single,
// clean row so the sheet never accumulates duplicate/contradictory rows.
function saveWeekPlan(levelName, weekNumber, skillNumbers, outline) {
  try {
    const sheet = getSheet_('WeekPlan');
    if (!sheet) {
      return { success: false, message: 'WeekPlan sheet not found.' };
    }
    const headers = getHeaders_(sheet);
    const lIdx = headers.indexOf('LevelName');
    const wIdx = headers.indexOf('WeekNumber');
    const sIdx = headers.indexOf('SkillNumber');
    const oIdx = headers.indexOf('LessonOutline');

    if (lIdx === -1 || wIdx === -1 || sIdx === -1 || oIdx === -1) {
      return { success: false, message: 'WeekPlan sheet is missing one of the required columns (LevelName, WeekNumber, SkillNumber, LessonOutline).' };
    }

    if (!Array.isArray(skillNumbers)) skillNumbers = [];
    const cleanSkills = skillNumbers
      .map(n => Number(n))
      .filter(n => !isNaN(n) && n > 0);

    // Remove any existing rows for this level+week (iterate bottom-up so
    // deleting doesn't shift the indices of rows we haven't checked yet).
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][lIdx]).trim() === levelName && Number(data[i][wIdx]) === Number(weekNumber)) {
        sheet.deleteRow(i + 1);
      }
    }

    // Write a single fresh row with all skills comma-separated.
    const newRow = new Array(headers.length).fill('');
    newRow[lIdx] = levelName;
    newRow[wIdx] = weekNumber;
    newRow[sIdx] = cleanSkills.join(',');
    newRow[oIdx] = outline || '';
    sheet.appendRow(newRow);

    Logger.log('✅ Week plan saved for ' + levelName + ' Week ' + weekNumber + ': skills [' + cleanSkills.join(',') + ']');
    return { success: true, message: 'Week plan saved with ' + cleanSkills.length + ' skill(s)!' };
  } catch (e) {
    Logger.log('❌ Error in saveWeekPlan: ' + e.message);
    return { success: false, message: 'Error: ' + e.message };
  }
}

// ==================== PROGRESS & HISTORY ====================
function getPupilProgress(pupilId, levelName) {
  try {
    const sheet = getSheet_('Assessments');
    if (!sheet) {
      Logger.log('❌ Assessments sheet not found!');
      return [];
    }
    const headers = getHeaders_(sheet);
    const rows = getRows_(sheet);
    const pIdx = headers.indexOf('PupilID');
    const lIdx = headers.indexOf('LevelName');
    const sIdx = headers.indexOf('SkillNumber');
    const scIdx = headers.indexOf('Score');
    const dIdx = headers.indexOf('Date');
    
    const filtered = rows.filter(r => String(r[pIdx]).trim() === pupilId && String(r[lIdx]).trim() === levelName);
    const latestScores = {};
    filtered.forEach(r => {
      const skill = Number(r[sIdx]);
      const date = new Date(r[dIdx]);
      if (!latestScores[skill] || date > new Date(latestScores[skill].date)) {
        latestScores[skill] = { score: Number(r[scIdx]), date: r[dIdx] };
      }
    });
    
    const skills = getSkillsForLevel(levelName);
    const skillCount = skills.length > 0 ? skills.length : 6;
    
    const progress = [];
    for (let i = 1; i <= skillCount; i++) {
      progress.push({
        skillNumber: i,
        score: latestScores[i] ? Number(latestScores[i].score) : null,
        assessed: !!latestScores[i]
      });
    }
    return progress;
  } catch (e) {
    Logger.log('❌ Error in getPupilProgress: ' + e.message);
    return [];
  }
}

function getPupilAssessments(pupilId) {
  try {
    const sheet = getSheet_('Assessments');
    if (!sheet) return [];
    const headers = getHeaders_(sheet);
    const rows = getRows_(sheet);
    const pIdx = headers.indexOf('PupilID');
    const sIdx = headers.indexOf('SkillNumber');
    const scIdx = headers.indexOf('Score');
    const dIdx = headers.indexOf('Date');
    const wIdx = headers.indexOf('WeekNumber');
    
    return rows
      .filter(r => String(r[pIdx]).trim() === pupilId)
      .map(r => ({
        skill: Number(r[sIdx]),
        score: Number(r[scIdx]),
        date: new Date(r[dIdx]),
        week: Number(r[wIdx])
      }));
  } catch (e) {
    Logger.log('❌ Error in getPupilAssessments: ' + e.message);
    return [];
  }
}

function getPupilHistory(pupilId) {
  try {
    const assessments = getPupilAssessments(pupilId);
    const weekMap = {};
    assessments.forEach(a => {
      const week = a.week;
      if (!weekMap[week]) weekMap[week] = { total: 0, count: 0 };
      weekMap[week].total += a.score;
      weekMap[week].count++;
    });
    const weeks = Object.keys(weekMap).sort((a, b) => Number(a) - Number(b));
    return weeks.map(w => ({ week: Number(w), total: weekMap[w].total }));
  } catch (e) {
    Logger.log('❌ Error in getPupilHistory: ' + e.message);
    return [];
  }
}

// ==================== ACHIEVEMENTS ====================
function getPupilAchievements(pupilId) {
  try {
    const sheet = getSheet_('Achievements');
    if (!sheet) return [];
    const headers = getHeaders_(sheet);
    const rows = getRows_(sheet);
    const pIdx = headers.indexOf('PupilID');
    const aIdx = headers.indexOf('AchievementName');
    const dIdx = headers.indexOf('DateEarned');
    
    return rows
      .filter(r => String(r[pIdx]).trim() === pupilId)
      .map(r => ({ name: String(r[aIdx]).trim(), date: r[dIdx] }));
  } catch (e) {
    Logger.log('❌ Error in getPupilAchievements: ' + e.message);
    return [];
  }
}

function awardAchievement(pupilId, achievementName) {
  try {
    const sheet = getSheet_('Achievements');
    if (!sheet) {
      Logger.log('❌ Achievements sheet not found!');
      return;
    }
    const existing = getPupilAchievements(pupilId).map(a => a.name);
    if (existing.includes(achievementName)) return;
    sheet.appendRow([pupilId, achievementName, new Date().toISOString()]);
    Logger.log('🏅 Awarded achievement: ' + achievementName + ' to ' + pupilId);
  } catch (e) {
    Logger.log('❌ Error in awardAchievement: ' + e.message);
  }
}

function checkAndAwardAchievements(pupilId, levelName) {
  try {
    const progress = getPupilProgress(pupilId, levelName);
    const scores = progress.map(p => p.score);
    const assessedCount = scores.filter(s => s !== null).length;
    const total = scores.reduce((a, b) => a + (b || 0), 0);
    const allAssessed = assessedCount === progress.length;
    const allPass = allAssessed && scores.every(s => s >= PASS_MIN);
    const totalPass = allAssessed && total >= PASS_TOTAL;
    const allFive = allAssessed && scores.every(s => s === 5);
    const totalAssessments = getPupilAssessments(pupilId).length;
    
    if (totalAssessments === 1) awardAchievement(pupilId, ACHIEVEMENTS.FIRST_ASSESS);
    if (assessedCount >= 3) awardAchievement(pupilId, ACHIEVEMENTS.HALFWAY);
    if (allAssessed) awardAchievement(pupilId, ACHIEVEMENTS.FULL_HOUSE);
    if (allPass) awardAchievement(pupilId, ACHIEVEMENTS.ALL_PASS);
    if (totalPass) awardAchievement(pupilId, ACHIEVEMENTS.TOTAL_PASS);
    if (allFive) awardAchievement(pupilId, ACHIEVEMENTS.PERFECT_SCORE);
  } catch (e) {
    Logger.log('❌ Error in checkAndAwardAchievements: ' + e.message);
  }
}

function awardPromotionAchievement(pupilId, newLevel) {
  awardAchievement(pupilId, ACHIEVEMENTS.PROMOTION);
  if (newLevel === LEVEL_ORDER[LEVEL_ORDER.length - 1]) {
    awardAchievement(pupilId, ACHIEVEMENTS.HIGHEST_LEVEL);
  }
}

// ==================== SAVE SCORE ====================
function saveSkillScore(pupilId, classId, levelName, weekNumber, skillNumber, score) {
  try {
    const sheet = getSheet_('Assessments');
    if (!sheet) {
      Logger.log('❌ Assessments sheet not found!');
      return false;
    }
    const date = new Date().toISOString().split('T')[0];
    const assessmentId = Utilities.getUuid();
    sheet.appendRow([assessmentId, pupilId, classId, levelName, weekNumber, date, skillNumber, score]);
    Logger.log('✅ Saved score: ' + pupilId + ' skill ' + skillNumber + ' = ' + score);
    checkAndAwardAchievements(pupilId, levelName);
    return true;
  } catch (e) {
    Logger.log('❌ Error in saveSkillScore: ' + e.message);
    return false;
  }
}

// ==================== CHECK PROMOTION ====================
function checkPromotion(pupilId, levelName) {
  try {
    const progress = getPupilProgress(pupilId, levelName);
    const scores = progress.map(p => p.score);
    
    if (scores.includes(null)) {
      return { 
        eligible: false, 
        reason: `Only ${scores.filter(s => s !== null).length}/${progress.length} skills assessed.` 
      };
    }
    
    const minScore = Math.min(...scores);
    if (minScore < PASS_MIN) {
      return { 
        eligible: false, 
        reason: `Minimum score is ${minScore} (need ≥ ${PASS_MIN}).` 
      };
    }
    
    const total = scores.reduce((a, b) => a + b, 0);
    if (total < PASS_TOTAL) {
      return { 
        eligible: false, 
        reason: `Total is ${total} (need ≥ ${PASS_TOTAL}).` 
      };
    }
    
    const currentIndex = LEVEL_ORDER.indexOf(levelName);
    if (currentIndex === -1 || currentIndex === LEVEL_ORDER.length - 1) {
      return { 
        eligible: false, 
        reason: 'Already at highest level or unknown level.' 
      };
    }
    
    return { eligible: true, nextLevel: LEVEL_ORDER[currentIndex + 1], total: total };
  } catch (e) {
    Logger.log('❌ Error in checkPromotion: ' + e.message);
    return { eligible: false, reason: 'Error: ' + e.message };
  }
}

// ==================== PERFORM PROMOTION ====================
function performPromotion(pupilId, levelName) {
  try {
    const progress = getPupilProgress(pupilId, levelName);
    const scores = progress.map(p => p.score);
    const total = scores.reduce((a, b) => a + b, 0);
    
    const currentIndex = LEVEL_ORDER.indexOf(levelName);
    const nextLevel = LEVEL_ORDER[currentIndex + 1];
    
    const pupilSheet = getSheet_('Pupils');
    if (!pupilSheet) {
      return { success: false, message: 'Pupils sheet not found.' };
    }
    
    const pH = getHeaders_(pupilSheet);
    const pRows = getRows_(pupilSheet);
    const idIdx = pH.indexOf('PupilID');
    const levelIdx = pH.indexOf('CurrentLevel');
    const classIdx = pH.indexOf('ClassID');
    
    let rowIndex = -1;
    for (let i = 0; i < pRows.length; i++) {
      if (String(pRows[i][idIdx]).trim() === pupilId) {
        rowIndex = i + 2;
        break;
      }
    }
    if (rowIndex === -1) {
      return { success: false, message: 'Pupil not found.' };
    }
    
    const classSheet = getSheet_('Classes');
    if (!classSheet) {
      return { success: false, message: 'Classes sheet not found.' };
    }
    
    const cH = getHeaders_(classSheet);
    const cRows = getRows_(classSheet);
    const cLevelIdx = cH.indexOf('LevelName');
    const cDayIdx = cH.indexOf('Day');
    const cTimeIdx = cH.indexOf('Time');
    const cIdIdx = cH.indexOf('ClassID');
    
    let currentClassId = String(pRows[rowIndex - 2][classIdx] || '').trim();
    let currentDay = '', currentTime = '';
    if (currentClassId) {
      const currClass = cRows.find(r => String(r[cIdIdx]).trim() === currentClassId);
      if (currClass) {
        currentDay = String(currClass[cDayIdx]).trim();
        currentTime = String(currClass[cTimeIdx]).trim();
      }
    }
    
    let newClassId = null;
    let candidates = cRows.filter(r => String(r[cLevelIdx]).trim() === nextLevel);
    if (currentDay && currentTime) {
      const match = candidates.find(r => String(r[cDayIdx]).trim() === currentDay && String(r[cTimeIdx]).trim() === currentTime);
      if (match) newClassId = String(match[cIdIdx]).trim();
    }
    if (!newClassId && candidates.length > 0) {
      newClassId = String(candidates[0][cIdIdx]).trim();
    }
    
    pupilSheet.getRange(rowIndex, levelIdx + 1).setValue(nextLevel);
    if (newClassId) {
      pupilSheet.getRange(rowIndex, classIdx + 1).setValue(newClassId);
    }
    
    awardPromotionAchievement(pupilId, nextLevel);
    checkAndAwardAchievements(pupilId, nextLevel);
    
    const pupilName = String(pRows[rowIndex - 2][pH.indexOf('FirstName')] || '').trim() + ' ' + 
                     String(pRows[rowIndex - 2][pH.indexOf('LastName')] || '').trim();
    
    Logger.log('🎉 PROMOTED: ' + pupilId + ' to ' + nextLevel);
    
    return {
      success: true,
      newLevel: nextLevel,
      newClassId: newClassId,
      total: total,
      pupilName: pupilName,
      fromLevel: levelName
    };
  } catch (e) {
    Logger.log('❌ Error in performPromotion: ' + e.message);
    return { success: false, message: 'Error: ' + e.message };
  }
}

// ==================== SEND EMAIL AND PROMOTE ====================
function sendEmailAndPromote(pupilId, levelName, weekNumber, classId, force) {
  try {
    // First, get pupil details BEFORE promotion
    const pupilSheet = getSheet_('Pupils');
    if (!pupilSheet) {
      return { success: false, message: 'Pupils sheet not found.' };
    }
    
    const pH = getHeaders_(pupilSheet);
    const pRows = getRows_(pupilSheet);
    const idIdx = pH.indexOf('PupilID');
    const nameIdx = pH.indexOf('FirstName');
    const lastIdx = pH.indexOf('LastName');
    const emailIdx = pH.indexOf('ParentEmail');
    const levelIdx = pH.indexOf('CurrentLevel');
    
    let pupil = null;
    for (let row of pRows) {
      if (String(row[idIdx]).trim() === pupilId) {
        pupil = {
          id: pupilId,
          name: String(row[nameIdx] || '').trim() + ' ' + String(row[lastIdx] || '').trim(),
          email: String(row[emailIdx] || '').trim(),
          level: String(row[levelIdx] || '').trim()
        };
        break;
      }
    }
    if (!pupil) return { success: false, message: 'Pupil not found.' };
    if (!pupil.email) return { success: false, message: 'No parent email on record.' };

    // ---- Duplicate-send guard ----
    // Requires a sheet named "EmailLog" with columns: PupilID, LevelName, WeekNumber, DateSent.
    // If that sheet doesn't exist, the guard is silently skipped (logged as a warning).
    if (!force && hasEmailBeenSent(pupilId, levelName, weekNumber)) {
      return {
        success: false,
        alreadySent: true,
        message: 'An update for Week ' + weekNumber + ' was already sent to ' + pupil.name + "'s parent. Send it again?"
      };
    }

    Logger.log('📧 Sending email for: ' + pupil.name + ' (' + pupil.email + ')');

    // Get class details for the teacher name
    let teacherName = 'Not assigned';
    let classDay = '';
    let classTime = '';
    if (classId) {
      const classDetails = getClassDetails(classId);
      if (classDetails) {
        teacherName = classDetails.teacherName || 'Not assigned';
        classDay = classDetails.day || '';
        classTime = classDetails.time || '';
      }
    }

    // Get progress with individual skill scores
    const progress = getPupilProgress(pupilId, levelName);
    const scores = progress.map(p => p.score);
    const assessed = scores.filter(s => s !== null).length;
    const total = scores.filter(s => s !== null).reduce((a, b) => a + b, 0);
    const minScore = assessed > 0 ? Math.min(...scores.filter(s => s !== null)) : 'N/A';
    
    // Get skill descriptions
    const skills = getSkillsForLevel(levelName);
    
    // Build skill score table
    let skillTableHtml = '';
    if (skills.length > 0) {
      skillTableHtml = `
        <table style="width:100%; border-collapse:collapse; margin:10px 0; font-size:0.9em;">
          <thead>
            <tr style="background:#1a3e6f; color:white;">
              <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">#</th>
              <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">Skill</th>
              <th style="padding:8px 12px; text-align:center; border:1px solid #ddd;">Score</th>
              <th style="padding:8px 12px; text-align:center; border:1px solid #ddd;">Status</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      progress.forEach((p, idx) => {
        const skill = skills[idx] || { description: 'Unknown' };
        const isAssessed = p.assessed;
        const scoreDisplay = isAssessed ? p.score : '—';
        const statusColor = isAssessed ? (p.score >= PASS_MIN ? '#28a745' : '#dc3545') : '#ffc107';
        const statusText = isAssessed ? (p.score >= PASS_MIN ? '✅ Pass' : '❌ Needs work') : '⏳ Not yet';
        const rowColor = isAssessed ? (p.score >= PASS_MIN ? '#eaf7e6' : '#f8d7da') : '#fff3e0';
        
        skillTableHtml += `
          <tr style="background:${rowColor};">
            <td style="padding:6px 12px; border:1px solid #ddd; text-align:center; font-weight:bold;">${p.skillNumber}</td>
            <td style="padding:6px 12px; border:1px solid #ddd;">${skill.description}</td>
            <td style="padding:6px 12px; border:1px solid #ddd; text-align:center; font-weight:bold; font-size:1.1em;">${scoreDisplay}</td>
            <td style="padding:6px 12px; border:1px solid #ddd; text-align:center; color:${statusColor}; font-weight:600;">${statusText}</td>
          </tr>
        `;
      });
      
      skillTableHtml += `
          </tbody>
        </table>
      `;
    }

    // Get week plan with descriptions
    const weekPlan = getWeekPlan(levelName, weekNumber);
    const skillDescriptions = weekPlan.skillDescriptions || [];
    const outline = weekPlan.outline || 'No outline planned for this week.';
    
    // Build skill focus list
    let skillFocusHtml = '';
    if (skillDescriptions.length > 0) {
      skillFocusHtml = skillDescriptions.map(d => `<li>${d}</li>`).join('');
    } else {
      skillFocusHtml = '<li>No specific skills mapped for this week.</li>';
    }
    
    // Calculate promotion status (moved earlier so the badge styling below can use it)
    const allAssessed = assessed === progress.length;
    const allPass = allAssessed && scores.every(s => s >= PASS_MIN);
    const totalPass = allAssessed && total >= PASS_TOTAL;
    const isEligible = allAssessed && allPass && totalPass;
    const currentIndex = LEVEL_ORDER.indexOf(levelName);
    const nextLevel = isEligible && currentIndex < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[currentIndex + 1] : null;
    const justPromoted = isEligible && !!nextLevel;

    // Get achievements
    const achievements = getPupilAchievements(pupilId);
    
    // Build achievement badges HTML for email header
    let achievementBadgesHtml = '';
    if (achievements.length > 0) {
      const badgeColors = {
        '🌟 First Splash': '#FFD700',
        '💪 Halfway Hero (3 skills)': '#C0C0C0',
        '🏆 Full House (all 6 skills)': '#FF6B35',
        '🥉 Bronze Pass (all skills ≥3)': '#CD7F32',
        '🥈 Silver Pass (total ≥20)': '#C0C0C0',
        '🥇 Gold Star (all 5s)': '#FFD700',
        '🚀 Level Up!': '#9B59B6',
        '👑 Master Swimmer': '#FF6B6B'
      };
      const headerColor = justPromoted ? 'rgba(42,28,5,0.75)' : 'rgba(255,255,255,0.85)';
      
      achievementBadgesHtml = `
        <div style="margin: 18px 0 4px 0;">
          <p style="margin:0 0 10px 0; font-weight:700; color:${headerColor}; font-size:0.8em; letter-spacing:0.5px; text-transform:uppercase;">🏅 Achievements Earned</p>
          <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">
      `;
      achievements.forEach(a => {
        const color = badgeColors[a.name] || '#f0f4fa';
        const textColor = color === '#FFD700' ? '#333' : 'white';
        achievementBadgesHtml += `
          <span style="background:${color}; color:${textColor}; padding:5px 14px; border-radius:20px; font-size:0.78em; font-weight:700; box-shadow:0 2px 6px rgba(0,0,0,0.2); display:inline-block;">
            ${a.name}
          </span>
        `;
      });
      achievementBadgesHtml += `
          </div>
        </div>
      `;
    } else {
      const fallbackBg = justPromoted ? 'rgba(42,28,5,0.1)' : 'rgba(255,255,255,0.1)';
      const fallbackColor = justPromoted ? 'rgba(42,28,5,0.7)' : 'rgba(255,255,255,0.7)';
      achievementBadgesHtml = `
        <div style="margin: 18px 0 4px 0; padding: 10px 14px; background:${fallbackBg}; border-radius:10px;">
          <p style="margin:0; font-size:0.85em; color:${fallbackColor};">No achievements yet – keep swimming! 🏊</p>
        </div>
      `;
    }

    let promotionStatus = '';
    if (isEligible && nextLevel) {
      promotionStatus = `<p style="color:#28a745; font-weight:bold; font-size:1.1em;">🎉 PROMOTED to ${nextLevel}! All criteria met!</p>`;
    } else if (allAssessed) {
      let reasons = [];
      if (!allPass) reasons.push('some skills below 3');
      if (!totalPass) reasons.push(`total score ${total}/${PASS_TOTAL}`);
      promotionStatus = `<p style="color:#ffc107; font-weight:bold;">⏳ ${reasons.join(' and ')} - keep practicing!</p>`;
    } else {
      promotionStatus = `<p style="color:#6c757d;">📝 ${assessed}/${progress.length} skills assessed - keep going!</p>`;
    }

    // Build social share URLs with badges
    const shareText = encodeURIComponent('🏊 My child ' + pupil.name + ' just completed ' + pupil.level + ' at Peter Hill Swimming!');
    const shareBadges = achievements.map(a => a.name.split('(')[0].trim()).join(' ');
    const fullShareText = encodeURIComponent('🏊 My child ' + pupil.name + ' just completed ' + pupil.level + ' at Peter Hill Swimming! ' + shareBadges);
    const shareUrl = encodeURIComponent('https://www.peterhillswimming.com');
    
    // Facebook share with page link and badges
    const facebookShareText = encodeURIComponent('🏊 My child ' + pupil.name + ' just completed ' + pupil.level + ' at Peter Hill Swimming! ' + shareBadges + ' 🏅\n\nCheck out Peter Hill Swimming: https://www.facebook.com/peterhillswimming');
    const facebookShareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + shareUrl + '&quote=' + facebookShareText;
    
    // X (Twitter) share with profile link and badges
    const twitterShareText = encodeURIComponent('🏊 My child ' + pupil.name + ' just completed ' + pupil.level + ' at Peter Hill Swimming! ' + shareBadges + ' 🏅\n\nFollow @phill2806 for more swim excellence!');
    const twitterShareUrl = 'https://twitter.com/intent/tweet?text=' + twitterShareText + '&url=' + shareUrl;
    
    // WhatsApp share
    const whatsappShareText = encodeURIComponent('🏊 My child ' + pupil.name + ' just completed ' + pupil.level + ' at Peter Hill Swimming! ' + shareBadges + ' 🏅\n\nCheck out Peter Hill Swimming: https://www.facebook.com/peterhillswimming');
    const whatsappShareUrl = 'https://api.whatsapp.com/send?text=' + whatsappShareText;

    // ---- Shareable badge styling: gold/coral when just promoted, navy otherwise ----
    const firstName = pupil.name.trim().split(' ')[0] || pupil.name;
    const badgeBackground = justPromoted
      ? 'linear-gradient(135deg, #f4b400 0%, #ff7a45 100%)'
      : 'linear-gradient(135deg, #0f2a45 0%, #081a2b 100%)';
    const badgeTextColor = justPromoted ? '#2a1c05' : '#ffffff';
    const badgeAccentColor = justPromoted ? '#5c3b00' : '#ff9c6f';
    const badgeTagBg = justPromoted ? 'rgba(42,28,5,0.15)' : 'rgba(255,255,255,0.15)';
    const badgeTagColor = justPromoted ? '#2a1c05' : 'rgba(255,255,255,0.9)';
    const badgeRibbonBg = '#ffffff';
    const badgeRibbonText = '#e8622e';
    const badgePillBg = justPromoted ? 'rgba(42,28,5,0.15)' : '#ff7a45';
    const badgePillText = justPromoted ? '#2a1c05' : '#ffffff';

    let htmlBody = `
      <html>
      <head>
        <style>
          body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; color: #16232f; max-width: 600px; margin: auto; padding: 0; background:#f2f6f9; }
          .outer { padding: 16px; }
          h3 { color: #0f2a45; margin: 22px 0 10px 0; font-size: 1.05em; }
          p { line-height: 1.5; }

          /* ---- Shareable badge: this is the bit designed to be screenshotted ---- */
          .badge-card {
            border-radius: 20px;
            padding: 26px 20px 22px 20px;
            text-align: center;
            margin-bottom: 18px;
            position: relative;
          }
          .badge-tag {
            display: inline-block;
            background: rgba(255,255,255,0.15);
            color: rgba(255,255,255,0.9);
            font-size: 0.65em;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding: 3px 10px;
            border-radius: 20px;
            margin-bottom: 12px;
          }
          .badge-logo { width: 56px; height: 56px; border-radius: 50%; margin-bottom: 10px; border: 2px solid rgba(255,255,255,0.35); display: block; margin-left: auto; margin-right: auto; }
          .badge-club { margin: 0; font-size: 0.78em; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; }
          .badge-name { margin: 8px 0 12px 0; font-size: 2em; font-weight: 800; }
          .badge-ribbon {
            display: inline-block;
            font-size: 1.05em;
            font-weight: 800;
            padding: 6px 18px;
            border-radius: 20px;
            margin-bottom: 10px;
          }
          .badge-pill { display: inline-block; padding: 7px 18px; border-radius: 20px; font-size: 0.85em; font-weight: 700; margin: 0 4px 6px 4px; }
          .badge-caption {
            text-align: center;
            font-size: 0.78em;
            color: #64748b;
            margin: -10px 0 18px 0;
          }

          .summary-box, .progress-box { background: #eef3f7; padding: 16px 18px; border-radius: 12px; margin: 14px 0; }
          .bar-bg { background: #dde5ec; height: 18px; border-radius: 10px; margin: 6px 0 12px 0; overflow: hidden; }
          .bar-fill { background: #0f2a45; height: 18px; border-radius: 10px; width: 0%; }
          .bar-fill.green { background: #17a589; }
          .bar-fill.yellow { background: #ff7a45; }
          ul { padding-left: 20px; }
          li { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 0.88em; }
          th { background: #0f2a45; color: white; padding: 8px 12px; text-align: left; border: 1px solid #dde5ec; }
          td { padding: 7px 12px; border: 1px solid #dde5ec; }
          .footer { 
            margin-top: 26px; 
            padding-top: 18px; 
            border-top: 2px solid #e0e6eb; 
            text-align: center; 
            color: #64748b; 
            font-size: 0.8em;
          }
          .footer-logo {
            width: 46px;
            height: 46px;
            border-radius: 50%;
            display: block;
            margin: 0 auto 8px auto;
          }
          .referral-box {
            background: #fff4ec;
            border-radius: 12px;
            padding: 14px 18px;
            margin: 18px 0;
            text-align: center;
            font-size: 0.88em;
            border: 1px solid #ffd9bf;
          }
          .cert-note { 
            background: #e8f0f8; 
            padding: 14px 18px; 
            border-radius: 12px; 
            margin: 15px 0;
            border-left: 4px solid #0f2a45;
          }
          .lesson-box {
            background: #f6f9fb;
            padding: 16px 18px;
            border-radius: 12px;
            margin: 15px 0;
            border-left: 4px solid #17a589;
          }
          .lesson-box p { margin: 5px 0; }
          .share-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 14px 0;
            justify-content: center;
          }
          .share-btn {
            display: inline-block;
            padding: 9px 18px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.85em;
            color: white;
          }
          .share-btn.facebook { background: #1877f2; }
          .share-btn.twitter { background: #000000; }
          .share-btn.whatsapp { background: #25d366; }
          .screenshot-tip {
            text-align: center;
            font-size: 0.82em;
            color: #64748b;
            margin: 4px 0 14px 0;
          }
          .follow-links { margin: 10px 0; font-size: 0.85em; text-align: center; }
          .follow-links a { color: #0f2a45; text-decoration: none; font-weight: 600; }
          .follow-links a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="outer">

          <div class="badge-card" style="background:${badgeBackground}; color:${badgeTextColor};">
            <span class="badge-tag" style="background:${badgeTagBg}; color:${badgeTagColor};">📸 Shareable Badge</span>
            <img src="${LOGO_URL}" alt="Peter Hill Swimming" class="badge-logo">
            <p class="badge-club" style="color:${badgeAccentColor};">Peter Hill Swimming</p>
            <h1 class="badge-name">${firstName}</h1>
            ${isEligible && nextLevel ? `
              <div class="badge-ribbon" style="background:${badgeRibbonBg}; color:${badgeRibbonText};">🏆 LEVEL COMPLETE!</div>
              <div><span class="badge-pill" style="background:${badgePillBg}; color:${badgePillText};">${pupil.level} → ${nextLevel}</span></div>
            ` : `
              <div><span class="badge-pill" style="background:${badgePillBg}; color:${badgePillText};">Currently: ${pupil.level}</span></div>
            `}
            ${achievementBadgesHtml}
          </div>
          <p class="badge-caption">⬆️ Tap and hold (or screenshot) to save and share ${firstName}'s badge</p>

          <p>Dear Parent,</p>
          <p>Here is <strong>${pupil.name}</strong>'s progress update for this week:</p>

          <div class="lesson-box">
            <p><strong>👩‍🏫 Your teacher today was:</strong> ${teacherName}</p>
            <p><strong>📋 This week's focus (skills prescribed):</strong></p>
            <ul>${skillFocusHtml}</ul>

            <p><strong>📝 This week we worked on:</strong></p>
            <p><em>${outline}</em></p>
          </div>

          <h3>📊 Individual Skill Scores</h3>
          ${skillTableHtml}

          <div class="summary-box">
            <p style="margin:0 0 8px 0;"><strong>📈 Summary</strong></p>
            <p style="margin:4px 0;">✅ Skills assessed: <strong>${assessed} / ${progress.length}</strong></p>
            <p style="margin:4px 0;">⭐ Total score: <strong>${total} / ${progress.length * 5}</strong> (need ≥ ${PASS_TOTAL} to pass)</p>
            <p style="margin:4px 0;">🏅 Lowest skill score: <strong>${minScore}</strong> (need ≥ ${PASS_MIN} each)</p>
            ${promotionStatus}
          </div>

          <div class="progress-box">
            <p style="margin:0 0 4px 0;"><strong>Skills assessed</strong> — ${assessed}/${progress.length}</p>
            <div class="bar-bg"><div class="bar-fill" style="width: ${(assessed/progress.length)*100}%;"></div></div>
            <p style="margin:0 0 4px 0;"><strong>Total score</strong> — ${total}/${progress.length * 5}</p>
            <div class="bar-bg"><div class="bar-fill ${total >= PASS_TOTAL ? 'green' : 'yellow'}" style="width: ${Math.min((total/(progress.length * 5))*100, 100)}%;"></div></div>
          </div>

          ${isEligible && nextLevel ? `
          <div class="cert-note">
            <p style="margin:0; font-size:0.95em;">
              📄 <strong>Certificate Attached:</strong> 
              ${pupil.name} has successfully completed ${pupil.level} and is promoted to ${nextLevel}!
              <br><span style="font-size:0.85em; color:#555;">Please find the personalised PDF certificate attached to this email.</span>
            </p>
            <p id="certStatus" style="margin:5px 0 0 0; font-size:0.85em; color:#888;">Generating certificate...</p>
          </div>
          ` : ''}

          <h3>📣 Share This With Friends &amp; Family</h3>
          <p class="screenshot-tip">📸 Tip: the card at the top of this email is designed to look great as a screenshot — perfect for Instagram or WhatsApp status, where links don't work.</p>
          <div class="share-buttons">
            <a href="${facebookShareUrl}" target="_blank" class="share-btn facebook">📘 Facebook</a>
            <a href="${twitterShareUrl}" target="_blank" class="share-btn twitter">🐦 X (Twitter)</a>
            <a href="${whatsappShareUrl}" target="_blank" class="share-btn whatsapp">💬 WhatsApp</a>
          </div>
          <div class="follow-links">
            <p style="margin:5px 0;">Follow us for more swim excellence!</p>
            <p style="margin:5px 0;">
              <a href="https://www.facebook.com/peterhillswimming" target="_blank">📘 Facebook</a> · 
              <a href="https://x.com/phill2806" target="_blank">🐦 X (Twitter)</a>
            </p>
          </div>

          <div class="referral-box">
            💙 Know a friend whose child would love lessons with us? We'd love to have them join ${pupil.name} in the pool!
          </div>

          <p style="margin-top: 20px;">Keep up the great effort in the pool! 🏊</p>
          <p>– The Peter Hill Swimming Team</p>

          <div class="footer">
            <img src="${LOGO_URL}" alt="Peter Hill Swimming" class="footer-logo">
            <p style="margin:0;"><strong>Peter Hill Swimming</strong></p>
            <p style="margin:4px 0 0 0; font-size:0.7em;">Excellence in Swim Education</p>
            <p style="margin:8px 0 0 0; font-size:0.65em;">This is an automated message from your swim school tracking system.</p>
          </div>

        </div>
      </body>
      </html>
    `;

    // ---- Test mode: redirect real parent emails to a safe test address ----
    const settings = getSettings();
    let recipientEmail = pupil.email;
    let subjectPrefix = '';
    if (settings.testMode && settings.testEmail) {
      recipientEmail = settings.testEmail;
      subjectPrefix = '[TEST MODE - would go to ' + pupil.email + '] ';
    }

    // Create the email with attachment
    const emailOptions = {
      to: recipientEmail,
      subject: `${subjectPrefix}Weekly Swim Update - ${pupil.name} - Week ${weekNumber}`,
      htmlBody: htmlBody
    };

    // Generate and attach certificate if promoted
    let certificateAttached = false;
    if (isEligible && nextLevel) {
      try {
        Logger.log('📄 Attempting to generate certificate for: ' + pupil.name + ' (' + levelName + ')');
        const certPdf = generateCertificatePdf(pupil.name, levelName);
        if (certPdf) {
          emailOptions.attachments = [certPdf];
          certificateAttached = true;
          Logger.log('📎 Certificate attached for: ' + pupil.name + ' (' + levelName + ') - Size: ' + certPdf.getBytes().length + ' bytes');
          htmlBody = htmlBody.replace(
            '<p id="certStatus" style="margin:5px 0 0 0; font-size:0.85em; color:#888;">Generating certificate...</p>',
            '<p style="margin:5px 0 0 0; font-size:0.85em; color:#28a745;">✅ Certificate generated and attached!</p>'
          );
          emailOptions.htmlBody = htmlBody;
        } else {
          Logger.log('⚠️ Failed to generate certificate for: ' + pupil.name);
          htmlBody = htmlBody.replace(
            '<p id="certStatus" style="margin:5px 0 0 0; font-size:0.85em; color:#888;">Generating certificate...</p>',
            '<p style="margin:5px 0 0 0; font-size:0.85em; color:#e74c3c;">⚠️ Certificate could not be generated. Please contact the swim school.</p>'
          );
          emailOptions.htmlBody = htmlBody;
        }
      } catch (certError) {
        Logger.log('❌ Certificate generation error: ' + certError.message);
        htmlBody = htmlBody.replace(
          '<p id="certStatus" style="margin:5px 0 0 0; font-size:0.85em; color:#888;">Generating certificate...</p>',
          '<p style="margin:5px 0 0 0; font-size:0.85em; color:#e74c3c;">⚠️ Certificate generation error: ' + certError.message + '</p>'
        );
        emailOptions.htmlBody = htmlBody;
      }
    }

    // Send the email
    MailApp.sendEmail(emailOptions);
    Logger.log('📧 Email sent to ' + recipientEmail + (settings.testMode ? ' (TEST MODE, real parent is ' + pupil.email + ')' : '') + ' (Certificate attached: ' + certificateAttached + ')');
    logEmailSent(pupilId, levelName, weekNumber);

    // Now perform the promotion if eligible
    let promotionResult = null;
    if (isEligible && nextLevel) {
      promotionResult = performPromotion(pupilId, levelName);
      if (promotionResult.success) {
        Logger.log('🎉 Promotion completed: ' + pupil.name + ' → ' + nextLevel);
      } else {
        Logger.log('⚠️ Promotion failed: ' + promotionResult.message);
      }
    }

    return { 
      success: true, 
      message: `Email sent to ${recipientEmail}${settings.testMode ? ' (test mode)' : ''}${isEligible && nextLevel && promotionResult && promotionResult.success ? ' and pupil promoted to ' + nextLevel : ''}`,
      promoted: isEligible && nextLevel && promotionResult && promotionResult.success,
      newLevel: promotionResult && promotionResult.success ? promotionResult.newLevel : null,
      certificateAttached: certificateAttached,
      testMode: settings.testMode
    };
  } catch (e) {
    Logger.log('❌ Error in sendEmailAndPromote: ' + e.message);
    Logger.log('❌ Stack trace: ' + e.stack);
    return { success: false, message: 'Error sending email: ' + e.message };
  }
}

// ==================== SETTINGS (TEST MODE) ====================
// Persisted with PropertiesService so it survives between sessions.
function getSettings() {
  try {
    const props = PropertiesService.getScriptProperties();
    return {
      testMode: props.getProperty('TEST_MODE') === 'true',
      testEmail: props.getProperty('TEST_EMAIL') || ''
    };
  } catch (e) {
    Logger.log('❌ Error in getSettings: ' + e.message);
    return { testMode: false, testEmail: '' };
  }
}

function saveSettings(testMode, testEmail) {
  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty('TEST_MODE', testMode ? 'true' : 'false');
    props.setProperty('TEST_EMAIL', testEmail || '');
    Logger.log('⚙️ Settings saved. Test mode: ' + testMode + ', Test email: ' + testEmail);
    return { success: true, message: testMode ? 'Test mode ON — all parent emails will go to ' + testEmail + ' instead.' : 'Test mode OFF — emails will go to real parent addresses.' };
  } catch (e) {
    Logger.log('❌ Error in saveSettings: ' + e.message);
    return { success: false, message: 'Error: ' + e.message };
  }
}

// ==================== DUPLICATE-SEND GUARD ====================
// Requires a sheet named "EmailLog" with columns: PupilID, LevelName, WeekNumber, DateSent.
// If the sheet is missing, the guard is skipped (logged as a warning) rather than blocking sends.
function hasEmailBeenSent(pupilId, levelName, weekNumber) {
  try {
    const sheet = getSheet_('EmailLog');
    if (!sheet) {
      Logger.log('⚠️ EmailLog sheet not found - duplicate-send protection is disabled. Add a sheet named "EmailLog" with columns PupilID, LevelName, WeekNumber, DateSent to enable it.');
      return false;
    }
    const headers = getHeaders_(sheet);
    const rows = getRows_(sheet);
    const pIdx = headers.indexOf('PupilID');
    const lIdx = headers.indexOf('LevelName');
    const wIdx = headers.indexOf('WeekNumber');
    if (pIdx === -1 || lIdx === -1 || wIdx === -1) return false;
    return rows.some(r =>
      String(r[pIdx]).trim() === pupilId &&
      String(r[lIdx]).trim() === levelName &&
      Number(r[wIdx]) === Number(weekNumber)
    );
  } catch (e) {
    Logger.log('❌ Error in hasEmailBeenSent: ' + e.message);
    return false;
  }
}

function logEmailSent(pupilId, levelName, weekNumber) {
  try {
    const sheet = getSheet_('EmailLog');
    if (!sheet) return;
    sheet.appendRow([pupilId, levelName, weekNumber, new Date().toISOString()]);
  } catch (e) {
    Logger.log('❌ Error in logEmailSent: ' + e.message);
  }
}

// ==================== ATTENDANCE ====================
// Requires a sheet named "Attendance" with columns: AttendanceID, PupilID, ClassID, Date, Status.
function getAttendance(classId, date) {
  try {
    const sheet = getSheet_('Attendance');
    if (!sheet) return {};
    const headers = getHeaders_(sheet);
    const rows = getRows_(sheet);
    const pIdx = headers.indexOf('PupilID');
    const cIdx = headers.indexOf('ClassID');
    const dIdx = headers.indexOf('Date');
    const sIdx = headers.indexOf('Status');
    if (pIdx === -1 || cIdx === -1 || dIdx === -1 || sIdx === -1) return {};

    const result = {};
    rows.forEach(r => {
      if (String(r[cIdx]).trim() === String(classId).trim() && String(r[dIdx]).trim() === String(date).trim()) {
        result[String(r[pIdx]).trim()] = String(r[sIdx]).trim();
      }
    });
    return result;
  } catch (e) {
    Logger.log('❌ Error in getAttendance: ' + e.message);
    return {};
  }
}

// records: array of { pupilId, status } where status is 'Present' or 'Absent'
function markAttendance(classId, date, records) {
  try {
    const sheet = getSheet_('Attendance');
    if (!sheet) {
      return { success: false, message: 'Attendance sheet not found. Create a sheet named "Attendance" with columns: AttendanceID, PupilID, ClassID, Date, Status.' };
    }
    const headers = getHeaders_(sheet);
    const pIdx = headers.indexOf('PupilID');
    const cIdx = headers.indexOf('ClassID');
    const dIdx = headers.indexOf('Date');
    const sIdx = headers.indexOf('Status');
    const idIdx = headers.indexOf('AttendanceID');

    if (pIdx === -1 || cIdx === -1 || dIdx === -1 || sIdx === -1) {
      return { success: false, message: 'Attendance sheet is missing one of the required columns (PupilID, ClassID, Date, Status).' };
    }
    if (!Array.isArray(records)) records = [];

    // Remove any existing rows for this class+date so re-saving never duplicates entries.
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][cIdx]).trim() === String(classId).trim() && String(data[i][dIdx]).trim() === String(date).trim()) {
        sheet.deleteRow(i + 1);
      }
    }

    records.forEach(r => {
      const newRow = new Array(headers.length).fill('');
      if (idIdx > -1) newRow[idIdx] = Utilities.getUuid();
      newRow[pIdx] = r.pupilId;
      newRow[cIdx] = classId;
      newRow[dIdx] = date;
      newRow[sIdx] = r.status;
      sheet.appendRow(newRow);
    });

    Logger.log('✅ Attendance saved for class ' + classId + ' on ' + date + ' (' + records.length + ' pupil(s))');
    return { success: true, message: 'Attendance saved for ' + records.length + ' pupil(s).' };
  } catch (e) {
    Logger.log('❌ Error in markAttendance: ' + e.message);
    return { success: false, message: 'Error: ' + e.message };
  }
}

// ==================== RESET ACHIEVEMENTS ====================
function resetAllAchievements() {
  try {
    const sheet = getSheet_('Achievements');
    if (!sheet) {
      return { success: false, message: 'Achievements sheet not found.' };
    }
    
    const headers = getHeaders_(sheet);
    if (headers.length === 0) {
      return { success: false, message: 'No headers found in Achievements sheet.' };
    }
    
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    Logger.log('✅ All achievements have been reset');
    return { success: true, message: 'All achievements have been reset successfully!' };
  } catch (e) {
    Logger.log('❌ Error resetting achievements: ' + e.message);
    return { success: false, message: 'Error: ' + e.message };
  }
}

function resetPupilAchievements(pupilId) {
  try {
    if (!pupilId) {
      return { success: false, message: 'No pupil selected.' };
    }
    
    const sheet = getSheet_('Achievements');
    if (!sheet) {
      return { success: false, message: 'Achievements sheet not found.' };
    }
    
    const headers = getHeaders_(sheet);
    const rows = getRows_(sheet);
    const pIdx = headers.indexOf('PupilID');
    
    if (pIdx === -1) {
      return { success: false, message: 'PupilID column not found.' };
    }
    
    const rowsToKeep = rows.filter(r => String(r[pIdx]).trim() !== pupilId);
    
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (rowsToKeep.length > 0) {
      sheet.getRange(2, 1, rowsToKeep.length, headers.length).setValues(rowsToKeep);
    }
    
    Logger.log('✅ Achievements reset for pupil: ' + pupilId);
    return { success: true, message: 'Achievements reset for this pupil!' };
  } catch (e) {
    Logger.log('❌ Error resetting pupil achievements: ' + e.message);
    return { success: false, message: 'Error: ' + e.message };
  }
}

// ==================== DIAGNOSTIC FUNCTION ====================
function diagnose() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✅ ===== DIAGNOSTIC START =====');
    Logger.log('✅ Spreadsheet found');
    
    // Check all sheets
    const sheets = ['Teachers', 'Pupils', 'Classes', 'Skills', 'Assessments', 'Achievements', 'WeekPlan'];
    sheets.forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (sheet) {
        const data = sheet.getDataRange().getValues();
        Logger.log('✅ ' + name + ' sheet found. Rows: ' + data.length);
        if (data.length > 0) Logger.log('   Headers: ' + JSON.stringify(data[0]));
      } else {
        Logger.log('❌ ' + name + ' sheet NOT found');
      }
    });
    
    // Check certificate templates
    Logger.log('📄 Certificate Templates:');
    const levels = Object.keys(CERTIFICATE_TEMPLATES);
    levels.forEach(level => {
      const templateId = CERTIFICATE_TEMPLATES[level];
      if (templateId && templateId !== 'YOUR_DUCKLING_TEMPLATE_ID_HERE' && 
          templateId !== 'YOUR_LEVEL1_TEMPLATE_ID_HERE' &&
          templateId !== 'YOUR_LEVEL3_TEMPLATE_ID_HERE' &&
          templateId !== 'YOUR_LEVEL4_TEMPLATE_ID_HERE' &&
          templateId !== 'YOUR_LEVEL5_TEMPLATE_ID_HERE' &&
          templateId !== 'YOUR_LEVEL6_TEMPLATE_ID_HERE') {
        try {
          const file = DriveApp.getFileById(templateId);
          Logger.log('   ✅ ' + level + ': ' + file.getName() + ' (' + file.getMimeType() + ')');
        } catch (e) {
          Logger.log('   ❌ ' + level + ': ' + e.message);
        }
      } else {
        Logger.log('   ⚠️ ' + level + ': Not configured yet');
      }
    });
    
    Logger.log('✅ ===== DIAGNOSTIC COMPLETE =====');
    
  } catch (e) {
    Logger.log('❌ ERROR: ' + e.message);
  }
}

// ==================== TEST CERTIFICATE GENERATION ====================
function testCertificateGeneration() {
  Logger.log('🧪 ===== TESTING CERTIFICATE GENERATION =====');
  const testName = 'Test Pupil';
  const testLevel = 'Level 1';
  
  const result = generateCertificatePdf(testName, testLevel);
  if (result) {
    Logger.log('✅ Certificate generated successfully!');
    Logger.log('📎 File size: ' + result.getBytes().length + ' bytes');
    Logger.log('📎 Filename: ' + result.getName());
  } else {
    Logger.log('❌ Certificate generation failed');
  }
}
