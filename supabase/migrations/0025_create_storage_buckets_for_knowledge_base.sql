
-- Create kb-raw bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kb-raw', 'kb-raw', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- Create kb-parsed bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kb-parsed', 'kb-parsed', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;
