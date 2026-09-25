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
  ArrowRight, 
  ArrowDown, 
  Clock, 
  Zap, 
  Search,
  PackageCheck
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
  const [loadingReys, setLoadingReys] = useState<boolean>(true);

  // Active Tab: 'distribute' (Reys hisoboti / Kargolarga tarqatish) vs 'adjust' (Adashgan yuklar)
  const [activeTab, setActiveTab] = useState<"distribute" | "adjust">("distribute");

  // Fast mode preference
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

  // Koeffitsient: '0' (Ayirilmasin), '0.94', '1.22', '1.4', 'custom'
  const [coefOption, setCoefOption] = useState<"0" | "0.94" | "1.22" | "1.4" | "custom">(() => {
    const saved = localStorage.getItem("mandarin_dist_saved_coef");
    return (saved as any) || "0";
  });
  const [customCoefValue, setCustomCoefValue] = useState<string>(() => {
    return localStorage.getItem("mandarin_dist_saved_custom_coef") || "";
  });
  const customCoefInputRef = useRef<HTMLInputElement>(null);

  // Gross Weight input
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
      setLoadingReys(true);
      getReys(Number(reysId))
        .then((r) => setReys(r))
        .catch((err) => console.warn("Reys yuklashda xatolik:", err))
        .finally(() => setLoadingReys(false));

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
      const items = await fetchCustomTypes();
      if (Array.isArray(items)) {
        setCustomTypes(items.map((i) => i.name));
      }
    } catch {
      // ignore
    }
  };

  // Combine default types + custom types
  const allAvailableTypes = Array.from(new Set([...DEFAULT_TYPES, ...customTypes])).sort((a, b) =>
    a.localeCompare(b)
  );

  // Compute Active Coefficient Value
  const activeCoefValue: number = coefOption === "custom"
    ? Number(customCoefValue) || 0
    : Number(coefOption);

  // Compute Net Weight
  const grossNum = Number(grossWeight) || 0;
  const computedNetWeight = Math.max(0, grossNum > 0 ? Number((grossNum - activeCoefValue).toFixed(2)) : 0);

  // Initialize Camera Stream
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
          video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
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
  }, [isFullscreenCameraOpen, viewingPhoto]);

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

  // Convert Base64 data URL to Blob
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

  // Gallery File Selection
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

  // Remove photo from captured list
  const handleRemovePhoto = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Add custom tovar turi on the fly
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
      // Local fallback
      setCustomTypes((prev) => Array.from(new Set([...prev, name])));
      setSelectedType(name);
      setShowNewTypeModal(false);
      setNewTypeNameInput("");
    }
  };

  // Execute Save Distribution Entry
  const handleSaveDistributionEntry = async () => {
    const gross = Number(grossWeight);
    if (!gross || gross <= 0) {
      alert("Iltimos, og'irlikni to'g'ri kiriting!");
      grossWeightInputRef.current?.focus();
      return;
    }

    if (activeCoefValue >= gross) {
      alert("Koeffitsient og'irlikdan kichik bo'lishi kerak!");
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
    setSuccessToast(`✓ ${selectedType.toUpperCase()} saqlandi (${computedNetWeight} kg sof vazn)`);
    setTimeout(() => setSuccessToast(null), 3500);

    // Reset fields
    setGrossWeight("");
    setCapturedPhotos([]);

    // If remember preference is enabled, keep tovar turi and coef; otherwise optionally reset
    if (rememberSelection) {
      localStorage.setItem("mandarin_dist_saved_type", selectedType);
      localStorage.setItem("mandarin_dist_saved_coef", coefOption);
      if (coefOption === "custom") {
        localStorage.setItem("mandarin_dist_saved_custom_coef", customCoefValue);
      }
    }

    // Fast Mode: automatically reopen camera or focus weight
    if (isFastMode) {
      setTimeout(() => {
        setIsFullscreenCameraOpen(true);
      }, 200);
    }
  };

  // Execute Adashgan Yuklar Adjustment
  const handleSaveAdjustment = async () => {
    if (!adjFromType || !adjToType) {
      alert("Qaysi turdan qaysi turga o'tkazishni tanlang!");
      return;
    }
    if (adjFromType === adjToType) {
      alert("Bir xil tovar turiga o'tkazib bo'lmaydi!");
      return;
    }
    const weight = Number(adjWeight);
    if (!weight || weight <= 0) {
      alert("O'tkazilayotgan og'irlikni kiriting!");
      return;
    }

    try {
      await adjustEntryInventory({
        reys_id: Number(reysId),
        from_type: adjFromType,
        to_type: adjToType,
        weight,
      });
      setSuccessToast(`✓ ${adjFromType.toUpperCase()} dan ${adjToType.toUpperCase()} ga ${weight} kg o'tkazildi`);
      setTimeout(() => setSuccessToast(null), 3500);
      setAdjWeight("");
      loadInventoryData();
    } catch (err: any) {
      alert(`O'tkazmada xatolik: ${err?.message || "Server bilan aloqa yo'q"}`);
    }
  };

  if (loadingReys) {
    return (
      <div className="p-16 text-center text-muted-foreground border border-dashed border-border rounded-3xl my-8">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
        Kargolarga tarqatish bo'limi yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto px-2 sm:px-4">
      
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

      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center space-x-2.5 min-w-0">
          <Link
            to={`/reports/reys/${reysId}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors shrink-0 shadow-sm"
            title="Reys oynasiga qaytish"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center space-x-2 truncate">
              <span>{reys?.code || "Reys"}</span>
              <span className="text-xs font-semibold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                Kargolarga tarqatish
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
              Yuklarni tovar turlari va koeffitsientlar bo'yicha tarqatish
            </p>
          </div>
        </div>

        {/* Yuklanganlar Button with Badge */}
        <button
          onClick={() => navigate(`/reports/reys/${reysId}/distribute/list`)}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-accent text-xs font-semibold transition-all active:scale-95 shadow-sm shrink-0"
        >
          <ListOrdered className="h-3.5 w-3.5 text-teal-400" />
          <span className="hidden sm:inline">Yuklanganlar</span>
          <span className="px-1.5 py-0.2 rounded-md bg-teal-500/20 text-teal-400 font-mono text-[10px] font-bold">
            {savedCount}
          </span>
        </button>
      </div>

      {/* Modern 2-Tab Navigation Bar */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-muted/60 border border-border/80">
        <button
          type="button"
          onClick={() => setActiveTab("distribute")}
          className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 ${
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
          className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 ${
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
          
          {/* 1. Rasmlar Bloki (Jonli kamera va Galereya) */}
          <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-card p-3 sm:p-4 shadow-xl space-y-2.5 glass-panel">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-xs font-bold text-foreground flex items-center space-x-1.5">
                <Camera className="h-3.5 w-3.5 text-emerald-400" />
                <span>Rasmlar</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                {capturedPhotos.length}/10 rasm
              </span>
            </div>

            {capturedPhotos.length > 0 ? (
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
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-md z-10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-1 left-1.5 bg-black/70 text-[9px] font-mono font-bold text-white px-1.5 py-0.2 rounded-md">
                      #{idx + 1}
                    </span>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setIsFullscreenCameraOpen(true)}
                  className="h-20 w-16 sm:h-24 sm:w-20 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 flex flex-col items-center justify-center space-y-1 text-emerald-400 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-[10px] font-bold">+ Kamera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 w-16 sm:h-24 sm:w-20 rounded-2xl border-2 border-dashed border-border bg-background/50 hover:bg-muted/30 flex flex-col items-center justify-center space-y-1 text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-[10px] font-bold">+ Galereya</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background/40 p-3 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-center min-h-[90px] active:scale-98"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <span className="mt-1.5 text-xs font-bold text-foreground">Galereya</span>
                  <span className="text-[10px] text-muted-foreground">Fayl tanlash</span>
                </div>

                <div
                  onClick={() => {
                    if (!isCameraActive) setIsCameraActive(true);
                    setIsFullscreenCameraOpen(true);
                  }}
                  className="group cursor-pointer flex flex-col items-center justify-center rounded-2xl border border-border bg-black/60 overflow-hidden min-h-[90px] hover:border-emerald-500/50 transition-all shadow-sm active:scale-98 relative"
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover absolute inset-0 opacity-70 group-hover:opacity-90 transition-opacity"
                  />
                  <div className="relative z-10 flex items-center space-x-1.5 bg-emerald-500/90 backdrop-blur-xs px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-md">
                    <Camera className="h-3.5 w-3.5" />
                    <span>Kamerani ochish</span>
                  </div>
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

          {/* 2. Tovar Turi Tanlash (Searchable Selector & Custom Add) */}
          <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-card p-3 sm:p-4 shadow-xl space-y-2 glass-panel">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center space-x-1.5">
                <Layers className="h-3.5 w-3.5 text-teal-400" />
                <span>Tovar turi</span>
              </span>
              <button
                type="button"
                onClick={() => setShowNewTypeModal(true)}
                className="flex items-center space-x-1 text-[11px] font-semibold text-teal-400 hover:text-teal-300"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Yangi tur qo'shish</span>
              </button>
            </div>

            {/* Selected Value Bar & Click to Open Sheet */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowTypeSelectSheet(true)}
                className="flex-1 flex items-center justify-between h-12 px-4 rounded-2xl border border-border bg-background/60 hover:border-teal-500/50 text-foreground transition-all text-left font-bold text-sm uppercase tracking-wide shadow-sm"
              >
                <span className="text-teal-400">{selectedType}</span>
                <span className="text-xs text-muted-foreground font-normal">O'zgartirish ▾</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNewTypeModal(true)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground hover:text-teal-400 hover:border-teal-500/40 transition-colors shrink-0 shadow-sm"
                title="Yangi tovar turini yozish"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
          </section>

          {/* 3. Koeffitsient (Tare Deduction Chips) */}
          <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-card p-3 sm:p-4 shadow-xl space-y-2.5 glass-panel">
            <span className="text-xs font-bold text-foreground flex items-center space-x-1.5">
              <Scale className="h-3.5 w-3.5 text-emerald-400" />
              <span>Koeffitsient (Karobka ayirmasi)</span>
            </span>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: "0", label: "Ayirilmasin" },
                { id: "0.94", label: "0.94" },
                { id: "1.22", label: "1.22" },
                { id: "1.4", label: "1.4" },
                { id: "custom", label: "O'zim kiritaman" },
              ].map((opt) => {
                const isActive = coefOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setCoefOption(opt.id as any);
                      if (opt.id === "custom") {
                        setTimeout(() => customCoefInputRef.current?.focus(), 100);
                      }
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center truncate ${
                      isActive
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 border border-emerald-400"
                        : "bg-background/60 border border-border text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Coef Input Field */}
            {coefOption === "custom" && (
              <div className="pt-1">
                <input
                  ref={customCoefInputRef}
                  type="text"
                  inputMode="decimal"
                  value={customCoefValue}
                  onChange={(e) => setCustomCoefValue(e.target.value.replace(/,/g, "."))}
                  placeholder="Masalan: 1.05"
                  className="w-full h-11 px-3.5 rounded-xl border border-emerald-500/50 bg-background/80 text-sm font-mono font-bold text-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}
          </section>

          {/* 4. Og'irlik (Weight Input & Live Net Calculation) */}
          <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-card p-3 sm:p-4 shadow-xl space-y-3 glass-panel">
            <div className="flex items-center justify-between">
              <label htmlFor="dist-gross-weight" className="text-xs font-bold text-foreground">
                Umumiy og'irlik (W)
              </label>
              {grossNum > 0 && (
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Sof vazn: {computedNetWeight} kg
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="dist-gross-weight"
                ref={grossWeightInputRef}
                type="text"
                inputMode="decimal"
                value={grossWeight}
                onChange={(e) => setGrossWeight(e.target.value.replace(/,/g, "."))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveDistributionEntry();
                }}
                placeholder="0.00"
                className="w-full h-14 pl-4 pr-14 rounded-2xl border-2 border-border bg-background/80 text-xl font-bold font-mono text-foreground focus:outline-hidden focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground font-mono">
                kg
              </span>
            </div>

            {/* Live Calculation Banner */}
            {grossNum > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/60 text-[11px] font-mono text-muted-foreground">
                <span>Brutto: <strong className="text-foreground">{grossNum} kg</strong></span>
                <span>Koeffitsient: <strong className="text-foreground">-{activeCoefValue} kg</strong></span>
                <span className="text-emerald-400 font-bold">Sof: {computedNetWeight} kg</span>
              </div>
            )}
          </section>

          {/* 5. Toggles: Fast Mode & Remember Selection */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border text-xs">
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
              <span className="font-semibold text-foreground">Qiymatlarni eslab qolish</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFastMode}
                onChange={(e) => {
                  setIsFastMode(e.target.checked);
                  localStorage.setItem("mandarin_dist_fast_mode", String(e.target.checked));
                }}
                className="h-4 w-4 rounded-md border-border text-emerald-500 focus:ring-emerald-500/20"
              />
              <span className="font-semibold text-foreground flex items-center space-x-1">
                <Zap className="h-3 w-3 text-amber-400" />
                <span>Fast mode</span>
              </span>
            </label>
          </div>

          {/* 6. Saqlash Tugmasi */}
          <button
            type="button"
            onClick={handleSaveDistributionEntry}
            className="w-full flex items-center justify-center space-x-2 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-base shadow-xl shadow-emerald-500/30 active:scale-98 transition-all"
          >
            <Check className="h-5 w-5 stroke-[2.5]" />
            <span>Saqlash</span>
          </button>
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
                className="text-[11px] text-teal-400 font-semibold hover:underline"
              >
                {loadingInventory ? "Yuklanmoqda..." : "Yangilash"}
              </button>
            </div>

            {inventoryList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Hozircha hech qanday tovar turi bo'yicha qoldiq yo'q.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {inventoryList.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 rounded-xl border border-border bg-background/50 space-y-1 shadow-sm"
                  >
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {inv.tovar_turi}
                    </span>
                    <p className="text-base font-extrabold text-foreground font-mono">
                      {inv.weight.toFixed(2)} kg
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* FULLSCREEN ZERO-LATENCY CAMERA MODAL                      */}
      {/* ========================================================= */}
      {isFullscreenCameraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          {/* Viewfinder Container */}
          <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center">
            <video
              ref={fullscreenVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover absolute inset-0"
            />
            {isShutterFlashing && (
              <div className="absolute inset-0 bg-white/70 pointer-events-none animate-out fade-out duration-150" />
            )}
            {/* Top controls: Camera Flip & Close */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <button
                type="button"
                onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/60 backdrop-blur-md text-white border border-white/20 active:scale-95"
                title="Kamerani almashtirish"
              >
                <RefreshCw className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreenCameraOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/60 backdrop-blur-md text-white border border-white/20 active:scale-95"
                title="Yopish"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Shutter Bar with PROMINENT, LARGE SHUTTER BUTTON */}
          <div className="w-full bg-black/90 backdrop-blur-xl px-6 py-6 pb-10 flex items-center justify-around z-20 border-t border-white/10">
            {/* Gallery shortcut */}
            <button
              type="button"
              onClick={() => {
                setIsFullscreenCameraOpen(false);
                fileInputRef.current?.click();
              }}
              className="flex flex-col items-center space-y-1 text-white/80 hover:text-white"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 border border-white/20">
                <ImageIcon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold">Galereya</span>
            </button>

            {/* LARGE SHUTTER BUTTON (Thumb-friendly 80-96px) */}
            <button
              type="button"
              onClick={() => handleCapturePhoto(true)}
              className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border-4 sm:border-[5px] border-white/95 bg-white/10 backdrop-blur-md p-1.5 active:scale-90 transition-transform shadow-2xl shadow-black/80"
              title="Kadr olish"
            >
              <div className="h-full w-full rounded-full bg-emerald-500 active:bg-emerald-400 shadow-lg shadow-emerald-500/60 flex items-center justify-center text-white font-black font-mono text-sm sm:text-base border-2 border-white/30">
                {capturedPhotos.length > 0 ? `+${capturedPhotos.length + 1}` : ""}
              </div>
            </button>

            {/* Done button */}
            <button
              type="button"
              onClick={() => setIsFullscreenCameraOpen(false)}
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
                        ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                        : "hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <span>{t}</span>
                    {selectedType === t && <Check className="h-4 w-4 text-teal-400" />}
                  </button>
                ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowTypeSelectSheet(false);
                setShowNewTypeModal(true);
              }}
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border border-dashed border-teal-500/40 text-teal-400 text-xs font-bold hover:bg-teal-500/10 transition-colors"
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
                className="px-4 py-2 rounded-xl bg-teal-500 text-xs font-bold text-white hover:bg-teal-600 transition-colors shadow-md"
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
