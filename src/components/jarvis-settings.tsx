'use client';

/**
 * AKIOR Settings View
 * Configuration panel for the application
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis';

export function AkiorSettings() {
  const { isSupported: sttSupported } = useSpeechRecognition();
  const { isSupported: ttsSupported, voices, selectedVoice, setVoice } = useSpeechSynthesis();
  
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          AKIOR configuration
        </p>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl space-y-8">
          {/* Voice Settings */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Voice Settings
            </h3>
            
            <div className="akior-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Speech Recognition</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sttSupported ? 'Available in this browser' : 'Not supported - use Chrome or Edge'}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full ${sttSupported ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Text-to-Speech</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ttsSupported ? 'Available in this browser' : 'Not supported'}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full ${ttsSupported ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-speak" className="text-sm font-medium">Auto-speak Responses</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically read responses aloud
                  </p>
                </div>
                <Switch
                  id="auto-speak"
                  checked={autoSpeak}
                  onCheckedChange={setAutoSpeak}
                  disabled={!ttsSupported}
                />
              </div>

              {ttsSupported && voices.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Voice Selection</Label>
                  <select
                    value={selectedVoice?.name || ''}
                    onChange={(e) => {
                      const voice = voices.find(v => v.name === e.target.value);
                      if (voice) setVoice(voice);
                    }}
                    className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                  >
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Appearance Settings */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Appearance
            </h3>
            
            <div className="akior-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode" className="text-sm font-medium">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Use dark theme (recommended)
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
            </div>
          </section>

          {/* API Settings */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              API Configuration
            </h3>
            
            <div className="akior-card space-y-4">
              <div>
                <Label className="text-sm font-medium">LLM Integration</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Currently using stubbed responses. To integrate a real LLM:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Edit <code className="text-primary">/api/chat/route.ts</code></li>
                  <li>Replace <code className="text-primary">generateAkiorResponse()</code> function</li>
                  <li>Add your OpenAI/Anthropic API key</li>
                </ul>
              </div>
            </div>
          </section>

          {/* System Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              System Information
            </h3>
            
            <div className="akior-card">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Version:</span>
                  <span className="ml-2 text-foreground">1.0.0</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Framework:</span>
                  <span className="ml-2 text-foreground">Next.js 15</span>
                </div>
                <div>
                  <span className="text-muted-foreground">STT API:</span>
                  <span className="ml-2 text-foreground">Web Speech API</span>
                </div>
                <div>
                  <span className="text-muted-foreground">TTS API:</span>
                  <span className="ml-2 text-foreground">speechSynthesis</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}