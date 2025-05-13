import { SkillStatus } from 'src/entities/skill.entity';
export declare class CreateSkillDto {
    name: string;
    subject: string;
    category?: string;
    description?: string;
    gradeLevel: number;
    status?: SkillStatus;
}
declare const UpdateSkillDto_base: import("@nestjs/common").Type<Partial<CreateSkillDto>>;
export declare class UpdateSkillDto extends UpdateSkillDto_base {
    status?: SkillStatus;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    deletedBy?: string;
    prerequisites?: string[];
}
export {};
