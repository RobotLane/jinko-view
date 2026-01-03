import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ShieldCheck, Activity, Upload, CheckCircle, Video, Lock, FileBadge, Database, Play } from 'lucide-react'
import './index.css'

// CONFIGURATION
const API_URL = "http://localhost:8000/api"

function App() {
  const [activeTab, setActiveTab] = useState('vault') // Start at the Vault (Home)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  
  // STATE MACHINE
  const [auditText, setAuditText] = useState('')
  const [genData, setGenData] = useState({address: '', specs: '', features: '', tone: 'Luxury'})
  const [avatarKey, setAvatarKey] = useState(null)
  const [jobId, setJobId] = useState(null)
  const [isCertified, setIsCertified] = useState(false)
  const [vaultFiles, setVaultFiles] = useState([]) 

  // --- ACTIONS ---
  const loadVault = async () => {
    try {
        const res = await axios.get(`${API_URL}/vault`)
        setVaultFiles(res.data)
    } catch (err) { console.error("Vault Error", err) }
  }

  // Load vault whenever we enter the vault tab
  useEffect(() => {
    if (activeTab === 'vault') { loadVault() }
  }, [activeTab])

  const runAudit = async () => {
    setLoading(true); setResult(null); setIsCertified(false) 
    try {
      const res = await axios.post(`${API_URL}/audit`, {
        text: auditText, state: "AZ", brokerage: "Jinko Realty", 
        rules: "Standard FHA", is_owner: false
      })
      setResult(res.data)
      if (res.data.status === 'PASS') { setIsCertified(true) }
    } catch (err) { alert("Brain Connection Error"); console.error(err) }
    setLoading(false)
  }

  const runGenerate = async () => {
    setLoading(true); setResult(null); setIsCertified(false)
    try {
      const res = await axios.post(`${API_URL}/generate`, genData)
      setAuditText(res.data.draft) 
      setActiveTab('audit') 
    } catch (err) { alert("Brain Connection Error"); console.error(err) }
    setLoading(false)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/upload-url`, {
        filename: file.name,
        file_type: file.type
      });
      const { upload_url, file_key } = res.data;
      await axios.put(upload_url, file, { headers: { 'Content-Type': file.type } });
      setAvatarKey(file_key);
      alert("Identity Uploaded. It will appear in the Asset Vault shortly.");
    } catch (err) { console.error(err); alert("Vault Upload Failed."); }
    setLoading(false);
  };

  const runRender = async () => {
    if (!isCertified) { alert("SECURITY PROTOCOL: Script must be Jinko Certified first."); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/render`, {
        prompt: auditText,
        image_key: avatarKey
      })
      if (res.data.status === "SUCCESS") {
        setJobId(res.data.job_id);
        alert("Render Initialized. Check Asset Vault in ~5 minutes.");
      } else {
        alert("Render Error: " + res.data.msg);
      }
    } catch (err) { console.error(err); alert("Render Failed."); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans overflow-hidden relative">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto p-8 relative z-10 flex gap-8">
        
        {/* SIDEBAR */}
        <div className="w-72 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-[85vh] flex flex-col">
          <div className="mb-8">
             <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
               JINKO VAULT
             </h1>
             <p className="text-xs text-gray-500 tracking-widest mt-1">COMPLIANCE OS v21.0</p>
          </div>
          
          <nav className="flex flex-col gap-4">
            <NavButton active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} icon={<Database size={20} />} label="Asset Vault" />
            <div className="h-px bg-white/10 my-2" />
            <NavButton active={activeTab === 'origin'} onClick={() => setActiveTab('origin')} icon={<Sparkles size={20} />} label="1. Script Origin" />
            <NavButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={<ShieldCheck size={20} />} label="2. Compliance Core" />
            
            <div className="relative">
                <NavButton active={activeTab === 'studio'} onClick={() => setActiveTab('studio')} icon={<Activity size={20} />} label="3. Avatar Studio" />
                {!isCertified && <Lock size={14} className="absolute right-4 top-4 text-gray-600" />}
            </div>
          </nav>

          <div className="mt-auto border-t border-white/10 pt-6">
             <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full ${isCertified ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                 <span className="text-xs font-mono text-gray-400">
                     SESSION: {isCertified ? 'CERTIFIED' : 'UNVERIFIED'}
                 </span>
             </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-10 h-[85vh] overflow-y-auto relative">
          <AnimatePresence mode='wait'>
            {loading && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center flex-col backdrop-blur-md rounded-2xl">
                <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"/>
                <p className="text-cyan-400 tracking-widest font-mono animate-pulse">PROCESSING REQUEST...</p>
              </motion.div>
            )}

            {/* --- TAB 0: THE ASSET VAULT (ALWAYS OPEN) --- */}
            {activeTab === 'vault' && (
              <motion.div key="vault" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="space-y-8">
                 <div className="flex justify-between items-end">
                    <Header title="Secure Storage" subtitle="Access your retained identities and video assets." />
                    <button onClick={loadVault} className="text-xs text-cyan-400 hover:text-white mb-2">REFRESH LINK</button>
                 </div>

                 <div className="grid grid-cols-4 gap-4">
                    {vaultFiles.map((file) => (
                        <div key={file.key} className="bg-black/40 rounded-xl overflow-hidden border border-white/5 hover:border-cyan-500/50 transition-all group relative">
                            <div className="aspect-square flex items-center justify-center overflow-hidden bg-white/5">
                                {file.type === 'IDENTITY' ? (
                                    <img src={file.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <div className="text-center">
                                        <Video size={48} className="text-gray-600 group-hover:text-cyan-400 mx-auto mb-2" />
                                        <Play size={24} className="text-white mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${file.type === 'IDENTITY' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{file.type}</span>
                                    <span className="text-[10px] text-gray-500">{file.date}</span>
                                </div>
                                <p className="text-xs text-gray-400 font-mono truncate mb-3">{file.key.split('/').pop()}</p>
                                <a href={file.url} target="_blank" className="block text-center w-full py-2 bg-white/5 hover:bg-white/10 rounded text-xs text-white transition-colors">
                                    ACCESS FILE
                                </a>
                            </div>
                        </div>
                    ))}
                    {vaultFiles.length === 0 && (
                        <div className="col-span-4 py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                            <Database size={48} className="mx-auto mb-4 opacity-20" />
                            <p>VAULT EMPTY</p>
                        </div>
                    )}
                 </div>
              </motion.div>
            )}

            {/* --- TAB 1: ORIGIN --- */}
            {activeTab === 'origin' && (
              <motion.div key="origin" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="space-y-8">
                <Header title="Script Origin" subtitle="Generate or Upload raw script data." />
                <div className="grid grid-cols-2 gap-6">
                  <InputBox label="Property Address" value={genData.address} onChange={(e) => setGenData({...genData, address: e.target.value})} />
                  <InputBox label="Specs (Bed/Bath/Sqft)" value={genData.specs} onChange={(e) => setGenData({...genData, specs: e.target.value})} />
                </div>
                <InputBox label="Key Features (Pool, View, upgrades)" value={genData.features} onChange={(e) => setGenData({...genData, features: e.target.value})} />
                <div className="pt-4">
                    <button onClick={runGenerate} className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold tracking-widest hover:scale-[1.01] transition-transform shadow-lg shadow-cyan-500/20 text-sm">GENERATE DRAFT SCRIPT</button>
                </div>
              </motion.div>
            )}

            {/* --- TAB 2: COMPLIANCE --- */}
            {activeTab === 'audit' && (
              <motion.div key="audit" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="space-y-8">
                <Header title="Compliance Core" subtitle="Verify script against Fair Housing & State Laws." />
                <textarea value={auditText} onChange={(e) => setAuditText(e.target.value)} className="w-full h-64 bg-black/30 border border-white/10 rounded-xl p-6 text-gray-300 focus:border-cyan-500 focus:outline-none transition-colors leading-relaxed font-light" placeholder="Paste script for verification..." />
                <button onClick={runAudit} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl font-bold tracking-widest hover:scale-[1.01] transition-transform shadow-lg shadow-emerald-500/20 text-sm">RUN FORENSIC AUDIT</button>
                {result && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className={`p-6 rounded-xl border mt-6 ${result.status === 'PASS' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className={`text-xl font-bold ${result.status === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>{result.status === 'PASS' ? 'CERTIFICATION GRANTED' : 'VIOLATIONS DETECTED'}</h3>
                          {result.status === 'PASS' && <p className="text-xs text-green-500/70 mt-1">CRYPTOGRAPHIC SIGNATURE: VALID</p>}
                      </div>
                      {result.status === 'PASS' && <FileBadge size={32} className="text-green-400" />}
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{result.final_text}</p>
                    {result.status === 'PASS' && (
                        <div className="mt-4 pt-4 border-t border-green-500/20">
                            <button onClick={() => setActiveTab('studio')} className="text-sm font-bold text-green-400 hover:text-green-300 flex items-center gap-2">PROCEED TO STUDIO <Activity size={16} /></button>
                        </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
            
            {/* --- TAB 3: AVATAR STUDIO (LOCKED) --- */}
            {activeTab === 'studio' && (
              <motion.div key="studio" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="h-full flex flex-col">
                {!isCertified ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 grayscale">
                        <Lock size={64} className="mx-auto text-red-400 mb-4" />
                        <h2 className="text-3xl font-bold text-gray-400">STUDIO LOCKED</h2>
                        <p className="text-gray-500 max-w-md">Security Protocol Engaged. You must obtain a valid Compliance Certificate to access the production studio.</p>
                        <button onClick={() => setActiveTab('audit')} className="mt-6 px-6 py-2 border border-gray-600 rounded-full text-sm hover:bg-white/5">Return to Audit</button>
                    </div>
                ) : (
                    <div className="w-full space-y-8">
                         <Header title="Avatar Studio" subtitle="Initialize new Digital Twin render." />
                         
                         <div className="grid grid-cols-2 gap-8 items-start mb-12">
                            {/* UPLOAD ZONE */}
                            <div className="relative group cursor-pointer">
                                <div className={`h-48 border-2 border-dashed rounded-2xl flex items-center justify-center flex-col transition-all ${avatarKey ? 'border-green-500 bg-green-500/5' : 'border-gray-600 hover:border-cyan-500 hover:bg-white/5'}`}>
                                    {avatarKey ? (
                                    <> <CheckCircle size={32} className="text-green-500 mb-2" /> <span className="text-green-400 font-bold text-sm">READY FOR DEPLOYMENT</span> </>
                                    ) : (
                                    <> <Upload size={32} className="text-gray-500 mb-2 group-hover:text-cyan-500" /> <span className="text-gray-400 group-hover:text-cyan-400 text-sm">Upload New Identity</span> </>
                                    )}
                                    <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/png, image/jpeg" />
                                </div>
                            </div>

                            {/* DEPLOY ZONE */}
                            <div className="flex flex-col gap-4">
                                {avatarKey && !jobId && (
                                <button onClick={runRender} className="w-full h-48 bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/50 rounded-xl font-bold tracking-widest hover:scale-[1.02] transition-transform flex flex-col items-center justify-center gap-4 group">
                                    <Video size={40} className="text-purple-400 group-hover:text-white transition-colors" /> 
                                    <span className="text-purple-300 group-hover:text-white">DEPLOY TWIN</span>
                                </button>
                                )}
                                {jobId && (
                                <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl animate-pulse">
                                    <h3 className="text-purple-400 font-bold text-xl mb-2">RENDERING ACTIVE</h3>
                                    <p className="text-gray-400 font-mono text-xs">ID: {jobId}</p>
                                </div>
                                )}
                                {!avatarKey && <div className="h-48 flex items-center justify-center text-gray-600 border border-white/5 rounded-xl text-sm">Waiting for Identity Upload...</div>}
                            </div>
                         </div>
                    </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

const NavButton = ({active, onClick, icon, label}) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
    {icon} <span className="font-medium text-sm">{label}</span>
  </button>
)

const InputBox = ({label, value, onChange}) => (
  <div className="space-y-2">
    <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{label}</label>
    <input value={value} onChange={onChange} className="w-full bg-black/30 border border-white/10 rounded-lg p-4 text-white focus:border-cyan-500 focus:outline-none transition-colors" />
  </div>
)

const Header = ({title, subtitle}) => (
    <div className="mb-2">
        <h2 className="text-3xl font-light text-white">{title}</h2>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
    </div>
)

export default App