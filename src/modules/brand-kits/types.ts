export interface BrandKit {
    id: string;
    org_id: string;
    name: string;
    website_url?: string;
    business_name?: string;
    description?: string;
    locations?: string[];
    logo_url?: string;
    colors: Array<{
        name: string;
        value: string;
        type: 'primary' | 'secondary' | 'accent';
    }>;
    fonts: {
        heading: string;
        body: string;
    };
    social_links?: Record<string, string>;
    offerings?: Array<{
        name: string;
        description: string;
    }>;
    strategy?: {
        vision?: string;
        mission?: string;
        values?: string[];
        target_audience?: string;
        brand_voice?: string;
        key_differentiators?: string[];
    };
    created_at: string;
}

export interface CreateBrandKitInput {
    org_id: string;
    name: string;
    website_url?: string;
    business_name?: string;
    description?: string;
    locations?: string[];
    logo_url?: string;
    colors: Array<{
        name: string;
        value: string;
        type: 'primary' | 'secondary' | 'accent';
    }>;
    fonts: {
        heading: string;
        body: string;
    };
    social_links?: Record<string, string>;
    offerings?: Array<{
        name: string;
        description: string;
    }>;
    strategy?: {
        vision?: string;
        mission?: string;
        values?: string[];
        target_audience?: string;
        brand_voice?: string;
        key_differentiators?: string[];
    };
}

export interface UpdateBrandKitInput extends Partial<CreateBrandKitInput> {
    id: string;
}
