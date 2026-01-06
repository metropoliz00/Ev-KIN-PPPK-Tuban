
import React, { useState, useMemo } from 'react';
import { 
  EvaluationInput, 
} from './types';
import { calculateEvaluation } from './utils/calculations';
import InputSection from './components/InputSection';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType, 
} from 'docx';
import saveAs from 'file-saver';

const App: React.FC = () => {
  const [formData, setFormData] = useState<EvaluationInput>({
    nama: '',
    nip: '',
    unitKerja: '',
    tmtAwal: '',
    tmtAkhir: '',
    contractType: '1_YEAR',
    discipline: {
      absencesN: 0,
      shortHoursN: 0,
      absencesNMinus1: 0,
      shortHoursNMinus1: 0,
      absentMoreThan28Days: false,
      absent10DaysConsecutive: false,
      absentMoreThan28DaysNMinus1: false,
      absent10DaysConsecutiveNMinus1: false,
    },
    skpPredicate: 'BAIK',
    integrity: 'NIHIL',
    jobAvailability: 'AVAILABLE',
    behaviorPredicate: 'BAIK',
    qualification: {
      educationMatched: true,
      trainingJP: 0,
      moocOrientation: true,
    },
    isHealthy: true,
  });

  const result = useMemo(() => calculateEvaluation(formData), [formData]);

  const updateFormData = (path: string, value: any) => {
    const parts = path.split('.');
    if (parts.length === 1) {
      setFormData(prev => ({ ...prev, [parts[0]]: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        [parts[0]]: {
          ...(prev[parts[0] as keyof EvaluationInput] as any),
          [parts[1]]: value
        }
      }));
    }
  };

  const handleAbsencesNChange = (val: number) => {
    updateFormData('discipline.absencesN', val);
    if (val >= 28) {
      updateFormData('discipline.absentMoreThan28Days', true);
    }
  };

  const handleAbsencesNMinus1Change = (val: number) => {
    updateFormData('discipline.absencesNMinus1', val);
    if (val >= 28) {
      updateFormData('discipline.absentMoreThan28DaysNMinus1', true);
    }
  };

  const chartData = [
    { name: 'Disiplin', score: result.scoreDiscipline, weight: '40%' },
    { name: 'SKP', score: result.scoreSKP, weight: '15%' },
    { name: 'Integritas', score: result.scoreIntegrity, weight: '10%' },
    { name: 'Jabatan', score: result.scoreJob, weight: '10%' },
    { name: 'Perilaku', score: result.scoreBehavior, weight: '15%' },
    { name: 'Kualifikasi', score: result.scoreQualification, weight: '10%' },
  ];

  const logoUrl = "https://tubankab.go.id/files/2018-04/logo-tuban.jpg";

  const generateWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "PEMERINTAH KABUPATEN TUBAN", bold: true, size: 28 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "HASIL EVALUASI KINERJA PPPK", bold: true, size: 24 }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: "A. IDENTITAS PEGAWAI", bold: true, size: 22 })],
            spacing: { before: 200, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Nama")] }), new TableCell({ children: [new Paragraph(`: ${formData.nama || '-'}`)] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph("NIP / NI PPPK")] }), new TableCell({ children: [new Paragraph(`: ${formData.nip || '-'}`)] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Unit Kerja")] }), new TableCell({ children: [new Paragraph(`: ${formData.unitKerja || '-'}`)] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Masa Kontrak")] }), new TableCell({ children: [new Paragraph(`: ${formData.contractType === '1_YEAR' ? '1 Tahun' : '5 Tahun'}`)] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Periode Kontrak")] }), new TableCell({ children: [new Paragraph(`: ${formData.tmtAwal || '-'} s.d ${formData.tmtAkhir || '-'}`)] })] }),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: "B. RINCIAN PENILAIAN", bold: true, size: 22 })],
            spacing: { before: 400, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Kriteria", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Bobot", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Skor (0-100)", bold: true })] })] }),
                ]
              }),
              ...chartData.map(item => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(item.name)] }),
                  new TableCell({ children: [new Paragraph(item.weight)] }),
                  new TableCell({ children: [new Paragraph(item.score.toFixed(1))] }),
                ]
              }))
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: "C. KESIMPULAN EVALUASI", bold: true, size: 22 })],
            spacing: { before: 400, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Total Nilai Akhir")] }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: result.totalScore.toFixed(2), bold: true })] })] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Predikat Kinerja")] }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: result.predicate, bold: true })] })] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Simpulan")] }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: result.recommendation, bold: true, color: result.isEligible ? "000000" : "FF0000" })] })] })] }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 800 },
            children: [
              new TextRun({ text: `Tuban, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 400 },
            children: [
              new TextRun({ text: "Petugas Verifikator BKPSDM", italics: true }),
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Evaluasi_PPPK_${formData.nama || 'Tanpa_Nama'}.docx`);
  };

  const inputClass = "w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5 ml-1";

  return (
    <div className="min-h-screen pb-10 bg-slate-50 flex flex-col">
      <header className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white py-8 px-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center border border-white/20 shadow-xl overflow-hidden p-1 transition-transform hover:scale-105 duration-300">
               <img src={logoUrl} alt="Logo Tuban" className="h-full w-auto object-contain drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase leading-tight">Evaluasi PPPK KAB. TUBAN</h1>
              <p className="text-amber-50 font-medium opacity-90 border-t border-white/20 mt-1 pt-1">Sistem Evaluasi Kinerja</p>
            </div>
          </div>
          <div className="bg-amber-900/20 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
             <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
             <span className="text-sm font-semibold tracking-wide uppercase">SE NO 800.1.5.3/1283/414.203/2025</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
        <div className="lg:col-span-7 space-y-6">
          <InputSection title="Identitas Pegawai">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nama Lengkap</label>
                <input type="text" className={inputClass} value={formData.nama} onChange={e => updateFormData('nama', e.target.value)} placeholder="Masukkan Nama Sesuai SK" />
              </div>
              <div>
                <label className={labelClass}>NIP / NI PPPK</label>
                <input type="text" className={inputClass} value={formData.nip} onChange={e => updateFormData('nip', e.target.value)} placeholder="Masukkan NIP" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Unit Kerja</label>
                <input type="text" className={inputClass} value={formData.unitKerja} onChange={e => updateFormData('unitKerja', e.target.value)} placeholder="Nama Sekolah / OPD" />
              </div>
              <div>
                <label className={labelClass}>Jenis Kontrak</label>
                <select className={inputClass} value={formData.contractType} onChange={e => updateFormData('contractType', e.target.value)}>
                  <option value="1_YEAR">1 Tahun</option>
                  <option value="5_YEARS">5 Tahun</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>TMT Awal</label>
                  <input type="date" className={inputClass} value={formData.tmtAwal} onChange={e => updateFormData('tmtAwal', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>TMT Akhir</label>
                  <input type="date" className={inputClass} value={formData.tmtAkhir} onChange={e => updateFormData('tmtAkhir', e.target.value)} />
                </div>
              </div>
            </div>
          </InputSection>

          <InputSection title="Disiplin & Kehadiran" description="Data TKS (Tanpa Keterangan Sah) dan Akumulasi Kekurangan Jam Kerja">
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Penilaian Tahun N (Tahun Berjalan)
                  </h4>
                  {formData.contractType === '5_YEARS' && (
                    <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">Bobot 60%</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelClass}>TKS Tahun N (Hari)</label>
                      <input 
                        type="number" 
                        min="0"
                        className={`${inputClass} ${formData.discipline.absencesN >= 28 ? 'border-red-500 bg-red-50' : ''}`}
                        value={formData.discipline.absencesN} 
                        onChange={e => handleAbsencesNChange(Number(e.target.value))} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Kurang Jam Thn N (Jam)</label>
                      <input 
                        type="number" 
                        min="0"
                        className={`${inputClass} ${formData.discipline.shortHoursN > 157.5 ? 'border-amber-500 bg-amber-50' : ''}`}
                        value={formData.discipline.shortHoursN} 
                        onChange={e => updateFormData('discipline.shortHoursN', Number(e.target.value))} 
                      />
                    </div>
                </div>
                
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${formData.discipline.absentMoreThan28Days ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-red-200'}`}>
                    <label className="text-sm font-medium text-slate-700 leading-tight pr-4">
                      Ketidakhadiran tanpa keterangan sah >= 28 hari (Thn N)
                    </label>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-red-600 rounded cursor-pointer" 
                      checked={formData.discipline.absentMoreThan28Days} 
                      onChange={e => updateFormData('discipline.absentMoreThan28Days', e.target.checked)} 
                    />
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${formData.discipline.absent10DaysConsecutive ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-red-200'}`}>
                    <label className="text-sm font-medium text-slate-700 leading-tight pr-4">
                      Ketidakhadiran 10 hari berturut-turut tanpa keterangan sah (Thn N)
                    </label>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-red-600 rounded cursor-pointer" 
                      checked={formData.discipline.absent10DaysConsecutive} 
                      onChange={e => updateFormData('discipline.absent10DaysConsecutive', e.target.checked)} 
                    />
                  </div>
                </div>
              </div>

              {formData.contractType === '5_YEARS' && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                   <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Penilaian Tahun N-1 (Tahun Sebelumnya)
                    </h4>
                    <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">Bobot 40%</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className={labelClass}>TKS Thn N-1 (Hari)</label>
                            <input 
                              type="number" 
                              min="0"
                              className={`${inputClass} ${(formData.discipline.absencesNMinus1 || 0) >= 28 ? 'border-red-500 bg-red-50' : ''}`}
                              value={formData.discipline.absencesNMinus1} 
                              onChange={e => handleAbsencesNMinus1Change(Number(e.target.value))} 
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Kurang Jam Thn N-1 (Jam)</label>
                            <input 
                              type="number" 
                              min="0"
                              className={`${inputClass} ${(formData.discipline.shortHoursNMinus1 || 0) > 157.5 ? 'border-amber-500 bg-amber-50' : ''}`}
                              value={formData.discipline.shortHoursNMinus1} 
                              onChange={e => updateFormData('discipline.shortHoursNMinus1', Number(e.target.value))} 
                            />
                        </div>
                   </div>

                   <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${formData.discipline.absentMoreThan28DaysNMinus1 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-red-200'}`}>
                        <label className="text-sm font-medium text-slate-700 leading-tight pr-4">
                        Ketidakhadiran tanpa keterangan sah >= 28 hari (Thn N-1)
                        </label>
                        <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-red-600 rounded cursor-pointer" 
                        checked={formData.discipline.absentMoreThan28DaysNMinus1} 
                        onChange={e => updateFormData('discipline.absentMoreThan28DaysNMinus1', e.target.checked)} 
                        />
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${formData.discipline.absent10DaysConsecutiveNMinus1 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-red-200'}`}>
                        <label className="text-sm font-medium text-slate-700 leading-tight pr-4">
                        Ketidakhadiran 10 hari berturut-turut tanpa keterangan sah (Thn N-1)
                        </label>
                        <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-red-600 rounded cursor-pointer" 
                        checked={formData.discipline.absent10DaysConsecutiveNMinus1} 
                        onChange={e => updateFormData('discipline.absent10DaysConsecutiveNMinus1', e.target.checked)} 
                        />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </InputSection>

          <InputSection title="Capaian Kinerja (SKP) & Perilaku">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Predikat SKP (Bobot 15%)</label>
                <select className={inputClass} value={formData.skpPredicate} onChange={e => updateFormData('skpPredicate', e.target.value)}>
                  <option value="SANGAT_BAIK">Sangat Baik</option>
                  <option value="BAIK">Baik</option>
                  <option value="BUTUH_PERBAIKAN">Butuh Perbaikan</option>
                  <option value="KURANG">Kurang</option>
                  <option value="SANGAT_KURANG">Sangat Kurang</option>
                  <option value="TIDAK_MENGUMPULKAN">Tidak Mengumpulkan</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Predikat Perilaku (Bobot 15%)</label>
                <select className={inputClass} value={formData.behaviorPredicate} onChange={e => updateFormData('behaviorPredicate', e.target.value)}>
                  <option value="SANGAT_BAIK">Sangat Baik</option>
                  <option value="BAIK">Baik</option>
                  <option value="BUTUH_PERBAIKAN">Butuh Perbaikan</option>
                  <option value="KURANG">Kurang</option>
                  <option value="SANGAT_KURANG">Sangat Kurang</option>
                </select>
              </div>
            </div>
          </InputSection>

          <InputSection title="Integritas & Ketersediaan Jabatan">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Hukuman Disiplin (LHKASN/LHKPN)</label>
                <select className={inputClass} value={formData.integrity} onChange={e => updateFormData('integrity', e.target.value)}>
                  <option value="NIHIL">Nihil / Tidak Ada Pelanggaran</option>
                  <option value="RINGAN">Ringan</option>
                  <option value="SEDANG">Sedang</option>
                  <option value="BERAT">Berat</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Formasi Jabatan (Bobot 10%)</label>
                <select className={inputClass} value={formData.jobAvailability} onChange={e => updateFormData('jobAvailability', e.target.value)}>
                  <option value="AVAILABLE">Tersedia</option>
                  <option value="NOT_AVAILABLE">Tidak Tersedia</option>
                  <option value="GURU_JAM_KURANG">Guru Jam Kurang (Linearitas)</option>
                </select>
              </div>
            </div>
          </InputSection>

          <InputSection title="Kualifikasi & Pengembangan (Bobot 10%)">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="text-sm font-bold text-slate-700">Kesesuaian Pendidikan (Ijazah vs Jabatan)</label>
                <input type="checkbox" className="w-6 h-6 accent-amber-500" checked={formData.qualification.educationMatched} onChange={e => updateFormData('qualification.educationMatched', e.target.checked)} />
              </div>
              <div>
                <label className={labelClass}>Total JP Pengembangan Kompetensi</label>
                <input type="number" min="0" className={inputClass} value={formData.qualification.trainingJP} onChange={e => updateFormData('qualification.trainingJP', Number(e.target.value))} />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="text-sm font-bold text-slate-700">Penyelesaian Orientasi MOOC</label>
                <input type="checkbox" className="w-6 h-6 accent-amber-500" checked={formData.qualification.moocOrientation} onChange={e => updateFormData('qualification.moocOrientation', e.target.checked)} />
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100 mt-6 transition-all hover:bg-red-100/50">
                <div className="flex flex-col">
                    <label className="text-sm font-black text-red-700 uppercase tracking-tighter">Kesehatan Jasmani & Rohani</label>
                    <span className="text-[10px] text-red-600/70 font-medium italic">Prasyarat utama perpanjangan kontrak</span>
                </div>
                <input type="checkbox" className="w-6 h-6 accent-red-600" checked={formData.isHealthy} onChange={e => updateFormData('isHealthy', e.target.checked)} />
              </div>
            </div>
          </InputSection>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-32 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
              <div className={`p-8 text-white text-center transition-all duration-700 relative ${result.isEligible ? 'bg-slate-900' : 'bg-red-950'}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                </div>
                <h3 className="text-xs font-black opacity-60 uppercase tracking-[0.2em] mb-3">Nilai Akhir Evaluasi</h3>
                <div className="text-7xl font-black tracking-tighter drop-shadow-lg">{result.totalScore.toFixed(2)}</div>
                <div className={`mt-5 inline-flex items-center px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                  result.predicate === 'SANGAT BAIK' ? 'bg-emerald-500 text-white' :
                  result.predicate === 'BAIK' ? 'bg-blue-600 text-white' :
                  result.predicate === 'BUTUH PERBAIKAN' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'
                }`}>
                  {result.predicate}
                </div>
              </div>
              
              <div className="p-8">
                <div className="h-64 w-full mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="score" radius={[0, 12, 12, 0]} barSize={24}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            index === 0 ? (entry.score < 50 ? '#ef4444' : '#f59e0b') : 
                            index === 1 ? '#3b82f6' :
                            index === 2 ? '#ef4444' :
                            index === 3 ? '#10b981' :
                            index === 4 ? '#8b5cf6' : '#6366f1'
                          } />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className={`mt-4 p-6 rounded-[1.5rem] border-2 text-center transition-all ${
                  result.isEligible ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'
                }`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Simpulan Rekomendasi</p>
                  <p className={`text-sm font-bold leading-relaxed tracking-tight ${
                    result.isEligible ? 'text-emerald-900' : 'text-red-900'
                  }`}>
                    {result.recommendation}
                  </p>
                </div>

                <button 
                  onClick={generateWord}
                  className="w-full mt-8 bg-slate-900 hover:bg-black text-white font-black py-4.5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  DOWNLOAD HASIL (.DOCX)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 py-10 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-500 font-bold text-sm tracking-tight">
            Sistem Evaluasi Kinerja &copy; 2025
          </p>
          <p className="text-slate-400 text-xs mt-1 font-semibold opacity-80">
            Dev by Dedy Meyga Saputra, S.Pd, M.Pd | Kabupaten Tuban
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
