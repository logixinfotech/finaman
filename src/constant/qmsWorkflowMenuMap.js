 

const MODULE_ALIASES = {
  deviation:     ['deviation', 'deviations', 'deviationreport'],
  incident:      ['incidents', 'incident', 'incidentreport'],
  capa:          ['capa', 'capareport'],
  changecontrol: ['changecontrol', 'change control'],
  recall:        ['productrecall', 'product recall', 'recall', 'recalls'],
  dms:           ['dms', 'documentmanagement', 'document management', 'documentmanagementsystem'],
  stp:           ['stp', 'stpregister', 'stp register'],
  training:      ['training', 'trainingmanagement', 'training management', 'trainingrecord'],
  audit:         ['audit', 'audits', 'auditreport'],
  qualification: ['qualification', 'qualifications', 'qualificationplanner'],
  calibration:   ['calibration', 'calibrations', 'instrumentcalibration'],
  pm:            ['preventivemain', 'preventivemaintenance', 'preventive maintenance', 'pm'],
  environmental: ['envmonitoring', 'environmentalmonitoring', 'environmental monitoring', 'environmental'],
  complaint:     ['complaint', 'complaints', 'marketcomplaint', 'market complaint'],
  risk:          ['riskassessment', 'risk assessment', 'risk'],
  oos:           ['oos', 'outofspecification'],
  oot:           ['oot', 'outoftrend'],
};

const slug = (v) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const LOOKUP = {};
Object.entries(MODULE_ALIASES).forEach(([moduleKey, aliases]) => {
  aliases.forEach((a) => { LOOKUP[slug(a)] = moduleKey; });
});

/**
 * Menu row se moduleKey nikalo.
 * @param {object} row - MASMNU row (appl_name, bar_name/menu_name, pad_name)
 * @returns {string|null} moduleKey ya null
 */
export function resolveWorkflowModuleKey(row) {
  if (!row) return null;

  const pad = slug(row.pad_name);
  if (pad.includes('report') || pad.includes('dashboard')) return null;

  const candidates = [row.appl_name, row.menu_name, row.bar_name];
  for (const c of candidates) {
    const hit = LOOKUP[slug(c)];
    if (hit) return hit;
  }
  return null;
}

export { MODULE_ALIASES };
