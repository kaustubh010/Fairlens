-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "google_id" TEXT,
    "email" TEXT NOT NULL,
    "hashed_password" TEXT NOT NULL,
    "full_name" TEXT,
    "profile_picture" TEXT,
    "is_artist" BOOLEAN NOT NULL DEFAULT false,
    "user_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datasets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" TEXT,
    "raw_data" JSONB NOT NULL,
    "columns" JSONB NOT NULL,
    "row_count" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_results" (
    "id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "dataset_name" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "protected_attributes" TEXT[],
    "outcome_column" TEXT NOT NULL,
    "prediction_column" TEXT,
    "metrics" JSONB NOT NULL,
    "proxy_correlations" JSONB NOT NULL,
    "overall_score" DOUBLE PRECISION NOT NULL,
    "overall_severity" TEXT NOT NULL,
    "group_breakdown" JSONB NOT NULL,
    "recommendations" JSONB,
    "ai_explanation" JSONB,

    CONSTRAINT "audit_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_results" ADD CONSTRAINT "audit_results_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_results" ADD CONSTRAINT "audit_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
