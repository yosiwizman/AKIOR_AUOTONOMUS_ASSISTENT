'use client';

/**
 * Agent Personality & Voice Settings
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Save, 
  Loader2, 
  Volume2,
  Bot,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useOpenAITTS, OPENAI_VOICES, OpenAIVoice } from '@/hooks/use-openai-tts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AgentSettings {
  agent_name: string;
  personality_prompt: string;
  voice_id: string;
  voice_speed: number;
}

const DEFAULT_SETTINGS: AgentSettings = {
  agent_name: 'AKIOR',
  personality_prompt: 'You are AKIOR, a helpful and knowledgeable AI assistant. You are professional, concise, and friendly. You remember important details about the user and use your knowledge base to provide accurate information.',
  voice_id: 'alloy',
  voice_speed: 1.0,
};

const PERSONALITY_PRESETS = [
  {
    name: 'Professional Assistant',
    prompt: 'You are AKIOR, a professional and efficient AI assistant. You provide clear, concise answers and maintain a formal yet friendly tone. You prioritize accuracy and helpfulness.',
  },
  {
    name: 'Friendly Companion',
    prompt: 'You are AKIOR, a warm and friendly AI companion. You engage in natural conversation, show genuine interest in the user, and maintain a positive, supportive attitude while being helpful.',
  },
  {
    name: 'Technical Expert',
    prompt: 'You are AKIOR, a technical expert AI. You provide detailed, accurate technical information and explanations. You use precise terminology and can break down complex concepts clearly.',
  },
  {
    name: 'Creative Partner',
    prompt: 'You are AKIOR, a creative AI partner. You think outside the box, offer innovative ideas, and help brainstorm solutions. You encourage creativity while remaining practical.',
  },
];

export function AgentSettingsPanel() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { speak, stop, isSpeaking, isLoading: isTTSLoading } = useOpenAITTS({
    voice: settings.voice_id as OpenAIVoice,
    speed: settings.voice_speed,
  });

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          agent_name: data.agent_name || DEFAULT_SETTINGS.agent_name,
          personality_prompt: data.personality_prompt || DEFAULT_SETTINGS.personality_prompt,
          voice_id: data.voice_id || DEFAULT_SETTINGS.voice_id,
          voice_speed: data.voice_speed || DEFAULT_SETTINGS.voice_speed,
        });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save settings
  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('agent_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Settings saved');
      setHasChanges(false);
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Update setting
  const updateSetting = <K extends keyof AgentSettings>(key: K, value: AgentSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Test voice
  const testVoice = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(`Hello! I'm ${settings.agent_name}. This is how I sound with the current voice settings.`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Agent Identity */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          Agent Identity
        </h3>
        
        <div className="akior-card space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Agent Name</Label>
            <Input
              id="agent-name"
              value={settings.agent_name}
              onChange={(e) => updateSetting('agent_name', e.target.value)}
              placeholder="AKIOR"
              className="bg-muted/50"
            />
          </div>
        </div>
      </section>

      {/* Personality */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Personality
        </h3>
        
        <div className="akior-card space-y-4">
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {PERSONALITY_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => updateSetting('personality_prompt', preset.prompt)}
                  className={cn(
                    'text-xs justify-start',
                    settings.personality_prompt === preset.prompt && 'border-primary bg-primary/10'
                  )}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="personality">Custom Personality Prompt</Label>
            <Textarea
              id="personality"
              value={settings.personality_prompt}
              onChange={(e) => updateSetting('personality_prompt', e.target.value)}
              placeholder="Describe how the agent should behave..."
              className="min-h-[150px] bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              This prompt defines how {settings.agent_name} will respond and interact with you.
            </p>
          </div>
        </div>
      </section>

      {/* Voice Settings */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-primary" />
          Voice Settings (OpenAI TTS)
        </h3>
        
        <div className="akior-card space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voice">Voice</Label>
            <Select
              value={settings.voice_id}
              onValueChange={(value) => updateSetting('voice_id', value)}
            >
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {OPENAI_VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div className="flex flex-col">
                      <span>{voice.name}</span>
                      <span className="text-xs text-muted-foreground">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Speed</Label>
              <span className="text-sm text-muted-foreground">{settings.voice_speed.toFixed(1)}x</span>
            </div>
            <Slider
              value={[settings.voice_speed]}
              onValueChange={([value]) => updateSetting('voice_speed', value)}
              min={0.5}
              max={2.0}
              step={0.1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slower</span>
              <span>Faster</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={testVoice}
            disabled={isTTSLoading}
            className="w-full"
          >
            {isTTSLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Volume2 className="w-4 h-4 mr-2" />
            )}
            {isSpeaking ? 'Stop' : 'Test Voice'}
          </Button>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
