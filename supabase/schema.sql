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
    CONSTRAINT unique_unit_date_shift UNIQUE (unit_id, production_date, shift)
);

-- Ensure columns exist if table was already created
ALTER TABLE production_days ADD COLUMN IF NOT EXISTS supervisor_id VARCHAR(50) DEFAULT 'SUP-01';
ALTER TABLE production_days ADD COLUMN IF NOT EXISTS lane_name VARCHAR(100) DEFAULT 'Lane 01';
ALTER TABLE production_days ADD COLUMN IF NOT EXISTS worker_name VARCHAR(100) DEFAULT '';
ALTER TABLE production_days ADD COLUMN IF NOT EXISTS worker_id VARCHAR(50) DEFAULT '';

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

-- 7. Seed Data matching the reference sheet (Unit: 01, Date: 1st Sep 2026)
DO $$
DECLARE
    v_unit_id UUID;
    v_day_id UUID;
BEGIN
    -- Insert Unit 01
    INSERT INTO units (unit_name)
    VALUES ('Unit 01')
    ON CONFLICT (unit_name) DO UPDATE SET unit_name = EXCLUDED.unit_name
    RETURNING id INTO v_unit_id;

    -- Insert Production Day for 2026-09-01
    INSERT INTO production_days (unit_id, production_date, shift, supervisor_name)
    VALUES (v_unit_id, '2026-09-01', 'Shift 01', 'R. K. Sharma')
    ON CONFLICT (unit_id, production_date, shift) DO UPDATE
    SET supervisor_name = EXCLUDED.supervisor_name
    RETURNING id INTO v_day_id;

    -- Clear previous seed entries if any for this day
    DELETE FROM hourly_production WHERE production_day_id = v_day_id;
    DELETE FROM critical_operations WHERE production_day_id = v_day_id;
    DELETE FROM downtime_summary WHERE production_day_id = v_day_id;
    DELETE FROM downtime_details WHERE production_day_id = v_day_id;

    -- Insert Hourly Production (10 hours matching the reference image)
    -- Inputs: 200 each, Targets: 150 each, Actuals: 100, 120, 160, 150, 90, 165, 140, 180, 120, 90
    INSERT INTO hourly_production (production_day_id, hour, input_available, target, actual) VALUES
    (v_day_id, 1, 200, 150, 100),
    (v_day_id, 2, 200, 150, 120),
    (v_day_id, 3, 200, 150, 160),
    (v_day_id, 4, 200, 150, 150),
    (v_day_id, 5, 200, 150, 90),
    (v_day_id, 6, 200, 150, 165),
    (v_day_id, 7, 200, 150, 140),
    (v_day_id, 8, 200, 150, 180),
    (v_day_id, 9, 200, 150, 120),
    (v_day_id, 10, 200, 150, 90);

    -- Insert Critical Operations from reference sheet
    -- 1: SLEEVE ATTACH (SUNIL 48/45, SUNIL 42/45)
    INSERT INTO critical_operations (production_day_id, operation_no, operation_name, worker_name, worker_id, hour, production, target) VALUES
    (v_day_id, 1, 'SLEEVE ATTACH', 'SUNIL', 'EMP-101', 1, 48, 45),
    (v_day_id, 1, 'SLEEVE ATTACH', 'SUNIL', 'EMP-101', 2, 42, 45),
    -- 2: SLEEVE ATTACH (MAMATA 29/45, MAMATA 45/45)
    (v_day_id, 2, 'SLEEVE ATTACH', 'MAMATA', 'EMP-102', 1, 29, 45),
    (v_day_id, 2, 'SLEEVE ATTACH', 'MAMATA', 'EMP-102', 2, 45, 45),
    -- 3: SIDE SEAM (UMESH 36/35, UMESH 36/35)
    (v_day_id, 3, 'SIDE SEAM', 'UMESH', 'EMP-103', 1, 36, 35),
    (v_day_id, 3, 'SIDE SEAM', 'UMESH', 'EMP-103', 2, 36, 35),
    -- 4: SIDE SEAM (VIKASH 25/35, LAKSHMI 37/35)
    (v_day_id, 4, 'SIDE SEAM', 'VIKASH', 'EMP-104', 1, 25, 35),
    (v_day_id, 4, 'SIDE SEAM', 'LAKSHMI', 'EMP-105', 2, 37, 35),
    -- 5: NECK RIB ATTACH (MAYA 26/30, KAILASH 32/30)
    (v_day_id, 5, 'NECK RIB ATTACH', 'MAYA', 'EMP-106', 1, 26, 30),
    (v_day_id, 5, 'NECK RIB ATTACH', 'KAILASH', 'EMP-107', 2, 32, 30),
    -- 6: NECK RIB ATTACH (RAGHU 20/30, LAKSHMI 30/30)
    (v_day_id, 6, 'NECK RIB ATTACH', 'RAGHU', 'EMP-108', 1, 20, 30),
    (v_day_id, 6, 'NECK RIB ATTACH', 'LAKSHMI', 'EMP-105', 2, 30, 30),
    -- 7: BOTTOM HEM (GOVIN 42/40, VIKASH 40/40)
    (v_day_id, 7, 'BOTTOM HEM', 'GOVIN', 'EMP-109', 1, 42, 40),
    (v_day_id, 7, 'BOTTOM HEM', 'VIKASH', 'EMP-104', 2, 40, 40),
    -- 8: BOTTOM HEM (RAGHU 40/40, MAHESH 40/40)
    (v_day_id, 8, 'BOTTOM HEM', 'RAGHU', 'EMP-108', 1, 40, 40),
    (v_day_id, 8, 'BOTTOM HEM', 'MAHESH', 'EMP-110', 2, 40, 40);

    -- Insert Downtime Summary
    INSERT INTO downtime_summary (production_day_id, category, hour, minutes) VALUES
    (v_day_id, 'Machine Breakdown', 1, 35),
    (v_day_id, 'Machine Breakdown', 2, 15),
    (v_day_id, 'Line Unbalancing', 1, 40),
    (v_day_id, 'Line Unbalancing', 2, 25),
    (v_day_id, 'Operator Movement', 1, 62),
    (v_day_id, 'Operator Movement', 2, 75),
    (v_day_id, 'Re work', 1, 25),
    (v_day_id, 'Re work', 2, 0),
    (v_day_id, 'Idle', 1, 42),
    (v_day_id, 'Idle', 2, 34),
    (v_day_id, 'Style Changeover', 1, 55),
    (v_day_id, 'Style Changeover', 2, 70);

    -- Insert Downtime Details
    INSERT INTO downtime_details (production_day_id, reason, worker_name, hour, minutes) VALUES
    (v_day_id, 'Machine Breakdown', 'SHIVO', 1, 20),
    (v_day_id, 'Machine Breakdown', 'SUNIL', 2, 40),
    (v_day_id, 'Machine Breakdown', 'MINITA', 1, 15),
    (v_day_id, 'Machine Breakdown', 'RAKESH', 2, 25),
    (v_day_id, 'Operator Movement', 'DINESH', 1, 9),
    (v_day_id, 'Operator Movement', 'VIKASH', 2, 20),
    (v_day_id, 'Re work', 'KALAM', 1, 12),
    (v_day_id, 'Re work', 'UMESH', 2, 7),
    (v_day_id, 'Idle', 'VIJAY', 1, 35),
    (v_day_id, 'Idle', 'MAHESH', 2, 12);

END $$;
