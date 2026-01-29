'use client';

/**
 * Agent Personality & Voice Settings
 * API keys are encrypted server-side before storage
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Save, 
  Loader2, 
  Volume2,
  Bot,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle
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
import { useAuth } from '@/contexts/auth-context';
import { useOpenAITTS, OPENAI_VOICES, OpenAIVoice } from '@/hooks/use-openai-tts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AgentSettings {
  id?: string;
  agent_name: string;
  personality_prompt: string;
  voice_id: string;
  voice_speed: number;
  openai_api_key: string;
  has_api_key?: boolean;
  masked_api_key?: string;
}

const DEFAULT_SETTINGS: AgentSettings = {
  agent_name: 'AKIOR',
  personality_prompt: 'You are AKIOR, a helpful and knowledgeable AI assistant. You are professional, concise, and friendly. You remember important details about the user and use your knowledge base to provide accurate information.',
  voice_id: 'alloy',
  voice_speed: 1.0,
  openai_api_key: '',
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
  const { user, session } = useAuth();
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');

  // Get auth headers
  const getAuthHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  }, [session]);

  const { 
    speak, 
    stop, 
    isSpeaking, 
    isLoading: isTTSLoading,
    setVoice,
    setSpeed,
  } = useOpenAITTS({
    voice: settings.voice_id as OpenAIVoice,
    speed: settings.voice_speed,
  });

  // Load settings from API
  const loadSettings = useCallback(async () => {
    if (!user || !session?.access_token) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/settings', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      
      if (data.settings) {
        const loadedSettings = {
          id: data.settings.id,
          agent_name: data.settings.agent_name || DEFAULT_SETTINGS.agent_name,
          personality_prompt: data.settings.personality_prompt || DEFAULT_SETTINGS.personality_prompt,
          voice_id: data.settings.voice_id || DEFAULT_SETTINGS.voice_id,
          voice_speed: data.settings.voice_speed || DEFAULT_SETTINGS.voice_speed,
          openai_api_key: '', // Don't show the actual key
          has_api_key: data.settings.has_api_key,
          masked_api_key: data.settings.masked_api_key,
        };
        setSettings(loadedSettings);
        
        // Update TTS hook with loaded settings
        setVoice(loadedSettings.voice_id as OpenAIVoice);
        setSpeed(loadedSettings.voice_speed);
        
        // Check if API key exists
        if (data.settings.has_api_key) {
          setApiKeyStatus('valid');
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [user, session, getAuthHeaders, setVoice, setSpeed]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save settings via API (API key is encrypted server-side)
  const handleSave = async () => {
    if (!user || !session?.access_token) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          agent_name: settings.agent_name,
          personality_prompt: settings.personality_prompt,
          voice_id: settings.voice_id,
          voice_speed: settings.voice_speed,
          openai_api_key: settings.openai_api_key, // Will be encrypted server-side
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save settings');
      }

      toast.success('Settings saved');
      setHasChanges(false);
      
      // Update API key status
      if (settings.openai_api_key && settings.openai_api_key.startsWith('sk-')) {
        setApiKeyStatus('valid');
        // Clear the input field and show masked version
        setSettings(prev => ({
          ...prev,
          openai_api_key: '',
          has_api_key: true,
          masked_api_key: `${settings.openai_api_key.slice(0, 7)}...${settings.openai_api_key.slice(-4)}`,
        }));
      } else if (settings.openai_api_key === '') {
        setApiKeyStatus('unknown');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Update setting
  const updateSetting = <K extends keyof AgentSettings>(key: K, value: AgentSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    
    // Update TTS hook in real-time for voice settings
    if (key === 'voice_id') {
      setVoice(value as OpenAIVoice);
    } else if (key === 'voice_speed') {
      setSpeed(value as number);
    } else if (key === 'openai_api_key') {
      setApiKeyStatus('unknown');
    }
  };

  // Test voice
  const testVoice = async () => {
    if (isSpeaking) {
      stop();
    } else {
      if (!settings.has_api_key && !settings.openai_api_key) {
        toast.error('Please enter your OpenAI API key first');
        return;
      }
      
      // For voice test, we need to save first if there's a new API key
      if (settings.openai_api_key && settings.openai_api_key.startsWith('sk-')) {
        toast.info('Please save your settings first to test the voice');
        return;
      }
      
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
      {/* OpenAI API Key */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          OpenAI API Key
        </h3>
        
        <div className="akior-card space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-key">API Key</Label>
            <div className="relative">
              <Input
                id="openai-key"
                type={showApiKey ? 'text' : 'password'}
                value={settings.openai_api_key}
                onChange={(e) => updateSetting('openai_api_key', e.target.value)}
                placeholder={settings.has_api_key ? settings.masked_api_key : 'sk-...'}
                className="bg-muted/50 pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
                {apiKeyStatus === 'valid' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {apiKeyStatus === 'invalid' && (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your OpenAI API key is required for AI chat, voice, and embeddings. 
              It is encrypted before being stored.
              Get one at{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                platform.openai.com
              </a>
            </p>
          </div>
        </div>
      </section>

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
            disabled={isTTSLoading || (!settings.has_api_key && !settings.openai_api_key)}
            className="w-full"
          >
            {isTTSLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Volume2 className="w-4 h-4 mr-2" />
            )}
            {isSpeaking ? 'Stop' : 'Test Voice'}
          </Button>
          {!settings.has_api_key && !settings.openai_api_key && (
            <p className="text-xs text-orange-500 text-center">
              Enter your OpenAI API key above to test voice
            </p>
          )}
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
