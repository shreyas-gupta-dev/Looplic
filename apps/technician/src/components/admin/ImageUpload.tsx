import { useState } from "react";
import { ImagePlus, Link2, X, Loader2 } from "lucide-react";

type ImageUploadProps = {
  preview: string | null;
  onFileSelect: (file: File) => void;
  onUrlSet: (url: string) => void;
  onClear: () => void;
  label?: string;
};

const ImageUpload = ({ preview, onFileSelect, onUrlSet, onClear, label = "Upload image (optional)" }: ImageUploadProps) => {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);

  const handleUrlSubmit = () => {
    const url = urlInput.trim();
    if (!url) return;
    setUrlLoading(true);
    // Validate URL by trying to load it
    const img = new Image();
    img.onload = () => { onUrlSet(url); setUrlLoading(false); };
    img.onerror = () => { onUrlSet(url); setUrlLoading(false); };
    img.src = url;
  };

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setMode("file")} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${mode === "file" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>
          <ImagePlus className="size-3 inline mr-1" />Upload
        </button>
        <button type="button" onClick={() => setMode("url")} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${mode === "url" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>
          <Link2 className="size-3 inline mr-1" />URL
        </button>
      </div>

      {preview && (
        <div className="relative inline-block">
          <img src={preview} alt="" className="size-14 rounded-xl object-contain border border-border" />
          <button type="button" onClick={onClear} className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
            <X className="size-3" />
          </button>
        </div>
      )}

      {mode === "file" ? (
        <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-xl p-3 hover:border-primary/40 transition-colors">
          <ImagePlus className="size-5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground font-medium truncate">{label}</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }} />
        </label>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="Paste image URL..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            className="flex-1 text-xs border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="button" onClick={handleUrlSubmit} disabled={urlLoading || !urlInput.trim()} className="px-3 py-2 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-50 flex items-center gap-1">
            {urlLoading ? <Loader2 className="size-3 animate-spin" /> : <Link2 className="size-3" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
