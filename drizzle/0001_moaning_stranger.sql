ALTER TABLE "room_players" ADD COLUMN "hand" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "current_turn_seat" integer;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "dealer_hand" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "shoe" jsonb DEFAULT '[]'::jsonb NOT NULL;