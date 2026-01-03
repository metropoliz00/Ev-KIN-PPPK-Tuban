
export type ContractType = '1_YEAR' | '5_YEARS';

export interface DisciplineData {
  absencesN: number; // Current year
  shortHoursN: number; // Current year deficiency
  absencesNMinus1?: number; // Previous year (for 5-year contracts)
  shortHoursNMinus1?: number; // Previous year deficiency
  absentMoreThan28Days: boolean; // Ketidakhadiran > 28 hari Tahun N
  absent10DaysConsecutive: boolean; // Ketidakhadiran 10 hari berturut-turut Tahun N
  absentMoreThan28DaysNMinus1?: boolean; // Ketidakhadiran > 28 hari Tahun N-1
  absent10DaysConsecutiveNMinus1?: boolean; // Ketidakhadiran 10 hari berturut-turut Tahun N-1
}

export type Predicate = 'SANGAT_BAIK' | 'BAIK' | 'BUTUH_PERBAIKAN' | 'KURANG' | 'SANGAT_KURANG' | 'TIDAK_MENGUMPULKAN';

export type IntegrityLevel = 'NIHIL' | 'RINGAN' | 'SEDANG' | 'BERAT';

export interface QualificationData {
  educationMatched: boolean;
  trainingJP: number;
  moocOrientation: boolean;
}

export interface EvaluationInput {
  nama: string;
  nip: string;
  unitKerja: string;
  tmtAwal: string;
  tmtAkhir: string;
  contractType: ContractType;
  discipline: DisciplineData;
  skpPredicate: Predicate;
  integrity: IntegrityLevel;
  jobAvailability: 'AVAILABLE' | 'NOT_AVAILABLE' | 'GURU_JAM_KURANG';
  behaviorPredicate: Predicate;
  qualification: QualificationData;
  isHealthy: boolean;
}

export interface EvaluationResult {
  scoreDiscipline: number;
  scoreSKP: number;
  scoreIntegrity: number;
  scoreJob: number;
  scoreBehavior: number;
  scoreQualification: number;
  totalScore: number;
  predicate: string;
  recommendation: string;
  isEligible: boolean;
  isHealthy: boolean;
}
