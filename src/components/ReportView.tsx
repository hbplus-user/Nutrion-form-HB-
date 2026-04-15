import React from 'react';
import type { Assessment } from '../types';
import {
  Printer,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  FileEdit
} from 'lucide-react';

interface ReportViewProps {
  assessment: Assessment;
  onBack: () => void;
  onEdit: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ assessment, onBack, onEdit }) => {
  const printReport = () => window.print();

  // Helper to parse complex diagnosis string if needed, 
  // but we'll assume the diagnosis field might contain the tags.
  const diagnosisBlocks = assessment.diagnosis?.split('\n') || [];
  const findings = diagnosisBlocks.filter(line => !line.includes('HB+') && !line.includes('PRES') && line.trim());

  return (
    <div className="report-wrapper-v5 animate-fade">
      {/* Action Bar */}
      <div className="report-actions-v5 print-hide">
        <button onClick={onBack} className="btn-v5-secondary">
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        <button onClick={onEdit} className="btn-v5-secondary">
          <FileEdit size={16} /> Edit clinical Profile
        </button>
        
        <button onClick={printReport} className="btn-v5-primary">
          <Printer size={16} /> Print / Export PDF
        </button>
      </div>

      <div className="report-sheet-a4">
        {/* Header Section */}
        <div className="report-header-v5">
          <div className="header-brand-v5">
            <img src="/hb-logo.png" alt="HB+" className="report-logo-v5" />
            <div className="brand-text-wrapper">
              <h1>Nutrition Assessment Report</h1>
              <p>Certified Clinical Analysis — HB+ Protocol v2.4</p>
            </div>
          </div>
          <div className="header-client-v5">
            <div className="name-v5">{assessment.client_name}</div>
            <div className="date-v5">
              UHID: {assessment.uhid || 'P-4282'} • {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="metrics-grid-v5">
          <div className="metric-box-v5">
            <div className="v5-val">{assessment.height}<span>ft</span></div>
            <div className="v5-label">Height</div>
          </div>
          <div className="metric-box-v5">
            <div className="v5-val">{assessment.weight}<span>kg</span></div>
            <div className="v5-label">Weight</div>
          </div>
          <div className="metric-box-v5">
            <div className="v5-val">{assessment.bmi}</div>
            <div className="v5-label">BMI (kg/m²)</div>
          </div>
          <div className="metric-box-v5">
            <div className="v5-val">{assessment.bmr}</div>
            <div className="v5-label">BMR (kcal/day)</div>
          </div>
          <div className="metric-box-v5">
            <div className="v5-val">{assessment.tdee}</div>
            <div className="v5-label">TDEE (kcal/day)</div>
          </div>
        </div>

        {/* Client Overview Table */}
        <div className="v5-section">
          <div className="v5-section-title">Client Overview</div>
          <table className="v5-table">
            <tbody>
              <tr>
                <td><strong>Age / Sex</strong></td>
                <td>{assessment.age}y • {assessment.gender}</td>
                <td><strong>Location</strong></td>
                <td>{assessment.location}</td>
              </tr>
              <tr>
                <td><strong>Occupation</strong></td>
                <td>{assessment.occupation}</td>
                <td><strong>Lifestyle</strong></td>
                <td>{assessment.lifestyle || 'Standard'}</td>
              </tr>
              <tr>
                <td><strong>Diet Type</strong></td>
                <td>{assessment.diet_type}</td>
                <td><strong>Gut Symptoms</strong></td>
                <td>{assessment.gut_symptoms?.join(', ') || 'None reported'}</td>
              </tr>
              <tr>
                <td><strong>Medications</strong></td>
                <td colSpan={3}>{assessment.medications || 'None'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Key Risk Flags */}
        <div className="v5-section">
          <div className="v5-section-title">Key Risk Flags</div>
          <div className="v5-badge-row">
            {assessment.bmi > 25 && <span className="v5-badge red">BMi {assessment.bmi} — Overweight</span>}
            <span className="v5-badge orange">High Stress (Level {assessment.stress_level})</span>
            {assessment.gut_symptoms?.length > 0 && (
               <span className="v5-badge yellow">Gut Issues: {assessment.gut_symptoms.join(', ')}</span>
            )}
          </div>
        </div>

        {/* Diagnosis Cards */}
        <div className="v5-section">
          <div className="v5-section-title">HB+ Diagnosis</div>
          <div className="v5-diag-grid">
            {findings.map((f, i) => (
              <div key={i} className="v5-diag-card">
                <div className="v5-diag-icon">✦</div>
                <div className="v5-diag-text">{f.replace(/^[•\s*-]+/, '')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Treatment Goals */}
        <div className="v5-section">
          <div className="v5-section-title">Treatment Goals</div>
          <div className="v5-goals-list">
            {assessment.recommendations?.filter(r => r.startsWith('GOAL:')).map((goal, i) => (
              <div key={i} className="v5-goal-item">
                <div className="v5-goal-num">{i + 1}</div>
                <div className="v5-goal-text">{goal.replace('GOAL: ', '')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Plan */}
        <div className="v5-section">
          <div className="v5-section-title">Recommended Plan</div>
          <div className="v5-plan-banner">
             {assessment.recommendations?.find(r => r.startsWith('PLAN:'))?.replace('PLAN: ', '') || 'Nutritional Reset Plan'}
          </div>
          <div className="v5-plan-bullets">
            <div className="v5-pb-item"><span>✓</span> Optimises metabolic rate for body composition targets.</div>
            <div className="v5-pb-item"><span>✓</span> Restores gut integrity and prevents systemic inflammation.</div>
            <div className="v5-pb-item"><span>✓</span> Stabilises post-meal insulin response and brain fog markers.</div>
            <div className="v5-pb-item"><span>✓</span> Supports long-term weight maintenance and energy stability.</div>
          </div>
        </div>

        {/* Clinical Notes */}
        <div className="v5-section">
          <div className="v5-section-title">Clinical Notes</div>
          <table className="v5-table">
            <tbody>
              {assessment.past_surgeries && (
                <tr>
                  <td><strong>Past Surgeries</strong></td>
                  <td>{assessment.past_surgeries}</td>
                </tr>
              )}
              {assessment.skin_hair_nail && (
                <tr>
                  <td><strong>Skin / Hair</strong></td>
                  <td>{assessment.skin_hair_nail}</td>
                </tr>
              )}
              {assessment.medications && (
                <tr>
                  <td><strong>Intolerances</strong></td>
                  <td>{assessment.medications}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dietary Snapshot */}
        <div className="v5-section">
          <div className="v5-section-title">Dietary Snapshot</div>
          <table className="v5-table">
            <tbody>
              <tr>
                <td><strong>Breakfast</strong></td>
                <td>{assessment.dietary_breakfast || '—'}</td>
              </tr>
              <tr>
                <td><strong>Lunch</strong></td>
                <td>{assessment.dietary_lunch || '—'}</td>
              </tr>
              <tr>
                <td><strong>Dinner</strong></td>
                <td>{assessment.dietary_dinner || '—'}</td>
              </tr>
              <tr>
                <td><strong>Alcohol</strong></td>
                <td>{assessment.dietary_alcohol || '—'}</td>
              </tr>
              <tr>
                <td><strong>Outside Meals</strong></td>
                <td>{assessment.dietary_outside || '—'}</td>
              </tr>
              <tr>
                <td><strong>Smoking</strong></td>
                <td>{assessment.dietary_smoking || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Formatted Blood Tests */}
        <div className="v5-section">
          <div className="v5-section-title">Recommended Blood Tests</div>
          <div className="v5-blood-box">
             {assessment.recommendations?.find(r => r.startsWith('BLOOD TESTS:'))?.replace('BLOOD TESTS: ', '') || 'No further tests required.'}
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="v5-footer">
          <p><strong>Disclaimer:</strong> This assessment is based on client-provided info and anthropometric markers. Suggesions are nutritional and lifestyle-related only. This is not a medical prescription. HB+ Hyderabad — Hyderabad, India. Support: +91 9999999999 • hb-plus.co.in</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .report-wrapper-v5 {
           max-width: 900px;
           margin: 0 auto;
           padding: 20px;
           font-family: 'DM Sans', sans-serif;
           color: var(--ink);
        }
        .report-actions-v5 {
           display: flex;
           justify-content: flex-end;
           gap: 12px;
           margin-bottom: 20px;
        }
        .btn-v5-primary {
           background: var(--sage);
           color: white;
           border: none;
           padding: 10px 20px;
           border-radius: 8px;
           cursor: pointer;
           font-weight: 700;
           display: flex;
           align-items: center;
           gap: 8px;
        }
        .btn-v5-secondary {
           background: white;
           color: var(--sage);
           border: 1.5px solid var(--sage);
           padding: 10px 20px;
           border-radius: 8px;
           cursor: pointer;
           font-weight: 700;
           display: flex;
           align-items: center;
           gap: 8px;
        }
        .report-sheet-a4 {
           background: white;
           padding: 40px;
           border: 1px solid var(--border);
           box-shadow: 0 10px 40px rgba(0,0,0,0.05);
           min-height: 297mm;
        }
        .report-header-v5 {
           display: flex;
           justify-content: space-between;
           align-items: flex-end;
           border-bottom: 4px solid var(--sage);
           padding-bottom: 12px;
           margin-bottom: 24px;
        }
        .header-brand-v5 h1 {
           font-family: 'DM Serif Display', serif;
           font-size: 28px;
           margin: 0;
           color: var(--charcoal);
        }
        .header-brand-v5 p {
           font-size: 13px;
           color: var(--sage);
           margin: 4px 0 0;
           font-weight: 600;
        }
        .header-client-v5 { text-align: right; }
        .name-v5 { font-family: 'DM Serif Display', serif; font-size: 24px; color: var(--sage); }
        .date-v5 { font-size: 11px; color: var(--smoke); font-weight: 700; text-transform: uppercase; }

        .metrics-grid-v5 {
           display: grid;
           grid-template-columns: repeat(5, 1fr);
           background: var(--mist);
           border: 1px solid var(--border);
           border-radius: 12px;
           margin-bottom: 24px;
           overflow: hidden;
        }
        .metric-box-v5 {
           padding: 16px;
           text-align: center;
           border-right: 1px solid var(--border);
        }
        .metric-box-v5:last-child { border-right: none; }
        .v5-val { font-size: 20px; font-weight: 800; color: var(--charcoal); }
        .v5-val span { font-size: 11px; margin-left: 2px; color: var(--smoke); }
        .v5-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--sage); margin-top: 4px; }

        .v5-section { 
          margin-bottom: 28px; 
          border-top: 1px solid #eee; 
          padding-top: 10px; 
          break-inside: avoid; /* Keeps header and content together */
        }
        .v5-section:empty { display: none; }
        
        .v5-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .v5-table td { padding: 10px; border: 1px solid #f0f0f0; }
        .v5-table tr td:first-child, .v5-table tr td:nth-child(3) { background: #fdfdfd; width: 150px; font-weight: 700; font-size: 11px; text-transform: uppercase; color: var(--smoke); }

        .v5-badge-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .v5-badge { padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
        .v5-badge.red { background: #fee2e2; color: #991b1b; }
        .v5-badge.orange { background: #ffedd5; color: #9a3412; }
        .v5-badge.yellow { background: #fef9c3; color: #854d0e; }

        .v5-diag-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .v5-diag-card { 
          background: var(--sage-pale); 
          border: 1.5px solid var(--border); 
          padding: 14px; 
          border-radius: 12px; 
          display: flex; 
          gap: 12px;
          align-items: center;
        }
        .v5-diag-icon { color: var(--clay); font-size: 18px; }
        .v5-diag-text { font-size: 13px; font-weight: 700; color: var(--ink); }

        .v5-goal-item { display: flex; gap: 14px; align-items: center; background: var(--mist); padding: 12px; border-radius: 10px; margin-bottom: 8px; border-left: 4px solid var(--sage); }
        .v5-goal-num { width: 24px; height: 24px; background: var(--sage); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
        .v5-goal-text { font-size: 13px; font-weight: 600; color: var(--ink); }

        .v5-plan-banner { background: var(--sage); color: white; padding: 16px; border-radius: 10px 10px 0 0; font-family: 'DM Serif Display', serif; font-size: 20px; text-transform: uppercase; text-align: center; letter-spacing: 1px; }
        .v5-plan-bullets { background: var(--sage-pale); border: 1px solid var(--border); border-top: none; padding: 20px; border-radius: 0 0 10px 10px; }
        .v5-pb-item { display: flex; gap: 10px; font-size: 13px; line-height: 1.6; margin-bottom: 10px; color: var(--ink); font-weight: 600; }
        .v5-pb-item span { color: var(--sage); font-weight: 800; font-size: 16px; }

        .v5-blood-box { background: var(--mist); border: 1.5px dashed var(--sage); padding: 20px; border-radius: 12px; font-size: 13px; line-height: 1.7; color: var(--ink); font-weight: 600; font-family: 'DM Mono', monospace; }

        .v5-footer { border-top: 1px solid var(--border); padding-top: 20px; margin-top: 40px; }
        .v5-footer p { font-size: 10px; color: var(--smoke); line-height: 1.5; text-align: justify; }

        @media print {
            body { background: white !important; }
            .report-wrapper-v5 { padding: 0 !important; max-width: none !important; margin: 0 !important; }
            .report-sheet-a4 { box-shadow: none !important; border: none !important; padding: 10mm 15mm !important; width: 210mm !important; }
            .print-hide { display: none !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      ` }} />
    </div>
  );
};

export default ReportView;
