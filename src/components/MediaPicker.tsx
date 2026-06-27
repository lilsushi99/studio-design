import React, { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, Grid, Check, Copy, AlertCircle, FileText, Music, Film, Image as ImageIcon, Trash2, ArrowLeft, RefreshCw } from 'lucide-react';
import { MediaItem } from '../types';

interface MediaPickerProps {
  value: string;
  onChange: (url: string) => void;
  mediaLibrary: MediaItem[];
  type?: 'image' | 'video' | 'audio';
  onRefreshMedia?: () => void;
}

export default function MediaPicker({ value, onChange, mediaLibrary, type = 'image', onRefreshMedia }: MediaPickerProps) {
  // We default to 'preview' if value is present, otherwise we ask the user to 'choose' a source
  const [sourceMode, setSourceMode] = useState<'choose' | 'upload' | 'library' | 'url' | 'preview'>(
    value ? 'preview' : 'choose'
  );
  const [urlInput, setUrlInput] = useState(value || '');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync mode if value changes externally
  useEffect(() => {
    if (value) {
      setSourceMode('preview');
      setUrlInput(value);
    } else {
      setSourceMode('choose');
    }
  }, [value]);

  const filteredLibrary = mediaLibrary.filter(item => {
    if (type === 'image') return item.type === 'image';
    if (type === 'video') return item.type === 'video';
    if (type === 'audio') return item.type === 'audio';
    return true;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    setProgress(5);

    // Simulate real upload progress bar
    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 85) {
          clearInterval(progressInterval);
          return p;
        }
        return p + Math.floor(Math.random() * 15) + 5;
      });
    }, 120);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      let result;
      try {
        result = await response.json();
      } catch (jsonErr) {
        const rawText = await response.text();
        throw new Error(rawText.substring(0, 150) || 'Upload server error (invalid response format).');
      }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload file.');
      }
      if (result.success && result.url) {
        setProgress(100);
        setTimeout(() => {
          onChange(result.url);
          setUrlInput(result.url);
          setSourceMode('preview');
          if (onRefreshMedia) onRefreshMedia();
          setUploading(false);
          setProgress(0);
        }, 200);
      } else {
        throw new Error(result.message || 'Upload returned unsuccessful state.');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadError(err.message || 'Error uploading file.');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    
    if (urlInput.startsWith('/storage/')) {
      onChange(urlInput);
      setSourceMode('preview');
      return;
    }

    setUploading(true);
    setUploadError('');
    setProgress(20);

    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) {
          clearInterval(progressInterval);
          return p;
        }
        return p + 10;
      });
    }, 100);

    try {
      const response = await fetch('/api/media/download-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });

      clearInterval(progressInterval);

      if (response.ok) {
        const result = await response.json();
        setProgress(100);
        setTimeout(() => {
          if (result.success && result.url) {
            onChange(result.url);
            if (onRefreshMedia) onRefreshMedia();
          } else {
            onChange(urlInput);
          }
          setSourceMode('preview');
          setUploading(false);
          setProgress(0);
        }, 200);
      } else {
        setProgress(100);
        setTimeout(() => {
          onChange(urlInput);
          setSourceMode('preview');
          setUploading(false);
          setProgress(0);
        }, 200);
      }
    } catch (err) {
      clearInterval(progressInterval);
      onChange(urlInput);
      setSourceMode('preview');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-4">
      
      {/* 1. PREVIEW MODE */}
      {sourceMode === 'preview' && value && (
        <div className="space-y-3">
          <div className="relative rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden flex items-center justify-center max-h-[220px] p-2">
            {type === 'image' && (
              <img
                src={value}
                alt="Selected Asset"
                className="max-h-[180px] w-auto object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            )}
            {type === 'video' && (
              <video
                src={value}
                controls
                className="max-h-[180px] w-full rounded-lg"
              />
            )}
            {type === 'audio' && (
              <div className="py-6 flex flex-col items-center space-y-2 w-full">
                <Music className="text-orange-400" size={28} />
                <audio src={value} controls className="w-full max-w-xs" />
              </div>
            )}
            <div className="absolute top-2 right-2 flex space-x-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(value);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="bg-neutral-900/80 hover:bg-neutral-900 p-2 text-white rounded-lg border border-neutral-800 transition-colors cursor-pointer"
                title="Copy Path URL"
              >
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                onChange('');
                setSourceMode('choose');
              }}
              className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer"
            >
              <Trash2 size={13} />
              <span>REMOVE IMAGE</span>
            </button>
            <button
              onClick={() => setSourceMode('choose')}
              className="flex items-center space-x-1.5 px-3 py-2 bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-white rounded-xl text-xs font-mono font-medium transition-all cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>REPLACE IMAGE</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. CHOOSE SOURCE MODE */}
      {sourceMode === 'choose' && (
        <div className="space-y-3">
          <span className="font-mono text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">CHOOSE SOURCE</span>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSourceMode('upload')}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-orange-500/40 text-center transition-all group cursor-pointer"
            >
              <Upload className="text-neutral-400 group-hover:text-orange-400 mb-2 transition-colors" size={18} />
              <span className="text-[10px] font-sans font-medium text-white">Upload Device</span>
            </button>
            <button
              onClick={() => setSourceMode('library')}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-orange-500/40 text-center transition-all group cursor-pointer"
            >
              <Grid className="text-neutral-400 group-hover:text-orange-400 mb-2 transition-colors" size={18} />
              <span className="text-[10px] font-sans font-medium text-white">Media Library</span>
            </button>
            <button
              onClick={() => setSourceMode('url')}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-orange-500/40 text-center transition-all group cursor-pointer"
            >
              <LinkIcon className="text-neutral-400 group-hover:text-orange-400 mb-2 transition-colors" size={18} />
              <span className="text-[10px] font-sans font-medium text-white">Paste URL</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. UPLOAD MODE */}
      {sourceMode === 'upload' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-neutral-400 uppercase tracking-wider">UPLOAD FROM LOCAL DEVICE</span>
            <button
              onClick={() => setSourceMode(value ? 'preview' : 'choose')}
              className="text-neutral-500 hover:text-white flex items-center space-x-1 text-[10px] font-mono cursor-pointer"
            >
              <ArrowLeft size={11} />
              <span>BACK</span>
            </button>
          </div>

          {!uploading ? (
            <label className="flex flex-col items-center justify-center w-full h-28 border border-dashed border-neutral-800 hover:border-orange-500 rounded-xl bg-neutral-950 cursor-pointer group transition-all">
              <div className="flex flex-col items-center justify-center pt-3 pb-4">
                <Upload size={22} className="text-neutral-500 group-hover:text-orange-400 mb-1.5 transition-colors" />
                <p className="font-sans text-[11px] text-neutral-400 group-hover:text-white transition-colors">
                  CHOOSE A FILE OR DRAG IT HERE
                </p>
                <p className="font-mono text-[7px] text-neutral-600 mt-1 uppercase">
                  JPEG, PNG, WEBP, SVG, MP4, MP3 (MAX 50MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept={type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : type === 'audio' ? 'audio/*' : '*'}
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          ) : (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-center space-y-4">
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>UPLOADING TO CONTENT REPOSITORY...</span>
                <span className="text-orange-400 font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-150" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          )}

          {uploadError && (
            <div className="text-red-500 flex items-center space-x-1.5 font-mono text-[9px] bg-red-950/20 p-2.5 rounded-lg border border-red-900/30">
              <AlertCircle size={12} />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* 4. LIBRARY MODE */}
      {sourceMode === 'library' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-neutral-400 uppercase tracking-wider">SELECT FROM MEDIA LIBRARY</span>
            <button
              onClick={() => setSourceMode(value ? 'preview' : 'choose')}
              className="text-neutral-500 hover:text-white flex items-center space-x-1 text-[10px] font-mono cursor-pointer"
            >
              <ArrowLeft size={11} />
              <span>BACK</span>
            </button>
          </div>

          <div className="min-h-[140px] max-h-[220px] overflow-y-auto pr-1">
            {filteredLibrary.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-neutral-500 text-[11px] bg-neutral-950 rounded-xl border border-neutral-850">
                <Grid size={16} className="mb-1" />
                <span>No existing {type} assets in media library.</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {filteredLibrary.map((item) => {
                  const isSelected = value === item.url;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onChange(item.url);
                        setSourceMode('preview');
                      }}
                      className={`relative aspect-square border-2 rounded bg-black group overflow-hidden cursor-pointer transition-all ${
                        isSelected ? 'border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'border-neutral-850 hover:border-neutral-500'
                      }`}
                    >
                      {item.type === 'image' && (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      {item.type === 'video' && (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-950">
                          <Film size={18} className="text-neutral-500" />
                        </div>
                      )}
                      {item.type === 'audio' && (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-950">
                          <Music size={18} className="text-neutral-500" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1">
                        <span className="font-mono text-[5px] text-white truncate text-left">{item.name}</span>
                        <span className="font-mono text-[4px] text-orange-400 text-left">{item.uploadedAt}</span>
                      </div>

                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-orange-500 text-black rounded-full p-0.5">
                          <Check size={8} className="stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. URL MODE */}
      {sourceMode === 'url' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-neutral-400 uppercase tracking-wider">PASTE REMOTE ASSET URL</span>
            <button
              onClick={() => setSourceMode(value ? 'preview' : 'choose')}
              className="text-neutral-500 hover:text-white flex items-center space-x-1 text-[10px] font-mono cursor-pointer"
            >
              <ArrowLeft size={11} />
              <span>BACK</span>
            </button>
          </div>

          <div className="flex flex-col space-y-2 py-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="e.g. https://images.unsplash.com/photo-..."
                className="flex-1 bg-neutral-950 border border-neutral-800 text-white font-sans text-xs px-3 py-2 rounded-xl focus:border-orange-500 outline-none"
              />
              <button
                onClick={handleUrlSubmit}
                disabled={uploading}
                className="bg-orange-500 hover:bg-orange-600 text-black font-mono font-bold text-[10px] px-4 py-2 rounded-xl uppercase transition-colors cursor-pointer"
              >
                {uploading ? 'SYNCING...' : 'RESOLVE'}
              </button>
            </div>
            <span className="font-mono text-[7px] text-neutral-500">
              Note: Pasting an external URL downloads it directly to server-side Storage and lists it in the library.
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
