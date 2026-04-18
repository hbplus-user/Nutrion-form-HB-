export const getPlanBullets = (planName: string) => {
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
