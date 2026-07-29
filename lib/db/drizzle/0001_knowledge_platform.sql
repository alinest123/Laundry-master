CREATE TABLE "topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"featured_image" text,
	"parent_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "article_topics" (
	"article_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	CONSTRAINT "article_topics_article_id_topic_id_pk" PRIMARY KEY("article_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "content_relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_article_id" integer NOT NULL,
	"target_article_id" integer NOT NULL,
	"relationship_type" text DEFAULT 'related' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_paths" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"topic_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_paths_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "learning_path_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"learning_path_id" integer NOT NULL,
	"article_id" integer NOT NULL,
	"stage" text DEFAULT 'build-understanding' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editorial_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"doc_type" text NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"effective_date" text,
	"doc_number" text,
	"status" text DEFAULT 'active' NOT NULL,
	"approved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "editorial_documents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "content_type" text DEFAULT 'professional-article' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "knowledge_level" text DEFAULT 'professional' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "difficulty" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "key_takeaway" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "learning_objectives" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "expert_review_status" text DEFAULT 'not-reviewed' NOT NULL;