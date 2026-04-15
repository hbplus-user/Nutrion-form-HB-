import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Assessment } from '../types';


interface AssessmentFormProps {
  onSuccess: (data: any) => void;
  initialData?: Assessment;
}

const LIFESTYLE_OPTIONS = ['Sedentary', 'WFH', 'Hybrid', 'Office', 'On the Move'];
const GUT_SYMPTOMS = ['Bloating', 'Constipation', 'Indigestion', 'Acid Reflux / Heartburn', 'Flatulence', 'Diarrhea', 'Burping', 'Nausea'];
const DIET_TYPES = ['Non-Vegetarian', 'Vegetarian', 'Eggetarian', 'Pescatarian', 'Vegan'];

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

  // Section 1 – Anthropometric
  const [clientName, setClientName] = useState(initialData?.client_name || '');
  const [uhid, setUhid] = useState(initialData?.uhid || '');
  const [age, setAge] = useState(initialData?.age?.toString() || '');
  const [sex, setSex] = useState(initialData?.gender || '');
  const [height, setHeight] = useState(initialData?.height?.toString() || ''); // ft.in format
  const [weight, setWeight] = useState(initialData?.weight?.toString() || ''); // kg
  const [location, setLocation] = useState(initialData?.location || '');
  const [jobActivity, setJobActivity] = useState(initialData?.occupation || '');
  const [lifestyle, setLifestyle] = useState(initialData?.lifestyle || '');
  const [stepCount, setStepCount] = useState(''); 
  const [physicalActivity, setPhysicalActivity] = useState(initialData?.physical_activity || '');

  // Computed
  const bmi = calcBMI(parseFloat(weight) || 0, height);
  const bmr = calcBMR(parseFloat(weight) || 0, height, parseFloat(age) || 0, sex);
  const tdee = calcTDEE(bmr, lifestyle);
  const bmiCat = getBMICategory(bmi);

  // Section 2 – Biochemical
  const [bloodReportsAvailable, setBloodReportsAvailable] = useState<'Yes' | 'No' | ''>(initialData ? 'Yes' : '');
  const [reportDate, setReportDate] = useState('');
  const [fbs, setFbs] = useState(initialData?.fasting_sugar?.toString() || '');
  const [hba1c, setHba1c] = useState('');
  const [lipidProfile, setLipidProfile] = useState('');
  const [tsh, setTsh] = useState('');
  const [haemoglobin, setHaemoglobin] = useState('');
  const [ironFerritin, setIronFerritin] = useState('');
  const [vitaminB12, setVitaminB12] = useState('');
  const [vitaminD, setVitaminD] = useState('');
  const [liverEnzymes, setLiverEnzymes] = useState('');
  const [kidneyProfile, setKidneyProfile] = useState('');
  const [thyroidAntiTPO, setThyroidAntiTPO] = useState('');
  const [hormonalProfile, setHormonalProfile] = useState('');
  const [otherFlags, setOtherFlags] = useState('');

  // Section 3 – Clinical
  const [medicalConcerns, setMedicalConcerns] = useState(initialData?.diagnosis?.split('PRESENT MEDICAL CONCERNS:\n')[1] || '');
  const [symptomsReported, setSymptomsReported] = useState('');
  const [pastSurgeries, setPastSurgeries] = useState(initialData?.past_surgeries || '');
  const [currentMedications, setCurrentMedications] = useState(initialData?.medications || '');
  const [skinHairNail, setSkinHairNail] = useState(initialData?.skin_hair_nail || '');
  const [menstrualHealth, setMenstrualHealth] = useState('');

  // Section 4 – Gut Health
  const [waterIntake, setWaterIntake] = useState('');
  const [eatingPattern, setEatingPattern] = useState('');
  const [gutSymptoms, setGutSymptoms] = useState<string[]>(initialData?.gut_symptoms || []);
  const [foodIntolerances, setFoodIntolerances] = useState('');
  const [stoolFrequency, setStoolFrequency] = useState('');

  // Section 5 – Lifestyle
  const [sleepQuality, setSleepQuality] = useState(initialData?.sleep_hours ? 'Good' : '');
  const [sleepDuration, setSleepDuration] = useState(initialData?.sleep_hours?.toString() || '');
  const [stressLevel, setStressLevel] = useState(initialData?.stress_level || 5);
  const [energyLevels, setEnergyLevels] = useState('');

  // Section 6 – Dietary Assessment
  const [dietType, setDietType] = useState(initialData?.diet_type || '');
  const [wakeUpTime, setWakeUpTime] = useState('');
  const [preBreakfast, setPreBreakfast] = useState('');
  const [breakfast, setBreakfast] = useState(initialData?.dietary_breakfast || '');
  const [midMorning, setMidMorning] = useState('');
  const [lunch, setLunch] = useState(initialData?.dietary_lunch || '');
  const [eveningSnack, setEveningSnack] = useState('');
  const [dinner, setDinner] = useState(initialData?.dietary_dinner || '');
  const [postDinner, setPostDinner] = useState('');
  const [teaCoffee, setTeaCoffee] = useState('');
  const [fruitIntake, setFruitIntake] = useState('');
  const [foodAllergies, setFoodAllergies] = useState('');
  const [smoking, setSmoking] = useState(initialData?.dietary_smoking || '');
  const [alcoholIntake, setAlcoholIntake] = useState(initialData?.dietary_alcohol || '');
  const [outsideMeals, setOutsideMeals] = useState(initialData?.dietary_outside || '');

  // Section 7 – Dietitian's Clinical Impression & Plan
  const [diagnosisTags, setDiagnosisTags] = useState<string[]>(
    initialData?.diagnosis?.includes('HB+ CLINICAL FINDINGS:')
      ? initialData.diagnosis.split('HB+ CLINICAL FINDINGS:\n')[1]?.split('\n\n')[0]?.split('\n') || []
      : []
  );
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [treatmentGoalTags, setTreatmentGoalTags] = useState<string[]>(
    initialData?.recommendations?.filter(r => r.startsWith('GOAL:')).map(g => g.replace('GOAL: ', '')) || []
  );
  const [treatmentGoalInput, setTreatmentGoalInput] = useState('');
  const [planName, setPlanName] = useState(initialData?.recommendations?.find(r => r.startsWith('PLAN:'))?.replace('PLAN: ', '') || '');
  const [planDuration, setPlanDuration] = useState('');
  const [bloodTests, setBloodTests] = useState(initialData?.recommendations?.find(r => r.startsWith('BLOOD TESTS:'))?.replace('BLOOD TESTS: ', '') || '');

  const addTag = (list: string[], setList: (v: string[]) => void, value: string) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
  };

  const removeTag = (list: string[], setList: (v: string[]) => void, tag: string) => {
    setList(list.filter(t => t !== tag));
  };

  const clearForm = () => {
    if (!confirm('Clear all form data?')) return;
    setClientName(''); setAge(''); setSex('Female'); setHeight(''); setWeight('');
    setLocation(''); setJobActivity(''); setLifestyle(''); setStepCount(''); setPhysicalActivity('');
    setBloodReportsAvailable(''); setReportDate(''); setFbs(''); setHba1c(''); setLipidProfile('');
    setTsh(''); setHaemoglobin(''); setIronFerritin(''); setVitaminB12(''); setVitaminD('');
    setLiverEnzymes(''); setKidneyProfile(''); setThyroidAntiTPO(''); setHormonalProfile(''); setOtherFlags('');
    setMedicalConcerns(''); setSymptomsReported(''); setPastSurgeries(''); setCurrentMedications('');
    setSkinHairNail(''); setMenstrualHealth('');
    setWaterIntake(''); setEatingPattern(''); setGutSymptoms([]); setFoodIntolerances(''); setStoolFrequency('');
    setSleepQuality(''); setSleepDuration(''); setStressLevel(5); setEnergyLevels('');
    setDietType(''); setWakeUpTime(''); setPreBreakfast(''); setBreakfast(''); setMidMorning('');
    setLunch(''); setEveningSnack(''); setDinner(''); setPostDinner(''); setTeaCoffee('');
    setFruitIntake(''); setFoodAllergies(''); setSmoking(''); setAlcoholIntake(''); setOutsideMeals('');
    setDiagnosisTags([]); setTreatmentGoalTags([]); setPlanName(''); setPlanDuration('12 Weeks'); setBloodTests('');
  };



  const toggleGutSymptom = (s: string) => {
    setGutSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
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
        phone: '',
        email: '',
        location: location,
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
        gut_symptoms: gutSymptoms,
        diet_type: dietType,
        medications: currentMedications,
        physical_activity: physicalActivity,
        lifestyle: lifestyle,
        sleep_hours: parseFloat(sleepDuration) || null,
        stress_level: stressLevel,
        overall_score: 85,
        diagnosis: `HB+ CLINICAL FINDINGS:\n${diagnosisTags.join('\n')}\n\nPRESENT MEDICAL CONCERNS:\n${medicalConcerns}`,
        recommendations: [
          ...treatmentGoalTags.map(g => `GOAL: ${g}`),
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
                <label>LOCATION / CITY</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="—" />
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
              <label>JOB / ACTIVITY TYPE</label>
              <input value={jobActivity} onChange={e => setJobActivity(e.target.value)} placeholder="e.g. Active — moderate lifestyle" />
            </div>

            <div className="nai-field" style={{ marginTop: 14 }}>
              <label>LIFESTYLE</label>
              <div className="nai-chip-group">
                {LIFESTYLE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`nai-chip${lifestyle === opt ? ' nai-chip-active' : ''}`}
                    onClick={() => setLifestyle(prev => prev === opt ? '' : opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="nai-grid-2" style={{ marginTop: 14 }}>
              <div className="nai-field">
                <label>DAILY STEP COUNT</label>
                <input value={stepCount} onChange={e => setStepCount(e.target.value)} placeholder="e.g. 8,000–10,000 steps" />
              </div>
              <div className="nai-field">
                <label>PHYSICAL ACTIVITY</label>
                <input value={physicalActivity} onChange={e => setPhysicalActivity(e.target.value)} placeholder="e.g. 3x/week gym + 1x yoga" />
              </div>
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

            <div className="nai-grid-2" style={{ marginTop: 14 }}>
              <div className="nai-field">
                <label>PAST SURGERIES / MEDICAL HISTORY</label>
                <textarea
                  value={pastSurgeries}
                  onChange={e => setPastSurgeries(e.target.value)}
                  placeholder="e.g. Meniscus knee surgery (3 years ago)"
                  rows={3}
                />
              </div>
              <div className="nai-field">
                <label>CURRENT MEDICATIONS &amp; SUPPLEMENTS</label>
                <textarea
                  value={currentMedications}
                  onChange={e => setCurrentMedications(e.target.value)}
                  placeholder="e.g. Iron, B-complex, BP medication, Statin (cholesterol), Omega 3, Synthroid, Probiotics, D3, Magnesium, Zinc"
                  rows={3}
                />
              </div>
            </div>

            <div className="nai-field" style={{ marginTop: 14 }}>
              <label>SKIN / HAIR / NAIL CONCERNS</label>
              <input value={skinHairNail} onChange={e => setSkinHairNail(e.target.value)} placeholder="e.g. Hair fall (post-menopause)" />
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
            <div className="nai-grid-2">
              <div className="nai-field">
                <label>WATER INTAKE</label>
                <input value={waterIntake} onChange={e => setWaterIntake(e.target.value)} placeholder="e.g. Sparkling water ~2 glasses + lemon water" />
              </div>
              <div className="nai-field">
                <label>EATING PATTERN</label>
                <input value={eatingPattern} onChange={e => setEatingPattern(e.target.value)} placeholder="e.g. Mostly skips breakfast" />
              </div>
            </div>

            <div className="nai-field" style={{ marginTop: 14 }}>
              <label>GUT SYMPTOMS (SELECT ALL THAT APPLY)</label>
              <div className="nai-chip-group" style={{ marginTop: 8 }}>
                {GUT_SYMPTOMS.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`nai-chip${gutSymptoms.includes(s) ? ' nai-chip-danger' : ''}`}
                    onClick={() => toggleGutSymptom(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="nai-grid-2" style={{ marginTop: 14 }}>
              <div className="nai-field">
                <label>FOOD INTOLERANCES / TRIGGERS</label>
                <input value={foodIntolerances} onChange={e => setFoodIntolerances(e.target.value)} placeholder="e.g. Bread (constipation trigger)" />
              </div>
              <div className="nai-field">
                <label>DAILY STOOL FREQUENCY</label>
                <input value={stoolFrequency} onChange={e => setStoolFrequency(e.target.value)} placeholder="e.g. Regular once/day, irregular" />
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 5: Lifestyle Assessment ── */}
        <div className="nai-section">
          <div className="nai-section-header">
            <div className="nai-section-icon nai-icon-lifestyle">🌙</div>
            <span>Lifestyle Assessment</span>
          </div>
          <div className="nai-body">
            <div className="nai-grid-2">
              <div className="nai-field">
                <label>SLEEP QUALITY</label>
                <select value={sleepQuality} onChange={e => setSleepQuality(e.target.value)}>
                  <option value="">Select…</option>
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Disturbed</option>
                  <option>Poor</option>
                  <option>Insomnia</option>
                </select>
              </div>
              <div className="nai-field">
                <label>SLEEP DURATION</label>
                <input value={sleepDuration} onChange={e => setSleepDuration(e.target.value)} placeholder="—" />
              </div>
            </div>

            <div className="nai-field" style={{ marginTop: 18 }}>
              <label>STRESS LEVEL (1–10)</label>
              <div className="nai-slider-row">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={stressLevel}
                  onChange={e => setStressLevel(parseInt(e.target.value))}
                  className="nai-range"
                />
                <span className="nai-range-val">{stressLevel}</span>
              </div>
            </div>

            <div className="nai-field" style={{ marginTop: 14 }}>
              <label>ENERGY LEVELS / POST-MEAL CRASH / BRAIN FOG</label>
              <textarea
                value={energyLevels}
                onChange={e => setEnergyLevels(e.target.value)}
                placeholder="e.g. Low energy December, recovering post retest (TSH 2.0)"
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
            <div className="nai-field">
              <label>DIET TYPE</label>
              <div className="nai-chip-group" style={{ marginTop: 6 }}>
                {DIET_TYPES.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`nai-chip${dietType === opt ? ' nai-chip-active' : ''}`}
                    onClick={() => setDietType(prev => prev === opt ? '' : opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

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
                <label>SMOKING</label>
                <input value={smoking} onChange={e => setSmoking(e.target.value)} placeholder="e.g. No / Yes (5 cigarettes/day)" />
              </div>
              <div className="nai-field">
                <label>ALCOHOL INTAKE</label>
                <input value={alcoholIntake} onChange={e => setAlcoholIntake(e.target.value)} placeholder="—" />
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
                <div className="nai-tag-list-bulleted">
                  {diagnosisTags.map(tag => (
                    <div key={tag} className="nai-tag-point">
                      <span>• {tag}</span>
                      <button type="button" className="nai-tag-remove" onClick={() => removeTag(diagnosisTags, setDiagnosisTags, tag)}>×</button>
                    </div>
                  ))}
                  {diagnosisTags.length === 0 && <div className="text-[11px] text-smoke opacity-50 pl-1">No findings added yet. Press [+] to list points.</div>}
                </div>
                <div className="nai-tag-row">
                  <input
                    className="nai-tag-field"
                    value={diagnosisInput}
                    onChange={e => setDiagnosisInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(diagnosisTags, setDiagnosisTags, diagnosisInput);
                        setDiagnosisInput('');
                      }
                    }}
                    placeholder="Type finding and press Enter or + …"
                  />
                  <button
                    type="button"
                    className="nai-tag-add-btn"
                    onClick={() => { addTag(diagnosisTags, setDiagnosisTags, diagnosisInput); setDiagnosisInput(''); }}
                  >+</button>
                </div>
              </div>
            </div>

            {/* Treatment Goals tag input */}
            <div className="nai-field" style={{ marginTop: 16 }}>
              <label>TREATMENT GOALS</label>
              <div className="nai-tag-input-wrap">
                <div className="nai-tag-list-bulleted">
                  {treatmentGoalTags.map(tag => (
                    <div key={tag} className="nai-tag-point nai-tag-point-goal">
                      <span>• {tag}</span>
                      <button type="button" className="nai-tag-remove" onClick={() => removeTag(treatmentGoalTags, setTreatmentGoalTags, tag)}>×</button>
                    </div>
                  ))}
                  {treatmentGoalTags.length === 0 && <div className="text-[11px] text-smoke opacity-50 pl-1">No goals added yet. Press [+] to list points.</div>}
                </div>
                <div className="nai-tag-row">
                  <input
                    className="nai-tag-field"
                    value={treatmentGoalInput}
                    onChange={e => setTreatmentGoalInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(treatmentGoalTags, setTreatmentGoalTags, treatmentGoalInput);
                        setTreatmentGoalInput('');
                      }
                    }}
                    placeholder="Type goal and press Enter or + …"
                  />
                  <button
                    type="button"
                    className="nai-tag-add-btn nai-tag-add-btn-goal"
                    onClick={() => { addTag(treatmentGoalTags, setTreatmentGoalTags, treatmentGoalInput); setTreatmentGoalInput(''); }}
                  >+</button>
                </div>
              </div>
            </div>

            <div className="nai-grid-2" style={{ marginTop: 16 }}>
              <div className="nai-field">
                <label>RECOMMENDED PLAN NAME</label>
                <input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="e.g. FAT LOSS AND METABOLIC RESET PLAN — 12 WEEK" />
              </div>
              <div className="nai-field">
                <label>PLAN DURATION</label>
                <input value={planDuration} onChange={e => setPlanDuration(e.target.value)} placeholder="12 Weeks" />
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
