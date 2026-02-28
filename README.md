# Synapse - Legal Document Analysis Platform

![Synapse Banner](assets/Banner%20synapse.png)

A powerful full-stack application that leverages AI to analyze legal documents through the Cerebras API, providing intelligent insights and document management capabilities.

## 🚀 Features

- 🔐 Secure user authentication with Supabase
- 📄 Document upload and management system
- 🤖 AI-powered legal document analysis
- 🔄 Real-time status updates
- 🎨 Modern and responsive UI
- 🔍 Advanced document search capabilities

## 📋 Prerequisites

- Node.js 18+ or Bun
- Supabase account
- Cerebras API access

## 🛠️ Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/synapse.git
cd synapse
```

2. Install dependencies:
```bash
bun install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Cerebras API Configuration (server-only)
CEREBRAS_API_KEY=your-cerebras-api-key

# Site URL (for auth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Set up your Supabase database with the following tables:

```sql
-- Documents table
create table documents (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  title text not null,
  content text not null,
  status text not null default 'pending'
);

-- Analysis table
create table analysis (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  document_id uuid references documents not null,
  user_id uuid references auth.users not null,
  analysis jsonb not null,
  status text not null default 'pending'
);

-- Set up Row Level Security (RLS)
alter table documents enable row level security;
alter table analysis enable row level security;

-- Create policies
create policy "Users can view their own documents"
  on documents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own documents"
  on documents for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own analysis"
  on analysis for select
  using (auth.uid() = user_id);

create policy "Users can insert their own analysis"
  on analysis for insert
  with check (auth.uid() = user_id);
```

## 🚀 Running the Application

1. Start the development server:
```bash
bun run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Production Deployment

1. Build the application:
```bash
bun run build
```

2. Start the production server:
```bash
bun run start
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ by Cheree team</sub>
</div>
