"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRecommendationFeedback1710000000000 = void 0;
class CreateRecommendationFeedback1710000000000 {
    constructor() {
        this.name = 'CreateRecommendationFeedback1710000000000';
    }
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_recommendation_feedback_feedback_type"`);
        await queryRunner.query(`DROP INDEX "IDX_recommendation_feedback_recommendation"`);
        await queryRunner.query(`DROP INDEX "IDX_recommendation_feedback_user"`);
        await queryRunner.query(`ALTER TABLE "recommendation_feedback" DROP CONSTRAINT "FK_recommendation_feedback_recommendation"`);
        await queryRunner.query(`ALTER TABLE "recommendation_feedback" DROP CONSTRAINT "FK_recommendation_feedback_user"`);
        await queryRunner.query(`DROP TABLE "recommendation_feedback"`);
        await queryRunner.query(`DROP TYPE "public"."recommendation_feedback_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recommendation_feedback_feedback_type_enum"`);
    }
}
exports.CreateRecommendationFeedback1710000000000 = CreateRecommendationFeedback1710000000000;
//# sourceMappingURL=1710000000000-CreateRecommendationFeedback.js.map