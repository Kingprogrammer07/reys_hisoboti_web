import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Camera, 
  CameraOff, 
  Image as ImageIcon, 
  Check, 
  X, 
  Scale, 
  Layers, 
  CheckCircle2, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  ListOrdered, 
  ZoomIn, 
  Trash2, 
  Plus, 
  Edit3, 
  ArrowDown, 
  Clock, 
  Zap, 
  Search,
  PackageCheck,
  Hash
} from "lucide-react";
import { 
  getReys, 
  createEntry, 
  adjustEntryInventory,
  fetchEntries, 
  fetchInventory, 
  fetchCustomTypes, 
  createCustomType,
  InventoryItem 
} from "../../api";
import { saveToOfflineQueue } from "../../utils/offlineQueue";

const DEFAULT_TYPES = [
  "akb", "triton", "izi", "navo", "xabib", "jet", "jon", "top", "uztez", "mandarin",
  "oneway", "x637", "x517", "redwing"
];

export const ReysDistributionFormPage: React.FC = () => {
  const { reysId } = useParams<{ reysId: string }>();
  const navigate = useNavigate();

  const [reys, setReys] = useState<{ id: number; code: string; custom_name?: string } | null>(null);

  // Active Tab: 'distribute' (Reys hisoboti / Kargolarga tarqatish) vs 'adjust' (Adashgan yuklar)
  const [activeTab, setActiveTab] = useState<"distribute" | "adjust">("distribute");

  // Fast mode preference (persisted in localStorage)
  const [isFastMode, setIsFastMode] = useState<boolean>(() => {
    return localStorage.getItem("mandarin_dist_fast_mode") === "true";
  });

  // Remember preference for tovar turi and coef
  const [rememberSelection, setRememberSelection] = useState<boolean>(() => {
    return localStorage.getItem("mandarin_dist_remember") === "true";
  });

  // Tovar turi & Custom Types
  const [selectedType, setSelectedType] = useState<string>(() => {
    return localStorage.getItem("mandarin_dist_saved_type") || "akb";
  });
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [showTypeSelectSheet, setShowTypeSelectSheet] = useState<boolean>(false);
  const [typeSearchQuery, setTypeSearchQuery] = useState<string>("");
  const [showNewTypeModal, setShowNewTypeModal] = useState<boolean>(false);
  const [newTypeNameInput, setNewTypeNameInput] = useState<string>("");

  // Karobka og'irligi (Koeffitsient): '0' (Ayirilmasin), '0.94', '1.22', '1.4', 'custom'
  const [coefOption, setCoefOption] = useState<"0" | "0.94" | "1.22" | "1.4" | "custom">(() => {
    const saved = localStorage.getItem("mandarin_dist_saved_coef");
    return (saved as any) || "0";
  });
  const [customCoefValue, setCustomCoefValue] = useState<string>(() => {
    return localStorage.getItem("mandarin_dist_saved_custom_coef") || "";
  });
  const customCoefInputRef = useRef<HTMLInputElement>(null);

  // Og'irlik (W) input
  const [grossWeight, setGrossWeight] = useState<string>("");
  const grossWeightInputRef = useRef<HTMLInputElement>(null);

  // Camera & Media stream state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isShutterFlashing, setIsShutterFlashing] = useState<boolean>(false);
  const [isFullscreenCameraOpen, setIsFullscreenCameraOpen] = useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Uploaded entries counter
  const [savedCount, setSavedCount] = useState<number>(0);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Tab 2: Adashgan yuklar state
  const [adjFromType, setAdjFromType] = useState<string>("");
  const [adjToType, setAdjToType] = useState<string>("");
  const [adjWeight, setAdjWeight] = useState<string>("");
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState<boolean>(false);

  // Load Reys data, inventory, and custom types
  useEffect(() => {
    if (reysId) {
      getReys(Number(reysId))
        .then((r) => setReys(r))
        .catch((err) => console.warn("Reys yuklashda xatolik:", err));

      fetchEntries(Number(reysId))
        .then((res) => {
          if (res && Array.isArray(res.items)) {
            setSavedCount(res.items.length);
          }
        })
        .catch(() => {});

      loadInventoryData();
      loadTypes();
    }
  }, [reysId]);

  const loadInventoryData = async () => {
    if (!reysId) return;
    try {
      setLoadingInventory(true);
      const res = await fetchInventory(Number(reysId));
      if (res && Array.isArray(res.items)) {
        setInventoryList(res.items);
      }
    } catch {
      // ignore
    } finally {
      setLoadingInventory(false);
    }
  };

  const loadTypes = async () => {
    try {
      const res = await fetchCustomTypes();
      if (Array.isArray(res)) {
        setCustomTypes(res.map((item) => (typeof item === "string" ? item : item.name)));
      }
    } catch {
      // ignore
    }
  };

  const allAvailableTypes = Array.from(new Set([...DEFAULT_TYPES, ...customTypes]));

  // Active Karobka Weight Calculation
  const activeCoefValue = coefOption === "0"
    ? 0
    : coefOption === "custom"
    ? Number(customCoefValue) || 0
    : Number(coefOption) || 0;

  // Live Net Weight Calculation
  const grossNum = Number(grossWeight) || 0;
  const computedNetWeight = Math.max(0, grossNum > 0 ? Number((grossNum - activeCoefValue).toFixed(2)) : 0);

  // Initialize Camera
  useEffect(() => {
    let active = true;

    async function initCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsCameraActive(false);
        return;
      }
      try {
        if (cameraStream) {
          cameraStream.getTracks().forEach((t) => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (active) {
          setCameraStream(stream);
          if (videoRef.current) videoRef.current.srcObject = stream;
          if (fullscreenVideoRef.current) fullscreenVideoRef.current.srcObject = stream;
        } else {
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch (err) {
        console.warn("Kamera ochilmadi:", err);
        if (active) setIsCameraActive(false);
      }
    }

    if (isCameraActive) {
      initCamera();
    }

    return () => {
      active = false;
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isCameraActive, facingMode]);

  useEffect(() => {
    if (cameraStream) {
      if (videoRef.current) videoRef.current.srcObject = cameraStream;
      if (fullscreenVideoRef.current) fullscreenVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isFullscreenCameraOpen]);

  // Lock background & unmount header when camera/lightbox is open
  useEffect(() => {
    if (isFullscreenCameraOpen || viewingPhoto) {
      document.body.classList.add("camera-active");
      window.dispatchEvent(new Event("camera-state-change"));
    } else {
      document.body.classList.remove("camera-active");
      window.dispatchEvent(new Event("camera-state-change"));
    }
    return () => {
      document.body.classList.remove("camera-active");
      window.dispatchEvent(new Event("camera-state-change"));
    };
  }, [isFullscreenCameraOpen, viewingPhoto]);

  // Fast mode auto focus
  useEffect(() => {
    if (isFastMode) {
      grossWeightInputRef.current?.focus();
    }
  }, [isFastMode]);

  // Capture Photo
  const handleCapturePhoto = (keepCameraOpen = false): string | null => {
    const activeVideo = isFullscreenCameraOpen ? fullscreenVideoRef.current : videoRef.current;
    if (activeVideo && canvasRef.current) {
      const video = activeVideo;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

        setCapturedPhotos((prev) => [...prev, dataUrl]);

        // Flash animation
        setIsShutterFlashing(true);
        setTimeout(() => setIsShutterFlashing(false), 200);

        if (!keepCameraOpen && isFullscreenCameraOpen) {
          setIsFullscreenCameraOpen(false);
          if (isFastMode) setTimeout(() => grossWeightInputRef.current?.focus(), 150);
        }
        return dataUrl;
      }
    }
    return null;
  };

  const dataURLtoBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 10 - capturedPhotos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setCapturedPhotos((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateCustomType = async () => {
    const name = newTypeNameInput.trim().toLowerCase();
    if (!name) return;
    try {
      await createCustomType(name);
      setCustomTypes((prev) => Array.from(new Set([...prev, name])));
      setSelectedType(name);
      setShowNewTypeModal(false);
      setNewTypeNameInput("");
    } catch {
      setCustomTypes((prev) => Array.from(new Set([...prev, name])));
      setSelectedType(name);
      setShowNewTypeModal(false);
      setNewTypeNameInput("");
    }
  };

  const handleSaveDistributionEntry = async () => {
    const gross = Number(grossWeight);
    if (!gross || gross <= 0) {
      alert("Iltimos, og'irlikni to'g'ri kiriting!");
      grossWeightInputRef.current?.focus();
      return;
    }

    if (activeCoefValue >= gross) {
      alert("Karobka og'irligi umumiy og'irlikdan kichik bo'lishi kerak!");
      return;
    }

    let finalPhotos = [...capturedPhotos];
    if (finalPhotos.length === 0 && isCameraActive) {
      const autoShot = handleCapturePhoto(false);
      if (autoShot) finalPhotos = [autoShot];
    }

    const currentBoxCode = `${selectedType.toUpperCase()}-${Date.now().toString().slice(-4)}`;

    try {
      const photoBlobs = finalPhotos.map((p) => dataURLtoBlob(p));
      await createEntry(
        {
          reys_id: Number(reysId),
          box_code: currentBoxCode,
          tovar_turi: selectedType,
          gross_weight: gross,
          tare_weight: activeCoefValue,
          coefficient_mode: coefOption === "0" ? "none" : coefOption === "custom" ? "custom" : "fixed",
        },
        photoBlobs
      );
    } catch (err) {
      console.warn("API xatosi, oflayn saqlanmoqda:", err);
      try {
        const photoBlobs = finalPhotos.map((p) => dataURLtoBlob(p));
        await saveToOfflineQueue(
          {
            reys_id: Number(reysId),
            box_code: currentBoxCode,
            tovar_turi: selectedType,
            gross_weight: gross,
            tare_weight: activeCoefValue,
            coefficient_mode: coefOption === "0" ? "none" : coefOption === "custom" ? "custom" : "fixed",
          },
          photoBlobs
        );
      } catch (idbErr) {
        console.error("IndexedDB saqlashda xatolik:", idbErr);
      }
    }

    setSavedCount((prev) => prev + 1);
    setSuccessToast(`✓ ${selectedType.toUpperCase()} saqlandi (${computedNetWeight} kg toza vazn)`);
    setTimeout(() => setSuccessToast(null), 3500);

    // Reset fields
    setGrossWeight("");
    setCapturedPhotos([]);

    if (rememberSelection) {
      localStorage.setItem("mandarin_dist_saved_type", selectedType);
      localStorage.setItem("mandarin_dist_saved_coef", coefOption);
      if (coefOption === "custom") {
        localStorage.setItem("mandarin_dist_saved_custom_coef", customCoefValue);
      }
    }

    // Fast Mode: automatically reopen camera or focus input
    if (isFastMode) {
      setTimeout(() => {
        setIsFullscreenCameraOpen(true);
      }, 200);
    } else {
      grossWeightInputRef.current?.focus();
    }
  };

  const handleSaveAdjustment = async () => {
    const weightNum = Number(adjWeight);
    if (!adjFromType || !adjToType) {
      alert("Iltimos, har ikkala tovar turini tanlang!");
      return;
    }
    if (adjFromType === adjToType) {
      alert("Bir xil tovar turiga o'tkazib bo'lmaydi!");
      return;
    }
    if (!weightNum || weightNum <= 0) {
      alert("Iltimos, og'irlikni to'g'ri kiriting!");
      return;
    }

    try {
      await adjustEntryInventory({
        reys_id: Number(reysId),
        from_type: adjFromType,
        to_type: adjToType,
        weight: weightNum,
      });

      setSuccessToast(`✓ ${adjFromType.toUpperCase()} dan ${adjToType.toUpperCase()} ga ${weightNum} kg o'tkazildi`);
      setTimeout(() => setSuccessToast(null), 3500);

      setAdjWeight("");
      loadInventoryData();
    } catch (err: any) {
      alert("O'tkazishda xatolik: " + (err?.detail || err?.message || "Server xatosi"));
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-24 px-2 sm:px-4">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center justify-between rounded-2xl bg-emerald-500 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-2xl shadow-emerald-500/40 animate-in fade-in slide-in-from-top-3 duration-200 max-w-md">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="ml-3 p-1 hover:bg-white/20 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. TOP BAR HEADER — MATCHES REYS ENTRY FORM UX EXACTLY */}
      <header className="flex items-center justify-between border-b border-border/60 pb-3 pt-1">
        {/* Left: Back button */}
        <div className="flex items-center space-x-2">
          <Link
            to={`/reports/reys/${reysId}`}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border border-white/10 bg-card text-foreground hover:bg-muted/50 transition-colors shadow-sm"
            title="Reys oynasiga qaytish"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </div>

        {/* Center Title + Reys code badge */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <span className="text-sm sm:text-base md:text-lg font-black tracking-wider uppercase text-foreground">
            TARQATISH
          </span>
          <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-mono">
            {reys?.code || `REYS-${reysId}`}
          </span>
        </div>

        {/* Right: Yuklanganlar + Tezkor + Camera toggle */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          {/* Yuklanganlar link */}
          <Link
            to={`/reports/reys/${reysId}/distribute/list`}
            className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-[11px] sm:text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
            title="Yuklanganlar ro'yxati"
          >
            <ListOrdered className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Yuklanganlar</span>
            <span className="font-mono font-bold">({savedCount})</span>
          </Link>

          {/* Fast Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isFastMode;
              setIsFastMode(next);
              localStorage.setItem("mandarin_dist_fast_mode", String(next));
            }}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all ${
              isFastMode
                ? "bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm shadow-amber-500/10"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
            title="Tezkor Rejim: Avtomatik fokus va doimiy kamera"
          >
            <Zap className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isFastMode ? "text-amber-400 fill-amber-400" : ""}`} />
            <span className="hidden md:inline">Tezkor</span>
          </button>

          {/* Camera Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isCameraActive) {
                if (cameraStream) {
                  cameraStream.getTracks().forEach((t) => t.stop());
                  setCameraStream(null);
                }
                setIsCameraActive(false);
                setIsFullscreenCameraOpen(false);
              } else {
                setIsCameraActive(true);
              }
            }}
            className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border transition-colors ${
              isCameraActive
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
            title={isCameraActive ? "Kamerani to'xtatish" : "Kamerani yoqish"}
          >
            {isCameraActive ? <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <CameraOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>
        </div>
      </header>

      {/* Tabs Switcher: Reys hisoboti vs Adashgan yuklar */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-muted/60 border border-border/80">
        <button
          type="button"
          onClick={() => setActiveTab("distribute")}
          className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === "distribute"
              ? "bg-card text-emerald-400 shadow-md border border-emerald-500/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <PackageCheck className="h-4 w-4" />
          <span>Reys hisoboti (Tarqatish)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("adjust")}
          className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === "adjust"
              ? "bg-card text-teal-400 shadow-md border border-teal-500/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Adashgan yuklar</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: REYS HISOBOTI (KARGOLARGA TARQATISH FORMASI)       */}
      {/* ========================================================= */}
      {activeTab === "distribute" && (
        <div className="space-y-4">
          
          {/* CARD 1: YUKLANMALAR (KOMPAKT VA BIR NECHTA RASM O'LISH) */}
          <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-card p-3 sm:p-4 shadow-xl space-y-2.5 glass-panel">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-xs font-bold text-foreground flex items-center space-x-1.5">
                <Camera className="h-3.5 w-3.5 text-emerald-400" />
                <span>Yuklanmalar</span>
              </span>
              
              <div className="flex items-center space-x-2">
                {capturedPhotos.length > 0 ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                    <span>{capturedPhotos.length}/10 rasm</span>
                  </span>
                ) : (
                  isCameraActive && (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Kamera tayyor</span>
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Photos Strip or Dual Action Tiles */}
            {capturedPhotos.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                  {capturedPhotos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="relative group shrink-0 h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-black/40 shadow-sm"
                    >
                      <img
                        src={photo}
                        alt={`Rasm #${idx + 1}`}
                        onClick={() => setViewingPhoto(photo)}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                        title="Kattalashtirib ko'rish"
                      />
                      <span className="absolute bottom-1 left-1.5 bg-black/70 backdrop-blur-xs text-[9px] font-mono font-bold text-white px-1.5 py-0.2 rounded-md border border-white/20 pointer-events-none">
                        #{idx + 1}
                      </span>
                      <div
                        onClick={() => setViewingPhoto(photo)}
                        className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                      >
                        <ZoomIn className="h-4 w-4 text-white drop-shadow" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(idx);
                        }}
                        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-md z-10"
                        title="Ushbu rasmni o'chirish"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add More Photos Triggers */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsFullscreenCameraOpen(true)}
                      className="h-20 w-16 sm:h-24 sm:w-20 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 flex flex-col items-center justify-center space-y-1 text-emerald-400 transition-all cursor-pointer active:scale-95"
                      title="Yana rasm olish"
                    >
                      <Camera className="h-4 w-4" />
                      <span className="text-[10px] font-bold">+ Kamera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 w-16 sm:h-24 sm:w-20 rounded-2xl border-2 border-dashed border-border bg-background/50 hover:bg-muted/30 flex flex-col items-center justify-center space-y-1 text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95"
                      title="Galereyadan yana rasm qo'shish"
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-[10px] font-bold">+ Galereya</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* TILE 1: GALEREYA */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background/40 p-3 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-center min-h-[90px] active:scale-98"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <span className="mt-1.5 text-xs font-bold text-foreground">Galereya</span>
                  <span className="text-[10px] text-muted-foreground">Fayl tanlash</span>
                </div>

                {/* TILE 2: KAMERA */}
                <div
                  onClick={() => {
                    if (!isCameraActive) setIsCameraActive(true);
                    setIsFullscreenCameraOpen(true);
                  }}
                  className="group relative cursor-pointer flex flex-col items-center justify-center rounded-2xl border border-border bg-black/60 overflow-hidden min-h-[90px] hover:border-emerald-500/50 transition-all shadow-sm active:scale-98"
                  title="Kamerani ochish"
                >
                  {isCameraActive ? (
                    <div className="relative w-full h-full min-h-[90px] flex items-center justify-center bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover absolute inset-0 opacity-70 group-hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-bold text-white flex items-center space-x-1">
                        <Maximize2 className="h-2 w-2 text-emerald-400" />
                        <span>Ochish</span>
                      </div>
                      <div className="relative z-10 flex items-center space-x-1 bg-emerald-500/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-md">
                        <Camera className="h-3 w-3" />
                        <span>Kamera</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted border border-border text-muted-foreground group-hover:text-emerald-400 transition-colors">
                        <Camera className="h-4 w-4" />
                      </div>
                      <span className="mt-1.5 text-xs font-bold text-foreground">Kamera</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">Yoqish</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilesSelected}
            />
            <canvas ref={canvasRef} className="hidden" />
          </section>

          {/* CARD 2: UNIFIED MAIN FORM INPUTS (MATCHES REYS ENTRY FORM UX) */}
          <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-card p-3.5 sm:p-5 shadow-xl space-y-4 sm:space-y-5 glass-panel">
            
            {/* FIELD 1: TOVAR TURI SELECTION */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center space-x-1.5">
                  <Hash className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Tovar turi:</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewTypeModal(true)}
                  className="flex items-center space-x-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Yangi tur</span>
                </button>
              </div>

              {/* Main Selector Button */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTypeSelectSheet(true)}
                  className="w-full flex items-center justify-between rounded-2xl border border-input bg-background px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-foreground font-mono font-bold tracking-wider hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs uppercase transition-all"
                >
                  <span className="text-emerald-400">{selectedType}</span>
                  <span className="text-xs font-sans text-muted-foreground font-normal">O'zgartirish ▾</span>
                </button>
              </div>

              {/* Quick Chips for 1-Tap Switching */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
                {DEFAULT_TYPES.slice(0, 9).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold uppercase transition-all shrink-0 border ${
                      selectedType === t
                        ? "bg-emerald-500 text-white border-emerald-400 shadow-sm"
                        : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* FIELD 2: OG'IRLIK (kg) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center space-x-1.5">
                <Scale className="h-3.5 w-3.5 text-teal-400" />
                <span>Og'irlik (kg):</span>
              </label>

              <div className="relative">
                <input
                  ref={grossWeightInputRef}
                  type="text"
                  inputMode="decimal"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(e.target.value.replace(/,/g, "."))}
                  placeholder="Masalan: 19.85"
                  className="w-full rounded-2xl border border-input bg-background pl-3.5 sm:pl-4 pr-12 py-2.5 sm:py-3 text-sm sm:text-base text-foreground font-mono font-bold focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveDistributionEntry();
                  }}
                />
                <span className="absolute right-4 top-3 text-xs font-extrabold text-muted-foreground">
                  kg
                </span>
              </div>
            </div>

            {/* FIELD 3: KAROBKA OG'IRLIGI (NO "TARA" / "BRUTTO") */}
            <div className="space-y-2 pt-1 border-t border-border/50">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Karobka og'irligi:
                </label>
                <span className="text-[11px] font-semibold text-emerald-400 font-mono">
                  Tanlangan: {activeCoefValue > 0 ? `${activeCoefValue} kg` : "Ayirilmasin"}
                </span>
              </div>

              {/* 5 Chips: fits 320px mobile up to desktop */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {[
                  { key: "0", label: "Ayirilmasin" },
                  { key: "0.94", label: "0.94 kg" },
                  { key: "1.22", label: "1.22 kg" },
                  { key: "1.4", label: "1.4 kg" },
                  { key: "custom", label: "O'zim kiritaman" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setCoefOption(opt.key as any);
                      if (opt.key === "custom") {
                        setTimeout(() => customCoefInputRef.current?.focus(), 100);
                      }
                    }}
                    className={`py-2 px-1 text-center rounded-xl text-[11px] sm:text-xs font-bold transition-all border ${
                      coefOption === opt.key
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : "bg-background/60 border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Custom Karobka Weight Input */}
              {coefOption === "custom" && (
                <div className="pt-1.5 animate-in fade-in duration-200">
                  <label className="text-[10px] text-muted-foreground block mb-1">
                    Maxsus karobka og'irligini kiriting:
                  </label>
                  <div className="relative flex items-center">
                    <input
                      ref={customCoefInputRef}
                      type="text"
                      inputMode="decimal"
                      value={customCoefValue}
                      onChange={(e) => {
                        const val = e.target.value.replace(/,/g, ".");
                        if (/^\d*\.?\d*$/.test(val)) {
                          setCustomCoefValue(val);
                        }
                      }}
                      placeholder="Masalan: 1.05"
                      className="w-full rounded-2xl border border-input bg-background pl-3.5 pr-20 py-2 sm:py-2.5 text-xs sm:text-sm text-foreground font-mono font-bold focus:border-emerald-500 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveDistributionEntry();
                      }}
                    />
                    <div className="absolute right-1.5 flex items-center space-x-1">
                      <span className="text-[11px] font-bold text-muted-foreground">kg</span>
                      <button
                        type="button"
                        onClick={handleSaveDistributionEntry}
                        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95 transition-all"
                        title="Tezkor Saqlash"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Calculation Banner */}
            {grossNum > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/60 text-[11px] font-mono text-muted-foreground animate-in fade-in">
                <span>Og'irlik: <strong className="text-foreground">{grossNum} kg</strong></span>
                <span>Karobka: <strong className="text-foreground">-{activeCoefValue} kg</strong></span>
                <span className="text-emerald-400 font-bold">Toza: {computedNetWeight} kg</span>
              </div>
            )}

            {/* Preferences Checkbox */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberSelection}
                  onChange={(e) => {
                    setRememberSelection(e.target.checked);
                    localStorage.setItem("mandarin_dist_remember", String(e.target.checked));
                  }}
                  className="h-4 w-4 rounded-md border-border text-emerald-500 focus:ring-emerald-500/20"
                />
                <span className="font-semibold text-muted-foreground hover:text-foreground">Qiymatlarni eslab qolish</span>
              </label>

              {grossNum > 0 && (
                <span className="text-emerald-400 font-bold font-mono">
                  Sof: {computedNetWeight} kg
                </span>
              )}
            </div>

            {/* BIG ACTION BUTTON — MATCHES REYS ENTRY FORM */}
            <button
              type="button"
              onClick={handleSaveDistributionEntry}
              className="w-full flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-4 py-3 sm:py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-emerald-500/25 active:scale-98 transition-all cursor-pointer"
            >
              <Check className="h-5 w-5 stroke-[3]" />
              <span>Saqlash {isFastMode ? "(Tezkor rejim faol)" : ""}</span>
            </button>
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ADASHGAN YUKLAR (TRANSFER & BALANCES)              */}
      {/* ========================================================= */}
      {activeTab === "adjust" && (
        <div className="space-y-4">
          <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-card p-4 sm:p-5 shadow-xl space-y-4 glass-panel">
            <h3 className="text-sm font-bold text-foreground flex items-center space-x-2">
              <Layers className="h-4 w-4 text-teal-400" />
              <span>Tovar turlari o'rtasida yuk o'tkazish</span>
            </h3>

            {/* From Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Qaysi turdan ayirish (-)</label>
              <select
                value={adjFromType}
                onChange={(e) => setAdjFromType(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-bold text-foreground focus:outline-hidden"
              >
                <option value="">Tanlang...</option>
                {allAvailableTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center text-teal-400 py-1">
              <ArrowDown className="h-5 w-5 animate-bounce" />
            </div>

            {/* To Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Qaysi turga qo'shish (+)</label>
              <select
                value={adjToType}
                onChange={(e) => setAdjToType(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-bold text-foreground focus:outline-hidden"
              >
                <option value="">Tanlang...</option>
                {allAvailableTypes.map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Weight Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">O'tkazilayotgan og'irlik (kg)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={adjWeight}
                  onChange={(e) => setAdjWeight(e.target.value.replace(/,/g, "."))}
                  placeholder="0.00"
                  className="w-full h-12 pl-4 pr-12 rounded-xl border border-border bg-background text-base font-bold font-mono text-foreground focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground font-mono">
                  kg
                </span>
              </div>
            </div>

            {/* Save Transfer Button */}
            <button
              type="button"
              onClick={handleSaveAdjustment}
              className="w-full flex items-center justify-center space-x-2 h-12 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm shadow-lg shadow-teal-500/30 active:scale-98 transition-all"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>O'tkazishni saqlash</span>
            </button>
          </section>

          {/* Current Balances Section */}
          <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-card p-4 sm:p-5 shadow-xl space-y-3 glass-panel">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-xs font-bold text-foreground flex items-center space-x-1.5">
                <Scale className="h-3.5 w-3.5 text-teal-400" />
                <span>Ombor holati (Joriy qoldiqlar)</span>
              </span>
              <button
                type="button"
                onClick={loadInventoryData}
                disabled={loadingInventory}
                className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-3 w-3 ${loadingInventory ? "animate-spin" : ""}`} />
                <span>Yangilash</span>
              </button>
            </div>

            {inventoryList.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Omborda hali mahsulotlar mavjud emas.</p>
            ) : (
              <div className="space-y-1.5">
                {inventoryList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs font-medium"
                  >
                    <span className="uppercase font-bold text-foreground">{item.tovar_turi}</span>
                    <span className="font-mono font-extrabold text-emerald-400">{item.weight.toFixed(2)} kg</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* FULLSCREEN LIVE CAMERA MODAL (LARGE SHUTTER BUTTON FOR MOBILE) */}
      {isFullscreenCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between animate-in fade-in duration-200">
          {/* Shutter flash overlay */}
          {isShutterFlashing && (
            <div className="absolute inset-0 z-40 bg-white/60 pointer-events-none animate-out fade-out duration-200" />
          )}

          {/* Top Controls */}
          <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 font-mono">
                {selectedType.toUpperCase()} ({capturedPhotos.length}/10)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20"
                title="Kamerani aylantirish"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreenCameraOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20"
                title="Yopish"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Video Viewfinder */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            <video
              ref={fullscreenVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* Bottom Shutter Controls */}
          <div className="relative z-20 flex items-center justify-around p-6 pb-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            {/* Gallery Picker Shortcut */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center space-y-1 text-white/80 hover:text-white"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 border border-white/20">
                <ImageIcon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold">Galereya</span>
            </button>

            {/* LARGE CAPTURE SHUTTER BUTTON (ENLARGED FOR MOBILE THUMBS) */}
            <button
              type="button"
              onClick={() => handleCapturePhoto(true)}
              className="group relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border-4 sm:border-[5px] border-white/95 bg-white/10 backdrop-blur-md p-1.5 shadow-2xl transition-transform active:scale-90"
              title="Rasmga olish"
            >
              <div className="h-full w-full rounded-full bg-emerald-500 group-hover:bg-emerald-400 shadow-inner transition-colors flex items-center justify-center">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/30" />
              </div>
            </button>

            {/* Done button */}
            <button
              type="button"
              onClick={() => {
                setIsFullscreenCameraOpen(false);
                if (isFastMode) setTimeout(() => grossWeightInputRef.current?.focus(), 150);
              }}
              className="flex flex-col items-center space-y-1 text-emerald-400 hover:text-emerald-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <Check className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold">Tayyor ({capturedPhotos.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {viewingPhoto && (
        <div
          onClick={() => setViewingPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
        >
          <img src={viewingPhoto} alt="Kattalashtirilgan rasm" className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl" />
          <button
            onClick={() => setViewingPhoto(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-white border border-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Searchable Tovar Turi Bottom Sheet */}
      {showTypeSelectSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/10 bg-card p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col glass-panel">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Tovar turini tanlang</h3>
              <button onClick={() => setShowTypeSelectSheet(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={typeSearchQuery}
                onChange={(e) => setTypeSearchQuery(e.target.value)}
                placeholder="Qidirish..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-hidden"
              />
            </div>

            <div className="overflow-y-auto space-y-1 flex-1 py-1 max-h-60 scrollbar-thin">
              {allAvailableTypes
                .filter((t) => t.toLowerCase().includes(typeSearchQuery.toLowerCase()))
                .map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSelectedType(t);
                      setShowTypeSelectSheet(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors uppercase ${
                      selectedType === t
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <span>{t}</span>
                    {selectedType === t && <Check className="h-4 w-4 text-emerald-400" />}
                  </button>
                ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowTypeSelectSheet(false);
                setShowNewTypeModal(true);
              }}
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border border-dashed border-emerald-500/40 text-emerald-400 text-xs font-bold hover:bg-emerald-500/10 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Yangi tovar turi qo'shish</span>
            </button>
          </div>
        </div>
      )}

      {/* New Type Prompt Modal */}
      {showNewTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-card p-5 shadow-2xl space-y-4 glass-panel">
            <h3 className="text-base font-bold text-foreground">Yangi tovar turi</h3>
            <p className="text-xs text-muted-foreground">Kiritilgan yangi tur ro'yxatga avtomatik qo'shiladi.</p>

            <input
              type="text"
              value={newTypeNameInput}
              onChange={(e) => setNewTypeNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateCustomType();
              }}
              placeholder="Masalan: limon, kivi, banan"
              autoFocus
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-bold text-foreground focus:outline-hidden"
            />

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNewTypeModal(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleCreateCustomType}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-xs font-bold text-white hover:bg-emerald-600 transition-colors shadow-md"
              >
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
