
import { 
  EvaluationInput, 
  EvaluationResult, 
  DisciplineData, 
  ContractType, 
  Predicate, 
  IntegrityLevel 
} from '../types';

const getAbsenceScore = (days: number): number => {
  if (days === 0) return 100;
  if (days <= 2) return 80;
  if (days <= 20) return 30;
  if (days <= 27) return 20;
  if (days === 28) return 10; // Mendekati ambang batas terminasi
  return 0; // Lebih dari 28 hari
};

const calculateDisciplineScore = (data: DisciplineData, type: ContractType): number => {
  // Aturan Mutlak: Jika ada TKS 10 hari berturut-turut ATAU total TKS > 28 hari di tahun berjalan
  if (data.consecutiveAbsence10Days || data.absencesN > 28) {
    return 0;
  }

  if (type === '1_YEAR') {
    let score = getAbsenceScore(data.absencesN);
    if (data.shortHoursN > 157.5) score -= 10;
    return Math.max(0, score);
  } else {
    // Kontrak 5 Tahun
    // Cek juga pelanggaran fatal di tahun sebelumnya (N-1)
    if (data.consecutiveAbsence10DaysNMinus1 || (data.absencesNMinus1 || 0) > 28) {
        return 0;
    }

    // Perhitungan Berbobot: N-1 (40%), N (60%)
    const scoreNMinus1Base = getAbsenceScore(data.absencesNMinus1 || 0);
    const scoreNMinus1 = (data.shortHoursNMinus1 || 0) > 157.5 ? scoreNMinus1Base - 10 : scoreNMinus1Base;
    
    const scoreNBase = getAbsenceScore(data.absencesN);
    const scoreN = data.shortHoursN > 157.5 ? scoreNBase - 10 : scoreNBase;
    
    return (Math.max(0, scoreNMinus1) * 0.4) + (Math.max(0, scoreN) * 0.6);
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

  const totalScore = 
    (sDiscipline * 0.4) + 
    (sSKP * 0.15) + 
    (sIntegrity * 0.1) + 
    (sJob * 0.1) + 
    (sBehavior * 0.15) + 
    (sQualification * 0.1);

  let predicate = '';
  if (totalScore >= 90) predicate = 'SANGAT BAIK';
  else if (totalScore >= 74) predicate = 'BAIK';
  else if (totalScore >= 53) predicate = 'BUTUH PERBAIKAN';
  else if (totalScore >= 42) predicate = 'KURANG';
  else predicate = 'SANGAT KURANG';

  const isEligible = totalScore >= 53;

  return {
    scoreDiscipline: sDiscipline,
    scoreSKP: sSKP,
    scoreIntegrity: sIntegrity,
    scoreJob: sJob,
    scoreBehavior: sBehavior,
    scoreQualification: sQualification,
    totalScore,
    predicate,
    isEligible,
    isHealthy: true
  };
};
