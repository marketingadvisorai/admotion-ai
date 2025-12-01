# Admotion AI

Admotion AI is a powerful platform for managing advertising campaigns, organizations, and team collaborations. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Organization Management**: Create and manage multiple organizations.
- **Team Collaboration**: Invite members, assign roles (Owner, Admin, Member, Viewer), and manage permissions.
- **Campaign Management**: Create and track advertising campaigns.
- **Asset Management**: Upload and organize creative assets.
- **Secure Authentication**: Powered by Supabase Auth.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI / Shadcn UI
- **Language**: TypeScript

## Getting Started

1.  **Clone the repository**

    ```bash
    git clone https://github.com/your-username/admotion-ai.git
    cd admotion-ai
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Environment Setup**

    Create a `.env.local` file in the root directory:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    ```

4.  **Run the development server**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser.

## Database Schema

The project uses Supabase. Key tables include:
- `organizations`
- `organization_memberships`
- `invitations`
- `profiles`
- `campaigns`

## License

[MIT](LICENSE)
