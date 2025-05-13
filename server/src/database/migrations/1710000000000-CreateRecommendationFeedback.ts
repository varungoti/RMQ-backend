import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRecommendationFeedback1710000000000 implements MigrationInterface {
    name = 'CreateRecommendationFeedback1710000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types first
        await queryRunner.query(`
            CREATE TYPE "public"."recommendation_feedback_feedback_type_enum" AS ENUM (
                'helpful', 'not_helpful', 'partially_helpful', 'irrelevant', 'too_difficult', 'too_easy'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."recommendation_feedback_source_enum" AS ENUM (
                'user', 'assessment', 'ai', 'system'
            )
        `);

        // Create the table
        await queryRunner.query(`
            CREATE TABLE "recommendation_feedback" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "recommendationId" uuid NOT NULL,
                "feedbackType" "public"."recommendation_feedback_feedback_type_enum" NOT NULL,
                "source" "public"."recommendation_feedback_source_enum" NOT NULL DEFAULT 'user',
                "comment" text,
                "impactScore" float,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_recommendation_feedback" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "recommendation_feedback"
            ADD CONSTRAINT "FK_recommendation_feedback_user"
            FOREIGN KEY ("userId")
            REFERENCES "user"("id")
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "recommendation_feedback"
            ADD CONSTRAINT "FK_recommendation_feedback_recommendation"
            FOREIGN KEY ("recommendationId")
            REFERENCES "recommendation"("id")
            ON DELETE CASCADE
        `);

        // Add indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_recommendation_feedback_user"
            ON "recommendation_feedback" ("userId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_recommendation_feedback_recommendation"
            ON "recommendation_feedback" ("recommendationId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_recommendation_feedback_feedback_type"
            ON "recommendation_feedback" ("feedbackType")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_recommendation_feedback_feedback_type"`);
        await queryRunner.query(`DROP INDEX "IDX_recommendation_feedback_recommendation"`);
        await queryRunner.query(`DROP INDEX "IDX_recommendation_feedback_user"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "recommendation_feedback" DROP CONSTRAINT "FK_recommendation_feedback_recommendation"`);
        await queryRunner.query(`ALTER TABLE "recommendation_feedback" DROP CONSTRAINT "FK_recommendation_feedback_user"`);

        // Drop the table
        await queryRunner.query(`DROP TABLE "recommendation_feedback"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE "public"."recommendation_feedback_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recommendation_feedback_feedback_type_enum"`);
    }
} 