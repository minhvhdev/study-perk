'use client';

import { useStudyStore } from '@/app/_store-study';
import { cn } from '@/app/_utils/app-cn.util';
import {
  Bell,
  CloudRain,
  Waves,
  Trees,
  Wind,
  Music,
  Pause,
  Volume2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { StudyTypeManager } from './StudyTypeManager';

import { SOUND_URLS } from '@/app/_constants/study-sounds.constant';

const NOTIFICATION_SOUNDS = [
  { id: 'commercialBreak', name: 'Commercial Break' },
  { id: 'itsBreakTime', name: "It's Break Time" },
  { id: 'roundEnd', name: 'Round End' },
];

const AMBIENT_SOUNDS = [
  { id: 'rain', name: 'Rain', icon: CloudRain },
  { id: 'waves', name: 'Waves', icon: Waves },
  { id: 'forest', name: 'Forest', icon: Trees },
  { id: 'whiteNoise', name: 'White Noise', icon: Wind },
];

export const StudyTypeCard = () => {
  return (
    <div className="p-6 rounded-4xl bg-card border border-border shadow-sm flex flex-1 flex-col gap-4">
      <StudyTypeManager />
    </div>
  );
};

export const StudySoundsCard = () => {
  const { settings, updateSettings } = useStudyStore();
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const togglePreview = (id: string) => {
    if (previewingId === id) {
      previewAudioRef.current?.pause();
      setPreviewingId(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      previewAudioRef.current = new Audio(SOUND_URLS[id]);
      previewAudioRef.current.onended = () => setPreviewingId(null);
      previewAudioRef.current
        .play()
        .catch((e) => console.error('Preview failed:', e));
      setPreviewingId(id);
    }
  };

  useEffect(() => {
    const audio = previewAudioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  return (
    <div className="w-full flex flex-col gap-6 h-full">
      {/* Row 1: Notification */}
      <div className="p-6 rounded-4xl bg-card border border-border flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Bell size={20} />
            </div>
            <div>
              <p className="font-bold text-base">Notifications</p>
            </div>
          </div>
          <button
            onClick={() =>
              updateSettings({
                notificationEnabled: !settings.notificationEnabled,
              })
            }
            className={cn(
              'w-10 h-5 rounded-full p-1 transition-colors relative',
              settings.notificationEnabled ? 'bg-primary' : 'bg-secondary',
            )}
          >
            <div
              className={cn(
                'w-3 h-3 rounded-full bg-white transition-transform',
                settings.notificationEnabled
                  ? 'translate-x-5'
                  : 'translate-x-0',
              )}
            />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {NOTIFICATION_SOUNDS.map((sound) => (
            <div key={sound.id} className="flex items-center">
              <button
                onClick={() => updateSettings({ notificationSound: sound.id })}
                className={cn(
                  'whitespace-nowrap px-4 py-2 rounded-l-xl text-base font-bold transition-all border border-r-0',
                  settings.notificationSound === sound.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary text-muted-foreground border-transparent',
                )}
              >
                {sound.name}
              </button>
              <button
                onClick={() => togglePreview(sound.id)}
                className={cn(
                  'px-3 py-2 rounded-r-xl transition-all border h-full',
                  settings.notificationSound === sound.id
                    ? 'bg-primary/90 text-primary-foreground border-primary border-l-primary/30'
                    : 'bg-secondary/80 text-muted-foreground border-transparent border-l-border/30',
                )}
              >
                {previewingId === sound.id ? (
                  <Pause size={16} />
                ) : (
                  <Volume2 size={16} />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Ambient Sound */}
      <div className="p-6 rounded-4xl bg-card border border-border flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Music size={20} />
            </div>
            <div>
              <p className="font-bold text-base">Ambient</p>
            </div>
          </div>
          <button
            onClick={() =>
              updateSettings({ ambientEnabled: !settings.ambientEnabled })
            }
            className={cn(
              'w-10 h-5 rounded-full p-1 transition-colors relative',
              settings.ambientEnabled ? 'bg-primary' : 'bg-secondary',
            )}
          >
            <div
              className={cn(
                'w-3 h-3 rounded-full bg-white transition-transform',
                settings.ambientEnabled ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {AMBIENT_SOUNDS.map((sound) => {
            const Icon = sound.icon;
            return (
              <div key={sound.id} className="flex items-center w-full">
                <button
                  onClick={() => updateSettings({ ambientSound: sound.id })}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-l-xl text-base font-bold transition-all border border-r-0 flex-1',
                    settings.ambientSound === sound.id
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-secondary/50 text-muted-foreground border-transparent',
                  )}
                >
                  <Icon size={16} />
                  <span className="truncate">{sound.name}</span>
                </button>
                <button
                  onClick={() => togglePreview(sound.id)}
                  className={cn(
                    'p-3 rounded-r-xl transition-all border h-full',
                    settings.ambientSound === sound.id
                      ? 'bg-primary/20 text-primary border-primary/20 border-l-primary/10'
                      : 'bg-secondary/40 text-muted-foreground border-transparent border-l-border/30',
                  )}
                >
                  {previewingId === sound.id ? (
                    <Pause size={16} />
                  ) : (
                    <Volume2 size={16} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
