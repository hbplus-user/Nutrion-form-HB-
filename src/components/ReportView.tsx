import React from 'react';
import type { Assessment } from '../types';
import {
  Printer,
  ChevronLeft,
  FileEdit,
  Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabase';
import { getPlanBullets } from '../lib/planUtils';

interface ReportViewProps {
  assessment: Assessment;
  onBack: () => void;
  onEdit: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ assessment, onBack, onEdit }) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const printReport = async () => {
    setIsExporting(true);
    try {
      // 1. Target the report content
      const reportElement = document.querySelector('.report-sheet-a4') as HTMLElement;
      if (!reportElement) return;

      // 2. Capture as canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // 3. Convert to PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');

      // 4. Upload to Supabase Storage
      const fileName = `report_${assessment.uhid || 'P'}_${Date.now()}.pdf`;
      const { data, error } = await supabase.storage
        .from('reports-bucket')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
      } else {
        console.log('Report uploaded successfully:', data.path);
      }

      // 5. Finally, open browser print dialog for the user
      window.print();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to parse complex diagnosis string if needed, 
  // but we'll assume the diagnosis field might contain the tags.
  // Priority: use the specific tags from the snapshot
  const diagnosisTags = assessment.report_snapshot?.diagnosisTags || [];
  
  // Fallback for legacy records or if snapshot is missing
  let findings = diagnosisTags;
  if (findings.length === 0 && assessment.diagnosis) {
    const blocks = assessment.diagnosis.split('\n');
    // Only take the portion between HB+ CLINICAL FINDINGS and PRESENT MEDICAL CONCERNS
    const startIndex = blocks.findIndex(b => b.includes('HB+ CLINICAL FINDINGS:'));
    const endIndex = blocks.findIndex(b => b.includes('PRESENT MEDICAL CONCERNS:'));
    
    if (startIndex !== -1) {
      const sliceEnd = endIndex !== -1 ? endIndex : blocks.length;
      findings = blocks.slice(startIndex + 1, sliceEnd).filter(line => line.trim());
    }
  }

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
        
        <button 
          onClick={printReport} 
          className="btn-v5-primary" 
          disabled={isExporting}
        >
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} 
          {isExporting ? 'Generating PDF...' : 'Print / Export PDF'}
        </button>
      </div>

      <div className="report-sheet-a4">
        {/* Header Section */}
        <div className="report-header-v5">
          <div className="header-brand-v5">
            <img src="/hb-logo.png" alt="HB+" className="report-logo-v5" />
            <div className="brand-text-wrapper">
              <h1>Nutrition Assessment</h1>
              <p>Clinical Analysis & Performance Plan</p>
            </div>
          </div>
          <div className="header-client-v5">
            <div className="name-v5">{assessment.report_snapshot?.consultantName || 'Nutrition Consultant'}</div>
            <div className="date-v5">
              {assessment.report_snapshot?.specialization || 'Clinical Nutritionist'}
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        {assessment.bmi > 0 && (
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
        )}

        {/* 1. Client Snapshot */}
        <div className="v5-section">
          <div className="v5-section-title">Client Snapshot</div>
          <table className="v5-table">
            <tbody>
              <tr>
                <td><strong>Client Name</strong></td>
                <td>{assessment.client_name}</td>
                <td><strong>Report Date</strong></td>
                <td>{new Date().toLocaleDateString('en-GB')}</td>
              </tr>
              <tr>
                <td><strong>UHID / Patient ID</strong></td>
                <td>{assessment.uhid || 'P-' + Math.floor(Math.random()*9000 + 1000)}</td>
                <td><strong>Phone Number</strong></td>
                <td>{assessment.phone || '—'}</td>
              </tr>
              <tr>
                <td><strong>Age / Gender</strong></td>
                <td>{assessment.age}y • {assessment.gender}</td>
                <td><strong>Current Lifestyle</strong></td>
                <td>{assessment.lifestyle || '—'}</td>
              </tr>
              {assessment.report_snapshot?.stepCount && (
                <tr>
                  <td><strong>Daily movement</strong></td>
                  <td>{assessment.report_snapshot.stepCount} Steps</td>
                  <td><strong>Occupation</strong></td>
                  <td>{assessment.report_snapshot.jobActivity || '—'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 2. Clinical Profile */}
        {(assessment.report_snapshot?.medicalConcerns || assessment.report_snapshot?.symptomsReported || assessment.medications || assessment.past_surgeries || assessment.skin_hair_nail || assessment.report_snapshot?.menstrualHealth) && (
          <div className="v5-section">
            <div className="v5-section-title">Clinical Profile</div>
            <table className="v5-table">
              <tbody>
                {assessment.report_snapshot?.medicalConcerns && (
                  <tr>
                    <td><strong>Medical Concerns</strong></td>
                    <td colSpan={3}>{assessment.report_snapshot.medicalConcerns}</td>
                  </tr>
                )}
                {assessment.report_snapshot?.symptomsReported && (
                  <tr>
                    <td><strong>Reported Symptoms</strong></td>
                    <td colSpan={3}>{assessment.report_snapshot.symptomsReported}</td>
                  </tr>
                )}
                {(assessment.medications || assessment.past_surgeries) && (
                  <tr>
                    <td><strong>Medications</strong></td>
                    <td>{assessment.medications || 'None'}</td>
                    <td><strong>Past Surgeries</strong></td>
                    <td>{assessment.past_surgeries || 'None'}</td>
                  </tr>
                )}
                {(assessment.skin_hair_nail || assessment.report_snapshot?.menstrualHealth) && (
                  <tr>
                    <td><strong>Skin / Hair / Nails</strong></td>
                    <td>{assessment.skin_hair_nail || '—'}</td>
                    <td><strong>Menstrual Health</strong></td>
                    <td>{assessment.report_snapshot?.menstrualHealth || '—'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Biochemical Analysis */}
        {(assessment.fasting_sugar || assessment.report_snapshot?.hba1c || assessment.report_snapshot?.tsh || assessment.report_snapshot?.haemoglobin || assessment.report_snapshot?.vitaminB12) && (
          <div className="v5-section">
            <div className="v5-section-title">Biochemical Analysis (Blood Markers)</div>
            <table className="v5-table">
              <tbody>
                {assessment.fasting_sugar && (
                  <tr>
                    <td><strong>FBS</strong></td>
                    <td>{assessment.fasting_sugar} mg/dL</td>
                    <td><strong>HbA1c</strong></td>
                    <td>{assessment.report_snapshot?.hba1c || '—'}</td>
                  </tr>
                )}
                {(assessment.report_snapshot?.lipidProfile || assessment.report_snapshot?.tsh) && (
                  <tr>
                    <td><strong>Lipid Profile</strong></td>
                    <td>{assessment.report_snapshot?.lipidProfile || '—'}</td>
                    <td><strong>TSH</strong></td>
                    <td>{assessment.report_snapshot?.tsh || '—'}</td>
                  </tr>
                )}
                {(assessment.report_snapshot?.haemoglobin || assessment.report_snapshot?.ironFerritin) && (
                  <tr>
                    <td><strong>Haemoglobin</strong></td>
                    <td>{assessment.report_snapshot?.haemoglobin || '—'}</td>
                    <td><strong>Iron/Ferritin</strong></td>
                    <td>{assessment.report_snapshot?.ironFerritin || '—'}</td>
                  </tr>
                )}
                {(assessment.report_snapshot?.vitaminB12 || assessment.report_snapshot?.vitaminD) && (
                  <tr>
                    <td><strong>Vitamin B12</strong></td>
                    <td>{assessment.report_snapshot?.vitaminB12 || '—'}</td>
                    <td><strong>Vitamin D</strong></td>
                    <td>{assessment.report_snapshot?.vitaminD || '—'}</td>
                  </tr>
                )}
                {(assessment.report_snapshot?.liverEnzymes || assessment.report_snapshot?.kidneyProfile) && (
                  <tr>
                    <td><strong>Liver Profile</strong></td>
                    <td>{assessment.report_snapshot?.liverEnzymes || '—'}</td>
                    <td><strong>Kidney Profile</strong></td>
                    <td>{assessment.report_snapshot?.kidneyProfile || '—'}</td>
                  </tr>
                )}
                {(assessment.report_snapshot?.thyroidAntiTPO || assessment.report_snapshot?.hormonalProfile) && (
                  <tr>
                    <td><strong>Thyroid Anti-TPO</strong></td>
                    <td>{assessment.report_snapshot?.thyroidAntiTPO || '—'}</td>
                    <td><strong>Hormonal Prof.</strong></td>
                    <td>{assessment.report_snapshot?.hormonalProfile || '—'}</td>
                  </tr>
                )}
                {assessment.report_snapshot?.otherFlags && (
                  <tr>
                    <td><strong>Critical Flags</strong></td>
                    <td colSpan={3}>{assessment.report_snapshot?.otherFlags}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Dietitian's Strategic Impression */}
        <div style={{ pageBreakBefore: 'always', paddingBottom: '1px' }}></div>
        <div className="v5-section" style={{ borderTop: 'none' }}>
           <div className="v5-section-title" style={{ fontSize: '18px', color: 'var(--sage)', marginBottom: '20px' }}>Dietitian's Strategic Impression</div>
           

           {/* HB+ Diagnosis */}
           {findings.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--smoke)', marginBottom: '10px' }}>Clinical Findings</div>
                <div className="v5-diag-grid-detailed">
                  {findings.map((f: string, i: number) => (
                    <div key={i} className="v5-diag-item-large">
                      <div className="v5-diag-bullet">✦</div>
                      <div className="v5-diag-content">
                        <div className="v5-diag-text-large">{f.replace(/^[•\s*-]+/, '')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           )}
        </div>

        {/* 4. Dietary Analysis */}
        {(assessment.dietary_breakfast || assessment.dietary_lunch || assessment.dietary_dinner || assessment.report_snapshot?.midMorning) && (
          <div className="v5-section">
            <div className="v5-section-title">Dietary Analysis</div>
            <table className="v5-table">
              <tbody>
                {(assessment.report_snapshot?.wakeUpTime || assessment.report_snapshot?.preBreakfast) && (
                  <tr>
                    <td><strong>Wake-up</strong></td>
                    <td>{assessment.report_snapshot.wakeUpTime || '—'}</td>
                    <td><strong>Pre-Breakfast</strong></td>
                    <td>{assessment.report_snapshot.preBreakfast || '—'}</td>
                  </tr>
                )}
                {assessment.dietary_breakfast && (
                  <tr>
                    <td><strong>Breakfast</strong></td>
                    <td colSpan={3}>{assessment.dietary_breakfast}</td>
                  </tr>
                )}
                {assessment.report_snapshot?.midMorning && (
                  <tr>
                    <td><strong>Mid-Morning</strong></td>
                    <td colSpan={3}>{assessment.report_snapshot.midMorning}</td>
                  </tr>
                )}
                {assessment.dietary_lunch && (
                  <tr>
                    <td><strong>Lunch</strong></td>
                    <td colSpan={3}>{assessment.dietary_lunch}</td>
                  </tr>
                )}
                {assessment.report_snapshot?.eveningSnack && (
                  <tr>
                    <td><strong>Evening Snack</strong></td>
                    <td colSpan={3}>{assessment.report_snapshot.eveningSnack}</td>
                  </tr>
                )}
                {assessment.dietary_dinner && (
                  <tr>
                    <td><strong>Dinner</strong></td>
                    <td colSpan={3}>{assessment.dietary_dinner}</td>
                  </tr>
                )}
                {assessment.report_snapshot?.postDinner && (
                  <tr>
                    <td><strong>Post Dinner</strong></td>
                    <td colSpan={3}>{assessment.report_snapshot.postDinner}</td>
                  </tr>
                )}
                {(assessment.report_snapshot?.teaCoffee || assessment.report_snapshot?.fruitIntake) && (
                  <tr>
                    <td><strong>Tea/Coffee</strong></td>
                    <td>{assessment.report_snapshot.teaCoffee || '—'}</td>
                    <td><strong>Fruit Intake</strong></td>
                    <td>{assessment.report_snapshot.fruitIntake || '—'}</td>
                  </tr>
                )}
                {(assessment.report_snapshot?.foodAllergies || assessment.report_snapshot?.outsideMeals) && (
                  <tr>
                    <td><strong>Allergies</strong></td>
                    <td>{assessment.report_snapshot.foodAllergies || 'None'}</td>
                    <td><strong>Outside Meals</strong></td>
                    <td>{assessment.report_snapshot.outsideMeals || '—'}</td>
                  </tr>
                )}
                {assessment.report_snapshot?.eatingPattern && (
                  <tr>
                    <td><strong>Eating Pattern</strong></td>
                    <td colSpan={3}>{assessment.report_snapshot.eatingPattern}</td>
                  </tr>
                )}
                <tr>
                  <td><strong>Smoking</strong></td>
                  <td>{assessment.dietary_smoking || 'No'}</td>
                  <td><strong>Alcohol</strong></td>
                  <td>{assessment.dietary_alcohol || 'No'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Lifestyle & Gut Habits */}
        {(assessment.gut_notes || assessment.report_snapshot?.waterIntake || assessment.report_snapshot?.sleepDuration || assessment.report_snapshot?.stoolFrequency) && (
          <div className="v5-section">
            <div className="v5-section-title">Lifestyle & Gut Habits</div>
            <table className="v5-table">
              <tbody>
                {(assessment.report_snapshot?.waterIntake || assessment.report_snapshot?.stoolFrequency) && (
                  <tr>
                    <td><strong>Water Intake</strong></td>
                    <td>{assessment.report_snapshot.waterIntake || '—'}</td>
                    <td><strong>Stool Freq.</strong></td>
                    <td>{assessment.report_snapshot.stoolFrequency || '—'}</td>
                  </tr>
                )}
                {(assessment.report_snapshot?.sleepDuration || assessment.report_snapshot?.energyLevels) && (
                  <tr>
                    <td><strong>Sleep</strong></td>
                    <td>{assessment.report_snapshot.sleepDuration ? assessment.report_snapshot.sleepDuration + ' hrs' : '—'} ({assessment.report_snapshot.sleepQuality || 'Average'})</td>
                    <td><strong>Energy Levels</strong></td>
                    <td>{assessment.report_snapshot.energyLevels || '—'}</td>
                  </tr>
                )}
                {assessment.report_snapshot?.stressLevel && (
                  <tr>
                    <td><strong>Stress Level</strong></td>
                    <td>Level {assessment.report_snapshot.stressLevel} / 10</td>
                    <td><strong>Stress Scale</strong></td>
                    <td>{assessment.report_snapshot.stressLevel > 7 ? 'High' : assessment.report_snapshot.stressLevel > 4 ? 'Moderate' : 'Low'} Stress</td>
                  </tr>
                )}
                {assessment.gut_notes && (
                  <tr>
                    <td><strong>Gut Health Notes</strong></td>
                    <td colSpan={3}>{assessment.gut_notes}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Treatment Goals */}
        {assessment.recommendations?.some(r => r.startsWith('GOAL:')) && (
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
        )}

        {/* Recommended Plan */}
        {(assessment.recommendations?.some(r => r.startsWith('PLAN:')) || assessment.recommendations?.some(r => r.startsWith('ITEM:'))) && (
          <div className="v5-section">
            <div className="v5-section-title">Recommended Plan</div>
            <div className="v5-plan-banner">
               {assessment.recommendations?.find(r => r.startsWith('PLAN:'))?.replace('PLAN: ', '') || 'Nutritional Reset Plan'} 
               {assessment.recommendations?.find(r => r.startsWith('DURATION:')) && (
                  <span style={{ opacity: 0.8, fontSize: '0.9em', marginLeft: '10px', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '10px' }}>
                    {assessment.recommendations?.find(r => r.startsWith('DURATION:'))?.replace('DURATION: ', '')}
                  </span>
               )}
            </div>
            <div className="v5-plan-bullets">
              {(assessment.recommendations?.some(r => r.startsWith('ITEM:')) 
                ? assessment.recommendations.filter(r => r.startsWith('ITEM:')).map(i => i.replace('ITEM: ', ''))
                : getPlanBullets(assessment.recommendations?.find(r => r.startsWith('PLAN:'))?.replace('PLAN: ', '') || '')
              ).map((bullet, idx) => (
                <div key={idx} className="v5-pb-item"><span>✓</span> {bullet}</div>
              ))}
            </div>
          </div>
        )}



        {/* Formatted Blood Tests */}
        {assessment.recommendations?.some(r => r.startsWith('BLOOD TESTS:')) && (
          <div className="v5-section">
            <div className="v5-section-title">Recommended Blood Tests</div>
            <div className="v5-blood-box">
               {assessment.recommendations?.find(r => r.startsWith('BLOOD TESTS:'))?.replace('BLOOD TESTS: ', '')}
            </div>
          </div>
        )}

        {/* Uploaded PDF Link */}
        {assessment.pdf_url && (
          <div className="v5-section print-hide">
            <div className="v5-section-title">Clinical Files Attached</div>
            <div className="v5-blood-box" style={{ borderStyle: 'solid', background: '#f0f4f8' }}>
              <a href={assessment.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sage)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={16} /> View External Clinical PDF
              </a>
            </div>
          </div>
        )}

        {/* Footer Disclaimer */}
        <div className="v5-footer">
          <p><strong>Disclaimer:</strong> This assessment is based on client-provided info and anthropometric markers. Suggestions are nutritional and lifestyle-related only. This is not a medical prescription. Support: +91 91544 55152 • healingbodiesplus.com</p>
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
        .date-v5 { font-size: 11px; color: #475569; font-weight: 700; text-transform: uppercase; }

        .metrics-grid-v5 {
           display: grid;
           grid-template-columns: repeat(5, 1fr);
           background: #fefce8;
           border: 2px solid #fde047;
           border-radius: 12px;
           margin-bottom: 24px;
           overflow: hidden;
        }
        .metric-box-v5 {
           padding: 18px 10px;
           text-align: center;
           border-right: 1px solid #fde047;
           display: flex;
           flex-direction: column;
           justify-content: center;
           min-height: 80px;
        }
        .metric-box-v5:last-child { border-right: none; }
        .v5-val { font-size: 20px; font-weight: 900; color: #854d0e; line-height: 1; }
        .v5-val span { font-size: 11px; margin-left: 2px; color: #a16207; opacity: 0.8; }
        .v5-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #854d0e; margin-top: 8px; letter-spacing: 0.5px; }

        .v5-label-v2 { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--sage); margin-top: 6px; letter-spacing: 0.5px; }

        .v5-section { 
          margin-bottom: 32px; 
          border-top: 2px solid var(--mist); 
          padding-top: 15px; 
          break-inside: avoid;
        }
        .v5-section-title { 
          font-size: 14px; 
          font-weight: 800; 
          text-transform: uppercase; 
          color: var(--charcoal); 
          margin-bottom: 15px; 
          letter-spacing: 1px;
          border-left: 4px solid var(--sage);
          padding-left: 10px;
        }
        
        .v5-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 10px; }
        .v5-table td { padding: 12px 15px; border: 1.5px solid #e2e8f0; vertical-align: middle; }
        .v5-table tr td:first-child, .v5-table tr td:nth-child(3) { 
          background: #f8fafc; 
          width: 160px; 
          font-weight: 800; 
          font-size: 10px; 
          text-transform: uppercase; 
          color: #334155; 
          letter-spacing: 0.5px;
          border-left: 4px solid #cbd5e1;
        }

        .v5-badge-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .v5-badge { padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
        .v5-badge.red { background: #fee2e2; color: #991b1b; }
        .v5-badge.orange { background: #ffedd5; color: #9a3412; }
        .v5-badge.yellow { background: #fef9c3; color: #854d0e; }

        .v5-diag-grid-detailed { display: flex; flex-direction: column; gap: 8px; }
        .v5-diag-item-large { 
          background: #fdfdfd; 
          border: 1px solid #eee; 
          padding: 16px 20px; 
          border-radius: 12px; 
          display: flex; 
          gap: 15px; 
          align-items: flex-start;
          transition: all 0.2s ease;
        }
        .v5-diag-bullet { color: var(--clay); font-size: 18px; line-height: 1; margin-top: 2px; }
        .v5-diag-text-large { font-size: 14px; font-weight: 700; color: var(--charcoal); line-height: 1.5; }

        .v5-gut-details { background: var(--mist); padding: 20px; border-radius: 12px; border: 1px solid var(--border); }
        .v5-gut-symptoms-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
        .v5-gut-symptoms-row strong { font-size: 11px; text-transform: uppercase; color: var(--smoke); letter-spacing: 0.5px; }
        .v5-gut-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .v5-gut-chip { background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
        .v5-gut-notes-box { border-top: 1px solid #e2e2e2; padding-top: 12px; margin-top: 8px; }
        .v5-gut-notes-box strong { font-size: 11px; text-transform: uppercase; color: var(--smoke); letter-spacing: 0.5px; display: block; margin-bottom: 8px; }
        .v5-gut-notes-box p { font-size: 13px; color: var(--ink); line-height: 1.6; margin: 0; font-weight: 500; }

        .v5-blood-box { background: var(--mist); border: 1.5px dashed var(--sage); padding: 20px; border-radius: 12px; font-size: 13px; line-height: 1.7; color: var(--ink); font-weight: 600; font-family: 'DM Mono', monospace; }

        .v5-plan-banner {
          background: var(--charcoal);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .v5-plan-bullets {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .v5-pb-item {
          display: flex;
          gap: 10px;
          font-size: 13px;
          line-height: 1.5;
          color: var(--ink);
          font-weight: 600;
        }
        .v5-pb-item span {
          color: var(--sage);
          font-weight: 900;
        }

        .v5-goals-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px; }
        .v5-goal-item { 
          background: #f8fafc; 
          border: 1px solid #e2e8f0; 
          padding: 12px 16px; 
          border-radius: 10px; 
          display: flex; 
          align-items: center; 
          gap: 12px; 
        }
        .v5-goal-num { 
          background: var(--sage); 
          color: white; 
          width: 24px; 
          height: 24px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 11px; 
          font-weight: 800; 
          flex-shrink: 0;
        }
        .v5-goal-text { font-size: 13px; font-weight: 700; color: var(--charcoal); }

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
