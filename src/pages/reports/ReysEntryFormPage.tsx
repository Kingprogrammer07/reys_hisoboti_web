import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Zap, 
  Camera, 
  CameraOff, 
  Image as ImageIcon, 
  Check, 
  X, 
  Scale, 
  Hash, 
  Type, 
  CheckCircle2, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  ListOrdered, 
  ZoomIn,
  Trash2,
  Plus
} from "lucide-react";
import { fetchEntries, createEntry, deleteEntry, getReys } from "../../api";
import { saveToOfflineQueue } from "../../utils/offlineQueue";

export interface SavedEntryItem {
  id: number;
  boxCode: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  photoUrl?: string;
  photoUrls?: string[];
  createdAt: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  top: "TOP",
  top_dan_chiqgan: "TOP'dan chiqgan",
  bizdan_chiqgan: "Bizdan chiqgan",
  bizda_qoladigan: "Bizda qoladigan",
  umumiy_hisobot: "Umumiy hisobot",
};

// ROUTE: /reports/reys/:reysId/entry/:categoryId
export const ReysEntryFormPage: React.FC = () => {
  const { reysId, categoryId = "top" } = useParams<{ reysId: string; categoryId: string }>();

  const [reys, setReys] = useState<{ id: number; code: string; custom_name?: string } | null>(null);

  useEffect(() => {
    if (reysId) {
      getReys(Number(reysId))
        .then((r) => {
          if (r) setReys(r);
        })
        .catch(() => {});
    }
  }, [reysId]);

  const categoryTitle = CATEGORY_NAMES[categoryId] || "TOP";

  // Storage key for persisting uploaded entries across sessions
  const storageKey = `mandarin_entries_${reysId}_${categoryId}`;

  // Fast Mode State (Persisted in localStorage)
  const [isFastMode, setIsFastMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("fast_mode_pref");
    return saved !== null ? saved === "true" : true;
  });

  // Box Code Input State & Numeric Only Toggle (Default: ONLY NUMBERS)
  const [isNumericOnly, setIsNumericOnly] = useState<boolean>(true);
  const [boxCode, setBoxCode] = useState<string>("");
  const boxCodeInputRef = useRef<HTMLInputElement>(null);

  // Gross Weight State (iOS Friendly with comma/dot normalization)
  const [grossWeight, setGrossWeight] = useState<string>("");
  const grossWeightInputRef = useRef<HTMLInputElement>(null);

  // Karobka Og'irligi Radio Options: Ayirilmasin, 1, 1.22, 1.4, O'zim kiritaman
  const [tareOption, setTareOption] = useState<"0" | "1" | "1.22" | "1.4" | "custom">("1.22");
  const [customTareValue, setCustomTareValue] = useState<string>(() => {
    return localStorage.getItem("mandarin_saved_custom_tare") || "";
  });
  const customTareInputRef = useRef<HTMLInputElement>(null);

  // Modal asking if custom tare weight should be saved for next time
  const [showTareConfirmModal, setShowTareConfirmModal] = useState<boolean>(false);

  // Camera & Media Stream State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // MULTI-PHOTO STATE (1 or more photos per box)
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isShutterFlashing, setIsShutterFlashing] = useState<boolean>(false);

  // Fullscreen Photo Lightbox State for enlarging captured photo
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // FULLSCREEN CAMERA STATE (Tapping camera opens full-screen viewfinder)
  const [isFullscreenCameraOpen, setIsFullscreenCameraOpen] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Saved Entries List initialized from localStorage or empty
  const [savedEntries, setSavedEntries] = useState<SavedEntryItem[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Persist saved entries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(savedEntries));
    } catch (e) {
      console.error(e);
    }
  }, [savedEntries, storageKey]);

  // Load entries from Backend API on mount
  useEffect(() => {
    if (reysId) {
      fetchEntries(Number(reysId))
        .then((res) => {
          if (res && Array.isArray(res.items)) {
            setSavedEntries(res.items);
          }
        })
        .catch((err) => console.warn("Could not load live entries from API", err));
    }
  }, [reysId]);

  // Compute Active Tare Weight Number
  const activeTareWeight: number = tareOption === "custom" 
    ? (Number(customTareValue) || 0)
    : Number(tareOption);

  // Compute Net Weight (Toza vazn)
  const grossNum = Number(grossWeight) || 0;
  const computedNetWeight = Math.max(0, grossNum > 0 ? Number((grossNum - activeTareWeight).toFixed(2)) : 0);

  // 1. Initialize Camera in Background for Zero-Latency Capture
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
        console.warn("Camera stream unavailable or permission denied:", err);
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

  // Ensure Video Stream stays bound to both mini & fullscreen video elements
  useEffect(() => {
    if (cameraStream) {
      if (videoRef.current) videoRef.current.srcObject = cameraStream;
      if (fullscreenVideoRef.current) fullscreenVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isFullscreenCameraOpen]);

  // Fast Mode Initial Auto-Focus on Karobka Kodi
  useEffect(() => {
    if (isFastMode) {
      boxCodeInputRef.current?.focus();
    }
  }, [isFastMode]);

  // Hide global mobile navigation and lock background when camera or lightbox is open
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


  // Toggle Camera Stream On/Off
  const handleToggleCamera = () => {
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
  };

  // Flip Camera Front / Back
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Capture Still Frame from Camera Stream (Supports continuous multi-photo capture)
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
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        
        // Append to multi-photo collection
        setCapturedPhotos((prev) => [...prev, dataUrl]);

        // Visual flash feedback
        setIsShutterFlashing(true);
        setTimeout(() => setIsShutterFlashing(false), 200);

        if (!keepCameraOpen && isFullscreenCameraOpen) {
          setIsFullscreenCameraOpen(false);
        }

        // FAST MODE: Focus on Karobka Kodi input if camera closed
        if (!keepCameraOpen) {
          setTimeout(() => {
            if (isFastMode && boxCodeInputRef.current) {
              boxCodeInputRef.current.focus();
            }
          }, 150);
        }

        return dataUrl;
      }
    }
    return null;
  };

  // Remove a single photo from collection
  const handleRemovePhoto = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Gallery File Picker Handler (Supports multiple files simultaneously)
  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      const newPhotos: string[] = [];
      let processed = 0;

      fileList.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            newPhotos.push(reader.result as string);
          }
          processed++;
          if (processed === fileList.length) {
            setCapturedPhotos((prev) => [...prev, ...newPhotos]);
            // FAST MODE: Focus on Karobka Kodi input
            setTimeout(() => {
              if (isFastMode && boxCodeInputRef.current) {
                boxCodeInputRef.current.focus();
              }
            }, 150);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  // Box Code Input Change (Enforcing Number-Only when Toggle is Active)
  const handleBoxCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (isNumericOnly) {
      val = val.replace(/\D/g, "");
    }
    setBoxCode(val);
  };

  // Gross Weight Input Change with iOS Friendly Normalization (Comma -> Dot)
  const handleGrossWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/,/g, ".");
    if (/^\d*\.?\d*$/.test(val)) {
      setGrossWeight(val);
    }
  };

  // Handle Tare Radio Selection (Auto-focus if "O'zim kiritaman" is clicked)
  const handleTareOptionSelect = (option: "0" | "1" | "1.22" | "1.4" | "custom") => {
    setTareOption(option);
    if (option === "custom") {
      const savedCustom = localStorage.getItem("mandarin_saved_custom_tare");
      if (savedCustom && !customTareValue) {
        setCustomTareValue(savedCustom);
      }
      setTimeout(() => {
        customTareInputRef.current?.focus();
      }, 50);
    }
  };

  // Save Entry Handler
  const handleSaveEntry = () => {
    if (!boxCode.trim()) {
      alert("Iltimos, karobka kodini kiriting!");
      boxCodeInputRef.current?.focus();
      return;
    }

    if (!grossWeight || Number(grossWeight) <= 0) {
      alert("Iltimos, yuk og'irligini to'g'ri kiriting!");
      grossWeightInputRef.current?.focus();
      return;
    }

    // If custom tare is selected and differs from saved, ask user with sleek confirmation dialog
    const savedCustom = localStorage.getItem("mandarin_saved_custom_tare");
    if (tareOption === "custom" && customTareValue && customTareValue !== savedCustom) {
      setShowTareConfirmModal(true);
      return;
    }

    executeSaveEntry();
  };

  const dataURLtoBlob = (dataurl: string): Blob => {
    try {
      const arr = dataurl.split(",");
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch {
      return new Blob([], { type: "image/jpeg" });
    }
  };

  // Execute actual entry saving
  const executeSaveEntry = async () => {
    let finalPhotos = [...capturedPhotos];
    // If no photos attached yet and camera is actively running, auto-capture a shot
    if (finalPhotos.length === 0 && isCameraActive) {
      const autoShot = handleCapturePhoto(false);
      if (autoShot) {
        finalPhotos = [autoShot];
      }
    }

    const currentBoxCode = boxCode.trim();
    const currentGross = Number(grossWeight);

    let savedItem: SavedEntryItem;
    try {
      const photoBlobs = finalPhotos.map((p) => dataURLtoBlob(p));
      const res = await createEntry(
        {
          reys_id: Number(reysId),
          box_code: currentBoxCode,
          tovar_turi: categoryTitle,
          gross_weight: currentGross,
          tare_weight: activeTareWeight,
          coefficient_mode: tareOption === "0" ? "none" : "box",
        },
        photoBlobs
      );
      savedItem = res;
    } catch (err: any) {
      console.warn("API save failed, saving to IndexedDB offline queue", err);
      try {
        const photoBlobs = finalPhotos.map((p) => dataURLtoBlob(p));
        await saveToOfflineQueue(
          {
            reys_id: Number(reysId),
            box_code: currentBoxCode,
            tovar_turi: categoryTitle,
            gross_weight: currentGross,
            tare_weight: activeTareWeight,
            coefficient_mode: tareOption === "0" ? "none" : "box",
          },
          photoBlobs
        );
      } catch (idbErr) {
        console.error("Failed to save to IndexedDB offline queue:", idbErr);
      }

      savedItem = {
        id: -Date.now(),
        boxCode: currentBoxCode,
        grossWeight: currentGross,
        tareWeight: activeTareWeight,
        netWeight: computedNetWeight,
        photoUrl: finalPhotos[0] || undefined,
        photoUrls: finalPhotos.length > 0 ? finalPhotos : undefined,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };
      setSuccessToast(`✓ Karobka #${currentBoxCode} oflayn saqlandi (Internet ulanganda serverga yuboriladi)`);
    }

    setSavedEntries([savedItem, ...savedEntries]);
    setSuccessToast(`✓ Karobka #${currentBoxCode} saqlandi (${savedItem.netWeight} kg toza, ${finalPhotos.length} ta rasm)`);
    setTimeout(() => setSuccessToast(null), 3000);

    // Reset Form Fields
    setBoxCode("");
    setGrossWeight("");
    setCapturedPhotos([]);

    // In Fast Mode: Keep selected Tare Option, auto-focus back on Karobka Kodi
    if (isFastMode) {
      setTimeout(() => {
        boxCodeInputRef.current?.focus();
      }, 100);
    }
  };

  // Confirm custom tare save decision
  const handleConfirmTareSave = (shouldSave: boolean) => {
    setShowTareConfirmModal(false);
    if (shouldSave && customTareValue) {
      localStorage.setItem("mandarin_saved_custom_tare", customTareValue);
    }
    executeSaveEntry();
  };

  return (
    <div className="space-y-3.5 sm:space-y-5 pb-8 sm:pb-12 max-w-4xl mx-auto px-2 sm:px-4">
      
      {/* 1. HEADER (ULTRA-RESPONSIVE DOWN TO 320px) */}
      <header className="sticky top-0 z-30 flex items-center justify-between rounded-2xl border border-border bg-card/95 backdrop-blur-md px-2.5 sm:px-4 py-2.5 sm:py-3 shadow-md glass-panel">
        
        {/* Left: Back Button */}
        <Link
          to={`/reports/reys/${reysId}`}
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-accent transition-colors shrink-0"
          title="Ortga qaytish"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {/* Center: Category Name & Reys Code */}
        <div className="text-center px-1 min-w-0">
          <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-foreground tracking-wide flex items-center justify-center space-x-1 sm:space-x-1.5 truncate">
            <span className="truncate">{categoryTitle}</span>
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20 font-mono shrink-0">
              {reys?.code || `REYS-${reysId}`}
            </span>
          </h1>
          <p className="text-[10px] text-muted-foreground truncate hidden xs:block">Kiritish formasi va tezkor qayd</p>
        </div>

        {/* Right Actions: Dedicated Link to /entry/:catId/list + Fast Mode + Camera Toggle */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          
          {/* DEDICATED PAGE LINK FOR YUKLANGANLAR */}
          <Link
            to={`/reports/reys/${reysId}/entry/${categoryId}/list`}
            className="flex items-center space-x-1 px-2 py-1.5 sm:px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-[11px] sm:text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
            title="Yuklangan karobkalar ro'yxati sahifasiga o'tish"
          >
            <ListOrdered className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Yuklanganlar</span>
            <span className="font-mono font-bold">({savedEntries.length})</span>
          </Link>

          {/* Fast Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isFastMode;
              setIsFastMode(next);
              localStorage.setItem("fast_mode_pref", String(next));
            }}
            className={`flex items-center space-x-1 px-2 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all ${
              isFastMode
                ? "bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm shadow-amber-500/10"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
            title="Tezkor Rejim: Avtomatik fokus va doimiy kamera"
          >
            <Zap className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isFastMode ? "text-amber-400 fill-amber-400" : ""}`} />
            <span className="hidden md:inline">Tezkor</span>
          </button>

          {/* Camera Close / Toggle Button */}
          <button
            type="button"
            onClick={handleToggleCamera}
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

      {/* Success Toast */}
      {successToast && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. YUKLANMALAR (KOMPAKT VA BIR NECHTA RASM O'LISHNI QO'LLAB-QUVVATLAYDI) */}
      <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-card p-3 sm:p-4 shadow-xl space-y-2.5 glass-panel">
        
        {/* Compact Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <span className="text-xs font-bold text-foreground flex items-center space-x-1.5">
            <Camera className="h-3.5 w-3.5 text-emerald-400" />
            <span>Yuklanmalar</span>
          </span>
          
          <div className="flex items-center space-x-2">
            {capturedPhotos.length > 0 ? (
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                <span>{capturedPhotos.length} ta rasm</span>
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

        {/* Content: If photos captured -> Thumbnail strip; If none -> Compact Camera & Gallery buttons */}
        {capturedPhotos.length > 0 ? (
          <div className="space-y-2">
            {/* Horizontal Scrollable Thumbnail Strip with Delete & Zoom */}
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

                  {/* Photo Index Badge */}
                  <span className="absolute bottom-1 left-1.5 bg-black/70 backdrop-blur-xs text-[9px] font-mono font-bold text-white px-1.5 py-0.2 rounded-md border border-white/20 pointer-events-none">
                    #{idx + 1}
                  </span>

                  {/* Zoom Overlay on Hover */}
                  <div
                    onClick={() => setViewingPhoto(photo)}
                    className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  >
                    <ZoomIn className="h-4 w-4 text-white drop-shadow" />
                  </div>

                  {/* Delete Photo Button */}
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

              {/* Add More Photos Triggers (Camera & Gallery) */}
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
          /* Empty State: Sleek Compact 2-Card Row */
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            
            {/* CARD 1: GALEREYA (Supports multiple files) */}
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

            {/* CARD 2: KAMERA (CLICK OPENS FULLSCREEN CAMERA) */}
            <div
              onClick={() => {
                if (!isCameraActive) setIsCameraActive(true);
                setIsFullscreenCameraOpen(true);
              }}
              className="group relative cursor-pointer flex flex-col items-center justify-center rounded-2xl border border-border bg-black/60 overflow-hidden min-h-[90px] hover:border-emerald-500/50 transition-all shadow-sm active:scale-98"
              title="Kamerani butun ekranga ochish uchun bosing"
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
                    <span>Kamera ochish</span>
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

        {/* Hidden Multiple File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleGalleryFileSelect}
        />

        {/* Hidden Canvas for Instant Snapshot Frame Capturing */}
        <canvas ref={canvasRef} className="hidden" />
      </section>

      {/* 3. MAIN FORM INPUTS (OPTIMIZED FOR 320px) */}
      <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-card p-3.5 sm:p-5 shadow-xl space-y-4 sm:space-y-5 glass-panel">
        
        {/* INPUT 1: KAROBKA KODI WITH NUMERIC / ALPHANUMERIC TOGGLE */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center space-x-1.5">
              <Hash className="h-3.5 w-3.5 text-emerald-400" />
              <span>Karobka kodi:</span>
            </label>

            {/* Toggle: Number Only (Default) vs Alphanumeric */}
            <button
              type="button"
              onClick={() => {
                const next = !isNumericOnly;
                setIsNumericOnly(next);
                if (next) {
                  setBoxCode(boxCode.replace(/\D/g, ""));
                }
              }}
              className={`flex items-center space-x-1 rounded-xl px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold transition-all border ${
                isNumericOnly
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                  : "bg-background/60 border-border text-muted-foreground hover:text-foreground"
              }`}
              title={isNumericOnly ? "Hozir: Faqat raqam qabul qilinadi" : "Hozir: Harf va raqam qabul qilinadi"}
            >
              {isNumericOnly ? (
                <>
                  <Hash className="h-3 w-3" />
                  <span>Faqat raqam</span>
                </>
              ) : (
                <>
                  <Type className="h-3 w-3" />
                  <span>Harf & Raqam</span>
                </>
              )}
            </button>
          </div>

          <input
            ref={boxCodeInputRef}
            type="text"
            inputMode={isNumericOnly ? "numeric" : "text"}
            pattern={isNumericOnly ? "[0-9]*" : undefined}
            value={boxCode}
            onChange={handleBoxCodeChange}
            placeholder={isNumericOnly ? "Masalan: 104" : "Masalan: KB-104"}
            className="w-full rounded-2xl border border-input bg-background px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-foreground font-mono font-bold tracking-wider focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                grossWeightInputRef.current?.focus();
              }
            }}
          />
        </div>

        {/* INPUT 2: OG'IRLIK — iOS FRIENDLY DECIMAL INPUT */}
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
              onChange={handleGrossWeightChange}
              placeholder="Masalan: 19.85"
              className="w-full rounded-2xl border border-input bg-background pl-3.5 sm:pl-4 pr-12 py-2.5 sm:py-3 text-sm sm:text-base text-foreground font-mono font-bold focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveEntry();
                }
              }}
            />
            <span className="absolute right-4 top-3 text-xs font-extrabold text-muted-foreground">
              kg
            </span>
          </div>
        </div>

        {/* INPUT 3 / RADIO SELECTION: KAROBKA OG'IRLIGI */}
        <div className="space-y-2 pt-1 border-t border-border/50">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground">
              Karobka og'irligi:
            </label>
            <span className="text-[11px] font-semibold text-emerald-400 font-mono">
              Tanlangan: {activeTareWeight} kg
            </span>
          </div>

          {/* Radio Buttons (Grid 3 cols on mobile, 5 on desktop - fits 320px) */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {[
              { key: "0", label: "Ayirilmasin" },
              { key: "1", label: "1 kg" },
              { key: "1.22", label: "1.22 kg" },
              { key: "1.4", label: "1.4 kg" },
              { key: "custom", label: "O'zim kiritaman" },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleTareOptionSelect(opt.key as any)}
                className={`py-2 px-1 text-center rounded-xl text-[11px] sm:text-xs font-bold transition-all border ${
                  tareOption === opt.key
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "bg-background/60 border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Conditional Custom Tare Input */}
          {tareOption === "custom" && (
            <div className="pt-1.5 animate-in fade-in duration-200">
              <label className="text-[10px] text-muted-foreground block mb-1">
                Maxsus karobka og'irligini kiriting:
              </label>
              <div className="relative flex items-center">
                <input
                  ref={customTareInputRef}
                  type="text"
                  inputMode="decimal"
                  value={customTareValue}
                  onChange={(e) => {
                    const val = e.target.value.replace(/,/g, ".");
                    if (/^\d*\.?\d*$/.test(val)) {
                      setCustomTareValue(val);
                    }
                  }}
                  placeholder="Masalan: 0.95"
                  className="w-full rounded-2xl border border-input bg-background pl-3.5 pr-20 py-2 sm:py-2.5 text-xs sm:text-sm text-foreground font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveEntry();
                    }
                  }}
                />

                {/* Right side inside input: "kg" label + Tick/Send Save button */}
                <div className="absolute right-1.5 flex items-center space-x-1">
                  <span className="text-[11px] font-bold text-muted-foreground">kg</span>
                  <button
                    type="button"
                    onClick={handleSaveEntry}
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

        {/* CALCULATED NET WEIGHT PREVIEW BADGE */}
        {grossNum > 0 && (
          <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 sm:p-3 text-xs">
            <span className="text-muted-foreground font-medium">Toza vazn:</span>
            <strong className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">
              {computedNetWeight.toLocaleString()} kg
            </strong>
          </div>
        )}

        {/* 4. MAIN SAQLASH BUTTON */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleSaveEntry}
            className="w-full flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 sm:py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-xl shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600 active:scale-98 transition-all"
          >
            <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
            <span>Saqlash {isFastMode ? "(Tezkor rejim faol)" : ""}</span>
          </button>
        </div>

      </section>

      {/* 5. FULLSCREEN CAMERA MODAL (MULTI-SHOT CONTINUOUS CAPTURE - Z-[100] ABOVE ALL NAVS) */}
      {isFullscreenCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col justify-between select-none">
          
          {/* Top Camera Controls Bar */}
          <div className="relative z-20 flex items-center justify-between px-3 sm:px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
            <button
              type="button"
              onClick={() => {
                setIsFullscreenCameraOpen(false);
                if (isFastMode) setTimeout(() => boxCodeInputRef.current?.focus(), 150);
              }}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md active:scale-95 transition-transform"
              title="Kameradan chiqish"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <div className="text-center">
              <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                {categoryTitle}
              </span>
              <p className="text-[10px] text-emerald-400 font-semibold">
                {capturedPhotos.length > 0 
                  ? `📸 ${capturedPhotos.length} ta kadr olindi`
                  : "Tarozi yoki karobkani to'g'irlang"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleFlipCamera}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md active:scale-95 transition-transform"
              title="Kamerani aylantirish (Old/Orqa)"
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Center Viewfinder (Clean Video Feed) */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            <video
              ref={fullscreenVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover absolute inset-0"
            />
            {/* Shutter Flash Animation */}
            {isShutterFlashing && (
              <div className="absolute inset-0 bg-white/70 pointer-events-none animate-out fade-out duration-150" />
            )}
          </div>

          {/* Bottom Area: Live Mini Strip of Captured Shots + Controls Bar (With pb-6 for Mobile Home Indicator) */}
          <div className="relative z-20 flex flex-col space-y-2.5 p-3 sm:p-5 pb-6 sm:pb-8 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
            
            {/* Captured Photos Preview Strip in Viewfinder */}
            {capturedPhotos.length > 0 && (
              <div className="flex items-center justify-center space-x-2 overflow-x-auto py-1">
                {capturedPhotos.map((photo, i) => (
                  <div key={i} className="relative h-11 w-11 rounded-xl overflow-hidden border border-emerald-400/80 shrink-0 shadow-lg">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-white bg-black/60 px-1 rounded">
                      #{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Shutter Bar */}
            <div className="flex items-center justify-around">
              {/* Gallery Shortcut */}
              <button
                type="button"
                onClick={() => {
                  setIsFullscreenCameraOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex flex-col items-center space-y-1 text-white/80 hover:text-white active:scale-95 transition-transform"
              >
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-white/10 border border-white/20">
                  <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="text-[10px] font-semibold">Galereya</span>
              </button>

              {/* BIG CIRCULAR SHUTTER CAPTURE BUTTON */}
              <button
                type="button"
                onClick={() => handleCapturePhoto(true)}
                className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border-4 sm:border-[5px] border-white/95 bg-white/10 backdrop-blur-md p-1.5 active:scale-90 transition-transform shadow-2xl shadow-black/80"
                title="Kadr olish (bir nechta olish mumkin)"
              >
                <div className="h-full w-full rounded-full bg-emerald-500 active:bg-emerald-400 shadow-lg shadow-emerald-500/60 flex items-center justify-center text-white font-black font-mono text-sm sm:text-base border-2 border-white/30">
                  {capturedPhotos.length > 0 ? `+${capturedPhotos.length + 1}` : ""}
                </div>
              </button>

              {/* Done / Close Button */}
              {capturedPhotos.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsFullscreenCameraOpen(false);
                    if (isFastMode) setTimeout(() => boxCodeInputRef.current?.focus(), 150);
                  }}
                  className="flex flex-col items-center space-y-1 text-emerald-400 hover:text-emerald-300 active:scale-95 transition-transform"
                >
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                    <Check className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-bold">Tayyor ({capturedPhotos.length})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFullscreenCameraOpen(false)}
                  className="flex flex-col items-center space-y-1 text-white/80 hover:text-white active:scale-95 transition-transform"
                >
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-white/10 border border-white/20">
                    <Minimize2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="text-[10px] font-semibold">Yopish</span>
                </button>
              )}
            </div>

          </div>

        </div>
      )}

      {/* 6. FULLSCREEN PHOTO LIGHTBOX MODAL (Z-[90]) */}
      {viewingPhoto && (
        <div 
          onClick={() => setViewingPhoto(null)}
          className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 cursor-pointer animate-in fade-in duration-150"
        >
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setViewingPhoto(null)}
              className="absolute -top-10 sm:-top-12 right-0 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              title="Yopish"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <img 
              src={viewingPhoto} 
              alt="Kattalashtirilgan rasm" 
              className="max-h-[80vh] max-w-full rounded-2xl object-contain border border-white/20 shadow-2xl" 
            />
            <div className="mt-2.5 flex items-center space-x-3">
              <span className="text-[11px] sm:text-xs text-white/70">Yopish uchun ekranning istalgan joyiga bosing</span>
              <button
                type="button"
                onClick={() => setViewingPhoto(null)}
                className="px-2.5 py-1 rounded-xl bg-white/20 text-white text-[11px] sm:text-xs font-semibold hover:bg-white/30"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CONFIRM CUSTOM TARE SAVE DIALOG (Z-[80], 320px COMPATIBLE) */}
      {showTareConfirmModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 animate-in fade-in duration-150">

          <div className="w-full max-w-[300px] sm:max-w-sm rounded-3xl border border-white/10 bg-card p-5 sm:p-6 shadow-2xl space-y-3.5 text-center glass-panel">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Scale className="h-5 w-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-foreground">Karobka og'irligi saqlansinmi?</h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Kiritilgan <strong className="text-emerald-400 font-mono font-bold">{customTareValue} kg</strong> karobka og'irligi keyingi safar uchun ham saqlanib qolsinmi?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleConfirmTareSave(false)}
                className="rounded-2xl border border-border bg-background py-2 text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-95"
              >
                Faqat 1 marta
              </button>

              <button
                type="button"
                onClick={() => handleConfirmTareSave(true)}
                className="rounded-2xl bg-emerald-500 py-2 text-xs font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-md shadow-emerald-500/25"
              >
                Ha, saqlansin
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
