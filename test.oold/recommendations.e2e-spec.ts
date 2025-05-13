const resourceTitle = 'E2E Test Resource';

const mockRecommendation: RecommendationDto = {
  id: uuidv4(),
  skill: createMockSkill(skillId),
  resources: [createMockResource(resourceId, resourceTitle)],
  priority: Priority.MEDIUM,
  createdAt: new Date(),
}; 