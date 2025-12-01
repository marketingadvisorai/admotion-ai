export interface BrandKit {
    id: string;
    org_id: string;
    name: string;
    logo_url?: string;
    colors: {
        primary: string;
        secondary: string;
        accent?: string;
        background?: string;
    };
    fonts: {
        heading: string;
        body: string;
    };
    created_at: string;
}

export interface CreateBrandKitInput {
    orgId: string;
    name: string;
    logo_url?: string;
    colors: {
        primary: string;
        secondary: string;
        accent?: string;
        background?: string;
    };
    fonts: {
        heading: string;
        body: string;
    };
}

export interface UpdateBrandKitInput extends Partial<CreateBrandKitInput> {
    id: string;
}
