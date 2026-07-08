import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Download, 
  Printer, 
  Save, 
  Github, 
  Linkedin, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight,
  ChevronLeft,
  Layout,
  Check,
  X,
  User,
  Users,
  Briefcase,
  GraduationCap,
  Wrench,
  Award,
  Maximize2,
  Camera,
  Layers,
  Terminal,
  Database,
  Cloud,
  Cpu,
  Trophy,
  Coffee,
  Code2,
  CheckCircle2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { ResumeData, INITIAL_RESUME_DATA, SkillSet } from './types.ts';
import ThreeBackground from './components/ThreeBackground.tsx';
import { improveText, suggestSkills, suggestSpokenLanguages, suggestInterests, suggestEducationPoints, suggestProjectDescription } from './services/contentEnhancerService.ts';

const toSentenceCase = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function App() {
  const [data, setData] = useState<ResumeData>(() => {
    const saved = localStorage.getItem('nova_resume_data');
    if (!saved) return INITIAL_RESUME_DATA;
    
      try {
      const parsed = JSON.parse(saved);
      // Deep merge skills to ensure all categories exist
      let skills = { ...INITIAL_RESUME_DATA.skills };
      if (Array.isArray(parsed.skills)) {
        skills.frontend = parsed.skills;
      } else if (parsed.skills) {
        skills = { ...skills, ...parsed.skills };
      }

      return {
        ...INITIAL_RESUME_DATA,
        ...parsed,
        personalInfo: { ...INITIAL_RESUME_DATA.personalInfo, ...(parsed.personalInfo || {}) },
        skills,
        education: Array.isArray(parsed.education) ? parsed.education : [],
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        hackathons: Array.isArray(parsed.hackathons) ? parsed.hackathons : [],
        openSource: Array.isArray(parsed.openSource) ? parsed.openSource : [],
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
        languages: Array.isArray(parsed.languages) ? parsed.languages : [],
        interests: Array.isArray(parsed.interests) ? parsed.interests : [],
        leadership: Array.isArray(parsed.leadership) ? parsed.leadership : [],
      };
    } catch (e) {
      console.error("Error parsing saved resume data", e);
      return INITIAL_RESUME_DATA;
    }
  });
  const [step, setStep] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');

  const calculateScore = (resume: ResumeData) => {
    let score = 0;
    const { personalInfo, skills, experience, projects, education, hackathons, languages, interests } = resume;
    
    // Personal Info: 30pts
    if (personalInfo.fullName) score += 5;
    if (personalInfo.summary && personalInfo.summary.length > 50) score += 10;
    if (personalInfo.profileImage) score += 5;
    if (personalInfo.github) score += 5;
    if (personalInfo.linkedin) score += 5;
    
    // Skills: 20pts
    const skillCount = Object.values(skills).flat().length;
    score += Math.min(skillCount * 2, 20);
    
    // Experience: 20pts
    score += Math.min(experience.length * 10, 20);
    
    // Projects: 15pts
    score += Math.min(projects.length * 5, 15);
    
    // Education: 10pts
    score += Math.min(education.length * 5, 10);

    // Extra: 10pts
    if (hackathons && hackathons.length > 0) score += 5;
    if ((languages && languages.length > 0) || (interests && interests.length > 0)) score += 5;
    
    return Math.min(score, 100);
  };

  const resumeScore = calculateScore(data);

  const getAssistantMessage = () => {
    if (resumeScore < 30) return "Start by adding your name and a strong professional summary.";
    if (resumeScore < 50) return "Add your technical skills and education to build core authority.";
    if (resumeScore < 75) return "Include projects or work experience to demonstrate your impact.";
    if (resumeScore < 95) return "Almost perfect! Add awards or languages to complete your profile.";
    return "Excellent! Your resume has high authority and is optimized for top IT firms.";
  };

  const [isSaved, setIsSaved] = useState(false);

  const saveToLocal = (newData: ResumeData) => {
    setData(newData);
    localStorage.setItem('nova_resume_data', JSON.stringify(newData));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);

    try {
      // 1. Wait for fonts to be fully loaded
      await document.fonts.ready;

      // 2. Collect all resume pages
      const pages = document.querySelectorAll('.resume-a4-page');
      if (pages.length === 0) {
        alert('No resume pages found to export.');
        return;
      }

      // 3. Wait for all images within resume pages to load
      const allImages = document.querySelectorAll('.resume-a4-page img');
      await Promise.all(
        Array.from(allImages).map((img) => {
          const htmlImg = img as HTMLImageElement;
          if (htmlImg.complete && htmlImg.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            htmlImg.onload = () => resolve();
            htmlImg.onerror = () => resolve();
            setTimeout(resolve, 2000); // Safety timeout
          });
        })
      );

      // 4. Brief render stabilisation delay
      await new Promise((r) => setTimeout(r, 200));

      // 5. Create an off-screen container for capture.
      //    ScalingA4Page wraps .resume-a4-page with CSS transform(scale), which
      //    distorts html2canvas output. We clone each page into a fixed-size
      //    off-screen container at native A4 px dimensions (794×1123) so the
      //    capture sees the exact layout the preview renders.
      const offscreen = document.createElement('div');
      offscreen.style.cssText =
        'position:fixed;left:-9999px;top:0;width:794px;height:1123px;overflow:hidden;z-index:-1;pointer-events:none;';
      document.body.appendChild(offscreen);

      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const A4_W_MM = 210;
      const A4_H_MM = 297;

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();

        // Clone the page node into our off-screen container
        const clone = pages[i].cloneNode(true) as HTMLElement;
        // Ensure the clone has fixed A4 pixel dimensions, no transform
        clone.style.cssText =
          'width:794px;height:1123px;min-width:794px;min-height:1123px;max-width:794px;max-height:1123px;' +
          'transform:none;box-sizing:border-box;position:relative;overflow:hidden;background:#fff;';
        offscreen.innerHTML = '';
        offscreen.appendChild(clone);

        // Let the cloned DOM settle
        await new Promise((r) => setTimeout(r, 100));

        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: 794,
          height: 1123,
          scrollX: 0,
          scrollY: 0,
        });

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, A4_W_MM, A4_H_MM);
      }

      // Cleanup off-screen container
      document.body.removeChild(offscreen);

      // 6. Save
      const safeName = (data.personalInfo?.fullName || 'Resume')
        .trim()
        .replace(/[^a-zA-Z0-9\s_-]/g, '')
        .replace(/\s+/g, '_');
      pdf.save(`${safeName}_ResumeFormer.pdf`);
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      alert('PDF Export Error: ' + (err?.message || String(err)));
    } finally {
      setIsExporting(false);
    }
  };

  const handleApplyTheme = (theme: ResumeData['theme']) => {
    saveToLocal({ ...data, theme });
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      saveToLocal(INITIAL_RESUME_DATA);
      setStep(0);
    }
  };



  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-indigo-500/30">
      <ThreeBackground />
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-2 flex items-center justify-between backdrop-blur-md border-b border-indigo-500/20 bg-slate-950/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)] cursor-pointer hover:scale-105 transition-transform">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent hidden sm:block">
              RESUME FORMER
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 mr-2">
            <Layout className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Design Systems</span>
          </div>
          <ThemeSwitcher current={data.theme} onSelect={handleApplyTheme} />

          <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block" />
          
          <button 
            onClick={handleClearData}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-rose-500/30 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 transition-all text-sm"
            title="Clear all fields"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>
          
          <button 
            onClick={() => saveToLocal(data)} 
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm ${isSaved ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 hover:border-indigo-500/50'}`}
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {isSaved ? 'Saved!' : 'Save'}
          </button>
          <button 
            disabled={isExporting}
            onClick={handleDownloadPDF} 
            className="flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-all text-sm font-bold shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-50"
          >
            {isExporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4 sm:px-12 max-w-[1700px] mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-8 xl:gap-24 items-start">
        {/* Mobile Tab Switcher */}
        <div className="lg:hidden w-full flex items-center justify-between p-1 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl mb-2 sticky top-[72px] z-40 shadow-2xl">
          <button
            type="button"
            onClick={() => setMobileTab('edit')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              mobileTab === 'edit'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Edit Details
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              mobileTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Live Preview
          </button>
        </div>

        {/* Left Side: Form */}
        <section className={`w-full lg:sticky lg:top-24 lg:h-[calc(100vh-160px)] lg:overflow-y-auto pr-0 lg:pr-8 lg:custom-scrollbar ${mobileTab === 'edit' ? 'block' : 'hidden lg:block'}`}>
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
            
            <header className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Design Your Future</h1>
                <p className="text-slate-400 text-sm">Step {step + 1} of 4: Profile Configuration</p>
              </div>
              <div className="hidden sm:flex gap-1.5">
                {[0, 1, 2, 3].map((s) => (
                  <div 
                    key={s} 
                    className={`h-1.5 w-6 sm:w-10 rounded-full transition-all duration-700 ease-out ${s <= step ? 'bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-slate-800'}`}
                  />
                ))}
              </div>
            </header>

            <FormContent step={step} data={data} setData={saveToLocal} />

            <SmartSuggestionPanel data={data} onUpdate={saveToLocal} />

            <footer className="mt-8 flex justify-between pt-6 border-t border-white/5">
              <button 
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-all text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button 
                onClick={() => {
                  if (step < 3) setStep(step + 1);
                  else handleDownloadPDF();
                }}
                className="flex items-center gap-2 px-6 sm:px-10 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all font-bold group shadow-lg shadow-indigo-600/20"
              >
                {step === 3 ? 'Finalize & Export' : 'Continue'}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </footer>
          </motion.div>

          {/* Quick Metrics / Tips Widget */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="bg-indigo-600/10 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
                <Layout className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Resume Authority</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-1000" 
                      style={{ width: `${resumeScore}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-bold">{resumeScore}/100</span>
                </div>
              </div>
            </div>
            
            <div className="bg-emerald-600/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">Smart Assistant</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">{getAssistantMessage()}</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Right Side: Preview - Centered A4 Sheet */}
        <section className={`w-full lg:sticky lg:top-24 lg:h-[calc(100vh-160px)] flex flex-col items-center justify-start ${mobileTab === 'preview' || isExporting ? 'flex' : 'hidden lg:flex'}`}>
          <div id="resume-preview-container" className="h-full w-full overflow-y-auto custom-scrollbar-light p-4 flex flex-col items-center justify-start gap-6 bg-slate-900/30 border border-white/5 rounded-3xl">
             <div id="resume-preview-root" className="w-full flex flex-col items-center gap-6">
               <ResumePreview data={data} />
             </div>
          </div>
        </section>
      </main>
      <AnimatePresence>
        {isExporting && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin mb-2" />
                <h3 className="text-xl font-bold text-white">Compiling PDF</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Assembling high-fidelity desktop A4 document components in memory...
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThemeSwitcher({ current, onSelect }: { current: ResumeData['theme'], onSelect: (t: ResumeData['theme']) => void }) {
  const themes: { id: ResumeData['theme'], label: string, color: string }[] = [
    { id: 'executive', label: 'Executive', color: 'bg-teal-600' },
    { id: 'futuristic', label: 'Neo-Tech', color: 'bg-indigo-600' },
    { id: 'modern', label: 'Modern UX', color: 'bg-emerald-600' },
    { id: 'minimal', label: 'Zenith', color: 'bg-slate-900' },
    { id: 'corporate', label: 'Enterprise', color: 'bg-blue-800' }
  ];

  return (
    <div className="flex gap-1.5 p-1 bg-white/5 rounded-full border border-white/10">
      {themes.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
            current === t.id 
              ? `${t.color} text-white shadow-lg` 
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ... Rest of subcomponents (FormContent, PersonalInfoForm etc.) stay but I'll add Image Upload and Theme support in Preview


// Sub-components for Form
function FormContent({ step, data, setData }: { step: number, data: ResumeData, setData: (d: ResumeData) => void }) {
  if (step === 0) return <PersonalInfoForm data={data} setData={setData} />;
  if (step === 1) return <ExperienceEducationForm data={data} setData={setData} />;
  if (step === 2) return <SkillsProjectsForm data={data} setData={setData} />;
  return <TechnicalExtrasForm data={data} setData={setData} />;
}

function SmartSuggestionPanel({ data, onUpdate }: { data: ResumeData, onUpdate: (d: ResumeData) => void }) {
  const suggestions = [];
  if (!data.personalInfo.github) suggestions.push({ icon: <Github className="w-3 h-3"/>, text: "Connect GitHub for code proof", action: "personal" });
  if (!data.personalInfo.linkedin) suggestions.push({ icon: <Linkedin className="w-3 h-3"/>, text: "Add LinkedIn profile for networking", action: "personal" });
  if (data.projects.length < 2) suggestions.push({ icon: <Code2 className="w-3 h-3"/>, text: "Add at least 2 technical projects", action: "projects" });
  if (Object.values(data.skills).flat().length < 10) suggestions.push({ icon: <Terminal className="w-3 h-3"/>, text: "Expand your skill matrix", action: "skills" });

  if (suggestions.length === 0) return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="mt-6 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10"
    >
      <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
        <Sparkles className="w-3 h-3" /> Intelligence Engine
      </h5>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px] text-slate-400">
            <CheckCircle2 className="w-3 h-3 text-indigo-500" />
            <span>{s.text}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function PersonalInfoForm({ data, setData }: { data: ResumeData, setData: (d: ResumeData) => void }) {
  const [isImproving, setIsImproving] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const formattedValue = ['fullName', 'title', 'currentInstitution', 'summary', 'location'].includes(name) 
      ? toSentenceCase(value) 
      : value;
    setData({
      ...data,
      personalInfo: { ...data.personalInfo, [name]: formattedValue }
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create a canvas to resize the image
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400; // Limit dimensions to 400px
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG with 0.7 quality
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setData({
              ...data,
              personalInfo: { ...data.personalInfo, profileImage: dataUrl }
            });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImproveSummary = async () => {
    if (!data.personalInfo.summary) return;
    setIsImproving(true);
    const improved = await improveText(data.personalInfo.summary, "Professional Summary for " + data.personalInfo.title);
    setData({
      ...data,
      personalInfo: { ...data.personalInfo, summary: improved }
    });
    setIsImproving(false);
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-white/5 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(31,38,135,0.2)] backdrop-blur-md"
      >
        <div className="relative group">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-indigo-500/30 group-hover:border-indigo-500 transition-all duration-500 bg-slate-950 flex items-center justify-center p-1">
            <div className="w-full h-full rounded-xl overflow-hidden bg-slate-900 border border-white/5">
              {data.personalInfo.profileImage ? (
                <img src={data.personalInfo.profileImage} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-12 h-12 text-slate-700" />
              )}
            </div>
          </div>
          <label className="absolute -bottom-3 -right-3 p-2.5 bg-indigo-600 rounded-xl cursor-pointer hover:bg-indigo-500 transition-all shadow-xl hover:scale-110 active:scale-95 z-20">
            <Camera className="w-5 h-5 text-white" />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-white text-lg font-bold">Biometric Profile</h3>
          <p className="text-slate-400 text-xs mt-1">Upload a high-resolution headshot for ID analysis</p>
          <div className="flex gap-2 mt-3 justify-center sm:justify-start">
             <div className="h-1 w-8 bg-indigo-500/50 rounded-full" />
             <div className="h-1 w-4 bg-indigo-500/20 rounded-full" />
             <div className="h-1 w-2 bg-indigo-500/10 rounded-full" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Identity Name" name="fullName" value={data.personalInfo.fullName} onChange={handleChange} placeholder="John Doe" />
        <Input label="Strategic Designation" name="title" value={data.personalInfo.title} onChange={handleChange} placeholder="Full Stack Developer" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Current Institution" name="currentInstitution" value={data.personalInfo.currentInstitution} onChange={handleChange} placeholder="MIT University" />
        <Input label="Email Address" name="email" value={data.personalInfo.email} onChange={handleChange} placeholder="john@example.com" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Phone Contact" name="phone" value={data.personalInfo.phone} onChange={handleChange} placeholder="+1 234 567 890" />
        <Input label="Location" name="location" value={data.personalInfo.location} onChange={handleChange} placeholder="San Francisco, CA" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="GitHub" name="github" value={data.personalInfo.github} onChange={handleChange} placeholder="github.com/johndoe" />
        <Input label="LinkedIn" name="linkedin" value={data.personalInfo.linkedin} onChange={handleChange} placeholder="linkedin.com/in/johndoe" />
      </div>
      <div className="relative">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-indigo-400">Professional Summary</label>
          <button 
            onClick={handleImproveSummary}
            disabled={isImproving}
            className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded hover:bg-indigo-500/30 flex items-center gap-1 disabled:opacity-50"
          >
            {isImproving ? <div className="w-3 h-3 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {isImproving ? 'Analyzing...' : 'Smart Enhance'}
          </button>
        </div>
        <Textarea 
          name="summary"
          value={data.personalInfo.summary}
          onChange={handleChange}
          rows={4}
          className="text-sm px-4 py-3"
          placeholder="Briefly describe your professional background..."
        />
      </div>
    </div>
  );
}

function ExperienceEducationForm({ data, setData }: { data: ResumeData, setData: (d: ResumeData) => void }) {
  const [suggestingEduId, setSuggestingEduId] = useState<string | null>(null);

  const addExperience = () => {
    setData({
      ...data,
      experience: [...data.experience, { id: crypto.randomUUID(), company: '', position: '', location: '', startDate: '', endDate: '', description: '' }]
    });
  };

  const removeExperience = (id: string) => {
    setData({ ...data, experience: data.experience.filter(e => e.id !== id) });
  };

  const updateExperience = (id: string, field: string, value: string) => {
    const formattedValue = ['company', 'position', 'location', 'description'].includes(field)
      ? toSentenceCase(value)
      : value;
    setData({
      ...data,
      experience: data.experience.map(e => e.id === id ? { ...e, [field]: formattedValue } : e)
    });
  };

  const handleSuggestEduPoints = async (edu: any) => {
    setSuggestingEduId(edu.id);
    const suggestion = await suggestEducationPoints(edu.school, edu.degree, edu.field);
    if (suggestion) {
      setData({
        ...data,
        education: data.education.map(e => e.id === edu.id ? { ...e, studyPoints: suggestion } : e)
      });
    }
    setSuggestingEduId(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-400" /> Work Experience</h3>
          <button onClick={addExperience} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-all"><Plus className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          {data.experience.map((exp) => (
            <div key={exp.id} className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl relative group">
              <button 
                onClick={() => removeExperience(exp.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <Input label="Company" value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} />
                <Input label="Position" value={exp.position} onChange={(e) => updateExperience(exp.id, 'position', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <Input label="Location" value={exp.location} onChange={(e) => updateExperience(exp.id, 'location', e.target.value)} placeholder="Remote / City" />
                <Input label="Start Date" value={exp.startDate} onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)} placeholder="Jan 2022" />
                <Input label="End Date" value={exp.endDate} onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)} placeholder="Present" />
              </div>
              <Textarea 
                placeholder="Description of your responsibilities..."
                value={exp.description}
                onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                className="h-20"
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Education */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><GraduationCap className="w-5 h-5 text-indigo-400" /> Education</h3>
          <button onClick={() => setData({...data, education: [...data.education, {id: crypto.randomUUID(), school: '', degree: '', field: '', startYear: '', endYear: '', cgpa: '', twelfthResult: '', twelfthSchool: '', tenthResult: '', tenthSchool: '', currentSemester: '', studyPoints: ''}]})} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-all"><Plus className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          {data.education.map((edu) => (
            <div key={edu.id} className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl relative group">
              <button 
                onClick={() => setData({...data, education: data.education.filter(e => e.id !== edu.id)})}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Institution" value={edu.school} onChange={(e) => setData({ ...data, education: data.education.map(ed => ed.id === edu.id ? {...ed, school: toSentenceCase(e.target.value)} : ed) })} />
                <Input label="Degree / Diploma" value={edu.degree} onChange={(e) => setData({ ...data, education: data.education.map(ed => ed.id === edu.id ? {...ed, degree: toSentenceCase(e.target.value)} : ed) })} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                <Input label="Field of Study" value={edu.field} onChange={(e) => setData({ ...data, education: data.education.map(ed => ed.id === edu.id ? {...ed, field: toSentenceCase(e.target.value)} : ed) })} placeholder="Computer Science" />
                <Input label="Current Semester" value={edu.currentSemester} onChange={(e) => setData({ ...data, education: data.education.map(ed => ed.id === edu.id ? {...ed, currentSemester: e.target.value} : ed) })} placeholder="6th Semester" />
                <Input label="Start Year" value={edu.startYear} onChange={(e) => setData({ ...data, education: data.education.map(ed => ed.id === edu.id ? {...ed, startYear: e.target.value} : ed) })} placeholder="2018" />
                <Input label="End Year" value={edu.endYear} onChange={(e) => setData({ ...data, education: data.education.map(ed => ed.id === edu.id ? {...ed, endYear: e.target.value} : ed) })} placeholder="2022" />
              </div>

              <div className="relative mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 ml-1">Current Study Details (Points)</label>
                  <button 
                    onClick={() => handleSuggestEduPoints(edu)}
                    disabled={suggestingEduId === edu.id}
                    className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                  >
                    {suggestingEduId === edu.id ? <div className="w-3 h-3 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Suggest Points
                  </button>
                </div>
                <Textarea 
                  placeholder="Key areas of study or academic excellence..."
                  value={edu.studyPoints}
                  onChange={(e) => setData({ ...data, education: data.education.map(ed => ed.id === edu.id ? {...ed, studyPoints: toSentenceCase(e.target.value)} : ed) })}
                  className="h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="space-y-3">
                  <Input label="12th School Name" value={edu.twelfthSchool} onChange={(e) => setData({ ...data, education: data.education.map(ed => ed.id === edu.id ? {...ed, twelfthSchool: toSentenceCase(e.target.value)} : ed) })} placeholder="High school name" />
                  <Input label="12th Result (%)" value={edu.twelfthResult} onChange={(e) => setData({ ...data, education: data.education.map(ed => ed.id === edu.id ? {...ed, twelfthResult: e.target.value} : ed) })} placeholder="95%" />
                </div>
                <div className="space-y-3">
                  <Input label="10th School Name" value={edu.tenthSchool} onChange={(e) => setData({ ...data, education: data.education.map(ed => ed.id === edu.id ? {...ed, tenthSchool: toSentenceCase(e.target.value)} : ed) })} placeholder="Secondary school name" />
                  <Input label="10th Result (%)" value={edu.tenthResult} onChange={(e) => setData({ ...data, education: data.education.map(ed => ed.id === edu.id ? {...ed, tenthResult: e.target.value} : ed) })} placeholder="92%" />
                </div>
              </div>
              <div className="mt-3">
                <Input label="Current CGPA" value={edu.cgpa} onChange={(e) => setData({ ...data, education: data.education.map(ed => ed.id === edu.id ? {...ed, cgpa: e.target.value} : ed) })} placeholder="9.8" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leadership & Institutional Experience */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-indigo-400" /> Leadership & Institutional</h3>
          <button onClick={() => setData({...data, leadership: [...(data.leadership || []), {id: crypto.randomUUID(), title: '', description: ''}]})} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-all"><Plus className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          {(data.leadership || []).map((l) => (
            <div key={l.id} className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl relative group">
              <button 
                onClick={() => setData({...data, leadership: data.leadership.filter(item => item.id !== l.id)})}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <Input label="Title / Role" value={l.title} onChange={(e) => setData({ ...data, leadership: data.leadership.map(item => item.id === l.id ? {...item, title: toSentenceCase(e.target.value)} : item) })} placeholder="Observer — Dummy Youth Parliament" />
              <div className="mt-3">
                <Textarea 
                  label="Description"
                  placeholder="Gained exposure to committee proceedings..."
                  value={l.description}
                  onChange={(e) => setData({ ...data, leadership: data.leadership.map(item => item.id === l.id ? {...item, description: toSentenceCase(e.target.value)} : item) })}
                  className="h-20"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillsProjectsForm({ data, setData }: { data: ResumeData, setData: (d: ResumeData) => void }) {
  const [isImproving, setIsImproving] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [suggestingProjId, setSuggestingProjId] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const handleSuggestProjDesc = async (proj: any) => {
    setSuggestingProjId(proj.id);
    const suggestion = await suggestProjectDescription(proj.name, proj.technologies || []);
    if (suggestion) {
      setData({
        ...data,
        projects: data.projects.map(p => p.id === proj.id ? { ...p, description: suggestion } : p)
      });
    }
    setSuggestingProjId(null);
  };
  
  const categories: { id: keyof SkillSet, label: string, icon: any }[] = [
    { id: 'frontend', label: 'Frontend', icon: <Layers className="w-4 h-4"/> },
    { id: 'backend', label: 'Backend', icon: <Cpu className="w-4 h-4"/> },
    { id: 'languages', label: 'Programming Languages', icon: <Code2 className="w-4 h-4"/> },
    { id: 'database', label: 'Database', icon: <Database className="w-4 h-4"/> },
    { id: 'cloud', label: 'Cloud', icon: <Cloud className="w-4 h-4"/> },
    { id: 'tools', label: 'Tools', icon: <Wrench className="w-4 h-4"/> },
    { id: 'softSkills', label: 'Soft Skills', icon: <Coffee className="w-4 h-4"/> }
  ];

  const handleSuggest = async () => {
    setIsImproving(true);
    const currentSkills = Object.values(data.skills).flat();
    const suggestions = await suggestSkills(data.personalInfo.title, currentSkills);
    
    if (suggestions) {
      const mergedSkills = { ...data.skills };
      (Object.keys(suggestions) as (keyof SkillSet)[]).forEach(cat => {
        if (Array.isArray(suggestions[cat]) && Array.isArray(mergedSkills[cat])) {
          mergedSkills[cat] = [...new Set([...mergedSkills[cat], ...suggestions[cat]])];
        }
      });
      setData({ ...data, skills: mergedSkills });
    }
    setIsImproving(false);
  };

  const handleSuggestForCategory = async (categoryId: keyof SkillSet) => {
    setLoadingCategory(categoryId);
    const suggestions = await suggestSkills(data.personalInfo.title, data.skills[categoryId], categoryId);
    if (Array.isArray(suggestions)) {
      setData({
        ...data,
        skills: {
          ...data.skills,
          [categoryId]: [...new Set([...data.skills[categoryId], ...suggestions])]
        }
      });
    }
    setLoadingCategory(null);
  };

  const addSkillToCategory = (category: keyof SkillSet, skill: string) => {
    if (!skill.trim()) return;
    setData({
      ...data,
      skills: {
        ...data.skills,
        [category]: [...new Set([...data.skills[category], skill.trim()])]
      }
    });
    setInputValues(prev => ({ ...prev, [category]: '' }));
  };

  const removeSkillFromCategory = (category: keyof SkillSet, skill: string) => {
    setData({
      ...data,
      skills: {
        ...data.skills,
        [category]: data.skills[category].filter(s => s !== skill)
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2"><Wrench className="w-5 h-5 text-indigo-400" /> Technical Skills</h3>
          <button 
            onClick={handleSuggest} 
            disabled={isImproving}
            className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-500/30 flex items-center gap-2 disabled:opacity-50"
          >
            {isImproving ? <div className="w-4 h-4 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isImproving ? 'Analyzing...' : 'Suggestions'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {categories.map(cat => (
            <div key={cat.id} className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl">
              <div className="flex items-center justify-between mb-3 text-indigo-300 text-xs font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  {cat.icon}
                  {cat.label}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setData({ ...data, skills: { ...data.skills, [cat.id]: [] } })}
                    className="p-1 hover:bg-rose-500/10 text-rose-400/50 hover:text-rose-400 rounded transition-colors"
                    title={`Clear all ${cat.label} skills`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleSuggestForCategory(cat.id)}
                    disabled={loadingCategory === cat.id}
                    className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-30"
                    title="Suggest Skills"
                  >
                    <Sparkles className={`w-3 h-3 ${loadingCategory === cat.id ? 'animate-pulse text-indigo-400' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <Input 
                  placeholder={`Add ${cat.label} skill...`}
                  value={inputValues[cat.id] || ''}
                  onChange={(e: any) => setInputValues(prev => ({ ...prev, [cat.id]: e.target.value }))}
                  onKeyDown={(e: any) => {
                    if (e.key === 'Enter') {
                      addSkillToCategory(cat.id, inputValues[cat.id] || '');
                    }
                  }}
                  onClear={() => setInputValues(prev => ({ ...prev, [cat.id]: '' }))}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(data.skills[cat.id] || []).map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-slate-300 flex items-center gap-1.5">
                    {skill}
                    <button onClick={() => removeSkillFromCategory(cat.id, skill)}><Trash2 className="w-2.5 h-2.5 text-rose-500/50 hover:text-rose-500" /></button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><Github className="w-5 h-5 text-indigo-400" /> Enterprise Projects</h3>
          <button onClick={() => setData({...data, projects: [...data.projects, {id: crypto.randomUUID(), name: '', description: '', technologies: []}]})} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-all"><Plus className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          {data.projects.map((proj) => (
            <div key={proj.id} className="p-5 bg-slate-950/30 border border-white/5 rounded-2xl relative group">
              <button 
                onClick={() => setData({...data, projects: data.projects.filter(p => p.id !== proj.id)})}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <Input label="Project Name" value={proj.name} onChange={(e: any) => setData({ ...data, projects: data.projects.map(p => p.id === proj.id ? {...p, name: toSentenceCase(e.target.value)} : p) })} />
                <Input label="Repository / Live Link" value={proj.link} onChange={(e: any) => setData({ ...data, projects: data.projects.map(p => p.id === proj.id ? {...p, link: e.target.value} : p) })} />
              </div>
              <div className="mb-3">
                 <Input 
                   label="Technologies Used (Comma Separated)" 
                   value={(proj.technologies || []).join(', ')} 
                   onChange={(e: any) => setData({ ...data, projects: data.projects.map(p => p.id === proj.id ? {...p, technologies: e.target.value.split(',').map((s: string) => s.trim())} : p) })} 
                   placeholder="React, Node.js, MongoDB"
                 />
              </div>
              <div className="relative">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 ml-1">Core architectural impact</label>
                  <button 
                    onClick={() => handleSuggestProjDesc(proj)}
                    disabled={suggestingProjId === proj.id}
                    className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                  >
                    {suggestingProjId === proj.id ? <div className="w-3 h-3 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Suggest Impact
                  </button>
                </div>
                <Textarea 
                  placeholder="Core architectural impact and technological outcomes..."
                  value={proj.description}
                  onChange={(e) => setData({ ...data, projects: data.projects.map(p => p.id === proj.id ? {...p, description: toSentenceCase(e.target.value)} : p) })}
                  className="h-20"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TechnicalExtrasForm({ data, setData }: { data: ResumeData, setData: (d: ResumeData) => void }) {
  const [isSuggestingLang, setIsSuggestingLang] = useState(false);
  const [isSuggestingInterests, setIsSuggestingInterests] = useState(false);
  const addHackathon = () => setData({...data, hackathons: [...data.hackathons, {id: crypto.randomUUID(), name: '', year: '', achievement: ''}]});
  const addOpenSource = () => setData({...data, openSource: [...data.openSource, {id: crypto.randomUUID(), name: '', description: '', contributionLink: ''}]});

  const handleSuggestLang = async () => {
    setIsSuggestingLang(true);
    const suggestions = await suggestSpokenLanguages(data.personalInfo.location || 'Global');
    setData({ ...data, languages: [...new Set([...(data.languages || []), ...suggestions])] });
    setIsSuggestingLang(false);
  };

  const handleSuggestInterests = async () => {
    setIsSuggestingInterests(true);
    const suggestions = await suggestInterests(data.personalInfo.title);
    setData({ ...data, interests: [...new Set([...(data.interests || []), ...suggestions])] });
    setIsSuggestingInterests(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-indigo-400" /> Hackathons & Awards
          </h3>
          <button onClick={addHackathon} className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-all"><Plus className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {data.hackathons.map(h => (
            <div key={h.id} className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl relative group shadow-lg">
              <button 
                onClick={() => setData({...data, hackathons: data.hackathons.filter(x => x.id !== h.id)})}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-full transition-all"
              ><Trash2 className="w-3.5 h-3.5"/></button>
              <div className="space-y-3">
                <Input label="Hackathon Name" value={h.name} onChange={(e: any) => setData({...data, hackathons: data.hackathons.map(x => x.id === h.id ? {...x, name: toSentenceCase(e.target.value)} : x)})} />
                <Input label="Outcome / Award" value={h.achievement} onChange={(e: any) => setData({...data, hackathons: data.hackathons.map(x => x.id === h.id ? {...x, achievement: toSentenceCase(e.target.value)} : x)})} placeholder="Winner, Top 10, etc." />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Globe className="w-5 h-5 text-indigo-400" /> Languages & Interests
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 ml-1">Spoken Languages</label>
              <button 
                onClick={handleSuggestLang} 
                disabled={isSuggestingLang}
                className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded flex items-center gap-1 hover:bg-indigo-500/30 disabled:opacity-50 transition-all"
              >
                {isSuggestingLang ? <div className="w-2.5 h-2.5 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                {isSuggestingLang ? 'Suggesting...' : 'Suggest'}
              </button>
            </div>
            <Input 
              placeholder="English (Native), Hindi (Native)..."
              value={(data.languages || []).join(', ')}
              onChange={(e: any) => setData({...data, languages: e.target.value ? e.target.value.split(',').map((s: string) => s.trim()) : []})}
              onClear={() => setData({...data, languages: []})}
            />
          </div>
          <div className="p-4 bg-slate-950/30 border border-white/5 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 ml-1">Interests</label>
              <button 
                onClick={handleSuggestInterests} 
                disabled={isSuggestingInterests}
                className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded flex items-center gap-1 hover:bg-indigo-500/30 disabled:opacity-50 transition-all"
              >
                {isSuggestingInterests ? <div className="w-2.5 h-2.5 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                {isSuggestingInterests ? 'Suggesting...' : 'Suggest'}
              </button>
            </div>
            <Input 
              placeholder="System Design, Cyber Security..."
              value={(data.interests || []).join(', ')}
              onChange={(e: any) => setData({...data, interests: e.target.value ? e.target.value.split(',').map((s: string) => s.trim()) : []})}
              onClear={() => setData({...data, interests: []})}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// UI Helpers
function Input({ label, onClear, ...props }: any) {
  const value = props.value ?? '';
  return (
    <div className="w-full group/input">
      {label && <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1.5 ml-1">{label}</label>}
      <div className="relative">
        <input 
          className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 pr-10 outline-none focus:border-indigo-500 transition-all text-sm placeholder:text-slate-600 shadow-inner"
          {...props}
          value={value}
        />
        {value && (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onClear) {
                onClear();
              } else if (props.onChange) {
                props.onChange({ target: { name: props.name, value: '' } } as any);
              }
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-rose-500 transition-colors p-1.5 bg-slate-900/50 rounded-full hover:bg-slate-900 shadow-sm"
            title="Clear Input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function Textarea({ label, onClear, className = "", ...props }: any) {
  const value = props.value ?? '';
  return (
    <div className="w-full group/textarea">
      {label && <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1.5 ml-1">{label}</label>}
      <div className="relative">
        <textarea 
          className={`w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 pr-10 outline-none focus:border-indigo-500 transition-all text-xs placeholder:text-slate-600 shadow-inner resize-none ${className}`}
          {...props}
          value={value}
        />
        {value && (
          <button 
            type="button"
            onClick={() => {
              if (onClear) {
                onClear();
              } else if (props.onChange) {
                props.onChange({ target: { name: props.name, value: '' } } as any);
              }
            }}
            className="absolute right-3 top-3 text-slate-600 hover:text-rose-500 transition-colors p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// Scaling A4 Page Wrapper Component
function ScalingA4Page({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.parentElement?.clientWidth || 794;
        const scaleFactor = Math.min((parentWidth - 32) / 794, 1);
        setScale(scaleFactor);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full flex justify-center items-start overflow-visible print:!h-auto print:!min-h-0 print:!block"
      style={{ height: `${1123 * scale}px`, minHeight: `${1123 * scale}px` }}
    >
      <div 
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'top center',
          width: '794px',
          height: '1123px',
          minWidth: '794px',
          minHeight: '1123px'
        }}
        className="relative origin-top print:!transform-none print:!w-full print:!h-auto print:!min-w-0 print:!min-h-0"
      >
        {children}
      </div>
    </div>
  );
}

interface Block {
  id: string;
  type: 
    | 'header' 
    | 'summary' 
    | 'skills' 
    | 'section-header' 
    | 'education' 
    | 'experience' 
    | 'project' 
    | 'openSource' 
    | 'leadership'
    | 'profileImage'
    | 'contact'
    | 'languages'
    | 'interests'
    | 'hackathons';
  subtype?: string;
  content: any;
}

// Executive layout sub-renderers
function ExecutiveHeaderBlock({ personalInfo }: { personalInfo: ResumeData['personalInfo'] }) {
  return (
    <header className="bg-[#40918b] px-8 pt-8 pb-6 text-white text-center w-full">
      <h1 className="text-4xl font-bold uppercase mb-1 tracking-tight">{personalInfo.fullName || 'YOUR NAME'}</h1>
      <p className="text-lg font-medium italic mb-4 opacity-90">{personalInfo.title || 'Professional Title'}</p>
      {personalInfo.summary && (
        <div className="max-w-2xl mx-auto">
          <h3 className="text-[10px] font-black uppercase tracking-widest mb-0.5 border-b border-white/40 inline-block pb-0.5">Career Objective</h3>
          <p className="text-[10px] leading-relaxed opacity-80">{personalInfo.summary}</p>
        </div>
      )}
    </header>
  );
}

function renderExecutiveSidebarBlockJSX(block: Block, personalInfo: ResumeData['personalInfo'], hackathons: any[]) {
  switch (block.type) {
    case 'profileImage':
      return (
        <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-xl bg-slate-400">
          <img src={block.content} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        </div>
      );
    case 'contact':
      return (
        <section className="w-full text-left">
          <h3 className="text-[11px] font-black uppercase text-slate-600 mb-4 tracking-wider border-b border-slate-300 pb-1">Contact Me</h3>
          <ul className="space-y-4 text-[10px]">
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#40918b] flex items-center justify-center text-white text-[9px] font-bold">T</div>
              <a href={`tel:${personalInfo.phone}`} className="hover:text-[#40918b] transition-colors">{personalInfo.phone || '9334326180'}</a>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#40918b] flex items-center justify-center text-white text-[9px] font-bold">@</div>
              <a href={`mailto:${personalInfo.email}`} className="break-all hover:text-[#40918b] transition-colors">{personalInfo.email || 'user@example.com'}</a>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#40918b] flex items-center justify-center text-white text-[9px] font-bold">L</div>
              <span>{personalInfo.location || 'Patna, Bihar'}</span>
            </li>
            {personalInfo.linkedin && (
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#40918b] flex items-center justify-center text-white text-[9px] font-bold">In</div>
                <a 
                  href={personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="break-all hover:text-[#40918b] transition-colors"
                >
                  {personalInfo.linkedin.replace('https://', '').replace('www.', '').replace('linkedin.com/in/', '')}
                </a>
              </li>
            )}
            {personalInfo.github && (
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#40918b] flex items-center justify-center text-white text-[9px] font-bold">Gh</div>
                <a 
                  href={personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="break-all hover:text-[#40918b] transition-colors"
                >
                  {personalInfo.github.replace('https://', '').replace('www.', '').replace('github.com/', '')}
                </a>
              </li>
            )}
          </ul>
        </section>
      );
    case 'languages':
      return (
        <section className="w-full text-left">
          <h3 className="text-[11px] font-black uppercase text-slate-600 mb-4 tracking-wider border-b border-slate-300 pb-1">Spoken Languages</h3>
          <ul className="space-y-2 text-[10px] text-slate-700">
            {block.content.map((lang: string, i: number) => (
              <li key={i} className="flex items-center gap-2 leading-tight">
                <div className="min-w-[4px] h-[4px] bg-[#40918b]" /> {lang}
              </li>
            ))}
          </ul>
        </section>
      );
    case 'interests':
      return (
        <section className="w-full text-left">
          <h3 className="text-[11px] font-black uppercase text-slate-600 mb-4 tracking-wider border-b border-slate-300 pb-1">Interests</h3>
          <ul className="space-y-2 text-[10px] text-slate-700">
            {block.content.map((interest: string, i: number) => (
              <li key={i} className="flex items-center gap-2 leading-tight">
                <div className="min-w-[4px] h-[4px] bg-[#40918b]" /> {interest}
              </li>
            ))}
          </ul>
        </section>
      );
    case 'hackathons':
      return (
        <section className="w-full text-left">
          <h3 className="text-[11px] font-black uppercase text-slate-600 mb-4 tracking-wider border-b border-slate-300 pb-1">Awards & Hackathons</h3>
          <div className="space-y-3">
            {block.content.map((h: any) => (
              <div key={h.id}>
                <h4 className="text-[10px] font-bold text-slate-800 leading-tight">{h.name}</h4>
                <p className="text-[9px] font-medium text-[#40918b] mt-0.5">{h.achievement}</p>
              </div>
            ))}
          </div>
        </section>
      );
    default:
      return null;
  }
}

function renderExecutiveMainBlockJSX(block: Block, personalInfo: ResumeData['personalInfo'], skills: SkillSet) {
  switch (block.type) {
    case 'header':
      return <ExecutiveHeaderBlock personalInfo={personalInfo} />;
    case 'section-header':
      return (
        <div className="w-full text-left">
          <h2 className="text-[13px] font-black uppercase text-[#40918b] flex items-center gap-3 mb-2 tracking-wide">
            <span className="w-3 h-3 bg-[#40918b]" /> {block.content}
          </h2>
          <div className="h-[1px] bg-slate-200 mb-2" />
        </div>
      );
    case 'education': {
      const edu = block.content;
      return (
        <div className="w-full text-left">
          <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-tight leading-tight">{edu.school}</h3>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[11px] font-medium text-slate-500 italic">
              {edu.degree} {edu.field && `(${edu.field})`}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">{edu.startYear} – {edu.endYear}</span>
          </div>
          {edu.currentSemester && <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{edu.currentSemester}</p>}
          {(edu.cgpa || edu.twelfthResult || edu.tenthResult) && (
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {edu.cgpa && (
                <div className="p-1.5 bg-slate-50 rounded border border-slate-100/50">
                  <span className="block text-[7px] font-black uppercase text-slate-400 tracking-wider">Current CGPA</span>
                  <span className="text-[10px] font-bold text-[#40918b]">{edu.cgpa}</span>
                </div>
              )}
              {edu.twelfthResult && (
                <div className="p-1.5 bg-slate-50 rounded border border-slate-100/50">
                  <span className="block text-[7px] font-black uppercase text-slate-400 tracking-wider">12th Standard</span>
                  <span className="text-[10px] font-bold text-slate-700">{edu.twelfthResult}</span>
                </div>
              )}
              {edu.tenthResult && (
                <div className="p-1.5 bg-slate-50 rounded border border-slate-100/50">
                  <span className="block text-[7px] font-black uppercase text-slate-400 tracking-wider">10th Standard</span>
                  <span className="text-[10px] font-bold text-slate-700">{edu.tenthResult}</span>
                </div>
              )}
            </div>
          )}
          {edu.studyPoints && (
            <ul className="mt-1.5 space-y-0.5">
              {edu.studyPoints.split('\n').filter((p: string) => p.trim()).map((point: string, i: number) => (
                <li key={i} className="text-[9.5px] text-slate-500 flex gap-2">
                  <span className="text-[#40918b]">•</span> {point.replace('•', '').trim()}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    case 'skills':
      return (
        <div className="w-full text-left">
          <h2 className="text-[12px] font-black uppercase text-[#40918b] mb-1 tracking-wide">
            TECHNICAL SKILLS
          </h2>
          <div className="h-[1px] bg-slate-300 mb-2" />
          <div className="space-y-1">
            {(Object.entries(skills) as [keyof SkillSet, string[]][]).map(([key, list]) => (
              list.length > 0 && (
                <div key={key} className="text-[10.5px] leading-snug">
                  <span className="font-black uppercase text-slate-900 mr-2">{key}:</span>
                  <span className="text-slate-600 font-semibold">{list.join(', ')}</span>
                </div>
              )
            ))}
          </div>
        </div>
      );
    case 'experience': {
      const exp = block.content;
      return (
        <div className="w-full text-left">
          <h3 className="text-[12px] font-bold text-slate-900 uppercase leading-tight">
            {exp.company} <span className="text-[#40918b] font-medium italic text-[11px] normal-case"> – {exp.position}</span>
          </h3>
          {exp.description && (
            <ul className="mt-1.5 space-y-0.5">
              {exp.description.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
                <li key={i} className="text-[10px] text-slate-600 flex gap-2 leading-relaxed">
                  <span className="text-[#40918b]">•</span> {line}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }
    case 'project': {
      const proj = block.content;
      return (
        <div className="w-full text-left">
          <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-tight">{proj.name}</h3>
          <p className="text-[10px] text-slate-500 leading-relaxed italic mt-0.5">{proj.description}</p>
        </div>
      );
    }
    case 'openSource': {
      const os = block.content;
      return (
        <div className="w-full text-left">
          <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-tight">{os.name}</h3>
          <p className="text-[10px] text-slate-500 leading-relaxed italic mt-0.5">{os.description}</p>
          <p className="text-[9px] text-[#40918b] font-bold mt-0.5 uppercase tracking-wider">{os.contributionLink}</p>
        </div>
      );
    }
    case 'leadership': {
      const l = block.content;
      return (
        <div className="w-full text-left">
          <h3 className="text-[12px] font-bold text-slate-900 uppercase">{l.title}</h3>
          <p className="text-[10px] text-slate-600 mt-1">{l.description}</p>
        </div>
      );
    }
    default:
      return null;
  }
}

// Non-executive layout sub-renderers
function NonExecutiveHeader({ personalInfo, theme, styles }: { personalInfo: ResumeData['personalInfo'], theme: string, styles: any }) {
  return (
    <header className={`${styles.header} w-full`}>
      {theme === 'futuristic' && <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />}
      <div className="relative z-10 flex flex-col items-center">
        {personalInfo.profileImage && (
          <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${theme === 'futuristic' ? 'border-indigo-500/50' : 'border-white'} shadow-xl mb-6`}>
            <img src={personalInfo.profileImage} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          </div>
        )}
        <h1 className={`text-4xl font-black tracking-tighter uppercase mb-2 ${theme === 'minimal' ? 'text-slate-900' : ''}`}>
          {personalInfo.fullName || 'YOUR NAME'}
        </h1>
        <p className={`font-bold uppercase tracking-[0.4em] text-[11px] mb-6 ${theme === 'futuristic' ? 'text-indigo-400' : theme === 'modern' ? 'text-emerald-600' : 'text-slate-500'}`}>
          {personalInfo.title || 'Professional Title'}
        </p>
        
        <div className={`flex flex-wrap gap-x-8 gap-y-2 text-[10px] items-center justify-center ${theme === 'minimal' || theme === 'modern' ? 'text-slate-400' : 'text-white/60'}`}>
          <a href={`mailto:${personalInfo.email}`} className="flex items-center gap-2 hover:text-indigo-500 transition-colors">
            <Mail className="w-3.5 h-3.5 text-indigo-500" /> {personalInfo.email || 'hello@example.com'}
          </a>
          <a href={`tel:${personalInfo.phone}`} className="flex items-center gap-2 hover:text-indigo-500 transition-colors">
            <Phone className="w-3.5 h-3.5 text-indigo-500" /> {personalInfo.phone || '+123-456-7890'}
          </a>
          <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-indigo-500" /> {personalInfo.location || 'Anywhere City'}</span>
          {personalInfo.linkedin && (
            <a 
              href={personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 hover:text-indigo-500 transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" /> 
              {personalInfo.linkedin.replace('https://', '').replace('www.', '').replace('linkedin.com/in/', '')}
            </a>
          )}
          {personalInfo.github && (
            <a 
              href={personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 hover:text-indigo-500 transition-colors"
            >
              <Github className="w-3.5 h-3.5" /> 
              {personalInfo.github.replace('https://', '').replace('www.', '').replace('github.com/', '')}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

function renderNonExecutiveSidebarBlockJSX(block: Block, styles: any) {
  switch (block.type) {
    case 'skills': {
      const list = block.content;
      return (
        <section className="w-full text-left">
          <h2 className={`${styles.sectionTitle} !text-left !border-b-2 !mb-3`}>Skills</h2>
          <div className="space-y-3">
            {(Object.entries(list) as [keyof SkillSet, string[]][]).map(([key, listItems]) => (
              listItems.length > 0 && (
                <div key={key}>
                  <h4 className={`text-[8.5px] font-black uppercase mb-1 tracking-wider ${styles.accent}`}>{key}</h4>
                  <ul className="space-y-0.5">
                    {listItems.map((skill, i) => (
                      <li key={i} className="text-[9.5px] text-slate-600 flex items-center gap-2 font-medium">
                        <div className={`w-1 h-1 rounded-full ${styles.accent} opacity-60`} /> {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </section>
      );
    }
    case 'languages': {
      const list = block.content;
      return (
        <section className="w-full text-left">
          <h2 className={`${styles.sectionTitle} !text-left !border-b-2 !mb-3`}>Languages</h2>
          <ul className="space-y-1.5">
            {list.map((lang: string, i: number) => (
              <li key={i} className="text-[9.5px] text-slate-600 flex items-center gap-2 font-medium">
                <div className={`w-1 h-1 rounded-full ${styles.accent} opacity-60`} /> {lang}
              </li>
            ))}
          </ul>
        </section>
      );
    }
    case 'interests': {
      const list = block.content;
      return (
        <section className="w-full text-left">
          <h2 className={`${styles.sectionTitle} !text-left !border-b-2 !mb-3`}>Interests</h2>
          <ul className="space-y-1.5">
            {list.map((interest: string, i: number) => (
              <li key={i} className="text-[9.5px] text-slate-600 flex items-center gap-2 font-medium">
                <div className={`w-1 h-1 rounded-full ${styles.accent} opacity-60`} /> {interest}
              </li>
            ))}
          </ul>
        </section>
      );
    }
    case 'hackathons': {
      const list = block.content;
      return (
        <section className="w-full text-left">
          <h2 className={`${styles.sectionTitle} !text-left !border-b-2 !mb-3`}>Awards</h2>
          <div className="space-y-2.5">
            {list.map((h: any) => (
              <div key={h.id}>
                <h4 className="text-[9.5px] font-bold text-slate-800 leading-tight">{h.name}</h4>
                <p className={`text-[8.5px] font-medium ${styles.accent} mt-0.5`}>{h.achievement}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }
    default:
      return null;
  }
}

function renderNonExecutiveMainBlockJSX(block: Block, styles: any) {
  switch (block.type) {
    case 'summary':
      return (
        <section className="w-full text-left">
          <h2 className={`${styles.sectionTitle} !text-left !mb-3`}>Career Objective</h2>
          <p className="text-[10.5px] leading-relaxed text-slate-500 font-medium italic">{block.content}</p>
        </section>
      );
    case 'section-header':
      return (
        <h2 className={`${styles.sectionTitle} !text-left !mb-4`}>{block.content}</h2>
      );
    case 'experience': {
      const exp = block.content;
      return (
        <div className="w-full text-left">
          <div className="flex justify-between items-baseline mb-0.5">
            <h3 className={`text-[11.5px] uppercase tracking-tight ${styles.itemTitle}`}>{exp.position}</h3>
            <span className="text-[8.5px] font-bold text-slate-400 whitespace-nowrap">{exp.startDate} — {exp.endDate}</span>
          </div>
          <p className={`text-[9.5px] font-bold uppercase ${styles.accent} mb-1.5`}>{exp.company} • {exp.location}</p>
          <ul className="space-y-0.5">
            {exp.description.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
              <li key={i} className="text-[9.5px] text-slate-500 flex gap-2 leading-relaxed">
                 <span className={styles.accent}>•</span> {line.replace('•', '').trim()}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case 'education': {
      const edu = block.content;
      return (
        <div className="w-full text-left">
          <div className="flex justify-between items-start mb-0.5">
            <div>
              <h3 className={`text-[11px] font-black uppercase ${styles.itemTitle}`}>{edu.degree} {edu.field && `in ${edu.field}`}</h3>
              <p className={`text-[10px] font-bold ${styles.accent}`}>{edu.school}</p>
            </div>
            <div className="text-right text-[8.5px] text-slate-400 font-bold">
              {edu.startYear} — {edu.endYear}
            </div>
          </div>

          <div className="mt-1 space-y-0.5">
            {edu.currentSemester && (
              <div className="flex items-center gap-2 text-[9.5px] text-slate-600">
                 <span className={styles.accent}>‣</span>
                 <span className="font-bold italic">Currently in {edu.currentSemester}</span>
              </div>
            )}
            {edu.studyPoints && edu.studyPoints.split('\n').filter((p: string) => p.trim()).map((point: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-[9px] text-slate-500 leading-snug">
                <span className={styles.accent}>‣</span>
                <span>{point.replace('•', '').replace('‣', '').trim()}</span>
              </div>
            ))}
          </div>

          {(edu.twelfthResult || edu.tenthResult) && (
            <div className="mt-1.5 flex gap-4">
              {edu.twelfthResult && (
                <div className="text-[9px]">
                   <span className="font-black text-slate-400 uppercase text-[7.5px]">12th:</span> <span className="font-bold text-slate-700">{edu.twelfthResult}</span>
                </div>
              )}
              {edu.tenthResult && (
                <div className="text-[9px]">
                   <span className="font-black text-slate-400 uppercase text-[7.5px]">10th:</span> <span className="font-bold text-slate-700">{edu.tenthResult}</span>
                </div>
              )}
            </div>
          )}
          
          {edu.cgpa && (
            <div className="mt-0.5 text-[9.5px] flex items-center gap-2">
               <span className="font-black text-slate-400 uppercase text-[7.5px]">CGPA:</span>
               <span className={`font-bold ${styles.accent}`}>{edu.cgpa}</span>
            </div>
          )}
        </div>
      );
    }
    case 'project': {
      const proj = block.content;
      return (
        <div className="w-full p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-left">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className={`text-[10.5px] uppercase font-black ${styles.itemTitle}`}>{proj.name}</h3>
            {proj.link && <Globe className="w-2.5 h-2.5 text-slate-400" />}
          </div>
          {proj.technologies && (
            <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{proj.technologies.join(' • ')}</p>
          )}
          <p className="text-[9.5px] text-slate-500 leading-relaxed italic">{proj.description}</p>
        </div>
      );
    }
    case 'openSource': {
      const os = block.content;
      return (
        <div className="w-full p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-left">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className={`text-[10.5px] uppercase font-black ${styles.itemTitle}`}>{os.name}</h3>
            <Globe className="w-2.5 h-2.5 text-slate-400" />
          </div>
          <p className="text-[9.5px] text-slate-500 leading-relaxed italic mb-1.5">{os.description}</p>
          <p className={`text-[7.5px] font-black ${styles.accent} uppercase tracking-wider`}>{os.contributionLink}</p>
        </div>
      );
    }
    case 'leadership': {
      const l = block.content;
      return (
        <div className="w-full text-left">
          <h3 className={`text-[10.5px] font-black uppercase ${styles.itemTitle}`}>{l.title}</h3>
          <p className="text-[9.5px] text-slate-500 leading-relaxed mt-0.5">{l.description}</p>
        </div>
      );
    }
    default:
      return null;
  }
}

// Global theme styles loader
function getThemeStyles(theme: string) {
  switch (theme) {
    case 'futuristic':
      return {
        wrapper: "bg-slate-900 text-slate-300",
        header: "bg-slate-950 text-white p-6 mb-4 relative overflow-hidden border-b border-indigo-500/30 text-center",
        accent: "text-indigo-400",
        itemTitle: "text-white font-bold",
        border: "border-indigo-50/10",
        sectionTitle: "text-[11px] font-black uppercase tracking-[0.3em] mb-4 text-indigo-500 flex items-center gap-4 before:content-[''] before:h-[1px] before:bg-indigo-500/20 before:flex-1 after:content-[''] after:h-[1px] after:bg-indigo-500/20 after:flex-1",
      };
    case 'minimal':
      return {
        wrapper: "bg-white text-slate-800",
        header: "text-center py-6 mb-4 border-b-2 border-slate-100",
        accent: "text-slate-900",
        itemTitle: "text-slate-900 font-bold",
        border: "border-slate-100",
        sectionTitle: "text-[11px] font-bold uppercase tracking-[0.2em] mb-4 text-slate-400 text-center flex items-center gap-4 before:content-[''] before:h-[1px] before:bg-slate-100 before:flex-1 after:content-[''] after:h-[1px] after:bg-slate-100 after:flex-1",
      };
    case 'corporate':
      return {
        wrapper: "bg-white text-slate-700",
        header: "bg-slate-50 p-6 mb-4 border-b-4 border-indigo-900 text-center",
        accent: "text-indigo-800",
        itemTitle: "text-slate-900 font-bold",
        border: "border-indigo-50",
        sectionTitle: "text-xs font-bold uppercase mb-4 text-indigo-900 border-b-2 border-indigo-900 pb-2 w-full text-center",
      };
    default: // modern
      return {
        wrapper: "bg-white text-slate-700",
        header: "bg-white pt-6 pb-4 mb-4 border-b-[6px] border-emerald-500 text-center",
        accent: "text-emerald-600",
        itemTitle: "text-slate-900 font-bold",
        border: "border-slate-100",
        sectionTitle: "text-[11px] font-black uppercase tracking-[0.2em] mb-4 text-slate-500 border-b border-slate-100 pb-2 w-full text-center",
      };
  }
}

// Resume Preview Component
function ResumePreview({ data }: { data: ResumeData }) {
  const { personalInfo, experience, education, projects, skills, theme, hackathons } = data;
  const styles = getThemeStyles(theme);
  
  const [paginatedData, setPaginatedData] = useState<{ mainPages: Block[][], sidebarPages: Block[][], headerHeight: number } | null>(null);
  const measuringRef = useRef<HTMLDivElement>(null);

  // Flat sidebar block definitions
  const sidebarBlocks: Block[] = [];
  if (theme === 'executive') {
    if (personalInfo.profileImage) {
      sidebarBlocks.push({ id: 'profileImage', type: 'profileImage', content: personalInfo.profileImage });
    }
    sidebarBlocks.push({ id: 'contact', type: 'contact', content: null });
    if (data.languages && data.languages.length > 0) {
      sidebarBlocks.push({ id: 'languages', type: 'languages', content: data.languages });
    }
    if (data.interests && data.interests.length > 0) {
      sidebarBlocks.push({ id: 'interests', type: 'interests', content: data.interests });
    }
    if (hackathons && hackathons.length > 0) {
      sidebarBlocks.push({ id: 'hackathons', type: 'hackathons', content: hackathons });
    }
  } else {
    if (Object.values(skills).some(s => s.length > 0)) {
      sidebarBlocks.push({ id: 'skills', type: 'skills', content: skills });
    }
    if (data.languages && data.languages.length > 0) {
      sidebarBlocks.push({ id: 'languages', type: 'languages', content: data.languages });
    }
    if (data.interests && data.interests.length > 0) {
      sidebarBlocks.push({ id: 'interests', type: 'interests', content: data.interests });
    }
    if (hackathons && hackathons.length > 0) {
      sidebarBlocks.push({ id: 'hackathons', type: 'hackathons', content: hackathons });
    }
  }

  // Flat main column block definitions
  const mainBlocks: Block[] = [];
  if (theme === 'executive') {
    mainBlocks.push({ id: 'header', type: 'header', content: null });
  }
  if (personalInfo.summary) {
    mainBlocks.push({ id: 'summary', type: 'summary', content: personalInfo.summary });
  }
  if (theme === 'executive' && Object.entries(skills).some(([_, s]) => s.length > 0)) {
    mainBlocks.push({ id: 'skills', type: 'skills', content: skills });
  }
  if (education && education.length > 0) {
    mainBlocks.push({ id: 'education-header', type: 'section-header', subtype: 'education', content: 'EDUCATION' });
    education.forEach(edu => {
      mainBlocks.push({ id: `education-${edu.id}`, type: 'education', content: edu });
    });
  }
  if (experience && experience.length > 0) {
    mainBlocks.push({ id: 'experience-header', type: 'section-header', subtype: 'experience', content: 'WORK EXPERIENCE' });
    experience.forEach(exp => {
      mainBlocks.push({ id: `experience-${exp.id}`, type: 'experience', content: exp });
    });
  }
  if (projects && projects.length > 0) {
    mainBlocks.push({ id: 'projects-header', type: 'section-header', subtype: 'projects', content: 'PROJECTS' });
    projects.forEach(proj => {
      mainBlocks.push({ id: `project-${proj.id}`, type: 'project', content: proj });
    });
  }
  if (data.openSource && data.openSource.length > 0) {
    mainBlocks.push({ id: 'openSource-header', type: 'section-header', subtype: 'openSource', content: 'OPEN SOURCE' });
    data.openSource.forEach(os => {
      mainBlocks.push({ id: `openSource-${os.id}`, type: 'openSource', content: os });
    });
  }
  if (data.leadership && data.leadership.length > 0) {
    mainBlocks.push({ id: 'leadership-header', type: 'section-header', subtype: 'leadership', content: 'LEADERSHIP & EXPERIENCE' });
    data.leadership.forEach(l => {
      mainBlocks.push({ id: `leadership-${l.id}`, type: 'leadership', content: l });
    });
  }

  useLayoutEffect(() => {
    if (!measuringRef.current) return;
    
    const root = measuringRef.current;
    
    // 1. Measure header height
    let headerHeight = 0;
    if (theme !== 'executive') {
      const headerEl = root.querySelector('[data-measuring-id="header"]');
      if (headerEl) {
        headerHeight = headerEl.getBoundingClientRect().height;
      }
    }
    
    // 2. Measure main blocks heights
    const mainBlockHeights: Record<string, number> = {};
    const mainEls = root.querySelectorAll('[data-measuring-type="main-block"]');
    mainEls.forEach(el => {
      const id = el.getAttribute('data-block-id') || '';
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const marginTop = parseFloat(style.marginTop) || 0;
      const marginBottom = parseFloat(style.marginBottom) || 0;
      mainBlockHeights[id] = rect.height + marginTop + marginBottom;
    });
    
    // 3. Measure sidebar blocks heights
    const sidebarBlockHeights: Record<string, number> = {};
    const sidebarEls = root.querySelectorAll('[data-measuring-type="sidebar-block"]');
    sidebarEls.forEach(el => {
      const id = el.getAttribute('data-block-id') || '';
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const marginTop = parseFloat(style.marginTop) || 0;
      const marginBottom = parseFloat(style.marginBottom) || 0;
      sidebarBlockHeights[id] = rect.height + marginTop + marginBottom;
    });
    
    // 4. Partition main blocks into pages
    const mainPages: Block[][] = [[]];
    let currentPageIndex = 0;
    let currentHeight = 0;
    
    mainBlocks.forEach(block => {
      const height = mainBlockHeights[block.id] || 0;
      let pageLimit = 1123 - 48; // Total height minus top/bottom content padding
      
      if (theme !== 'executive') {
        if (currentPageIndex === 0) {
          pageLimit = 1123 - headerHeight - 64; // Account for full-width header
        } else {
          pageLimit = 1123 - 64;
        }
      }
      
      if (currentHeight + height > pageLimit && mainPages[currentPageIndex].length > 0) {
        currentPageIndex++;
        mainPages.push([]);
        currentHeight = 0;
      }
      
      mainPages[currentPageIndex].push(block);
      currentHeight += height;
    });
    
    // 5. Partition sidebar blocks into pages
    const sidebarPages: Block[][] = [[]];
    let currentSidebarPageIndex = 0;
    let currentSidebarHeight = 0;
    
    sidebarBlocks.forEach(block => {
      const height = sidebarBlockHeights[block.id] || 0;
      let pageLimit = 1123 - 64;
      
      if (theme !== 'executive') {
        if (currentSidebarPageIndex === 0) {
          pageLimit = 1123 - headerHeight - 64;
        } else {
          pageLimit = 1123 - 64;
        }
      }
      
      if (currentSidebarHeight + height > pageLimit && sidebarPages[currentSidebarPageIndex].length > 0) {
        currentSidebarPageIndex++;
        sidebarPages.push([]);
        currentSidebarHeight = 0;
      }
      
      sidebarPages[currentSidebarPageIndex].push(block);
      currentSidebarHeight += height;
    });
    
    setPaginatedData({ mainPages, sidebarPages, headerHeight });
  }, [data, theme]);

  return (
    <>
      {/* Hidden layout elements for off-screen page block measurement */}
      <div 
        ref={measuringRef}
        id="resume-measuring-root" 
        className="absolute overflow-visible bg-white text-slate-800" 
        style={{ top: '-9999px', left: '-9999px', width: '794px', visibility: 'hidden', pointerEvents: 'none' }}
      >
        {theme !== 'executive' && (
          <div data-measuring-id="header" data-measuring-type="header">
            <NonExecutiveHeader personalInfo={personalInfo} theme={theme} styles={styles} />
          </div>
        )}
        <div className="flex flex-row w-full h-auto">
          <div 
            style={{ 
              width: theme === 'executive' ? '35%' : '180px',
              padding: theme === 'executive' ? '2rem' : '1.5rem',
              backgroundColor: theme === 'executive' ? '#e2e4e7' : undefined
            }}
            className="flex flex-col gap-6"
          >
            {sidebarBlocks.map(block => (
              <div key={block.id} data-measuring-type="sidebar-block" data-block-id={block.id}>
                {theme === 'executive'
                  ? renderExecutiveSidebarBlockJSX(block, personalInfo, hackathons)
                  : renderNonExecutiveSidebarBlockJSX(block, styles)}
              </div>
            ))}
          </div>
          <div 
            style={{ 
              padding: '2rem'
            }}
            className="flex-1 flex flex-col gap-5"
          >
            {mainBlocks.map(block => (
              <div key={block.id} data-measuring-type="main-block" data-block-id={block.id}>
                {theme === 'executive'
                  ? renderExecutiveMainBlockJSX(block, personalInfo, skills)
                  : renderNonExecutiveMainBlockJSX(block, styles)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Rendered Pages */}
      {paginatedData ? (
        <div className="flex flex-col gap-6 items-center w-full py-4">
          {Array.from({ length: Math.max(paginatedData.mainPages.length, paginatedData.sidebarPages.length) }).map((_, index) => {
            const pageBlocks = paginatedData.mainPages[index] || [];
            const sidebarBlocksForPage = paginatedData.sidebarPages[index] || [];
            
            return (
              <ScalingA4Page key={index}>
                <div 
                  className="resume-a4-page bg-white shadow-2xl relative select-none"
                  style={{
                    width: '794px',
                    height: '1123px',
                    minWidth: '794px',
                    minHeight: '1123px',
                    maxWidth: '794px',
                    maxHeight: '1123px',
                    boxSizing: 'border-box'
                  }}
                >
                  {theme === 'executive' ? (
                    <div className="h-full flex flex-row w-full overflow-hidden">
                      <aside className="w-[35%] bg-[#e2e4e7] p-8 flex flex-col gap-8 h-full">
                        {sidebarBlocksForPage.map(block => (
                          <div key={block.id}>
                            {renderExecutiveSidebarBlockJSX(block, personalInfo, hackathons)}
                          </div>
                        ))}
                      </aside>
                      <main className="flex-1 flex flex-col h-full bg-white justify-start">
                        <div className="px-8 py-6 flex-1 flex flex-col gap-5 text-slate-800 overflow-hidden justify-start">
                          {pageBlocks.map(block => (
                            <div key={block.id}>
                              {renderExecutiveMainBlockJSX(block, personalInfo, skills)}
                            </div>
                          ))}
                        </div>
                      </main>
                    </div>
                  ) : (
                    <div className={`h-full flex flex-col w-full overflow-hidden ${styles.wrapper}`}>
                      {index === 0 && (
                        <NonExecutiveHeader personalInfo={personalInfo} theme={theme} styles={styles} />
                      )}
                      <div className="px-10 pb-8 flex-1 flex flex-row gap-8 overflow-hidden pt-6">
                        <div className="w-[180px] flex flex-col gap-6 h-full">
                          {sidebarBlocksForPage.map(block => (
                            <div key={block.id}>
                              {renderNonExecutiveSidebarBlockJSX(block, styles)}
                            </div>
                          ))}
                        </div>
                        <div className="flex-1 flex flex-col gap-6 h-full justify-start">
                          {pageBlocks.map(block => (
                            <div key={block.id}>
                              {renderNonExecutiveMainBlockJSX(block, styles)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScalingA4Page>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-8 text-slate-400">Loading Resume Preview...</div>
      )}
    </>
  );
}
