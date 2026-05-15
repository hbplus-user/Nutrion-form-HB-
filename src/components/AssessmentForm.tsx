import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Assessment } from '../types';
import { getPlanBullets } from '../lib/planUtils';


interface AssessmentFormProps {
  onSuccess: (data: any) => void;
  initialData?: Assessment;
}



function calcBMI(weightKg: number, heightFtIn: string): number {
  const parts = heightFtIn.split('.');
  const feet = parseFloat(parts[0]) || 0;
  const inches = parseFloat(parts[1]) || 0;
  const totalInches = feet * 12 + inches;
  const meters = totalInches * 0.0254;
  if (meters <= 0 || weightKg <= 0) return 0;
  return parseFloat((weightKg / (meters * meters)).toFixed(2));
}

function calcBMR(weightKg: number, heightFtIn: string, age: number, sex: string): number {
  const parts = heightFtIn.split('.');
  const feet = parseFloat(parts[0]) || 0;
  const inches = parseFloat(parts[1]) || 0;
  const totalInches = feet * 12 + inches;
  const cm = totalInches * 2.54;
  if (weightKg <= 0 || cm <= 0 || age <= 0) return 0;
  if (sex === 'Female') {
    return Math.round(10 * weightKg + 6.25 * cm - 5 * age - 161);
  }
  return Math.round(10 * weightKg + 6.25 * cm - 5 * age + 5);
}

function calcTDEE(bmr: number, lifestyle: string): number {
  const factor: Record<string, number> = {
    'Sedentary': 1.2,
    'WFH': 1.375,
    'Hybrid': 1.375,
    'Office': 1.55,
    'On the Move': 1.725,
  };
  return Math.round(bmr * (factor[lifestyle] || 1.375));
}

function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi <= 0) return { label: '—', color: '#c6c6c6' }; /* var(--smoke) / #c6c6c6 */
  if (bmi < 18.5) return { label: `Underweight (BMI ${bmi})`, color: '#c99d5d' }; /* var(--gold) / #c99d5d */
  if (bmi < 25) return { label: `Normal Weight (BMI ${bmi})`, color: '#747440' }; /* var(--sage) / #747440 */
  if (bmi < 30) return { label: `Overweight (BMI ${bmi})`, color: '#a9674d' }; /* var(--clay) / #a9674d */
  return { label: `Obese (BMI ${bmi})`, color: '#9f4022' }; /* var(--red-soft) / #9f4022 */
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({ onSuccess, initialData }) => {
  const [loading, setLoading] = useState(false);

  const snap = initialData?.report_snapshot || {};

  // Section 1 – Anthropometric
  const [clientName, setClientName] = useState(initialData?.client_name || snap.clientName || '');
  const [uhid, setUhid] = useState(initialData?.uhid || snap.uhid || '');
  const [age, setAge] = useState(initialData?.age?.toString() || snap.age || '');
  const [sex, setSex] = useState(initialData?.gender || snap.sex || 'Female');
  const [height, setHeight] = useState(initialData?.height?.toString() || snap.height || '');
  const [weight, setWeight] = useState(initialData?.weight?.toString() || snap.weight || '');
  const [phone, setPhone] = useState(initialData?.phone || snap.phone || '');
  const [jobActivity, setJobActivity] = useState(initialData?.occupation || snap.jobActivity || '');
  const [lifestyle, setLifestyle] = useState(initialData?.lifestyle || snap.lifestyle || '');
  const [stepCount, setStepCount] = useState(snap.stepCount || '');

  // Consultant Info
  const [consultantName, setConsultantName] = useState(snap.consultantName || '');
  const [specialization, setSpecialization] = useState(snap.specialization || 'Clinical Dietitian');

  // Computed
  const bmi = calcBMI(parseFloat(weight) || 0, height);
  const bmr = calcBMR(parseFloat(weight) || 0, height, parseFloat(age) || 0, sex);
  const tdee = calcTDEE(bmr, lifestyle);
  const bmiCat = getBMICategory(bmi);

  // Section 2 – Biochemical
  const [bloodReportsAvailable, setBloodReportsAvailable] = useState<'Yes' | 'No' | ''>(snap.bloodReportsAvailable || (initialData ? 'Yes' : ''));
  const [reportDate, setReportDate] = useState(snap.reportDate || '');
  const [fbs, setFbs] = useState(initialData?.fasting_sugar?.toString() || snap.fbs || '');
  const [hba1c, setHba1c] = useState(snap.hba1c || '');
  const [lipidProfile, setLipidProfile] = useState(snap.lipidProfile || '');
  const [tsh, setTsh] = useState(snap.tsh || '');
  const [haemoglobin, setHaemoglobin] = useState(snap.haemoglobin || '');
  const [ironFerritin, setIronFerritin] = useState(snap.ironFerritin || '');
  const [vitaminB12, setVitaminB12] = useState(snap.vitaminB12 || '');
  const [vitaminD, setVitaminD] = useState(snap.vitaminD || '');
  const [liverEnzymes, setLiverEnzymes] = useState(snap.liverEnzymes || '');
  const [kidneyProfile, setKidneyProfile] = useState(snap.kidneyProfile || '');
  const [thyroidAntiTPO, setThyroidAntiTPO] = useState(snap.thyroidAntiTPO || '');
  const [hormonalProfile, setHormonalProfile] = useState(snap.hormonalProfile || '');
  const [otherFlags, setOtherFlags] = useState(snap.otherFlags || '');

  // Section 3 – Clinical
  const [medicalConcerns, setMedicalConcerns] = useState(snap.medicalConcerns || initialData?.diagnosis?.split('PRESENT MEDICAL CONCERNS:\n')[1] || '');
  const [symptomsReported, setSymptomsReported] = useState(snap.symptomsReported || '');
  const [pastSurgeries, setPastSurgeries] = useState(initialData?.past_surgeries || snap.pastSurgeries || '');
  const [currentMedications, setCurrentMedications] = useState(initialData?.medications || snap.currentMedications || '');
  const [skinHairNail, setSkinHairNail] = useState(initialData?.skin_hair_nail || snap.skinHairNail || '');
  const [menstrualHealth, setMenstrualHealth] = useState(snap.menstrualHealth || '');

  const [waterIntake, setWaterIntake] = useState(snap.waterIntake || '');
  const [eatingPattern, setEatingPattern] = useState(snap.eatingPattern || '');
  const [stoolFrequency, setStoolFrequency] = useState(snap.stoolFrequency || '');
  const [gutNotes, setGutNotes] = useState(initialData?.gut_notes || snap.gutNotes || '');

  // Section 5 – Lifestyle
  const [sleepQuality, setSleepQuality] = useState(snap.sleepQuality || (initialData?.sleep_hours ? 'Good' : ''));
  const [sleepDuration, setSleepDuration] = useState(initialData?.sleep_hours?.toString() || snap.sleepDuration || '');
  const [stressLevel, setStressLevel] = useState(initialData?.stress_level || snap.stressLevel || 5);
  const [energyLevels, setEnergyLevels] = useState(snap.energyLevels || '');

  // Section 6 – Dietary Assessment
  const [wakeUpTime, setWakeUpTime] = useState(snap.wakeUpTime || '');
  const [preBreakfast, setPreBreakfast] = useState(snap.preBreakfast || '');
  const [breakfast, setBreakfast] = useState(initialData?.dietary_breakfast || snap.breakfast || '');
  const [midMorning, setMidMorning] = useState(snap.midMorning || '');
  const [lunch, setLunch] = useState(initialData?.dietary_lunch || snap.lunch || '');
  const [eveningSnack, setEveningSnack] = useState(snap.eveningSnack || '');
  const [dinner, setDinner] = useState(initialData?.dietary_dinner || snap.dinner || '');
  const [postDinner, setPostDinner] = useState(snap.postDinner || '');
  const [teaCoffee, setTeaCoffee] = useState(snap.teaCoffee || '');
  const [fruitIntake, setFruitIntake] = useState(snap.fruitIntake || '');
  const [foodAllergies, setFoodAllergies] = useState(snap.foodAllergies || '');
  const [smoking, setSmoking] = useState(initialData?.dietary_smoking || snap.smoking || '');
  const [alcoholIntake, setAlcoholIntake] = useState(initialData?.dietary_alcohol || snap.alcoholIntake || '');
  const [outsideMeals, setOutsideMeals] = useState(initialData?.dietary_outside || snap.outsideMeals || '');

  // Section 7 – Dietitian's Clinical Impression & Plan
  const [diagnosisTags, setDiagnosisTags] = useState<string[]>(
    snap.diagnosisTags || (initialData?.diagnosis?.includes('HB+ CLINICAL FINDINGS:')
      ? initialData.diagnosis.split('HB+ CLINICAL FINDINGS:\n')[1]?.split('\n\n')[0]?.split('\n') || []
      : [])
  );
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const diagnosisInputRef = useRef<HTMLTextAreaElement>(null);
  const goalInputRef = useRef<HTMLInputElement>(null);
  const [treatmentGoalTags, setTreatmentGoalTags] = useState<string[]>(
    snap.treatmentGoalTags || (initialData?.recommendations?.filter(r => r.startsWith('GOAL:')).map(g => g.replace('GOAL: ', '')) || [])
  );
  const [treatmentGoalInput, setTreatmentGoalInput] = useState('');
  const [planName, setPlanName] = useState(snap.planName || initialData?.recommendations?.find(r => r.startsWith('PLAN:'))?.replace('PLAN: ', '') || '');
  const [planDuration, setPlanDuration] = useState(snap.planDuration || '');
  const [bloodTests, setBloodTests] = useState(snap.bloodTests || initialData?.recommendations?.find(r => r.startsWith('BLOOD TESTS:'))?.replace('BLOOD TESTS: ', '') || '');

  const [planItemTags, setPlanItemTags] = useState<string[]>(
    initialData?.recommendations?.filter(r => r.startsWith('ITEM:')).map(i => i.replace('ITEM: ', '')) || []
  );
  const [planItemInput, setPlanItemInput] = useState('');

  const [editDiagIdx, setEditDiagIdx] = useState<number | null>(null);
  const [editDiagVal, setEditDiagVal] = useState('');
  const [editGoalIdx, setEditGoalIdx] = useState<number | null>(null);
  const [editGoalVal, setEditGoalVal] = useState('');

  const addTag = (setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setList(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
  };

  const removeTag = (setList: React.Dispatch<React.SetStateAction<string[]>>, tag: string) => {
    setList(prev => prev.filter(t => t !== tag));
  };

  const clearForm = () => {
    if (!confirm('Clear all form data?')) return;
    setClientName(''); setPhone(''); setAge(''); setSex('Female'); setHeight(''); setWeight('');
    setJobActivity(''); setLifestyle(''); setStepCount('');
    setBloodReportsAvailable(''); setReportDate(''); setFbs(''); setHba1c(''); setLipidProfile('');
    setTsh(''); setHaemoglobin(''); setIronFerritin(''); setVitaminB12(''); setVitaminD('');
    setLiverEnzymes(''); setKidneyProfile(''); setThyroidAntiTPO(''); setHormonalProfile(''); setOtherFlags('');
    setMedicalConcerns(''); setSymptomsReported(''); setPastSurgeries(''); setCurrentMedications('');
    setSkinHairNail(''); setMenstrualHealth('');
    setWaterIntake(''); setEatingPattern(''); setGutNotes(''); setStoolFrequency('');
    setSleepQuality(''); setSleepDuration(''); setStressLevel(5); setEnergyLevels('');
    setWakeUpTime(''); setPreBreakfast(''); setBreakfast(''); setMidMorning('');
    setLunch(''); setEveningSnack(''); setDinner(''); setPostDinner(''); setTeaCoffee('');
    setFruitIntake(''); setFoodAllergies(''); setSmoking(''); setAlcoholIntake(''); setOutsideMeals('');
    setDiagnosisTags([]); setTreatmentGoalTags([]); setPlanName(''); setPlanDuration('12 Weeks'); setBloodTests('');
    setPlanItemTags([]); setPlanItemInput('');
    setConsultantName(''); setSpecialization('Clinical Dietitian');
  };







  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        client_name: clientName,
        uhid: uhid,
        age: parseInt(age) || null,
        gender: sex.toLowerCase() as any,
        phone: phone,
        occupation: jobActivity,
        weight: parseFloat(weight) || null,
        height: parseFloat(height) || null,
        bmi: bmi || null,
        bmr: bmr || null,
        tdee: tdee || null,
        waist_circumference: null,
        systolic_bp: null,
        diastolic_bp: null,
        fasting_sugar: parseFloat(fbs) || null,
        conditions: [],
        gut_notes: gutNotes,
        medications: currentMedications,
        lifestyle: lifestyle,
        sleep_hours: parseFloat(sleepDuration) || null,
        stress_level: stressLevel,
        overall_score: 85,
        diagnosis: `HB+ CLINICAL FINDINGS:\n${diagnosisTags.join('\n')}\n\nPRESENT MEDICAL CONCERNS:\n${medicalConcerns}`,
        recommendations: [
          ...treatmentGoalTags.map(g => `GOAL: ${g}`),
          ...planItemTags.map(i => `ITEM: ${i}`),
          `PLAN: ${planName}`,
          `DURATION: ${planDuration}`,
          `BLOOD TESTS: ${bloodTests}`
        ],
        past_surgeries: pastSurgeries,
        skin_hair_nail: skinHairNail,
        dietary_breakfast: breakfast,
        dietary_lunch: lunch,
        dietary_dinner: dinner,
        dietary_outside: outsideMeals,
        dietary_alcohol: alcoholIntake,
        dietary_smoking: smoking,
        plan_type: 'Gold' as any,
        status: 'completed' as any,
        report_snapshot: {
          clientName, uhid, age, sex, height, weight, phone, jobActivity, lifestyle, stepCount,
          bloodReportsAvailable, reportDate, fbs, hba1c, lipidProfile, tsh, haemoglobin, ironFerritin,
          vitaminB12, vitaminD, liverEnzymes, kidneyProfile, thyroidAntiTPO, hormonalProfile, otherFlags,
          medicalConcerns, symptomsReported, pastSurgeries, currentMedications, skinHairNail, menstrualHealth,
          waterIntake, eatingPattern, stoolFrequency, gutNotes,
          sleepQuality, sleepDuration, stressLevel, energyLevels,
          wakeUpTime, preBreakfast, breakfast, midMorning, lunch, eveningSnack, dinner, postDinner,
          teaCoffee, fruitIntake, foodAllergies, smoking, alcoholIntake, outsideMeals,
          diagnosisTags, treatmentGoalTags, planName, planDuration, bloodTests, planItemTags,
          consultantName, specialization
        }
      };

      let result;
      if (initialData?.id) {
        result = await supabase
          .from('assessments')
          .update(payload)
          .eq('id', initialData.id)
          .select();
      } else {
        result = await supabase
          .from('assessments')
          .insert([payload])
          .select();
      }

      if (result.error) throw result.error;
      onSuccess(result.data?.[0]);
    } catch (error: any) {
      alert('Error saving assessment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="intake-wrapper">
      <div className="intake-header">
        <h1>Nutritional Assessment Intake</h1>
        <p>Complete all sections during the consultation call. Report generates automatically on submission.</p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── SECTION 1: Anthropometric Measurements ── */}
        <div className="nai-section">
          <div className="nai-section-header">
            <div className="nai-section-icon nai-icon-anthro">🥗</div>
            <span>Personal Details</span>
          </div>
          <div className="nai-body">
            <div className="nai-grid-2" style={{ marginBottom: 20, background: 'rgba(116, 116, 64, 0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(116, 116, 64, 0.1)' }}>
              <div className="nai-field">
                <label style={{ color: 'var(--sage)', fontWeight: 'bold' }}>NUTRITION CONSULTANT NAME</label>
                <select 
                  value={consultantName} 
                  onChange={e => {
                    const val = e.target.value;
                    setConsultantName(val);
                    if (val === 'Pooja Agrawalla') setSpecialization('Clinical Nutritionist');
                    if (val === 'Pragya Dhanjika') setSpecialization('Functional Nutritionist');
                  }}
                >
                  <option value="">Select Consultant</option>
                  <option>Pooja Agrawalla</option>
                  <option>Pragya Dhanjika</option>
                </select>
              </div>
              <div className="nai-field">
                <label style={{ color: 'var(--sage)', fontWeight: 'bold' }}>SPECIALIZATION</label>
                <input 
                  value={specialization} 
                  onChange={e => setSpecialization(e.target.value)} 
                  placeholder="Clinical Nutritionist"
                />
              </div>
            </div>
            <div className="nai-grid-4">
              <div className="nai-field">
                <label>CLIENT FULL NAME</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Jeet Basa" required />
              </div>
              <div className="nai-field">
                <label>UHID / PATIENT ID</label>
                <input value={uhid} onChange={e => setUhid(e.target.value)} placeholder="e.g. HB-102" />
              </div>
              <div className="nai-field">
                <label>AGE (YEARS)</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 32" />
              </div>
              <div className="nai-field">
                <label>SEX</label>
                <select value={sex} onChange={e => setSex(e.target.value)}>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="nai-grid-3" style={{ marginTop: 14 }}>
              <div className="nai-field">
                <label>HEIGHT (FT.IN)</label>
                <input value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 5.2" />
              </div>
              <div className="nai-field">
                <label>WEIGHT (KG)</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 55" />
              </div>
              <div className="nai-field">
                <label>PHONE NUMBER</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +91 91544 55152" />
              </div>
            </div>

            {/* BMI / BMR / TDEE computed row */}
            <div className="nai-metrics-row">
              <div className="nai-metric">
                <span className="nai-metric-val">{bmi > 0 ? bmi : '—'}</span>
                <span className="nai-metric-label">BMI (kg/m²)</span>
              </div>
              <div className="nai-metric">
                <span className="nai-metric-val">{bmr > 0 ? bmr : '—'}</span>
                <span className="nai-metric-label">BMR (kcal/day)</span>
              </div>
              <div className="nai-metric">
                <span className="nai-metric-val">{tdee > 0 ? tdee : '—'}</span>
                <span className="nai-metric-label">TDEE (kcal/day)</span>
              </div>
            </div>

            {/* BMI Badge */}
            {bmi > 0 && (
              <div className="nai-bmi-badge" style={{ background: bmiCat.color + '22', color: bmiCat.color, borderColor: bmiCat.color + '55' }}>
                <span className="nai-bmi-dot" style={{ background: bmiCat.color }}></span>
                {bmiCat.label}
              </div>
            )}

            <div className="nai-field" style={{ marginTop: 18 }}>
              <label>AVERAGE DAILY STEP COUNT</label>
              <input value={stepCount} onChange={e => setStepCount(e.target.value)} placeholder="e.g. 5,000 - 8,000 steps" />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Biochemical Assessment ── */}
        <div className="nai-section">
          <div className="nai-section-header">
            <div className="nai-section-icon nai-icon-bio">🩸</div>
            <span>Biochemical Assessment (Blood Reports)</span>
          </div>
          <div className="nai-body">
            <div className="nai-field">
              <label>BLOOD REPORTS AVAILABLE?</label>
              <div className="nai-chip-group" style={{ marginTop: 6 }}>
                {(['Yes', 'No'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`nai-chip${bloodReportsAvailable === opt ? ' nai-chip-active' : ''}`}
                    onClick={() => setBloodReportsAvailable(prev => prev === opt ? '' : opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="nai-field" style={{ marginTop: 14 }}>
              <label>REPORT DATE (IF AVAILABLE)</label>
              <input value={reportDate} onChange={e => setReportDate(e.target.value)} placeholder="e.g. 16 Nov 2025" />
            </div>

            <div className="nai-grid-2" style={{ marginTop: 14 }}>
              <div className="nai-field">
                <label>FBS</label>
                <input value={fbs} onChange={e => setFbs(e.target.value)} placeholder="Value / Abnormal flag" />
              </div>
              <div className="nai-field">
                <label>HBA1C</label>
                <input value={hba1c} onChange={e => setHba1c(e.target.value)} placeholder="Value / Abnormal flag" />
              </div>
              <div className="nai-field">
                <label>LIPID PROFILE</label>
                <input value={lipidProfile} onChange={e => setLipidProfile(e.target.value)} placeholder="LDL/HDL/TG" />
              </div>
              <div className="nai-field">
                <label>TSH</label>
                <input value={tsh} onChange={e => setTsh(e.target.value)} placeholder="Value" />
              </div>
              <div className="nai-field">
                <label>HAEMOGLOBIN (HB)</label>
                <input value={haemoglobin} onChange={e => setHaemoglobin(e.target.value)} placeholder="Value (g/dL)" />
              </div>
              <div className="nai-field">
                <label>IRON / FERRITIN</label>
                <input value={ironFerritin} onChange={e => setIronFerritin(e.target.value)} placeholder="Value" />
              </div>
              <div className="nai-field">
                <label>VITAMIN B12</label>
                <input value={vitaminB12} onChange={e => setVitaminB12(e.target.value)} placeholder="Value" />
              </div>
              <div className="nai-field">
                <label>VITAMIN D</label>
                <input value={vitaminD} onChange={e => setVitaminD(e.target.value)} placeholder="Value" />
              </div>
              <div className="nai-field">
                <label>LIVER ENZYMES (AST/ALT/GGT)</label>
                <input value={liverEnzymes} onChange={e => setLiverEnzymes(e.target.value)} placeholder="Values" />
              </div>
              <div className="nai-field">
                <label>KIDNEY PROFILE</label>
                <input value={kidneyProfile} onChange={e => setKidneyProfile(e.target.value)} placeholder="Creatinine/eGFR" />
              </div>
              <div className="nai-field">
                <label>THYROID (ANTI-TPO)</label>
                <input value={thyroidAntiTPO} onChange={e => setThyroidAntiTPO(e.target.value)} placeholder="Value" />
              </div>
              <div className="nai-field">
                <label>HORMONAL PROFILE</label>
                <input value={hormonalProfile} onChange={e => setHormonalProfile(e.target.value)} placeholder="Testosterone/Estradiol/FSH…" />
              </div>
            </div>

            <div className="nai-field" style={{ marginTop: 14 }}>
              <label>OTHER NOTABLE VALUES / FLAGS</label>
              <textarea
                value={otherFlags}
                onChange={e => setOtherFlags(e.target.value)}
                placeholder="e.g. RDW 16.2, Neutrophil 9.14, ESR 55 — any abnormal values"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 3: Clinical Assessment ── */}
        <div className="nai-section">
          <div className="nai-section-header">
            <div className="nai-section-icon nai-icon-clinical">🏥</div>
            <span>Clinical Assessment</span>
          </div>
          <div className="nai-body">
            <div className="nai-field">
              <label>PRESENT MEDICAL CONCERNS</label>
              <textarea
                value={medicalConcerns}
                onChange={e => setMedicalConcerns(e.target.value)}
                placeholder="e.g. Arthritis (hand, C3–C5), Hashimoto's Thyroiditis, Low Haemoglobin, Menopause (2013)"
                rows={3}
              />
            </div>

            <div className="nai-field" style={{ marginTop: 14 }}>
              <label>SYMPTOMS REPORTED</label>
              <textarea
                value={symptomsReported}
                onChange={e => setSymptomsReported(e.target.value)}
                placeholder="e.g. TSH fluctuations, Anti-TPO 40+, low HB and iron, low energy, bloating, diarrhea episodes, hair fall post-menopause, muscle soreness"
                rows={3}
              />
            </div>


            <div className="nai-field" style={{ marginTop: 14 }}>
              <label>MENSTRUAL HEALTH (IF APPLICABLE)</label>
              <input value={menstrualHealth} onChange={e => setMenstrualHealth(e.target.value)} placeholder="e.g. Menopause 2013, endometrial history" />
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Gut Health Assessment ── */}
        <div className="nai-section">
          <div className="nai-section-header">
            <div className="nai-section-icon nai-icon-gut">🌿</div>
            <span>Gut Health Assessment</span>
          </div>
          <div className="nai-body">

            <div className="nai-grid-2" style={{ marginTop: 14 }}>
              <div className="nai-field">
                <label>DAILY STOOL FREQUENCY</label>
                <input value={stoolFrequency} onChange={e => setStoolFrequency(e.target.value)} placeholder="e.g. Regular once/day, irregular" />
              </div>
            </div>

            <div className="nai-field" style={{ marginTop: 14 }}>
              <label>ADDITIONAL GUT HEALTH NOTES</label>
              <textarea
                value={gutNotes}
                onChange={e => setGutNotes(e.target.value)}
                placeholder="e.g. Symptoms triggered by dairy; intermittent bloating in evenings..."
                rows={3}
              />
            </div>
          </div>
        </div>


        {/* ── SECTION 6: Dietary Assessment ── */}
        <div className="nai-section">
          <div className="nai-section-header">
            <div className="nai-section-icon nai-icon-dietary">🥗</div>
            <span>Dietary Assessment</span>
          </div>
          <div className="nai-body">

            <div className="nai-grid-2" style={{ marginTop: 14 }}>
              <div className="nai-field">
                <label>WAKE-UP TIME</label>
                <input value={wakeUpTime} onChange={e => setWakeUpTime(e.target.value)} placeholder="e.g. 8:30 AM" />
              </div>
              <div className="nai-field">
                <label>PRE-BREAKFAST</label>
                <input value={preBreakfast} onChange={e => setPreBreakfast(e.target.value)} placeholder="e.g. Water, lemon water, nothing" />
              </div>
              <div className="nai-field">
                <label>BREAKFAST</label>
                <input value={breakfast} onChange={e => setBreakfast(e.target.value)} placeholder="e.g. Often skipped; egg + gluten-free bread" />
              </div>
              <div className="nai-field">
                <label>MID-MORNING</label>
                <input value={midMorning} onChange={e => setMidMorning(e.target.value)} placeholder="e.g. Nuts, fruit, skips" />
              </div>
              <div className="nai-field">
                <label>LUNCH</label>
                <input value={lunch} onChange={e => setLunch(e.target.value)} placeholder="e.g. Chickpeas, rajma, rice; moong sprouts" />
              </div>
              <div className="nai-field">
                <label>EVENING SNACK</label>
                <input value={eveningSnack} onChange={e => setEveningSnack(e.target.value)} placeholder="e.g. Nuts (pistachios, peanuts), bajra, fruits" />
              </div>
              <div className="nai-field">
                <label>DINNER</label>
                <input value={dinner} onChange={e => setDinner(e.target.value)} placeholder="e.g. Rice, dal, sabji, rasam, sambhar" />
              </div>
              <div className="nai-field">
                <label>POST DINNER / BED-TIME</label>
                <input value={postDinner} onChange={e => setPostDinner(e.target.value)} placeholder="e.g. Continues snacking, milk" />
              </div>
              <div className="nai-field">
                <label>TEA / COFFEE FREQUENCY</label>
                <input value={teaCoffee} onChange={e => setTeaCoffee(e.target.value)} placeholder="e.g. 2–3 coffees/day with sugar" />
              </div>
              <div className="nai-field">
                <label>FRUIT INTAKE</label>
                <input value={fruitIntake} onChange={e => setFruitIntake(e.target.value)} placeholder="e.g. None / watermelon occasionally" />
              </div>
              <div className="nai-field">
                <label>FOOD ALLERGIES</label>
                <input value={foodAllergies} onChange={e => setFoodAllergies(e.target.value)} placeholder="e.g. Dust allergy, lactose sensitivity" />
              </div>
              <div className="nai-field">
                <label>OUTSIDE / PACKAGED MEALS</label>
                <input value={outsideMeals} onChange={e => setOutsideMeals(e.target.value)} placeholder="—" />
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 7: Dietitian's Clinical Impression & Plan ── */}
        <div className="nai-section">
          <div className="nai-section-header">
            <div className="nai-section-icon" style={{ background: 'var(--gold)' }}>✦</div>
            <span>Clinical Impression & Plan</span>
          </div>

          <div className="nai-body">
            {/* Diagnosis tag input */}
            <div className="nai-field">
              <label>HB+ DIAGNOSIS</label>
              <div className="nai-tag-input-wrap">
                <div className="v5-diag-grid-detailed">
                  {diagnosisTags.map((tag: string, i: number) => (
                    <div key={i} className="v5-diag-item-large">
                      {editDiagIdx === i ? (
                        <textarea
                          autoFocus
                          className="nai-tag-field"
                          style={{ flex: 1, minHeight: '60px', marginRight: 6 }}
                          value={editDiagVal}
                          onChange={e => setEditDiagVal(e.target.value)}
                          onBlur={() => {
                            const t = editDiagVal.trim();
                            if (t) setDiagnosisTags(prev => prev.map((v, idx) => idx === i ? t : v));
                            setEditDiagIdx(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              const t = editDiagVal.trim();
                              if (t) setDiagnosisTags(prev => prev.map((v, idx) => idx === i ? t : v));
                              setEditDiagIdx(null);
                            }
                            if (e.key === 'Escape') setEditDiagIdx(null);
                          }}
                        />
                      ) : (
                        <span style={{ cursor: 'text', flex: 1 }} title="Click to edit" onClick={() => { setEditDiagIdx(i); setEditDiagVal(tag); }}>• {tag}</span>
                      )}
                      <button type="button" className="nai-tag-remove" onClick={() => removeTag(setDiagnosisTags, tag)}>×</button>
                    </div>
                  ))}
                  {diagnosisTags.length === 0 && <div className="text-[11px] text-smoke opacity-50 pl-1">No findings added yet. Press [+] to list points.</div>}
                </div>
                <div className="nai-tag-row" style={{ marginTop: 12 }}>
                  <textarea
                    ref={diagnosisInputRef}
                    className="nai-tag-field"
                    style={{ minHeight: '80px', paddingTop: '10px' }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const val = diagnosisInputRef.current?.value.trim() ?? '';
                        if (val) {
                          setDiagnosisTags(prev => prev.includes(val) ? prev : [...prev, val]);
                          if (diagnosisInputRef.current) diagnosisInputRef.current.value = '';
                        }
                      }
                    }}
                    placeholder="Type finding and press Enter or + to list as point…"
                  />
                  <button
                    type="button"
                    className="nai-tag-add-btn"
                    style={{ height: '80px' }}
                    onMouseDown={e => {
                      e.preventDefault();
                      const val = diagnosisInputRef.current?.value.trim() ?? '';
                      if (val) {
                        setDiagnosisTags(prev => prev.includes(val) ? prev : [...prev, val]);
                        if (diagnosisInputRef.current) diagnosisInputRef.current.value = '';
                      }
                    }}
                  >+</button>
                </div>
              </div>
            </div>

            {/* Treatment Goals tag input */}
            <div className="nai-field" style={{ marginTop: 16 }}>
              <label>TREATMENT GOALS</label>
              <div className="nai-tag-input-wrap">
                <div className="nai-tag-list-bulleted">
                  {treatmentGoalTags.map((tag, i) => (
                    <div key={i} className="nai-tag-point nai-tag-point-goal">
                      {editGoalIdx === i ? (
                        <input
                          autoFocus
                          className="nai-tag-field"
                          style={{ flex: 1, marginRight: 6 }}
                          value={editGoalVal}
                          onChange={e => setEditGoalVal(e.target.value)}
                          onBlur={() => {
                            const t = editGoalVal.trim();
                            if (t) setTreatmentGoalTags(prev => prev.map((v, idx) => idx === i ? t : v));
                            setEditGoalIdx(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const t = editGoalVal.trim();
                              if (t) setTreatmentGoalTags(prev => prev.map((v, idx) => idx === i ? t : v));
                              setEditGoalIdx(null);
                            }
                            if (e.key === 'Escape') setEditGoalIdx(null);
                          }}
                        />
                      ) : (
                        <span style={{ cursor: 'text', flex: 1 }} title="Click to edit" onClick={() => { setEditGoalIdx(i); setEditGoalVal(tag); }}>• {tag}</span>
                      )}
                      <button type="button" className="nai-tag-remove" onClick={() => removeTag(setTreatmentGoalTags, tag)}>×</button>
                    </div>
                  ))}
                  {treatmentGoalTags.length === 0 && <div className="text-[11px] text-smoke opacity-50 pl-1">No goals added yet. Press [+] to list points.</div>}
                </div>
                <div className="nai-tag-row">
                  <input
                    ref={goalInputRef}
                    className="nai-tag-field"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = goalInputRef.current?.value.trim() ?? '';
                        if (val) {
                          setTreatmentGoalTags(prev => prev.includes(val) ? prev : [...prev, val]);
                          if (goalInputRef.current) goalInputRef.current.value = '';
                        }
                      }
                    }}
                    placeholder="Type goal and press Enter or + "
                  />
                  <button
                    type="button"
                    className="nai-tag-add-btn nai-tag-add-btn-goal"
                    onMouseDown={e => {
                      e.preventDefault();
                      const val = goalInputRef.current?.value.trim() ?? '';
                      if (val) {
                        setTreatmentGoalTags(prev => prev.includes(val) ? prev : [...prev, val]);
                        if (goalInputRef.current) goalInputRef.current.value = '';
                      }
                    }}
                  >+</button>
                </div>
              </div>
            </div>

            <div className="nai-grid-2" style={{ marginTop: 16 }}>
              <div className="nai-field">
                <label>RECOMMENDED PLAN NAME</label>
                <input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="e.g. FAT LOSS AND METABOLIC RESET PLAN — 12 WEEK" />
                <div className="nai-chip-suggestions">
                  {['FAT LOSS & METABOLIC RESET', 'THYROID REGULATION', 'GUT MICROBIOME', 'PCOS MANAGEMENT', 'DIABETES CARE'].map(p => (
                    <button
                      key={p}
                      type="button"
                      className="nai-chip-mini"
                      onClick={() => {
                        setPlanName(p);
                        setPlanItemTags(getPlanBullets(p));
                      }}
                    >
                      {p} Plan
                    </button>
                  ))}
                </div>
              </div>
              <div className="nai-field">
                <label>PLAN DURATION</label>
                <input value={planDuration} onChange={e => setPlanDuration(e.target.value)} placeholder="12 Weeks" />
              </div>
            </div>

            {/* Plan Points Editable List */}
            <div className="nai-field" style={{ marginTop: 16 }}>
              <label>PLAN DETAILS / POINTS (EDITABLE)</label>
              <div className="nai-plan-editor-container">
                <div className="nai-plan-bullets-list">
                  {planItemTags.map((tag, idx) => (
                    <div key={idx} className="nai-plan-bullet-row">
                      <div className="bullet-marker">•</div>
                      <textarea
                        className="nai-plan-bullet-textarea"
                        value={tag}
                        onChange={(e) => {
                          const newList = [...planItemTags];
                          newList[idx] = e.target.value;
                          setPlanItemTags(newList);
                        }}
                        placeholder="Type point content here..."
                        onFocus={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        rows={1}
                        style={{ height: 'auto' }}
                      />
                      <button
                        type="button"
                        className="nai-plan-bullet-delete"
                        onClick={() => {
                          const newList = [...planItemTags];
                          newList.splice(idx, 1);
                          setPlanItemTags(newList);
                        }}
                        title="Remove this point"
                      >×</button>
                    </div>
                  ))}
                  {planItemTags.length === 0 && <div className="text-[11px] text-smoke opacity-50 pl-1 py-4 text-center">No plan points added. Select a plan above to populate.</div>}
                </div>

                <div className="nai-plan-add-row">
                  <textarea
                    className="nai-plan-new-input"
                    value={planItemInput}
                    onChange={e => setPlanItemInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (planItemInput.trim()) {
                          setPlanItemTags(prev => [...prev, planItemInput.trim()]);
                          setPlanItemInput('');
                        }
                      }
                    }}
                    placeholder="Add a new custom plan point..."
                    rows={1}
                  />
                  <button
                    type="button"
                    className="nai-plan-add-btn"
                    onClick={() => {
                      if (planItemInput.trim()) {
                        setPlanItemTags(prev => [...prev, planItemInput.trim()]);
                        setPlanItemInput('');
                      }
                    }}
                  >ADD</button>
                </div>
              </div>
            </div>

            <div className="nai-field" style={{ marginTop: 16 }}>
              <label>RECOMMENDED BLOOD TESTS</label>
              <textarea
                value={bloodTests}
                onChange={e => setBloodTests(e.target.value)}
                placeholder="e.g. CBC, VIT B12 & D, Lipid Profile, Liver Profile, Thyroid Profile, FBS, PPBS, HBA1C, Insulin Fasting, Iron Profile, HS-CRP, ESR, Homocysteine, Ferritin, Folic Acid, Magnesium, Cortisol, Testosterone"
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-generate" disabled={loading}>
            {loading ? 'Saving…' : '⚡ Generate Assessment Report'}
          </button>
          <button type="button" className="btn-secondary" onClick={clearForm}>Clear Form</button>
        </div>
      </form>
    </div>
  );
};

export default AssessmentForm;
