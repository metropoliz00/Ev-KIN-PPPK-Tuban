
import { 
  EvaluationInput, 
  EvaluationResult, 
  DisciplineData, 
  ContractType, 
  Predicate, 
  IntegrityLevel 
} from '../types';

/**
 * Skor penilaian kehadiran berdasarkan tier jumlah hari (TKS) sesuai instruksi:
 * 1) 0 hari = 100
 * 2) 1-2 hari = 80
 * 3) 3-20 hari = 30
 * 4) 21-27 hari = 20
 * 5) >= 28 hari atau 10 hari berturut-turut = 0
 */
const getAbsenceScore = (days: number, isConsecutive: boolean): number => {
  if (isConsecutive || days >= 28) return 0;
  if (days <= 0) return 100;
  if (days >= 1 && days <= 2) return 80;
  if (days >= 3 && days <= 20) return 30;
  if (days >= 21 && days <= 27) return 20;
  return 0;
};

/**
 * Menghitung skor disiplin tahunan.
 * Mengurangi 10 poin jika akumulasi kekurangan jam kerja > 157.5 jam.
 */
const calculateYearlyDisciplineScore = (
  days: number, 
  shortHours: number, 
  isFatalMoreThan28: boolean, 
  isFatalConsecutive10: boolean
): number => {
  let score = getAbsenceScore(days, isFatalConsecutive10 || isFatalMoreThan28 || days >= 28);
  
  if (score === 0) return 0;

  if (shortHours > 157.5) {
    score -= 10;
  }

  return Math.max(0, score);
};

/**
 * Logika perhitungan skor disiplin berdasarkan masa kontrak.
 * Kontrak 1 Tahun: Menggunakan data Tahun N saja (100%).
 * Kontrak 5 Tahun: Tahun N (Berjalan) Bobot 60% + Tahun N-1 (Sebelumnya) Bobot 40%.
 * Persentase dihitung dari skor maksimal (100).
 */
const calculateDisciplineScore = (data: DisciplineData, type: ContractType): number => {
  if (type === '1_YEAR') {
    return calculateYearlyDisciplineScore(
      data.absencesN, 
      data.shortHoursN, 
      data.absentMoreThan28Days, 
      data.absent10DaysConsecutive
    );
  } else {
    // Penilaian Tahun N-1 (Bobot 40% dari total nilai komponen disiplin)
    const scoreNMinus1 = calculateYearlyDisciplineScore(
      data.absencesNMinus1 || 0, 
      data.shortHoursNMinus1 || 0, 
      !!data.absentMoreThan28DaysNMinus1, 
      !!data.absent10DaysConsecutiveNMinus1
    );

    // Penilaian Tahun N (Bobot 60% dari total nilai komponen disiplin)
    const scoreN = calculateYearlyDisciplineScore(
      data.absencesN, 
      data.shortHoursN, 
      data.absentMoreThan28Days, 
      data.absent10DaysConsecutive
    );
    
    // Gabungan bobot 40% tahun sebelumnya dan 60% tahun berjalan dari nilai maksimal
    return (scoreNMinus1 * 0.4) + (scoreN * 0.6);
  }
};

const getPredicateScore = (p: Predicate): number => {
  switch (p) {
    case 'SANGAT_BAIK': return 100;
    case 'BAIK': return 80;
    case 'BUTUH_PERBAIKAN': return 60;
    case 'KURANG': return 50;
    case 'SANGAT_KURANG': return 10;
    case 'TIDAK_MENGUMPULKAN': return 0;
    default: return 0;
  }
};

const getBehaviorScore = (p: Predicate): number => {
  switch (p) {
    case 'SANGAT_BAIK': return 100;
    case 'BAIK': return 80;
    case 'BUTUH_PERBAIKAN': return 60;
    case 'KURANG': return 40;
    case 'SANGAT_KURANG': return 20;
    default: return 0;
  }
};

const getIntegrityScore = (level: IntegrityLevel): number => {
  switch (level) {
    case 'NIHIL': return 100;
    case 'RINGAN': return 80;
    case 'SEDANG': return 60;
    case 'BERAT': return 10;
    default: return 0;
  }
};

const getJPScore = (jp: number): number => {
  if (jp >= 21) return 100;
  if (jp >= 11) return 80;
  if (jp >= 6) return 60;
  if (jp >= 1) return 50;
  return 0;
};

export const calculateEvaluation = (input: EvaluationInput): EvaluationResult => {
  // Syarat Mutlak: Kesehatan
  if (!input.isHealthy) {
    return {
      scoreDiscipline: 0,
      scoreSKP: 0,
      scoreIntegrity: 0,
      scoreJob: 0,
      scoreBehavior: 0,
      scoreQualification: 0,
      totalScore: 0,
      predicate: 'SANGAT KURANG',
      recommendation: 'TIDAK DIREKOMENDASIKAN untuk diperpanjang masa perjanjian kerjanya (Kesehatan Tidak Memenuhi Syarat)',
      isEligible: false,
      isHealthy: false
    };
  }

  // 1. Disiplin (Bobot 40%)
  const sDiscipline = calculateDisciplineScore(input.discipline, input.contractType);
  
  // 2. SKP (Bobot 15%)
  const sSKP = getPredicateScore(input.skpPredicate);
  
  // 3. Integritas (Bobot 10%)
  const sIntegrity = getIntegrityScore(input.integrity);
  
  // 4. Jabatan (Bobot 10%)
  let sJob = 0;
  if (input.jobAvailability === 'AVAILABLE') sJob = 100;
  else sJob = 0;

  // 5. Perilaku (Bobot 15%)
  const sBehavior = getBehaviorScore(input.behaviorPredicate);

  // 6. Kualifikasi (Bobot 10%)
  const scoreEdu = input.qualification.educationMatched ? 100 : 0;
  const scoreJP = getJPScore(input.qualification.trainingJP);
  const scoreMOOC = input.qualification.moocOrientation ? 100 : 0;
  // Pembobotan internal kualifikasi (Pendidikan 40%, JP 40%, MOOC 20%)
  const sQualification = (scoreEdu * 0.4) + (scoreJP * 0.4) + (scoreMOOC * 0.2);

  // Kalkulasi Nilai Akhir sesuai Bobot yang Ditentukan dalam instruksi
  const totalScore = 
    (sDiscipline * 0.4) + 
    (sSKP * 0.15) + 
    (sIntegrity * 0.1) + 
    (sJob * 0.1) + 
    (sBehavior * 0.15) + 
    (sQualification * 0.1);

  // Penentuan Predikat berdasarkan Rentang Nilai
  let predicate = '';
  if (totalScore >= 90) {
    predicate = 'SANGAT BAIK';
  } else if (totalScore >= 74) {
    predicate = 'BAIK';
  } else if (totalScore >= 53) {
    predicate = 'BUTUH PERBAIKAN';
  } else if (totalScore >= 42) {
    predicate = 'KURANG';
  } else {
    predicate = 'SANGAT KURANG';
  }

  let isEligible = false;
  let recommendation = '';
  const scoreLabel = totalScore.toFixed(2);

  // Simpulan Rekomendasi berdasarkan Predikat
  if (predicate === 'SANGAT BAIK') {
    isEligible = true;
    recommendation = `Berdasarkan perolehan Nilai Akhir ${scoreLabel} dengan predikat SANGAT BAIK, maka yang bersangkutan DIREKOMENDASIKAN UNTUK DIPERPANJANG masa perjanjian kerjanya.`;
  } else if (predicate === 'BAIK' || predicate === 'BUTUH PERBAIKAN') {
    isEligible = true;
    recommendation = `Berdasarkan perolehan Nilai Akhir ${scoreLabel} dengan predikat ${predicate}, maka yang bersangkutan DAPAT DIPERTIMBANGKAN UNTUK DIPERPANJANG masa perjanjian kerjanya.`;
  } else {
    isEligible = false;
    recommendation = `Berdasarkan perolehan Nilai Akhir ${scoreLabel} dengan predikat ${predicate}, maka yang bersangkutan TIDAK DIREKOMENDASIKAN untuk diperpanjang masa perjanjian kerjanya.`;
  }

  return {
    scoreDiscipline: sDiscipline,
    scoreSKP: sSKP,
    scoreIntegrity: sIntegrity,
    scoreJob: sJob,
    scoreBehavior: sBehavior,
    scoreQualification: sQualification,
    totalScore,
    predicate,
    recommendation,
    isEligible,
    isHealthy: true
  };
};
