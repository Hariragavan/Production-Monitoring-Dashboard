-- Production Monitoring TV Dashboard Database Schema
-- Run this script in the Supabase SQL Editor

-- 1. Create Units Table
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Production Days Table
CREATE TABLE IF NOT EXISTS production_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    production_date DATE NOT NULL,
    shift VARCHAR(50) NOT NULL DEFAULT 'Shift 01',
    supervisor_name VARCHAR(100) NOT NULL DEFAULT 'Supervisor',
    supervisor_id VARCHAR(50) DEFAULT 'SUP-01',
    lane_name VARCHAR(100) DEFAULT 'Lane 01',
    worker_name VARCHAR(100) DEFAULT '',
    worker_id VARCHAR(50) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_unit_date_lane_shift UNIQUE (unit_id, production_date, lane_name, shift)
);

-- Ensure columns exist and update unique constraint if table was already created
ALTER TABLE production_days ADD COLUMN IF NOT EXISTS supervisor_id VARCHAR(50) DEFAULT 'SUP-01';
ALTER TABLE production_days ADD COLUMN IF NOT EXISTS lane_name VARCHAR(100) DEFAULT 'Lane 01';
ALTER TABLE production_days ADD COLUMN IF NOT EXISTS worker_name VARCHAR(100) DEFAULT '';
ALTER TABLE production_days ADD COLUMN IF NOT EXISTS worker_id VARCHAR(50) DEFAULT '';

-- Update constraint to include lane_name for multi-lane support
ALTER TABLE production_days DROP CONSTRAINT IF EXISTS unique_unit_date_shift;
ALTER TABLE production_days DROP CONSTRAINT IF EXISTS unique_unit_date_lane_shift;
ALTER TABLE production_days ADD CONSTRAINT unique_unit_date_lane_shift UNIQUE (unit_id, production_date, lane_name, shift);

-- 3. Create Hourly Production Table
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

-- Disable Row Level Security (RLS) on all production operational tables
-- so that writes from the supervisor editor and TV dashboard are never blocked by policy violations:
ALTER TABLE units DISABLE ROW LEVEL SECURITY;
ALTER TABLE production_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_production DISABLE ROW LEVEL SECURITY;
ALTER TABLE critical_operations DISABLE ROW LEVEL SECURITY;
ALTER TABLE downtime_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE downtime_details DISABLE ROW LEVEL SECURITY;

-- If RLS is enabled in the project, allow full CRUD for both anon and authenticated users:
DO $$
BEGIN
  -- Drop old restrictive policies if they exist
  DROP POLICY IF EXISTS "Auth all units" ON units;
  DROP POLICY IF EXISTS "Auth all production_days" ON production_days;
  DROP POLICY IF EXISTS "Auth all hourly_production" ON hourly_production;
  DROP POLICY IF EXISTS "Auth all critical_operations" ON critical_operations;
  DROP POLICY IF EXISTS "Auth all downtime_summary" ON downtime_summary;
  DROP POLICY IF EXISTS "Auth all downtime_details" ON downtime_details;

  DROP POLICY IF EXISTS "Public read units" ON units;
  DROP POLICY IF EXISTS "Public read production_days" ON production_days;
  DROP POLICY IF EXISTS "Public read hourly_production" ON hourly_production;
  DROP POLICY IF EXISTS "Public read critical_operations" ON critical_operations;
  DROP POLICY IF EXISTS "Public read downtime_summary" ON downtime_summary;
  DROP POLICY IF EXISTS "Public read downtime_details" ON downtime_details;

  DROP POLICY IF EXISTS "Allow all units" ON units;
  DROP POLICY IF EXISTS "Allow all production_days" ON production_days;
  DROP POLICY IF EXISTS "Allow all hourly_production" ON hourly_production;
  DROP POLICY IF EXISTS "Allow all critical_operations" ON critical_operations;
  DROP POLICY IF EXISTS "Allow all downtime_summary" ON downtime_summary;
  DROP POLICY IF EXISTS "Allow all downtime_details" ON downtime_details;

  -- Create permissive policies
  CREATE POLICY "Allow all units" ON units FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all production_days" ON production_days FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all hourly_production" ON hourly_production FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all critical_operations" ON critical_operations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all downtime_summary" ON downtime_summary FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all downtime_details" ON downtime_details FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Enable Supabase Realtime for instant TV Dashboard updates
DO $$
BEGIN
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

