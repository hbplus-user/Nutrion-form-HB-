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

interface ReportViewProps {
  assessment: Assessment;
  onBack: () => void;
  onEdit: () => void;
}

const getPlanBullets = (planName: string) => {
  const name = planName.toUpperCase();
  
  if (name.includes('FAT LOSS') || name.includes('METABOLIC RESET')) {
    return [
      'Improves metabolic rate, energy balance, reduces excess body fat and elevated BMI, with balanced meals and portion control',
      'Enhances fat metabolism, helping the body utilize stored fat more efficiently, by improving meal quality and nutrient distribution.',
      'Regulates appetite, cravings, and prevents overeating, with improved hormonal signaling and proper meal timing.',
      'Supports blood sugar stability, reduces energy crashes and fatigue, by avoiding long gaps and improving insulin sensitivity.',
      'Reduces internal inflammation, which is often the root cause of weight gain and metabolic issues.',
      'Improves gut-brain axis function and vagus nerve signalling to manage stress, cravings, and digestion, with food and lifestyle.',
      'Supports better sleep and reduces cortisol imbalance, through regulated lifestyle habits, helping improve recovery and fat loss.',
      'Enhances skin health and immunity with anti-oxidant, anti-inflammatory and micro nutrient dense food groups.',
      'Regulates appetite and reduces unexplained weight gain, by maintaining structured meals and balanced nutrition.'
    ];
  }
  
  if (name.includes('THYROID')) {
    return [
      'Supports thyroid hormone balance, improves metabolism and helps reduce weight, by ensuring nutrient-rich and balanced meals.',
      'Enhances T4 to T3 conversion, improves energy levels and metabolic activity, by correcting nutrient deficiencies and gut microbiome.',
      'Improves gut-thyroid axis function, better hormone regulation and digestion with gut-friendly foods inclusion.',
      'Reduces fatigue, improves energy level, and supports better daily functioning, by improving mitochondrial energy production.',
      'Supports hormonal balance, reduces inflammation, improves food quality and lifestyle, helping improve overall thyroid health.',
      'Improves thyroid function, by correcting nutrient absorption, and underlying deficiencies such as iodine, selenium and zinc.'
    ];
  }
  
  if (name.includes('GUT MICROBIOME') || name.includes('GUT HEALTH')) {
    return [
      'Restores gut microbiota balance, improves digestion and overall gut function, by including gut-healing and easily digestible foods.',
      'Enhances nutrient absorption, improves energy level and correct deficiencies, by improving digestion.',
      'Reduces bloating, acidity, and digestive discomfort, by maintaining a balanced and simple meal pattern.',
      'Supports gut-brain axis, helping improve mood, cravings, sleep and stress response.',
      'Reduces internal inflammation and repairs gut barrier, helping improve skin health and overall metabolic function.',
      'Strengthens immunity, & reduces inflammation through anti-inflammatory foods, herbs, and adaptogens, while improving overall dietary quality.',
      'Supports better metabolism and energy production, by improving digestive efficiency'
    ];
  }
  
  if (name.includes('PCOS') || name.includes('HORMONAL')) {
    return [
      'Regulates menstrual cycle by supporting ovulation, estrogen-progesterone balance, and reduced androgen level.',
      'Improves insulin sensitivity, metabolic functions, and weight management helping control PCOS symptoms.',
      'Improves PCOS symptoms like fatigue, mood swings, and low energy, by regulating metabolic and hormonal function.',
      'Helps improve period pain, skin health (acne & pigmentation), and inflammation with anti-inflammatory foods, adaptogens and healthy fats.',
      'Increases insulin sensitivity to help improve brain functioning, mood stability, cravings, energy production, muscle and heart health.',
      'Enhances gut health and hormone detoxification via the gut-liver axis, providing better hormone utilization at the cellular level.'
    ];
  }
  
  if (name.includes('DIABETES')) {
    return [
      'Helps regulate blood sugar levels and prevent post-meal crashes through balanced meal timing, composition and glucose utilization.',
      'Increases insulin sensitivity to help improve brain functioning, mood stability, cravings, energy production, muscle and heart health.',
      'Enhances metabolic function by improving lifestyle habits, micro & macro nutrient density through supplementation and lifestyle habits.',
      'Supports gut health, which plays an important role in glucose metabolism and inflammation control'
    ];
  }
  
  return [
    'Optimises metabolic rate for body composition targets.',
    'Restores gut integrity and prevents systemic inflammation.',
    'Stabilises post-meal insulin response and brain fog markers.',
    'Supports long-term weight maintenance and energy stability.'
  ];
};

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
              <h1>Nutrition Assessment Report</h1>
            </div>
          </div>
          <div className="header-client-v5">
            <div className="name-v5">{assessment.client_name}</div>
            <div className="date-v5">
              UHID: {assessment.uhid || 'P-4282'} • {assessment.phone || '+91 00000 00000'}
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
                <td><strong>Diet Type</strong></td>
                <td>{assessment.diet_type}</td>
                <td><strong>Report Date</strong></td>
                <td>{new Date().toLocaleDateString('en-GB')}</td>
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
            {(assessment.gut_symptoms?.length ?? 0) > 0 && (
               <span className="v5-badge yellow">Gut Issues: {assessment.gut_symptoms?.join(', ')}</span>
            )}
          </div>
        </div>

        {/* HB+ Diagnosis */}
        <div className="v5-section">
          <div className="v5-section-title">HB+ Diagnosis</div>
          <div className="v5-diag-grid-detailed">
            {findings.map((f, i) => (
              <div key={i} className="v5-diag-item-large">
                <div className="v5-diag-bullet">✦</div>
                <div className="v5-diag-content">
                  <div className="v5-diag-text-large">{f.replace(/^[•\s*-]+/, '')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gut Health Details */}
        <div className="v5-section">
          <div className="v5-section-title">Gut Health Assessment</div>
          <div className="v5-gut-details">
            <div className="v5-gut-symptoms-row">
              <strong>Symptoms Reported:</strong>
              <div className="v5-gut-chips">
                {assessment.gut_symptoms?.map(s => (
                  <span key={s} className="v5-gut-chip">{s}</span>
                )) || <span className="text-smoke">None reported</span>}
              </div>
            </div>
            {assessment.gut_notes && (
              <div className="v5-gut-notes-box">
                <strong>Clinician Notes:</strong>
                <p>{assessment.gut_notes}</p>
              </div>
            )}
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
             {assessment.recommendations?.find(r => r.startsWith('DURATION:')) && (
                <span style={{ opacity: 0.8, fontSize: '0.9em', marginLeft: '10px', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '10px' }}>
                  {assessment.recommendations?.find(r => r.startsWith('DURATION:'))?.replace('DURATION: ', '')}
                </span>
             )}
          </div>
          <div className="v5-plan-bullets">
            {getPlanBullets(assessment.recommendations?.find(r => r.startsWith('PLAN:'))?.replace('PLAN: ', '') || '').map((bullet, idx) => (
              <div key={idx} className="v5-pb-item"><span>✓</span> {bullet}</div>
            ))}
          </div>
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
