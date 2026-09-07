# ResumeAI — AI-Powered Resume Reviewer

ResumeAI is a full-stack SaaS application that uses AI to analyze resumes against job descriptions and provide actionable feedback.

It helps job seekers understand their ATS compatibility, identify missing skills and keywords, and improve their resumes for specific job opportunities.

## 🚀 Live Demo

**Live Application:** https://ai-resume-reviewer-virid-tau.vercel.app

**GitHub Repository:** https://github.com/owaiskhanbitni/ai-resume-reviewer

---

## ✨ Features

### 🔐 Authentication

* User registration and login
* Persistent authentication with Supabase
* Protected dashboard
* Per-user review history

### 📄 Resume Analysis

* Upload resume as a PDF
* Automatically extract resume text
* Compare resume with a job description
* AI-powered resume evaluation

### 🤖 AI-Powered Insights

ResumeAI generates:

* Overall resume score
* ATS compatibility score
* Skills match score
* Experience match score
* Matching skills
* Missing skills
* AI-generated summary
* Personalized recommendations

### 📊 Review History

* Save previous resume analyses
* View previous scores and recommendations
* Reviews are associated with the authenticated user
* Delete previous reviews

### 💳 SaaS Subscription System

ResumeAI includes Free and Pro plans.

| Feature                 | Free    | Pro       |
| ----------------------- | ------- | --------- |
| Resume Reviews          | 3       | Unlimited |
| ATS Analysis            | Basic   | Detailed  |
| Missing Skills          | Limited | Detailed  |
| AI Recommendations      | ✅       | ✅         |
| Review History          | ✅       | ✅         |
| Subscription Management | —       | ✅         |

Stripe integration is implemented in test-mode architecture and is ready to be connected to an eligible Stripe account.

---

## 🛠️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Next.js API Routes
* Node.js

### Database & Authentication

* Supabase
* PostgreSQL
* Supabase Auth
* Row Level Security (RLS)

### Artificial Intelligence

* Groq
* LLM-based resume analysis

### PDF Processing

* pdf2json

### Payments

* Stripe
* Stripe Checkout
* Stripe Webhooks
* Subscription management

### Deployment

* Vercel
* GitHub

---

## 🏗️ Application Architecture

```text
                         ┌─────────────────────┐
                         │      User           │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Next.js Frontend  │
                         │                     │
                         │ Landing Page       │
                         │ Login / Signup      │
                         │ Dashboard           │
                         │ Billing             │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    API Routes       │
                         │                     │
                         │ PDF Extraction      │
                         │ AI Analysis         │
                         │ Stripe Checkout     │
                         │ Stripe Webhooks     │
                         └───────┬─────┬───────┘
                                 │     │
                    ┌────────────┘     └─────────────┐
                    ▼                                ▼
          ┌──────────────────┐              ┌─────────────────┐
          │     Supabase     │              │      Groq       │
          │                  │              │                 │
          │ Authentication   │              │ LLM Analysis    │
          │ PostgreSQL       │              │                 │
          │ User Profiles    │              └─────────────────┘
          │ Review History   │
          └──────────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │      Stripe      │
          │                  │
          │ Checkout         │
          │ Subscriptions    │
          │ Webhooks         │
          └──────────────────┘
```

---

## 📁 Project Structure

```text
ai-resume-reviewer/
│
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts
│   │   ├── extract/
│   │   │   └── route.ts
│   │   └── stripe/
│   │       ├── checkout/
│   │       │   └── route.ts
│   │       ├── portal/
│   │       │   └── route.ts
│   │       └── webhook/
│   │           └── route.ts
│   │
│   ├── billing/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── page.tsx
│
├── lib/
│   ├── supabase.ts
│   ├── supabase-server.ts
│   ├── supabase-admin.ts
│   └── stripe.ts
│
├── public/
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

## 🔄 How ResumeAI Works

### 1. User Authentication

A user creates an account or logs in using Supabase Authentication.

### 2. Resume Upload

The user uploads a PDF resume.

ResumeAI extracts the readable text from the PDF using `pdf2json`.

### 3. Job Description

The user enters the job description they are applying for.

### 4. AI Analysis

The resume text and job description are sent to the backend.

The backend sends the information to the Groq LLM with a structured analysis prompt.

### 5. Results

The AI returns structured results containing:

```text
Overall Score
ATS Score
Skills Match
Experience Match
Matching Skills
Missing Skills
Summary
Recommendations
```

### 6. Persistent Storage

The review is saved in PostgreSQL through Supabase and associated with the authenticated user's ID.

### 7. Subscription Gating

Free users are limited to three reviews.

Pro users receive unlimited reviews and access to enhanced analysis features.

---

## 🔒 Security

ResumeAI uses several security mechanisms:

* Environment variables for API credentials
* Supabase Authentication
* Supabase Row Level Security
* User-specific database queries
* Server-side AI API calls
* Server-side Stripe webhook verification
* Stripe service credentials kept outside the frontend

Sensitive environment variables are intentionally excluded from GitHub using `.gitignore`.

---

## ⚙️ Local Development

### Prerequisites

Make sure you have:

* Node.js
* npm
* Supabase account
* Groq API key
* Stripe account if testing payments

### Clone the repository

```bash
git clone https://github.com/owaiskhanbitni/ai-resume-reviewer.git

cd ai-resume-reviewer
```

### Install dependencies

```bash
npm install
```

### Create environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
GROQ_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Never commit `.env.local` to GitHub.

### Run the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🗄️ Database

ResumeAI uses Supabase PostgreSQL.

### Profiles

Stores:

* User ID
* Subscription plan
* Stripe customer ID
* Stripe subscription ID
* Subscription status
* Timestamps

### Reviews

Stores:

* User ID
* Resume name
* Job description
* Overall score
* ATS score
* Skills match
* Experience match
* AI summary
* Matching skills
* Missing skills
* Recommendations
* Creation timestamp

Row Level Security ensures users can access their own data.

---

## 💰 Subscription Model

### Free

The Free plan allows users to perform up to three resume reviews.

### Pro

The Pro plan is designed for users who need unlimited resume reviews and more detailed AI-powered analysis.

Stripe Checkout and webhook handlers are implemented in the application architecture.

---

## 🚀 Deployment

The application is deployed using Vercel.

Production deployment:

https://ai-resume-reviewer-virid-tau.vercel.app

The project is connected to GitHub so new changes can be deployed through the repository.

---

## 🧪 Testing Checklist

Before submitting the application, verify:

* [x] Landing page works
* [x] Signup works
* [x] Login works
* [x] Dashboard works
* [x] PDF extraction works
* [x] AI analysis works
* [x] Reviews are saved
* [x] Review history works
* [x] Free plan limit works
* [x] Billing page works
* [x] GitHub repository is public
* [x] Production deployment works

Stripe payment activation requires valid Stripe account credentials and configuration.

---

## 🔮 Future Improvements

Possible future improvements include:

* Resume templates
* Resume editing with AI
* Cover letter generation
* Job-specific resume rewriting
* LinkedIn profile optimization
* Multiple resume versions
* Job application tracking
* Advanced analytics
* Resume keyword optimization
* Email notifications

---

## 👨‍💻 Author

**Owais Khan**

Computer Science & Engineering — AI & ML

Built as a full-stack AI SaaS project demonstrating authentication, AI integration, persistent data, subscription architecture, and cloud deployment.
