'use client';

/**
 * useBrandContext Hook
 * Manages brand selection state and context extraction
 */

import { useState, useMemo, useCallback } from 'react';
import { BrandKit } from '@/modules/brand-kits/types';
import { BrandMode, AnalyzedBrandProfile } from '@/components/ads/brand-picker';
import { BrandIdentityLite, BrandContext } from '../types';

interface UseBrandContextOptions {
  initialBrandKits: BrandKit[];
  orgId: string;
}

export function useBrandContext({ initialBrandKits, orgId }: UseBrandContextOptions) {
  // Brand state
  const [brandKitOptions, setBrandKitOptions] = useState<BrandKit[]>(initialBrandKits);
  const [analyzerProfiles, setAnalyzerProfiles] = useState<AnalyzedBrandProfile[]>([]);
  const [selectedBrandKitId, setSelectedBrandKitId] = useState<string>('');
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string>('');
  const [brandMode, setBrandMode] = useState<BrandMode>('none');
  const [brandUrl, setBrandUrl] = useState('');
  const [brandAnalysis, setBrandAnalysis] = useState<BrandIdentityLite | null>(null);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);

  // Derived state
  const selectedBrandKit = useMemo(
    () => brandKitOptions.find((kit) => kit.id === selectedBrandKitId),
    [brandKitOptions, selectedBrandKitId]
  );

  const selectedAnalyzer = useMemo(
    () => analyzerProfiles.find((item) => item.id === selectedAnalyzerId),
    [analyzerProfiles, selectedAnalyzerId]
  );

  const activeBrand = brandMode === 'kit' 
    ? selectedBrandKit 
    : brandMode === 'analyze' 
      ? selectedAnalyzer?.analysis || brandAnalysis 
      : null;

  // Get brand context for prompts
  const getSelectedBrandContext = useCallback((): BrandContext | undefined => {
    if (brandMode === 'kit' && selectedBrandKit) {
      return {
        brandId: selectedBrandKit.id,
        brandName: selectedBrandKit.name,
        businessName: selectedBrandKit.business_name,
        description: selectedBrandKit.description,
        logoUrl: selectedBrandKit.logo_url,
        colors: selectedBrandKit.colors?.map((c) => c.value).filter(Boolean),
        brandVoice: selectedBrandKit.strategy?.brand_voice,
        targetAudience: selectedBrandKit.strategy?.target_audience,
        values: selectedBrandKit.strategy?.values,
      };
    }
    if (brandMode === 'analyze' && activeBrand) {
      return {
        businessName: activeBrand.business_name,
        description: activeBrand.description,
        logoUrl: activeBrand.logo_url,
        colors: activeBrand.colors?.map((c) => c.value).filter(Boolean),
        brandVoice: activeBrand.strategy?.brand_voice,
        targetAudience: activeBrand.strategy?.target_audience,
        values: activeBrand.strategy?.values,
      };
    }
    return undefined;
  }, [brandMode, selectedBrandKit, activeBrand]);

  // Analyze brand from URL
  const handleAnalyzeBrand = async (url: string, model?: string) => {
    if (!url.trim()) return;
    setIsAnalyzingBrand(true);
    try {
      const res = await fetch('/api/brand/create-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, orgId, model }),
      });
      const data = await res.json();
      if (data?.success && data?.data?.kit && data?.data?.analysis) {
        const kit = data.data.kit as BrandKit;
        const analysis = data.data.analysis as BrandIdentityLite;
        setBrandKitOptions((prev) => {
          const exists = prev.some((item) => item.id === kit.id);
          return exists ? prev : [kit, ...prev];
        });
        const profile: AnalyzedBrandProfile = {
          id: kit.id,
          url,
          name: analysis.business_name || kit.name || url,
          analysis,
          kitId: kit.id,
        };
        setAnalyzerProfiles((prev) => [profile, ...prev.filter((p) => p.id !== profile.id)]);
        setSelectedAnalyzerId(profile.id);
        setBrandAnalysis(analysis);
        setBrandMode('analyze');
        setSelectedBrandKitId(kit.id);
      }
    } catch (error) {
      console.error('Brand analyze failed', error);
    } finally {
      setIsAnalyzingBrand(false);
    }
  };

  // Select kit handler
  const handleSelectKit = (id: string) => {
    setSelectedBrandKitId(id);
    setBrandMode('kit');
    setSelectedAnalyzerId('');
    setBrandAnalysis(null);
  };

  // Select analyzer handler
  const handleSelectAnalyzer = (id: string) => {
    const profile = analyzerProfiles.find((item) => item.id === id);
    if (!profile) return;
    setSelectedAnalyzerId(id);
    setBrandMode('analyze');
    setBrandAnalysis(profile.analysis);
    if (profile.kitId) setSelectedBrandKitId(profile.kitId);
  };

  // Clear handler
  const handleClearBrand = () => {
    setBrandMode('none');
    setSelectedBrandKitId('');
    setSelectedAnalyzerId('');
    setBrandAnalysis(null);
  };

  return {
    // State
    brandKitOptions,
    analyzerProfiles,
    selectedBrandKitId,
    selectedAnalyzerId,
    brandMode,
    brandUrl,
    activeBrand,
    isAnalyzingBrand,
    
    // Setters
    setBrandUrl,
    setSelectedBrandKitId,
    
    // Handlers
    handleAnalyzeBrand,
    handleSelectKit,
    handleSelectAnalyzer,
    handleClearBrand,
    getSelectedBrandContext,
  };
}
