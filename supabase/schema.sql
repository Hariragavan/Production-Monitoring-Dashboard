-- ==========================================================
-- Production Monitoring TV Dashboard Database Schema
-- Run this complete script in the Supabase SQL Editor
-- ==========================================================

-- 1. Create Units Table
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Pre-seed standard units
INSERT INTO units (unit_name) VALUES 
('Unit 01'),
('Unit 02')
ON CONFLICT (unit_name) DO NOTHING;

-- 2. Create Production Days Table (Supports multiple lanes and dates)
CREATE TABLE IF NOT EXISTS production_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    production_date DATE NOT NULL,
    shift VARCHAR(50) NOT NULL DEFAULT 'Shift 01',
    supervisor_name VARCHAR(100) NOT NULL DEFAULT 'Supervisor',
    supervisor_id VARCHAR(50) DEFAULT 'SUP-01',
    lane_name VARCHAR(100) NOT NULL DEFAULT 'Lane 01',
    worker_name VARCHAR(100) DEFAULT '',
    worker_id VARCHAR(50) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_unit_date_lane_shift UNIQUE (unit_id, production_date, lane_name, shift)
);

-- 3. Create Hourly Production Table (Hours 1 to 10)
CREATE TABLE IF NOT EXISTS hourly_production (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_day_id UUID REFERENCES production_days(id) ON DELETE CASCADE,
    hour INT NOT NULL CHECK (hour >= 1 AND hour <= 10),
    input_available INT NOT NULL DEFAULT 0 CHECK (input_available >= 0),
    target INT NOT NULL DEFAULT 0 CHECK (target >= 0),
    actual INT NOT NULL DEFAULT 0 CHECK (actual >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_day_hour UNIQUE (production_day_id, hour)
);

-- 4. Create Critical Operations Table
CREATE TABLE IF NOT EXISTS critical_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_day_id UUID REFERENCES production_days(id) ON DELETE CASCADE,
    operation_no INT NOT NULL DEFAULT 1,
    operation_name VARCHAR(100) NOT NULL,
    worker_name VARCHAR(100) NOT NULL,
    worker_id VARCHAR(50) NOT NULL DEFAULT '',
    hour INT NOT NULL CHECK (hour >= 1 AND hour <= 10),
    production INT NOT NULL DEFAULT 0 CHECK (production >= 0),
    target INT NOT NULL DEFAULT 0 CHECK (target >= 0),
    completed BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) DEFAULT 'in_progress',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Downtime Summary Table
CREATE TABLE IF NOT EXISTS downtime_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_day_id UUID REFERENCES production_days(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    hour INT NOT NULL CHECK (hour >= 1 AND hour <= 10),
    minutes INT NOT NULL DEFAULT 0 CHECK (minutes >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_day_category_hour UNIQUE (production_day_id, category, hour)
);

-- 6. Create Downtime Details Table
CREATE TABLE IF NOT EXISTS downtime_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_day_id UUID REFERENCES production_days(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    worker_name VARCHAR(100) NOT NULL,
    hour INT NOT NULL CHECK (hour >= 1 AND hour <= 10),
    minutes INT NOT NULL DEFAULT 0 CHECK (minutes >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Disable RLS and add public access policies so all web writes succeed
ALTER TABLE units DISABLE ROW LEVEL SECURITY;
ALTER TABLE production_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_production DISABLE ROW LEVEL SECURITY;
ALTER TABLE critical_operations DISABLE ROW LEVEL SECURITY;
ALTER TABLE downtime_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE downtime_details DISABLE ROW LEVEL SECURITY;

-- 8. Set Replica Identity to FULL for accurate Realtime updates
ALTER TABLE units REPLICA IDENTITY FULL;
ALTER TABLE production_days REPLICA IDENTITY FULL;
ALTER TABLE hourly_production REPLICA IDENTITY FULL;
ALTER TABLE critical_operations REPLICA IDENTITY FULL;
ALTER TABLE downtime_summary REPLICA IDENTITY FULL;
ALTER TABLE downtime_details REPLICA IDENTITY FULL;

-- 9. Add all tables to Supabase Realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE units;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE production_days;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE hourly_production;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE critical_operations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE downtime_summary;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE downtime_details;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

