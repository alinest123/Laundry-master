-- Add Cal.com booking fields to appointments table
-- cal_booking_uid: Cal.com's unique booking UID (used for upsert / dedup)
-- scheduled_end:   end time from Cal.com payload
-- service_id / expert_id become nullable so Cal.com bookings don't require internal IDs

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cal_booking_uid text UNIQUE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS scheduled_end timestamp with time zone;
ALTER TABLE appointments ALTER COLUMN service_id DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN expert_id DROP NOT NULL;
