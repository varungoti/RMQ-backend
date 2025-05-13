  expect(recForTestSkill?.skill?.id).toEqual(testSkill.id);
  // Check resource details
  expect(recForTestSkill?.resources).toBeDefined();
  expect(recForTestSkill?.resources[0]?.id).toBeDefined();
  expect(recForTestSkill?.resources[0]?.title).toBeDefined();

  // Verify History
  expect(history).toHaveLength(1);
  expect(history[0].priority).toEqual(Priority.HIGH);
  expect(history[0].action).toEqual('viewed'); // Assuming 'viewed' is the default or expected action
  expect(history[0].resource?.id).toEqual(recForTestSkill?.resources[0]?.id);

  await recommendationsService.deleteRecommendationResource( 