-- AlterTable: Make revision_note nullable
ALTER TABLE "submission_revisions" ALTER COLUMN "revision_note" DROP NOT NULL;

-- AlterTable: Add version column (nullable first)
ALTER TABLE "submission_revisions" ADD COLUMN "version" INTEGER;

-- Update existing records: Set version based on submitted_at order for each submission
-- For each submission, assign version numbers starting from 2 (version 1 is the initial submission in submissions table)
DO $$
DECLARE
    submission_rec RECORD;
    revision_rec RECORD;
    version_num INTEGER;
BEGIN
    FOR submission_rec IN 
        SELECT DISTINCT submission_id 
        FROM submission_revisions 
        ORDER BY submission_id
    LOOP
        version_num := 2; -- Start from 2 because version 1 is the initial submission
        FOR revision_rec IN 
            SELECT id 
            FROM submission_revisions 
            WHERE submission_id = submission_rec.submission_id 
            ORDER BY submitted_at ASC
        LOOP
            UPDATE submission_revisions
            SET version = version_num
            WHERE id = revision_rec.id;
            version_num := version_num + 1;
        END LOOP;
    END LOOP;
END $$;

-- Set default value for new records (will be set by application logic)
-- Set NOT NULL constraint after updating existing data
ALTER TABLE "submission_revisions" ALTER COLUMN "version" SET NOT NULL;

-- CreateIndex
CREATE INDEX "submission_revisions_version_idx" ON "submission_revisions"("version");
