

# AI UX Heuristic Evaluator — Implementation Plan

## Overview
A SaaS tool that scrapes any website using Firecrawl, analyzes it with AI (Lovable AI) against Nielsen's 10 usability heuristics, and presents a detailed UX report. Users can sign up, save reports, and revisit past analyses.

## Pages & Layout

### 1. Landing Page (`/`)
- Hero section with title "AI UX Heuristic Evaluator" and subtitle
- URL input field with "Analyze" button (centered, prominent)
- 3-step "How it works" section (Enter URL → AI Analyzes → Get Report)
- Feature highlights (cards for key capabilities)
- Clean, modern SaaS aesthetic with light neutral colors

### 2. Auth Pages (`/login`, `/signup`, `/reset-password`)
- Simple email/password authentication
- Redirect to dashboard after login

### 3. Analysis Dashboard (`/dashboard`)
- List of past analyses with date, URL, and overall score
- Click to view full report
- "New Analysis" button with URL input

### 4. Report Page (`/report/:id`)
- **Overall UX Score** (0–100) displayed as a circular gauge
- **Heuristic Evaluation Table** — 10 rows, one per heuristic, with columns: Heuristic, Issue Description, Severity (color-coded badge), Recommendation
- **Sub-scores** section with progress bars for: Navigation Clarity, Information Hierarchy, Feedback Visibility, Error Prevention, Interaction Efficiency
- **Executive Summary** card
- **Recommendation Cards** — actionable improvement suggestions with problem, impact, and fix
- **UX Insights** section summarizing top issues

## Backend Architecture

### Database Tables
- `profiles` — user profile linked to auth.users
- `analyses` — stores each analysis (user_id, url, overall_score, status, created_at)
- `heuristic_results` — per-heuristic findings (analysis_id, heuristic_name, issue, severity, recommendation, sub_scores)

### Edge Functions
1. **`analyze-website`** — Orchestrates the flow:
   - Calls Firecrawl to scrape the target URL (markdown format)
   - Sends scraped content to Lovable AI with a structured prompt to evaluate all 10 heuristics
   - Uses tool calling to extract structured JSON (scores, issues, recommendations)
   - Saves results to database
   - Returns the analysis ID

### Connectors & Services
- **Firecrawl** — for website scraping
- **Lovable AI** — for heuristic evaluation using AI
- **Lovable Cloud** — for database, auth, edge functions

## Design
- Card-based UI with shadcn/ui components
- Light neutral color palette with accent colors for severity badges (green/yellow/red)
- Recharts for score visualizations
- Responsive layout for all screen sizes
- Professional, research-tool aesthetic

