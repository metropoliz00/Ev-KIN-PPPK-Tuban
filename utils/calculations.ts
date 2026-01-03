
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
 * Menghitung skor disiplin untuk satu tahun anggaran tertentu (Tahun N atau N-1).
 * Mengakomodasi pengurangan 10 poin jika kekurangan jam kerja > 157.5 jam.
 */
const calculateYearlyDisciplineScore = (
  days: number, 
  shortHours: number, 
  isFatalMoreThan28: boolean, 
  isFatalConsecutive10: boolean
): number => {
  // Base score berdasarkan hari TKS dan kondisi fatal
  let score = getAbsenceScore(days, isFatalConsecutive10 || isFatalMoreThan28 || days >= 28);
  
  // Jika sudah 0 (pelanggaran berat), tidak perlu dikurangi lagi
  if (score === 0) return 0;

  // Kekurangan Jam Kerja > 157.5 jam mengurangi skor sebesar 10 poin sesuai instruksi
  if (shortHours > 157.5) {
    score -= 10;
  }

  return Math.max(0, score);
};

/**
 * Logika perhitungan skor disiplin berdasarkan masa kontrak.
 * Kontrak 1 Tahun: Menggunakan data Tahun N saja (100%).
 * Kontrak 5 Tahun: Tahun N (Berjalan) Bobot 60% + Tahun N-1 (Sebelumnya) Bobot 40%.
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
    
    // Gabungan bobot 40/60 dari skor maksimal (100)
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
  // Prasyarat Kesehatan
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

  const sDiscipline = calculateDisciplineScore(input.discipline, input.contractType);
  const sSKP = getPredicateScore(input.skpPredicate);
  const sIntegrity = getIntegrityScore(input.integrity);
  
  let sJob = 0;
  if (input.jobAvailability === 'AVAILABLE') sJob = 100;
  else sJob = 0;

  const sBehavior = getBehaviorScore(input.behaviorPredicate);

  const scoreEdu = input.qualification.educationMatched ? 100 : 0;
  const scoreJP = getJPScore(input.qualification.trainingJP);
  const scoreMOOC = input.qualification.moocOrientation ? 100 : 0;
  const sQualification = (scoreEdu * 0.4) + (scoreJP * 0.4) + (scoreMOOC * 0.2);

  // Kalkulasi Nilai Akhir Berdasarkan Bobot Final (Disiplin 40%, SKP 15%, Perilaku 15%, dst)
  const totalScore = 
    (sDiscipline * 0.4) + 
    (sSKP * 0.15) + 
    (sIntegrity * 0.1) + 
    (sJob * 0.1) + 
    (sBehavior * 0.15) + 
    (sQualification * 0.1);

  // Penentuan Predikat Sesuai Rentang Nilai yang Diinstruksikan
  // Sangat Baik: 90-100, Baik: 74-89, Butuh Perbaikan: 53-73, Kurang: 42-52, Sangat Kurang: < 42
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

  // Logika Kelayakan Perpanjangan Berdasarkan Predikat
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
