/**
 * LOGIX GENERAL ASSESSMENT RULE ENGINE (FRONTEND SHARED)
 * Standardized Hardcoded Assessment for LOGIX Organization
 * 
 * Rules:
 * - Exactly 25 scored questions (A through Y)
 * - Questions with no scoring rule or N/A for a vacancy have max_marks = 0 (excluded from applicable max marks)
 * - "Unknown" answers always get 0 awarded marks
 * - No soft-skill HR questions (those are kept separate in HR Assessment)
 */

export const normalizeToAnnualSalary = (amount, salaryType = 'Annual') => {
  const val = parseFloat(amount);
  if (isNaN(val) || val <= 0) return 0;
  const type = (salaryType || '').toLowerCase();
  if (type.includes('month') || type === 'pm' || type === 'monthly') {
    return val * 12;
  }
  return val;
};

export const calculateAgeFromDob = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const calculateAgeScore = (candidateDobOrAge, jdCriteria = {}) => {
  const minAge = parseFloat(jdCriteria.min_age);
  const maxAge = parseFloat(jdCriteria.max_age);

  if (isNaN(minAge) && isNaN(maxAge)) {
    return {
      code: 'DOB_AGE',
      name: 'DOB / Age',
      max_marks: 0,
      awarded_marks: 0,
      is_applicable: false,
      required_jd_value: 'No explicit age limit in JD',
      candidate_answer: candidateDobOrAge ? String(candidateDobOrAge) : 'Not Specified',
      evaluation_note: 'Age criterion not specified in vacancy/JD (N/A).'
    };
  }

  let age = typeof candidateDobOrAge === 'number' ? candidateDobOrAge : calculateAgeFromDob(candidateDobOrAge);
  if (age === null || isNaN(age)) {
    const parsed = parseFloat(candidateDobOrAge);
    if (!isNaN(parsed) && parsed > 15 && parsed < 90) age = parsed;
  }

  if (age === null || isNaN(age) || String(candidateDobOrAge).toLowerCase() === 'unknown') {
    return {
      code: 'DOB_AGE',
      name: 'DOB / Age',
      max_marks: 2,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: `${!isNaN(minAge) ? minAge : 18} - ${!isNaN(maxAge) ? maxAge : 60} Years`,
      candidate_answer: candidateDobOrAge ? String(candidateDobOrAge) : 'Unknown',
      evaluation_note: 'Candidate age is Unknown / Not provided (0/2).'
    };
  }

  const effectiveMin = !isNaN(minAge) ? minAge : 18;
  const effectiveMax = !isNaN(maxAge) ? maxAge : 60;
  const jdText = `${effectiveMin} - ${effectiveMax} Years`;

  if (age >= effectiveMin && age <= effectiveMax) {
    return {
      code: 'DOB_AGE',
      name: 'DOB / Age',
      max_marks: 2,
      awarded_marks: 2,
      is_applicable: true,
      required_jd_value: jdText,
      candidate_answer: `${age} Years`,
      evaluation_note: `Candidate age (${age} yrs) is fully within approved range (${jdText}).`
    };
  } else if ((age >= effectiveMin - 2 && age < effectiveMin) || (age > effectiveMax && age <= effectiveMax + 2)) {
    return {
      code: 'DOB_AGE',
      name: 'DOB / Age',
      max_marks: 2,
      awarded_marks: 1,
      is_applicable: true,
      required_jd_value: jdText,
      candidate_answer: `${age} Years`,
      evaluation_note: `Candidate age (${age} yrs) is within ±2 years boundary of approved range (${jdText}).`
    };
  } else {
    return {
      code: 'DOB_AGE',
      name: 'DOB / Age',
      max_marks: 2,
      awarded_marks: 0,
      is_applicable: true,
      required_jd_value: jdText,
      candidate_answer: `${age} Years`,
      evaluation_note: `Candidate age (${age} yrs) is outside approved range (${jdText}) by more than 2 years.`
    };
  }
};

export const calculateRelocationScore = (candidateAnswer, vacancyData = {}) => {
  const workMode = (vacancyData.work_mode || vacancyData.work_mode_id || '').toString().toLowerCase();
  const requiresRelocation = vacancyData.requires_relocation === true || vacancyData.requires_relocation === 1 ||
    workMode.includes('relocation') || workMode.includes('on-site') || workMode.includes('onsite');

  if (vacancyData.requires_relocation === false || vacancyData.requires_relocation === 0) {
    return {
      code: 'RELOCATION',
      name: 'Open to Relocate',
      max_marks: 0,
      awarded_marks: 0,
      is_applicable: false,
      required_jd_value: 'Relocation not required for this role',
      candidate_answer: candidateAnswer || 'N/A',
      evaluation_note: 'Relocation not applicable for vacancy (N/A).'
    };
  }

  const ans = String(candidateAnswer || '').toLowerCase().trim();
  if (ans === 'unknown' || !ans) {
    return {
      code: 'RELOCATION',
      name: 'Open to Relocate',
      max_marks: 1,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: 'Yes (Willing to relocate)',
      candidate_answer: candidateAnswer || 'Unknown',
      evaluation_note: 'Relocation willingness is Unknown (0/1).'
    };
  }

  const isWilling = ans === 'yes' || ans === 'true' || ans === '1' || ans === 'willing' || ans.includes('open');
  return {
    code: 'RELOCATION',
    name: 'Open to Relocate',
    max_marks: 1,
    awarded_marks: isWilling ? 1 : 0,
    is_applicable: true,
    required_jd_value: 'Yes (Willing to relocate)',
    candidate_answer: isWilling ? 'Yes (Willing)' : 'No (Not Willing)',
    evaluation_note: isWilling ? 'Candidate is willing to relocate (1/1).' : 'Candidate is not open to relocation (0/1).'
  };
};

export const calculateEducationScore = (candidateEdu, vacancyData = {}) => {
  const ans = String(candidateEdu || '').trim();
  const requiredEdu = vacancyData.required_qualification || vacancyData.qualification_name || 'Graduate / Post Graduate';

  if (!ans || ans.toLowerCase() === 'unknown') {
    return {
      code: 'EDUCATION',
      name: 'Educational Qualification',
      max_marks: 3,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: requiredEdu,
      candidate_answer: ans || 'Unknown',
      evaluation_note: 'Qualification is Unknown / Not provided (0/3).'
    };
  }

  const val = ans.toLowerCase();
  const req = String(requiredEdu).toLowerCase();

  let awarded = 3;
  let note = 'Fully meets required qualification.';

  if (val.includes('below') || val.includes('10th') || (val.includes('12th') && (req.includes('grad') || req.includes('b.tech') || req.includes('degree') || req.includes('mba')))) {
    awarded = 0;
    note = 'Highest education is below required qualification level.';
  } else if (val.includes('diploma') && (req.includes('b.tech') || req.includes('mba') || req.includes('post grad') || req.includes('ca'))) {
    awarded = 1;
    note = 'Diploma is borderline compared to Degree/PG requirement.';
  } else if (val.includes('any graduate') || val.includes('b.a') || val.includes('ba') || val.includes('b.com') || val.includes('bcom')) {
    if (req.includes('b.tech') || req.includes('btech') || req.includes('mca') || req.includes('engineering') || req.includes('ca')) {
      awarded = 2;
      note = 'Non-technical graduation represents minor mismatch for technical/finance spec.';
    } else {
      awarded = 3;
      note = 'Graduation meets generic graduate requirement.';
    }
  }

  return {
    code: 'EDUCATION',
    name: 'Educational Qualification',
    max_marks: 3,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: requiredEdu,
    candidate_answer: ans,
    evaluation_note: `${note} (${awarded}/3)`
  };
};

export const calculateTenthScore = (candidatePct, vacancyData = {}) => {
  if (vacancyData.requires_tenth_percentage === false) {
    return {
      code: 'TENTH_PERCENTAGE',
      name: '10th Percentage',
      max_marks: 0,
      awarded_marks: 0,
      is_applicable: false,
      required_jd_value: 'Not Required',
      candidate_answer: candidatePct ? `${candidatePct}%` : 'N/A',
      evaluation_note: '10th percentage not required for vacancy (N/A).'
    };
  }

  const ans = String(candidatePct || '').trim();
  if (!ans || ans.toLowerCase() === 'unknown') {
    return {
      code: 'TENTH_PERCENTAGE',
      name: '10th Percentage',
      max_marks: 4,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: '≥ 65% (Cutoff)',
      candidate_answer: ans || 'Unknown',
      evaluation_note: '10th percentage is Unknown (0/4).'
    };
  }

  const pct = parseFloat(ans);
  if (isNaN(pct) || pct <= 0) {
    return {
      code: 'TENTH_PERCENTAGE',
      name: '10th Percentage',
      max_marks: 4,
      awarded_marks: 0,
      is_applicable: true,
      required_jd_value: '≥ 65% (Cutoff)',
      candidate_answer: ans,
      evaluation_note: 'Invalid percentage entered (0/4).'
    };
  }

  let awarded = 0;
  if (pct >= 90) awarded = 4;
  else if (pct >= 79) awarded = 3;
  else if (pct >= 65) awarded = 2;
  else awarded = 0;

  return {
    code: 'TENTH_PERCENTAGE',
    name: '10th Percentage',
    max_marks: 4,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: '≥ 65% (Cutoff)',
    candidate_answer: `${pct}%`,
    evaluation_note: `10th: ${pct}% → ${awarded}/4 (90+=4, 79-89=3, 65-78=2, <65=0).`
  };
};

export const calculateTwelfthScore = (candidatePct, vacancyData = {}) => {
  if (vacancyData.requires_twelfth_percentage === false) {
    return {
      code: 'TWELFTH_PERCENTAGE',
      name: '12th Percentage',
      max_marks: 0,
      awarded_marks: 0,
      is_applicable: false,
      required_jd_value: 'Not Required',
      candidate_answer: candidatePct ? `${candidatePct}%` : 'N/A',
      evaluation_note: '12th percentage not required for vacancy (N/A).'
    };
  }

  const ans = String(candidatePct || '').trim();
  if (!ans || ans.toLowerCase() === 'unknown') {
    return {
      code: 'TWELFTH_PERCENTAGE',
      name: '12th Percentage',
      max_marks: 4,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: '≥ 65% (Cutoff)',
      candidate_answer: ans || 'Unknown',
      evaluation_note: '12th percentage is Unknown (0/4).'
    };
  }

  const pct = parseFloat(ans);
  if (isNaN(pct) || pct <= 0) {
    return {
      code: 'TWELFTH_PERCENTAGE',
      name: '12th Percentage',
      max_marks: 4,
      awarded_marks: 0,
      is_applicable: true,
      required_jd_value: '≥ 65% (Cutoff)',
      candidate_answer: ans,
      evaluation_note: 'Invalid percentage entered (0/4).'
    };
  }

  let awarded = 0;
  if (pct >= 90) awarded = 4;
  else if (pct >= 79) awarded = 3;
  else if (pct >= 65) awarded = 2;
  else awarded = 0;

  return {
    code: 'TWELFTH_PERCENTAGE',
    name: '12th Percentage',
    max_marks: 4,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: '≥ 65% (Cutoff)',
    candidate_answer: `${pct}%`,
    evaluation_note: `12th: ${pct}% → ${awarded}/4 (90+=4, 79-89=3, 65-78=2, <65=0).`
  };
};

export const calculateGraduationScore = (candidateScore, vacancyData = {}) => {
  const targetPct = parseFloat(vacancyData.graduation_min_percentage) || 60;
  const ans = String(candidateScore || '').trim();

  if (!ans || ans.toLowerCase() === 'unknown') {
    return {
      code: 'GRADUATION',
      name: 'Graduation CGPA / %',
      max_marks: 3,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: `≥ ${targetPct}%`,
      candidate_answer: ans || 'Unknown',
      evaluation_note: 'Graduation score is Unknown (0/3).'
    };
  }

  let score = parseFloat(ans);
  if (!isNaN(score) && score <= 10 && score > 0) score = score * 9.5;

  if (isNaN(score) || score <= 0) {
    return {
      code: 'GRADUATION',
      name: 'Graduation CGPA / %',
      max_marks: 3,
      awarded_marks: 0,
      is_applicable: true,
      required_jd_value: `≥ ${targetPct}%`,
      candidate_answer: ans,
      evaluation_note: 'Invalid graduation score entered (0/3).'
    };
  }

  let awarded = 0;
  if (score >= targetPct) awarded = 3;
  else if (score >= targetPct - 5) awarded = 2;
  else if (score >= targetPct - 10) awarded = 1;
  else awarded = 0;

  return {
    code: 'GRADUATION',
    name: 'Graduation CGPA / %',
    max_marks: 3,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: `≥ ${targetPct}%`,
    candidate_answer: `${score.toFixed(1)}%`,
    evaluation_note: `Graduation: ${score.toFixed(1)}% vs target ${targetPct}% (${awarded}/3).`
  };
};

export const calculatePgScore = (candidatePgScore, vacancyData = {}) => {
  const reqPg = vacancyData.requires_pg === true || vacancyData.requires_pg === 1;
  if (!reqPg) {
    return {
      code: 'PG',
      name: 'PG CGPA / %',
      max_marks: 0,
      awarded_marks: 0,
      is_applicable: false,
      required_jd_value: 'Post Graduation Not Required',
      candidate_answer: candidatePgScore || 'N/A',
      evaluation_note: 'Post Graduation not required for vacancy (N/A).'
    };
  }

  const targetPct = parseFloat(vacancyData.pg_min_percentage) || 60;
  const ans = String(candidatePgScore || '').trim();

  if (!ans || ans.toLowerCase() === 'unknown' || ans.toLowerCase() === 'n/a' || ans.toLowerCase() === 'none') {
    return {
      code: 'PG',
      name: 'PG CGPA / %',
      max_marks: 3,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: `≥ ${targetPct}%`,
      candidate_answer: ans || 'Unknown',
      evaluation_note: 'PG score is Unknown / Not completed (0/3).'
    };
  }

  let score = parseFloat(ans);
  if (!isNaN(score) && score <= 10 && score > 0) score = score * 9.5;

  let awarded = 0;
  if (score >= targetPct) awarded = 3;
  else if (score >= targetPct - 5) awarded = 2;
  else if (score >= targetPct - 10) awarded = 1;
  else awarded = 0;

  return {
    code: 'PG',
    name: 'PG CGPA / %',
    max_marks: 3,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: `≥ ${targetPct}%`,
    candidate_answer: `${score.toFixed(1)}%`,
    evaluation_note: `PG: ${score.toFixed(1)}% vs target ${targetPct}% (${awarded}/3).`
  };
};

export const calculateCollegeScore = (candidateCollege, vacancyData = {}) => {
  const ans = String(candidateCollege || '').trim();
  const jdCriteria = vacancyData.preferred_institutes || vacancyData.college_tier_required || 'Standard UGC / AICTE Recognized';

  if (!ans || ans.toLowerCase() === 'unknown') {
    return {
      code: 'COLLEGE',
      name: 'College / University',
      max_marks: 3,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: jdCriteria,
      candidate_answer: ans || 'Unknown',
      evaluation_note: 'College/University is Unknown (0/3).'
    };
  }

  const val = ans.toLowerCase();
  let awarded = 2;
  let note = 'Acceptable recognized university/college.';

  if (val.includes('iit') || val.includes('nit') || val.includes('iim') || val.includes('bits') || val.includes('du') || val.includes('delhi university') || val.includes('tier 1') || val.includes('autonomous')) {
    awarded = 3;
    note = 'Top tier / premier institution match.';
  } else if (val.includes('distance') || val.includes('open') || val.includes('unrecognized') || val.includes('fake')) {
    awarded = 1;
    note = 'Distance / Open education representation (limited relevance).';
  }

  return {
    code: 'COLLEGE',
    name: 'College / University',
    max_marks: 3,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: jdCriteria,
    candidate_answer: ans,
    evaluation_note: `${note} (${awarded}/3).`
  };
};

export const calculateSalaryScore = (candidateExpected, candidateCurrent, vacancyData = {}) => {
  const minCtc = normalizeToAnnualSalary(vacancyData.min_ctc, vacancyData.salary_type);
  const maxCtc = normalizeToAnnualSalary(vacancyData.max_ctc || vacancyData.expected_gross, vacancyData.salary_type);

  if (maxCtc <= 0) {
    return {
      code: 'SALARY',
      name: 'Current & Expected Salary',
      max_marks: 0,
      awarded_marks: 0,
      is_applicable: false,
      required_jd_value: 'Not Configured in Vacancy',
      candidate_answer: `Current: ₹${candidateCurrent || '0'} | Expected: ₹${candidateExpected || '0'}`,
      evaluation_note: 'Salary budget not defined in vacancy (N/A).'
    };
  }

  const expSal = normalizeToAnnualSalary(candidateExpected, vacancyData.salary_type);
  const currSal = normalizeToAnnualSalary(candidateCurrent, vacancyData.salary_type);
  const budgetText = `₹${(minCtc / 100000).toFixed(2)}L - ₹${(maxCtc / 100000).toFixed(2)}L p.a.`;

  if (expSal <= 0 || String(candidateExpected).toLowerCase() === 'unknown') {
    return {
      code: 'SALARY',
      name: 'Current & Expected Salary',
      max_marks: 4,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: budgetText,
      candidate_answer: `Current: ₹${currSal > 0 ? (currSal / 100000).toFixed(2) + 'L' : 'Unknown'} | Expected: Unknown`,
      evaluation_note: 'Expected salary is Unknown (0/4).'
    };
  }

  let awarded = 0;
  let note = '';

  if (expSal <= maxCtc) {
    awarded = 4;
    note = 'Expected salary is fully within approved vacancy budget.';
  } else {
    const excessPct = ((expSal - maxCtc) / maxCtc) * 100;
    if (excessPct <= 10) {
      awarded = 3;
      note = `Expected salary is up to 10% above budget (+${excessPct.toFixed(1)}%).`;
    } else if (excessPct <= 20) {
      awarded = 2;
      note = `Expected salary is 10% to 20% above budget (+${excessPct.toFixed(1)}%).`;
    } else {
      awarded = 0;
      note = `Expected salary exceeds budget by >20% (+${excessPct.toFixed(1)}%).`;
    }
  }

  return {
    code: 'SALARY',
    name: 'Current & Expected Salary',
    max_marks: 4,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: budgetText,
    candidate_answer: `Current: ₹${(currSal / 100000).toFixed(2)}L | Expected: ₹${(expSal / 100000).toFixed(2)}L p.a.`,
    evaluation_note: `${note} (${awarded}/4).`
  };
};

export const calculateBondScore = (candidateAgrees, vacancyData = {}) => {
  const isBondReq = vacancyData.bond_applicable === true || vacancyData.bond_applicable === 1;
  if (!isBondReq) {
    return {
      code: 'BOND',
      name: 'Agree for Service Agreement / Bond',
      max_marks: 0,
      awarded_marks: 0,
      is_applicable: false,
      required_jd_value: 'Bond Not Applicable',
      candidate_answer: candidateAgrees || 'N/A',
      evaluation_note: 'Service bond is not applicable for this vacancy (N/A).'
    };
  }

  const bondMonths = vacancyData.bond_duration_months || 12;
  const bondAmt = vacancyData.bond_amount ? `(₹${vacancyData.bond_amount})` : '';
  const jdText = `Yes (${bondMonths} Months ${bondAmt})`;

  const ans = String(candidateAgrees || '').toLowerCase().trim();
  if (!ans || ans === 'unknown') {
    return {
      code: 'BOND',
      name: 'Agree for Service Agreement / Bond',
      max_marks: 1,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: jdText,
      candidate_answer: candidateAgrees || 'Unknown',
      evaluation_note: 'Agreement for service bond is Unknown (0/1).'
    };
  }

  const agrees = ans === 'yes' || ans === 'true' || ans === '1' || ans === 'agree' || ans.includes('willing');
  return {
    code: 'BOND',
    name: 'Agree for Service Agreement / Bond',
    max_marks: 1,
    awarded_marks: agrees ? 1 : 0,
    is_applicable: true,
    required_jd_value: jdText,
    candidate_answer: agrees ? 'Yes (Agreed)' : 'No (Disagreed)',
    evaluation_note: agrees ? 'Candidate agrees to the service agreement/bond terms (1/1).' : 'Candidate refused service agreement/bond terms (0/1).'
  };
};

export const calculateTravelScore = (candidateWilling, vacancyData = {}) => {
  const isTravelReq = vacancyData.travel_required === true || vacancyData.travel_required === 1;
  if (!isTravelReq) {
    return {
      code: 'TRAVEL',
      name: 'Willing to Travel',
      max_marks: 0,
      awarded_marks: 0,
      is_applicable: false,
      required_jd_value: 'Travel Not Required',
      candidate_answer: candidateWilling || 'N/A',
      evaluation_note: 'Official travel is not required for this role (N/A).'
    };
  }

  const freq = vacancyData.travel_frequency || 'Occasional / As needed';
  const jdText = `Yes (${freq})`;

  const ans = String(candidateWilling || '').toLowerCase().trim();
  if (!ans || ans === 'unknown') {
    return {
      code: 'TRAVEL',
      name: 'Willing to Travel',
      max_marks: 1,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: jdText,
      candidate_answer: candidateWilling || 'Unknown',
      evaluation_note: 'Willingness to travel is Unknown (0/1).'
    };
  }

  const willing = ans === 'yes' || ans === 'true' || ans === '1' || ans === 'willing';
  return {
    code: 'TRAVEL',
    name: 'Willing to Travel',
    max_marks: 1,
    awarded_marks: willing ? 1 : 0,
    is_applicable: true,
    required_jd_value: jdText,
    candidate_answer: willing ? 'Yes (Willing)' : 'No (Not Willing)',
    evaluation_note: willing ? 'Candidate is willing to travel as per role needs (1/1).' : 'Candidate is not willing to travel (0/1).'
  };
};

export const calculateIndustryScore = (candidateIndustry, vacancyData = {}) => {
  const reqIndustry = vacancyData.industry_name || vacancyData.preferred_industry || 'Relevant Manufacturing / IT / Services';
  const ans = String(candidateIndustry || '').trim();

  if (!ans || ans.toLowerCase() === 'unknown') {
    return {
      code: 'INDUSTRY_MATCH',
      name: 'Previous Industry Match',
      max_marks: 1,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: reqIndustry,
      candidate_answer: ans || 'Unknown',
      evaluation_note: 'Previous industry is Unknown (0/1).'
    };
  }

  const cVal = ans.toLowerCase();
  const vVal = String(reqIndustry).toLowerCase();
  const isMatch = cVal.includes(vVal) || vVal.includes(cVal) || cVal === 'relevant' || cVal === 'matching' || cVal === 'yes';

  return {
    code: 'INDUSTRY_MATCH',
    name: 'Previous Industry Match',
    max_marks: 1,
    awarded_marks: isMatch ? 1 : 0,
    is_applicable: true,
    required_jd_value: reqIndustry,
    candidate_answer: ans,
    evaluation_note: isMatch ? 'Candidate past industry matches vacancy domain (1/1).' : 'Candidate industry is not relevant (0/1).'
  };
};

export const calculateDesignationScore = (candidateDesig, vacancyData = {}) => {
  const reqDesig = vacancyData.designation_name || vacancyData.job_role || 'Relevant Role';
  const ans = String(candidateDesig || '').trim();

  if (!ans || ans.toLowerCase() === 'unknown') {
    return {
      code: 'DESIGNATION_MATCH',
      name: 'Designation Match',
      max_marks: 1,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: reqDesig,
      candidate_answer: ans || 'Unknown',
      evaluation_note: 'Past designation is Unknown (0/1).'
    };
  }

  const cVal = ans.toLowerCase();
  const vVal = String(reqDesig).toLowerCase();
  const isMatch = cVal.includes(vVal) || vVal.includes(cVal) || cVal === 'relevant' || cVal === 'matching' || cVal === 'yes';

  return {
    code: 'DESIGNATION_MATCH',
    name: 'Designation Match',
    max_marks: 1,
    awarded_marks: isMatch ? 1 : 0,
    is_applicable: true,
    required_jd_value: reqDesig,
    candidate_answer: ans,
    evaluation_note: isMatch ? 'Candidate current/last designation is relevant (1/1).' : 'Candidate designation is non-matching (0/1).'
  };
};

export const calculateDepartmentScore = (candidateDept, vacancyData = {}) => {
  const reqDept = vacancyData.department_name || 'Relevant Department';
  const ans = String(candidateDept || '').trim();

  if (!ans || ans.toLowerCase() === 'unknown') {
    return {
      code: 'DEPARTMENT_MATCH',
      name: 'Department Match',
      max_marks: 1,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: reqDept,
      candidate_answer: ans || 'Unknown',
      evaluation_note: 'Past department is Unknown (0/1).'
    };
  }

  const cVal = ans.toLowerCase();
  const vVal = String(reqDept).toLowerCase();
  const isMatch = cVal.includes(vVal) || vVal.includes(cVal) || cVal === 'relevant' || cVal === 'matching' || cVal === 'yes';

  return {
    code: 'DEPARTMENT_MATCH',
    name: 'Department Match',
    max_marks: 1,
    awarded_marks: isMatch ? 1 : 0,
    is_applicable: true,
    required_jd_value: reqDept,
    candidate_answer: ans,
    evaluation_note: isMatch ? 'Candidate past department matches target department (1/1).' : 'Candidate department is non-matching (0/1).'
  };
};

export const calculateProductServiceScore = (candidateDomain, vacancyData = {}) => {
  const ans = String(candidateDomain || '').trim();
  if (!ans || ans.toLowerCase() === 'unknown') {
    return {
      code: 'PRODUCT_SERVICE_MATCH',
      name: 'Previous Company Product / Services',
      max_marks: 1,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: 'Relevant Domain Products / Services',
      candidate_answer: ans || 'Unknown',
      evaluation_note: 'Past products/services domain is Unknown (0/1).'
    };
  }

  const isMatch = ans.toLowerCase() === 'yes' || ans.toLowerCase() === 'relevant' || ans.toLowerCase() === 'matching' || ans.length > 5;
  return {
    code: 'PRODUCT_SERVICE_MATCH',
    name: 'Previous Company Product / Services',
    max_marks: 1,
    awarded_marks: isMatch ? 1 : 0,
    is_applicable: true,
    required_jd_value: 'Relevant Domain Products / Services',
    candidate_answer: ans,
    evaluation_note: isMatch ? 'Candidate worked on matching product/service line (1/1).' : 'No relevant product/service match (0/1).'
  };
};

export const calculateLaptopScore = (candidateLaptop, vacancyData = {}) => {
  const workMode = String(vacancyData.work_mode || vacancyData.work_mode_id || '').toLowerCase();
  const requiresLaptop = vacancyData.laptop_required === true || vacancyData.laptop_required === 1 ||
    workMode.includes('remote') || workMode.includes('hybrid') || workMode.includes('wfh');

  if (vacancyData.laptop_required === false) {
    return {
      code: 'LAPTOP',
      name: 'Laptop Availability',
      max_marks: 0,
      awarded_marks: 0,
      is_applicable: false,
      required_jd_value: 'Company Provided Workstation',
      candidate_answer: candidateLaptop || 'N/A',
      evaluation_note: 'Laptop not required from candidate (N/A).'
    };
  }

  const ans = String(candidateLaptop || '').toLowerCase().trim();
  if (!ans || ans === 'unknown') {
    return {
      code: 'LAPTOP',
      name: 'Laptop Availability',
      max_marks: 1,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: 'Yes (Personal Laptop Available)',
      candidate_answer: candidateLaptop || 'Unknown',
      evaluation_note: 'Laptop availability is Unknown (0/1).'
    };
  }

  const hasLaptop = ans === 'yes' || ans === 'true' || ans === '1' || ans === 'available';
  return {
    code: 'LAPTOP',
    name: 'Laptop Availability',
    max_marks: 1,
    awarded_marks: hasLaptop ? 1 : 0,
    is_applicable: true,
    required_jd_value: 'Yes (Personal Laptop Available)',
    candidate_answer: hasLaptop ? 'Yes (Available)' : 'No (Not Available)',
    evaluation_note: hasLaptop ? 'Candidate has functional laptop for work (1/1).' : 'Candidate does not possess laptop (0/1).'
  };
};

export const calculateExperienceScore = (candidateExp, vacancyData = {}) => {
  const minExp = parseFloat(vacancyData.min_experience_years) || 0;
  const maxExp = parseFloat(vacancyData.max_experience_years) || (minExp + 3);
  const rangeText = `${minExp} - ${maxExp} Years`;

  const ans = String(candidateExp ?? '').trim();
  if (!ans || ans.toLowerCase() === 'unknown') {
    return {
      code: 'TOTAL_EXPERIENCE',
      name: 'Total Experience',
      max_marks: 4,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: rangeText,
      candidate_answer: ans || 'Unknown',
      evaluation_note: 'Total experience is Unknown (0/4).'
    };
  }

  const exp = parseFloat(ans);
  if (isNaN(exp) || exp < 0) {
    return {
      code: 'TOTAL_EXPERIENCE',
      name: 'Total Experience',
      max_marks: 4,
      awarded_marks: 0,
      is_applicable: true,
      required_jd_value: rangeText,
      candidate_answer: ans,
      evaluation_note: 'Invalid experience entered (0/4).'
    };
  }

  let awarded = 0;
  let note = '';

  if (exp >= minExp && exp <= maxExp) {
    awarded = 4;
    note = `Experience (${exp} yrs) is exactly within approved JD range (${rangeText}).`;
  } else {
    let diff = 0;
    if (exp < minExp) diff = minExp - exp;
    else if (exp > maxExp) diff = exp - maxExp;

    if (diff <= 3) {
      awarded = 3;
      note = `Experience (${exp} yrs) is within 3 years of JD range (diff: ${diff.toFixed(1)} yrs).`;
    } else if (diff <= 5) {
      awarded = 2;
      note = `Experience (${exp} yrs) is within 3 to 5 years of JD range (diff: ${diff.toFixed(1)} yrs).`;
    } else {
      awarded = 0;
      note = `Experience (${exp} yrs) is outside JD range by > 5 years (diff: ${diff.toFixed(1)} yrs).`;
    }
  }

  return {
    code: 'TOTAL_EXPERIENCE',
    name: 'Total Experience',
    max_marks: 4,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: rangeText,
    candidate_answer: `${exp} Years`,
    evaluation_note: `${note} (${awarded}/4).`
  };
};

export const calculateLanguageScore = (candidateLangs, vacancyData = {}) => {
  const reqLangs = vacancyData.required_languages || vacancyData.language_names || ['English', 'Hindi'];
  if (!reqLangs || (Array.isArray(reqLangs) && reqLangs.length === 0)) {
    return {
      code: 'LANGUAGE',
      name: 'Languages Known',
      max_marks: 0,
      awarded_marks: 0,
      is_applicable: false,
      required_jd_value: 'No explicit language requirement',
      candidate_answer: candidateLangs || 'N/A',
      evaluation_note: 'Language requirement not specified for vacancy (N/A).'
    };
  }

  const reqList = Array.isArray(reqLangs) ? reqLangs.map(l => String(l).toLowerCase().trim()) : String(reqLangs).toLowerCase().split(/[,/]+/).map(s => s.trim()).filter(Boolean);
  const reqText = reqList.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');

  const ans = String(candidateLangs || '').trim();
  if (!ans || ans.toLowerCase() === 'unknown') {
    return {
      code: 'LANGUAGE',
      name: 'Languages Known',
      max_marks: 2,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: reqText,
      candidate_answer: ans || 'Unknown',
      evaluation_note: 'Languages known is Unknown (0/2).'
    };
  }

  const candList = ans.toLowerCase().split(/[,/]+/).map(s => s.trim()).filter(Boolean);
  const matches = reqList.filter(req => candList.some(c => c.includes(req) || req.includes(c)));

  let awarded = 0;
  if (matches.length >= reqList.length) awarded = 2;
  else if (matches.length > 0) awarded = 1;
  else awarded = 0;

  return {
    code: 'LANGUAGE',
    name: 'Languages Known',
    max_marks: 2,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: reqText,
    candidate_answer: ans,
    evaluation_note: `Matched ${matches.length}/${reqList.length} required languages (${awarded}/2).`
  };
};

export const calculateNoticeScore = (candidateNoticeDays, vacancyData = {}) => {
  const reqDays = parseInt(vacancyData.notice_period_days, 10) || 30;
  const jdText = `≤ ${reqDays} Days / Immediate`;

  const ans = String(candidateNoticeDays ?? '').trim();
  if (!ans || ans.toLowerCase() === 'unknown') {
    return {
      code: 'NOTICE_PERIOD',
      name: 'Notice Period / Earliest Joining',
      max_marks: 4,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: jdText,
      candidate_answer: ans || 'Unknown',
      evaluation_note: 'Notice period is Unknown (0/4).'
    };
  }

  let days = 30;
  if (ans.toLowerCase().includes('immediate') || ans === '0') days = 0;
  else if (ans.toLowerCase().includes('15')) days = 15;
  else if (ans.toLowerCase().includes('30') || ans.toLowerCase().includes('1 month')) days = 30;
  else if (ans.toLowerCase().includes('45')) days = 45;
  else if (ans.toLowerCase().includes('60') || ans.toLowerCase().includes('2 month')) days = 60;
  else if (ans.toLowerCase().includes('90') || ans.toLowerCase().includes('3 month')) days = 90;
  else {
    const p = parseInt(ans, 10);
    if (!isNaN(p)) days = p;
  }

  let awarded = 0;
  let note = '';

  if (days <= reqDays || days <= 15) {
    awarded = 4;
    note = `Immediate / within vacancy target (${days} days).`;
  } else if (days <= reqDays + 15 || days <= 30) {
    awarded = 3;
    note = `Slightly delayed but manageable (${days} days).`;
  } else if (days <= reqDays + 30 || days <= 60) {
    awarded = 2;
    note = `Moderately delayed (${days} days).`;
  } else if (days <= 90) {
    awarded = 1;
    note = `Significant delay (${days} days).`;
  } else {
    awarded = 0;
    note = `Not acceptable delay (> 90 days).`;
  }

  return {
    code: 'NOTICE_PERIOD',
    name: 'Notice Period / Earliest Joining',
    max_marks: 4,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: jdText,
    candidate_answer: days === 0 ? 'Immediate Joiner' : `${days} Days`,
    evaluation_note: `${note} (${awarded}/4).`
  };
};

export const calculateErpScore = (candidateErpLevel) => {
  const ans = String(candidateErpLevel || '').toLowerCase().trim();
  if (!ans || ans === 'unknown') {
    return {
      code: 'ERP',
      name: 'ERP Knowledge',
      max_marks: 2,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: 'Knowledge of ERP / Enterprise Systems',
      candidate_answer: candidateErpLevel || 'Unknown',
      evaluation_note: 'ERP Knowledge is Unknown (0/2).'
    };
  }

  let awarded = 0;
  let note = 'No prior ERP exposure.';

  if (ans.includes('strong') || ans.includes('expert') || ans.includes('hands-on') || ans.includes('sap') || ans.includes('oracle') || ans.includes('finaman') || ans.includes('tally') || ans.includes('zoho') || ans === '2') {
    awarded = 2;
    note = 'Strong ERP hands-on experience.';
  } else if (ans.includes('basic') || ans.includes('moderate') || ans.includes('some') || ans === '1') {
    awarded = 1;
    note = 'Basic conceptual understanding of ERP.';
  }

  return {
    code: 'ERP',
    name: 'ERP Knowledge',
    max_marks: 2,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: 'Knowledge of ERP / Enterprise Systems',
    candidate_answer: candidateErpLevel,
    evaluation_note: `${note} (${awarded}/2).`
  };
};

export const calculateEmailChatScore = (candidateEmailChat, vacancyData = {}) => {
  if (vacancyData.requires_email_chat === false) {
    return {
      code: 'EMAIL_CHAT',
      name: 'Email & Chat Handling',
      max_marks: 0,
      awarded_marks: 0,
      is_applicable: false,
      required_jd_value: 'Not Required',
      candidate_answer: candidateEmailChat || 'N/A',
      evaluation_note: 'Email/Chat handling not relevant for this role (N/A).'
    };
  }

  const ans = String(candidateEmailChat || '').toLowerCase().trim();
  if (!ans || ans === 'unknown') {
    return {
      code: 'EMAIL_CHAT',
      name: 'Email & Chat Handling',
      max_marks: 2,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: 'Professional Business Writing & Chat Support',
      candidate_answer: candidateEmailChat || 'Unknown',
      evaluation_note: 'Email & Chat skill is Unknown (0/2).'
    };
  }

  let awarded = 1;
  let note = 'Acceptable professional writing.';

  if (ans.includes('strong') || ans.includes('expert') || ans.includes('excellent') || ans.includes('fluent') || ans === '2') {
    awarded = 2;
    note = 'Strong corporate email etiquette and chat handling.';
  } else if (ans.includes('weak') || ans.includes('poor') || ans.includes('none') || ans === '0') {
    awarded = 0;
    note = 'Weak written communication.';
  }

  return {
    code: 'EMAIL_CHAT',
    name: 'Email & Chat Handling',
    max_marks: 2,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: 'Professional Business Writing & Chat Support',
    candidate_answer: candidateEmailChat,
    evaluation_note: `${note} (${awarded}/2).`
  };
};

export const calculateRelevantExperienceScore = (candidateRelevance, vacancyData = {}) => {
  const reqRole = vacancyData.job_role || vacancyData.designation_name || 'Target Role Responsibilities';
  const ans = String(candidateRelevance ?? '').toLowerCase().trim();

  if (!ans || ans === 'unknown') {
    return {
      code: 'RELEVANT_EXPERIENCE',
      name: 'Relevant Work Experience',
      max_marks: 4,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: reqRole,
      candidate_answer: candidateRelevance || 'Unknown',
      evaluation_note: 'Relevant experience is Unknown (0/4).'
    };
  }

  let awarded = 2;
  let note = 'Partially relevant functional experience.';

  if (ans.includes('high') || ans.includes('exact') || ans === '4') {
    awarded = 4;
    note = 'Highly relevant work experience matching JD responsibilities.';
  } else if (ans.includes('relevant') || ans.includes('good') || ans === '3') {
    awarded = 3;
    note = 'Relevant work experience in identical domain.';
  } else if (ans.includes('limited') || ans.includes('minor') || ans === '1') {
    awarded = 1;
    note = 'Limited relevance to target position.';
  } else if (ans.includes('none') || ans.includes('fresher') || ans.includes('no') || ans === '0') {
    awarded = 0;
    note = 'No relevant prior experience.';
  }

  return {
    code: 'RELEVANT_EXPERIENCE',
    name: 'Relevant Work Experience',
    max_marks: 4,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: reqRole,
    candidate_answer: candidateRelevance,
    evaluation_note: `${note} (${awarded}/4).`
  };
};

export const calculateOfficeToolsScore = (candidateOffice, vacancyData = {}) => {
  if (vacancyData.requires_office_tools === false) {
    return {
      code: 'OFFICE_TOOLS',
      name: 'MS Excel / Word / Docs',
      max_marks: 0,
      awarded_marks: 0,
      is_applicable: false,
      required_jd_value: 'Not Required',
      candidate_answer: candidateOffice || 'N/A',
      evaluation_note: 'Office documentation tools not required for vacancy (N/A).'
    };
  }

  const ans = String(candidateOffice || '').toLowerCase().trim();
  if (!ans || ans === 'unknown') {
    return {
      code: 'OFFICE_TOOLS',
      name: 'MS Excel / Word / Docs',
      max_marks: 2,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: 'Excel (Formulas, Pivot) & Word Docs',
      candidate_answer: candidateOffice || 'Unknown',
      evaluation_note: 'Office Tools knowledge is Unknown (0/2).'
    };
  }

  let awarded = 1;
  let note = 'Basic working knowledge of Excel & Word.';

  if (ans.includes('strong') || ans.includes('advance') || ans.includes('vlookup') || ans.includes('pivot') || ans.includes('expert') || ans === '2') {
    awarded = 2;
    note = 'Strong practical Excel skills (Pivot, Advanced Formulas) and Docs.';
  } else if (ans.includes('weak') || ans.includes('poor') || ans.includes('none') || ans === '0') {
    awarded = 0;
    note = 'No functional knowledge of office tools.';
  }

  return {
    code: 'OFFICE_TOOLS',
    name: 'MS Excel / Word / Docs',
    max_marks: 2,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: 'Excel (Formulas, Pivot) & Word Docs',
    candidate_answer: candidateOffice,
    evaluation_note: `${note} (${awarded}/2).`
  };
};

export const calculateProgrammingLanguagesScore = (candidateLanguages, vacancyData = {}) => {
  const dept = String(vacancyData.department_name || '').toLowerCase();
  const role = String(vacancyData.job_role || vacancyData.designation_name || '').toLowerCase();
  const reqSkills = vacancyData.required_skills || vacancyData.programming_languages || [];

  const isTechRole = vacancyData.is_technical_role === true || dept.includes('it') || dept.includes('software') ||
    dept.includes('development') || dept.includes('tech') || role.includes('developer') || role.includes('engineer') || role.includes('programmer');

  if (!isTechRole) {
    return {
      code: 'PROGRAMMING_LANGUAGE',
      name: 'Programming Languages',
      max_marks: 0,
      awarded_marks: 0,
      is_applicable: false,
      required_jd_value: 'Non-Technical Position',
      candidate_answer: candidateLanguages || 'N/A',
      evaluation_note: 'Programming languages not applicable for non-technical position (N/A).'
    };
  }

  const reqList = Array.isArray(reqSkills) ? reqSkills.map(s => String(s).toLowerCase().trim()) : String(reqSkills).toLowerCase().split(/[,/]+/).map(s => s.trim()).filter(Boolean);
  const reqText = reqList.length ? reqList.join(', ') : 'Core Tech Stack in JD';

  const ans = String(candidateLanguages || '').trim();
  if (!ans || ans.toLowerCase() === 'unknown') {
    return {
      code: 'PROGRAMMING_LANGUAGE',
      name: 'Programming Languages',
      max_marks: 3,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: reqText,
      candidate_answer: ans || 'Unknown',
      evaluation_note: 'Programming languages is Unknown (0/3).'
    };
  }

  const candList = ans.toLowerCase().split(/[,/]+/).map(s => s.trim()).filter(Boolean);
  const matches = reqList.filter(req => candList.some(c => c.includes(req) || req.includes(c)));

  let awarded = 1;
  if (reqList.length > 0) {
    if (matches.length >= reqList.length) awarded = 3;
    else if (matches.length >= Math.ceil(reqList.length / 2)) awarded = 2;
    else if (matches.length > 0) awarded = 1;
    else awarded = 0;
  } else {
    awarded = candList.length >= 3 ? 3 : (candList.length >= 1 ? 2 : 0);
  }

  return {
    code: 'PROGRAMMING_LANGUAGE',
    name: 'Programming Languages',
    max_marks: 3,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: reqText,
    candidate_answer: ans,
    evaluation_note: `Programming stack match (${awarded}/3).`
  };
};

export const calculateSalesTargetScore = (candidateTargetExp, vacancyData = {}) => {
  const dept = String(vacancyData.department_name || '').toLowerCase();
  const role = String(vacancyData.job_role || vacancyData.designation_name || '').toLowerCase();

  const isSalesRole = vacancyData.is_sales_role === true || dept.includes('sales') || dept.includes('marketing') ||
    dept.includes('bd') || dept.includes('business development') || role.includes('sales') || role.includes('marketing') || role.includes('bd');

  if (!isSalesRole) {
    return {
      code: 'SALES_TARGET',
      name: 'Monthly Sales Target Achievement',
      max_marks: 0,
      awarded_marks: 0,
      is_applicable: false,
      required_jd_value: 'Non-Sales Position',
      candidate_answer: candidateTargetExp || 'N/A',
      evaluation_note: 'Sales target is not applicable for non-sales roles (N/A).'
    };
  }

  const ans = String(candidateTargetExp || '').toLowerCase().trim();
  if (!ans || ans === 'unknown') {
    return {
      code: 'SALES_TARGET',
      name: 'Monthly Sales Target Achievement',
      max_marks: 2,
      awarded_marks: 0,
      is_applicable: true,
      is_unknown: true,
      required_jd_value: 'Sales Target History & Quota Achievement',
      candidate_answer: candidateTargetExp || 'Unknown',
      evaluation_note: 'Sales target experience is Unknown (0/2).'
    };
  }

  let awarded = 0;
  let note = 'No prior sales quota experience.';

  if (ans.includes('strong') || ans.includes('achieved') || ans.includes('100%') || ans.includes('consistent') || ans === '2') {
    awarded = 2;
    note = 'Strong verifiable record of achieving monthly sales targets.';
  } else if (ans.includes('some') || ans.includes('partial') || ans.includes('moderate') || ans === '1') {
    awarded = 1;
    note = 'Has handled sales targets with moderate achievement.';
  }

  return {
    code: 'SALES_TARGET',
    name: 'Monthly Sales Target Achievement',
    max_marks: 2,
    awarded_marks: awarded,
    is_applicable: true,
    required_jd_value: 'Sales Target History & Quota Achievement',
    candidate_answer: candidateTargetExp,
    evaluation_note: `${note} (${awarded}/2).`
  };
};

export const evaluateGeneralAssessment = (candidateData = {}, vacancyData = {}) => {
  const results = [
    calculateAgeScore(candidateData.dob || candidateData.age, vacancyData),
    calculateRelocationScore(candidateData.open_to_relocate, vacancyData),
    calculateEducationScore(candidateData.highest_qualification, vacancyData),
    calculateTenthScore(candidateData.tenth_percentage, vacancyData),
    calculateTwelfthScore(candidateData.twelfth_percentage, vacancyData),
    calculateGraduationScore(candidateData.graduation_percentage || candidateData.graduation_cgpa, vacancyData),
    calculatePgScore(candidateData.pg_percentage || candidateData.pg_cgpa, vacancyData),
    calculateCollegeScore(candidateData.college_name, vacancyData),
    calculateSalaryScore(candidateData.expected_ctc, candidateData.current_ctc, vacancyData),
    calculateBondScore(candidateData.agree_for_bond, vacancyData),
    calculateTravelScore(candidateData.willing_to_travel, vacancyData),
    calculateIndustryScore(candidateData.current_company_industry, vacancyData),
    calculateDesignationScore(candidateData.current_designation, vacancyData),
    calculateDepartmentScore(candidateData.current_department, vacancyData),
    calculateProductServiceScore(candidateData.previous_company_products, vacancyData),
    calculateLaptopScore(candidateData.laptop_available, vacancyData),
    calculateExperienceScore(candidateData.total_experience_years, vacancyData),
    calculateLanguageScore(candidateData.languages_known, vacancyData),
    calculateNoticeScore(candidateData.notice_period_days, vacancyData),
    calculateErpScore(candidateData.erp_knowledge),
    calculateEmailChatScore(candidateData.email_chat_handling, vacancyData),
    calculateRelevantExperienceScore(candidateData.relevant_work_experience, vacancyData),
    calculateOfficeToolsScore(candidateData.ms_office_knowledge, vacancyData),
    calculateProgrammingLanguagesScore(candidateData.programming_languages, vacancyData),
    calculateSalesTargetScore(candidateData.monthly_sales_target, vacancyData)
  ];

  let applicableMaxMarks = 0;
  let obtainedMarks = 0;

  results.forEach(r => {
    if (r.is_applicable && r.max_marks > 0) {
      applicableMaxMarks += r.max_marks;
      obtainedMarks += r.awarded_marks;
    }
  });

  const percentage = applicableMaxMarks > 0 ? parseFloat(((obtainedMarks / applicableMaxMarks) * 100).toFixed(2)) : 0;

  let evaluationStatus = 'Hold';
  if (percentage >= 70) evaluationStatus = 'Shortlisted';
  else if (percentage < 50) evaluationStatus = 'Rejected';

  return {
    applicable_max_marks: applicableMaxMarks,
    obtained_marks: obtainedMarks,
    percentage: percentage,
    evaluation_status: evaluationStatus,
    answers: results
  };
};
