export interface BrandColors {
    primary: string;
    secondary: string;
    accent?: string;
}

export interface BrandFonts {
    heading: string;
    body: string;
}

export interface BrandKit {
    id: string;
    org_id: string;
    name: string;
    logo_url: string | null;
    colors: BrandColors | null;
    fonts: BrandFonts | null;
    created_at: string;
}
