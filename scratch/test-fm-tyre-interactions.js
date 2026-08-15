/**
 * scratch/test-fm-tyre-interactions.js
 * Forensic validation of all 12 Fleet Manager Tyre Intelligence dashboard interactions.
 */

const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
const mainJs = fs.readFileSync(path.join(__dirname, '../frontend/main.js'), 'utf8');

console.log('============================================================');
console.log('FI360 — TYRE INTELLIGENCE INTERACTION TEST SUITE');
console.log('============================================================\n');

const tests = [
  {
    action: 'Click Total Tyres',
    expected: 'Tyre inventory context (openKPIDrillTyres)',
    htmlCheck: () => indexHtml.includes('onclick="window.openKPIDrillTyres()"'),
    jsCheck: () => mainJs.includes('async function openKPIDrillTyres()')
  },
  {
    action: 'Click Inspection Compliance',
    expected: 'Inspection context (openInspectionComplianceDrill)',
    htmlCheck: () => indexHtml.includes('onclick="window.openInspectionComplianceDrill()"'),
    jsCheck: () => mainJs.includes('window.openInspectionComplianceDrill = async function')
  },
  {
    action: 'Click Attention Required',
    expected: 'Defect/alert context (openKPIDrillDefects)',
    htmlCheck: () => indexHtml.includes('onclick="window.openKPIDrillDefects()"'),
    jsCheck: () => mainJs.includes('async function openKPIDrillDefects()')
  },
  {
    action: 'Click Average Tread',
    expected: 'Tread context (openTreadDepthAnalysisDrill)',
    htmlCheck: () => indexHtml.includes('onclick="window.openTreadDepthAnalysisDrill()"'),
    jsCheck: () => mainJs.includes('window.openTreadDepthAnalysisDrill = async function')
  },
  {
    action: 'Click Tyre Cost/km',
    expected: 'Cost context (openTyreCostAnalysisDrill)',
    htmlCheck: () => indexHtml.includes('onclick="window.openTyreCostAnalysisDrill()"'),
    jsCheck: () => mainJs.includes('window.openTyreCostAnalysisDrill = async function')
  },
  {
    action: 'Click Critical',
    expected: 'Critical items (openAttentionQueueDrill(\'CRITICAL\'))',
    htmlCheck: () => indexHtml.includes('onclick="window.openAttentionQueueDrill(\'CRITICAL\')"'),
    jsCheck: () => mainJs.includes('category === \'CRITICAL\'')
  },
  {
    action: 'Click Replacement Due',
    expected: 'Replacement items (openAttentionQueueDrill(\'REPLACEMENT_DUE\'))',
    htmlCheck: () => indexHtml.includes('onclick="window.openAttentionQueueDrill(\'REPLACEMENT_DUE\')"'),
    jsCheck: () => mainJs.includes('category === \'REPLACEMENT_DUE\'')
  },
  {
    action: 'Click Inspection Due',
    expected: 'Inspection items (openAttentionQueueDrill(\'INSPECTION_DUE\'))',
    htmlCheck: () => indexHtml.includes('onclick="window.openAttentionQueueDrill(\'INSPECTION_DUE\')"'),
    jsCheck: () => mainJs.includes('category === \'INSPECTION_DUE\'')
  },
  {
    action: 'Click Open Defects',
    expected: 'Defects (openKPIDrillDefects)',
    htmlCheck: () => indexHtml.includes('onclick="window.openKPIDrillDefects()"'),
    jsCheck: () => mainJs.includes('async function openKPIDrillDefects()')
  },
  {
    action: 'Click Investigate',
    expected: 'Relevant vehicle/tyre (openVehicleDefectInvestigation)',
    htmlCheck: () => mainJs.includes('window.openVehicleDefectInvestigation('),
    jsCheck: () => mainJs.includes('window.openVehicleDefectInvestigation = function(')
  },
  {
    action: 'Click AI recommendation',
    expected: 'Relevant explanation (openAiRecommendationDetail)',
    htmlCheck: () => indexHtml.includes('onclick="window.openAiRecommendationDetail('),
    jsCheck: () => mainJs.includes('window.openAiRecommendationDetail = function(')
  },
  {
    action: 'Click inventory tyre',
    expected: 'Tyre detail (openTyreDetailModal)',
    htmlCheck: () => mainJs.includes('onclick="window.openTyreDetailModal('),
    jsCheck: () => mainJs.includes('window.openTyreDetailModal = function(')
  }
];

let passed = 0;
let failed = 0;

tests.forEach((t, i) => {
  const hPass = t.htmlCheck();
  const jPass = t.jsCheck();
  const ok = hPass && jPass;
  if (ok) {
    console.log(`✅ [${i + 1}/12] ${t.action} -> ${t.expected}: PASS`);
    passed++;
  } else {
    console.error(`❌ [${i + 1}/12] ${t.action} -> ${t.expected}: FAIL (HTML: ${hPass}, JS: ${jPass})`);
    failed++;
  }
});

console.log('\n============================================================');
console.log(`INTERACTION TEST SUMMARY: ${passed}/${tests.length} PASSED, ${failed} FAILED`);
console.log('============================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
