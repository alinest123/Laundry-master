CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'administrator', 'editor', 'author', 'consultant', 'user');--> statement-breakpoint
CREATE TYPE "public"."stain_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."security_event" AS ENUM('login_failed', 'unauthorized', 'permission_denied', 'brute_force');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"featured_image" text,
	"parent_id" integer,
	"is_hidden" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio" text,
	"avatar" text,
	"role" text DEFAULT 'Author' NOT NULL,
	"email" text,
	"twitter" text,
	"linkedin" text,
	"expertise" text,
	"article_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"article_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"content" text DEFAULT '' NOT NULL,
	"featured_image" text,
	"reading_time" integer DEFAULT 5 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"author_id" integer NOT NULL,
	"is_featured" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"meta_title" text,
	"meta_description" text,
	"meta_keywords" text,
	"canonical_url" text,
	"og_image" text,
	"structured_data" text,
	"noindex" boolean DEFAULT false NOT NULL,
	"nofollow" boolean DEFAULT false NOT NULL,
	"toc_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "article_categories" (
	"article_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "article_categories_article_id_category_id_pk" PRIMARY KEY("article_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "article_tags" (
	"article_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "article_tags_article_id_tag_id_pk" PRIMARY KEY("article_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "article_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"alt_text" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_references" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"description" text,
	"ref_type" text DEFAULT 'reference' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_related" (
	"article_id" integer NOT NULL,
	"related_article_id" integer NOT NULL,
	CONSTRAINT "article_related_article_id_related_article_id_pk" PRIMARY KEY("article_id","related_article_id")
);
--> statement-breakpoint
CREATE TABLE "experts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"bio" text NOT NULL,
	"avatar" text,
	"specializations" text[] DEFAULT '{}' NOT NULL,
	"rating" numeric(3, 1) DEFAULT '4.8' NOT NULL,
	"session_count" integer DEFAULT 0 NOT NULL,
	"years_experience" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"duration" integer DEFAULT 60 NOT NULL,
	"price" numeric(10, 2) DEFAULT '150.00' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"icon" text,
	"category" text DEFAULT 'General' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"notes" text,
	"zoom_link" text,
	"user_email" text NOT NULL,
	"user_name" text NOT NULL,
	"service_id" integer NOT NULL,
	"expert_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_name" text NOT NULL,
	"author_role" text NOT NULL,
	"author_avatar" text,
	"content" text NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"email_verified" boolean DEFAULT true NOT NULL,
	"email_verification_token" text,
	"verification_token_expiry" timestamp with time zone,
	"password_reset_token" text,
	"reset_token_expiry" timestamp with time zone,
	"avatar_url" text,
	"bio" text,
	"phone" text,
	"newsletter_enabled" boolean DEFAULT true NOT NULL,
	"newsletter_topics" text DEFAULT '[]',
	"two_fa_enabled" boolean DEFAULT false NOT NULL,
	"two_fa_secret" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "fabrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"care_instructions" text,
	"properties" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fabrics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "stains" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"removal_steps" text,
	"difficulty" "stain_difficulty" DEFAULT 'medium' NOT NULL,
	"fabric_compatibility" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stains_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"provider_ref" text,
	"description" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zoom_meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"host_email" text NOT NULL,
	"join_url" text,
	"start_time" timestamp with time zone,
	"duration" integer DEFAULT 60,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"related_type" text,
	"related_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_library" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"url" text NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"alt_text" text,
	"uploaded_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"status_code" integer DEFAULT 301 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redirects_from_path_unique" UNIQUE("from_path")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_name" text DEFAULT 'The Science of Professional Textile Care' NOT NULL,
	"site_description" text,
	"contact_email" text,
	"maintenance_mode" boolean DEFAULT false NOT NULL,
	"custom_head_html" text,
	"custom_body_html" text,
	"social_links" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"event" "security_event" NOT NULL,
	"user_id" integer,
	"ip_address" text,
	"user_agent" text,
	"path" text,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"user_email" text,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"diff" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"article_id" integer NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_articles_user_id_article_id_unique" UNIQUE("user_id","article_id")
);
--> statement-breakpoint
CREATE TABLE "page_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"page" text NOT NULL,
	"field_key" text NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_content_page_field_key_unique" UNIQUE("page","field_key")
);
--> statement-breakpoint
CREATE TABLE "article_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"author_name" text NOT NULL,
	"author_email" text NOT NULL,
	"content" text NOT NULL,
	"is_approved" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"snapshot" text DEFAULT '{}' NOT NULL,
	"saved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
