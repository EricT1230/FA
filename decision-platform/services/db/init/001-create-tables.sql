-- Freelancer Aggregator Database Schema
-- Version: 1.0.0
-- Description: Initial schema for microservices architecture

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    password_hash VARCHAR(255), -- For local auth
    provider VARCHAR(50) DEFAULT 'local', -- 'local', 'google', 'github'
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    notification_preferences JSONB DEFAULT '{
        "email": true,
        "teamDecisions": true,
        "dailyDigest": true,
        "realTimeAlerts": true
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{
        "minScore": 70,
        "maxApplicants": 20,
        "preferRemote": true,
        "autoNotify": true
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('OWNER', 'DECISION_OWNER', 'TECHNICAL_REVIEWER', 'BUSINESS_REVIEWER', 'OBSERVER')),
    permissions JSONB DEFAULT '{
        "canMakeDecisions": false,
        "canSubmitSignals": true,
        "canViewAll": true
    }'::jsonb,
    active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Raw jobs table (from ingestion)
CREATE TABLE raw_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    posted_at TIMESTAMP WITH TIME ZONE,
    raw_data JSONB NOT NULL,
    ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source, external_id)
);

-- Processed jobs table (after normalization and scoring)
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_job_id UUID REFERENCES raw_jobs(id) ON DELETE CASCADE,
    source_key VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    posted_at TIMESTAMP WITH TIME ZONE,
    category VARCHAR(100),
    skills JSONB, -- Array of skill strings
    remote BOOLEAN DEFAULT false,
    applicants_min INTEGER,
    applicants_max INTEGER,
    ehr_twd DECIMAL(10,2), -- Effective hourly rate in TWD
    score INTEGER CHECK (score >= 0 AND score <= 100),
    breakdown JSONB, -- Score breakdown: {P, Fit, Q, R, Comp}
    reasons_top JSONB, -- Array of top reason strings
    reasons_positive JSONB, -- Array of positive reason strings
    reasons_negative JSONB, -- Array of negative reason strings
    fx_as_of TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(raw_job_id)
);

-- Job risk assessments table
CREATE TABLE job_risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    gate_status VARCHAR(20) NOT NULL CHECK (gate_status IN ('PASS', 'SOFT_WARNING', 'HARD_BLOCK')),
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    factors JSONB, -- Array of risk factor objects
    recommendations JSONB, -- Array of recommendation strings
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id)
);

-- Participant signals table
CREATE TABLE participant_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    signal VARCHAR(20) NOT NULL CHECK (signal IN ('RECOMMEND', 'CAUTION', 'REJECT')),
    reasoning JSONB, -- {category, details, confidence}
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, team_id, user_id)
);

-- Decision records table
CREATE TABLE decision_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    job_snapshot JSONB, -- Snapshot of job at decision time
    risk_assessment JSONB, -- Snapshot of risk assessment
    participant_signals JSONB, -- Array of all signals at decision time
    decided_by UUID REFERENCES users(id),
    decision_outcome VARCHAR(20) NOT NULL CHECK (decision_outcome IN ('PROCEED', 'SKIP')),
    reasoning TEXT,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    conditions JSONB, -- Array of condition strings if PROCEED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team job decisions table (current status)
CREATE TABLE team_job_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    decision_id UUID REFERENCES decision_records(id),
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('PROCEED', 'SKIP')),
    decided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, job_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_raw_jobs_source_ingested ON raw_jobs(source, ingested_at DESC);
CREATE INDEX idx_jobs_source_score ON jobs(source_key, score DESC);
CREATE INDEX idx_jobs_created_score ON jobs(created_at DESC, score DESC);
CREATE INDEX idx_jobs_remote_score ON jobs(remote, score DESC);
CREATE INDEX idx_jobs_skills ON jobs USING GIN(skills);
CREATE INDEX idx_jobs_category ON jobs(category);

CREATE INDEX idx_participant_signals_team_job ON participant_signals(team_id, job_id);
CREATE INDEX idx_participant_signals_user ON participant_signals(user_id, timestamp DESC);

CREATE INDEX idx_decision_records_team ON decision_records(team_id, created_at DESC);
CREATE INDEX idx_decision_records_job ON decision_records(job_id);

CREATE INDEX idx_team_job_decisions_team ON team_job_decisions(team_id, decided_at DESC);
CREATE INDEX idx_team_job_decisions_job ON team_job_decisions(job_id);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

CREATE INDEX idx_team_members_team_active ON team_members(team_id, active);
CREATE INDEX idx_team_members_user_active ON team_members(user_id, active);

-- Create search indexes
CREATE INDEX idx_jobs_title_search ON jobs USING GIN(to_tsvector('english', title));
CREATE INDEX idx_jobs_title_trigram ON jobs USING GIN(title gin_trgm_ops);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();