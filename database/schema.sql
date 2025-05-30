-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE exercise_category AS ENUM ('chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full_body');
CREATE TYPE workout_status AS ENUM ('planned', 'in_progress', 'completed', 'skipped');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'pro');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    fitness_goal TEXT CHECK (fitness_goal IN ('strength', 'muscle', 'endurance', 'weight_loss', 'general')),
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
    preferred_units TEXT CHECK (preferred_units IN ('metric', 'imperial')) DEFAULT 'metric',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Subscription related fields
    subscription_status TEXT CHECK (subscription_status IN ('free', 'premium', 'trial')) DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    trial_started_at TIMESTAMP WITH TIME ZONE,
    data_retention_days INTEGER DEFAULT 90, -- Free users: 90 days, Premium: unlimited (-1)
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Exercise library
CREATE TABLE public.exercises (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    muscle_groups TEXT[] DEFAULT '{}',
    equipment TEXT[],
    category TEXT CHECK (category IN ('push', 'pull', 'legs', 'core', 'cardio', 'other')),
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    is_custom BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0)
);

-- Workout templates
CREATE TABLE public.workout_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    estimated_duration INTEGER, -- minutes
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template exercises (exercises in a template)
CREATE TABLE public.template_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES public.workout_templates(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    target_sets INTEGER,
    target_reps INTEGER,
    target_weight DECIMAL,
    rest_time INTEGER -- seconds
);

-- Workout sessions table
CREATE TABLE public.workout_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) NOT NULL,
    name TEXT,
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    total_volume DECIMAL(10,2), -- Total weight * reps for the session
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_duration CHECK (duration_seconds IS NULL OR duration_seconds > 0),
    CONSTRAINT positive_volume CHECK (total_volume IS NULL OR total_volume >= 0),
    CONSTRAINT completed_after_started CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- Exercise sets table
CREATE TABLE public.exercise_sets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES public.exercises(id) NOT NULL,
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight DECIMAL(10,2),
    duration_seconds INTEGER, -- For time-based exercises
    distance DECIMAL(10,2), -- For distance-based exercises
    rest_duration_seconds INTEGER,
    notes TEXT,
    is_warmup BOOLEAN DEFAULT FALSE,
    is_personal_record BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_set_number CHECK (set_number > 0),
    CONSTRAINT positive_reps CHECK (reps IS NULL OR reps > 0),
    CONSTRAINT positive_weight CHECK (weight IS NULL OR weight > 0),
    CONSTRAINT positive_duration CHECK (duration_seconds IS NULL OR duration_seconds > 0),
    CONSTRAINT positive_distance CHECK (distance IS NULL OR distance > 0),
    CONSTRAINT positive_rest CHECK (rest_duration_seconds IS NULL OR rest_duration_seconds >= 0)
);

-- Personal records table
CREATE TABLE public.personal_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) NOT NULL,
    exercise_id UUID REFERENCES public.exercises(id) NOT NULL,
    record_type TEXT CHECK (record_type IN ('max_weight', 'max_reps', 'max_volume', 'best_time', 'longest_distance')) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    reps INTEGER, -- For weight-based records
    achieved_at TIMESTAMP WITH TIME ZONE NOT NULL,
    exercise_set_id UUID REFERENCES public.exercise_sets(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_value CHECK (value > 0),
    CONSTRAINT positive_reps_pr CHECK (reps IS NULL OR reps > 0),
    UNIQUE(user_id, exercise_id, record_type)
);

-- Row Level Security Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies for user profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for exercises
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Users can create custom exercises" ON public.exercises FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policies for workout templates
CREATE POLICY "Users can view own templates and public templates" ON public.workout_templates 
    FOR SELECT USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY "Users can create own templates" ON public.workout_templates 
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own templates" ON public.workout_templates 
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own templates" ON public.workout_templates 
    FOR DELETE USING (user_id = auth.uid());

-- Policies for workouts
CREATE POLICY "Users can manage own workouts" ON public.workout_sessions FOR ALL USING (auth.uid() = user_id);

-- Policies for exercise sets
CREATE POLICY "Users can manage own exercise sets" ON public.exercise_sets FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workout_sessions ws 
        WHERE ws.id = workout_session_id AND ws.user_id = auth.uid()
    )
);

-- Policies for personal records
CREATE POLICY "Users can manage own personal records" ON public.personal_records FOR ALL USING (auth.uid() = user_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Indexes for performance
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_workout_sessions_user_date ON public.workout_sessions(user_id, started_at DESC);
CREATE INDEX idx_exercise_sets_workout ON public.exercise_sets(workout_session_id, set_number);
CREATE INDEX idx_personal_records_user_exercise ON public.personal_records(user_id, exercise_id, record_type);

-- Insert some basic exercises
INSERT INTO public.exercises (name, category, muscle_groups, equipment, instructions, is_custom) VALUES
('Bench Press', 'chest', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['barbell', 'bench'], 'Lie on bench, lower bar to chest, press up', false),
('Squat', 'legs', ARRAY['quadriceps', 'glutes', 'hamstrings'], ARRAY['barbell', 'squat_rack'], 'Stand with feet shoulder-width apart, squat down, drive through heels', false),
('Deadlift', 'back', ARRAY['hamstrings', 'glutes', 'back', 'traps'], ARRAY['barbell'], 'Hinge at hips, keep back straight, lift bar from floor', false),
('Pull-up', 'back', ARRAY['lats', 'biceps', 'rear_delts'], ARRAY['pull_up_bar'], 'Hang from bar, pull body up until chin over bar', false),
('Overhead Press', 'shoulders', ARRAY['shoulders', 'triceps', 'core'], ARRAY['barbell'], 'Press bar overhead from shoulder height', false),
('Barbell Row', 'back', ARRAY['lats', 'rhomboids', 'rear_delts', 'biceps'], ARRAY['barbell'], 'Bend over, row bar to lower chest', false); 