import { createHybridResponse } from '../src/common/utils/response-helper';

describe('ResponseHelper', () => {
  describe('createHybridResponse', () => {
    it('should create a hybrid response with boolean success parameter', () => {
      // Arrange
      const data = {
        id: '123',
        question: { id: 'q1' },
        assessmentSession: { id: 's1' },
        isCorrect: true
      };
      const message = 'Success message';
      const success = true;

      // Act
      const result = createHybridResponse(data, message, success);

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', message);
      expect(result).toHaveProperty('data', data);
      expect(result).toHaveProperty('id', data.id);
      expect(result).toHaveProperty('isCorrect', data.isCorrect);
      expect(result.question).toEqual(data.question);
      expect(result.assessmentSession).toEqual(data.assessmentSession);
      // Importantly, should NOT have a 'correct' property
      expect(result).not.toHaveProperty('correct');
    });

    it('should create a hybrid response with object as third parameter', () => {
      // Arrange
      const data = {
        id: '123',
        question: { id: 'q1' },
        assessmentSession: { id: 's1' },
        isCorrect: true
      };
      const message = 'Success message';
      const additionalProps = { correct: true, extraProp: 'value' };

      // Act
      const result = createHybridResponse(data, message, additionalProps);

      // Assert
      expect(result).toHaveProperty('success', true); // Default success value
      expect(result).toHaveProperty('message', message);
      expect(result).toHaveProperty('data', data);
      expect(result).toHaveProperty('id', data.id);
      expect(result).toHaveProperty('isCorrect', data.isCorrect);
      // Additional props should be added
      expect(result).toHaveProperty('correct', additionalProps.correct);
      expect(result).toHaveProperty('extraProp', additionalProps.extraProp);
    });

    it('should handle null data', () => {
      // Act
      const result = createHybridResponse(null, 'No data', false);

      // Assert
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('message', 'No data');
      expect(result).toHaveProperty('data', null);
    });
  });
}); 