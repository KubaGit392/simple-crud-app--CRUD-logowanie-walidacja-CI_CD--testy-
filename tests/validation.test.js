const { errorResponse } = require('../utils/validation');

test('Tworzy poprawny obiekt błędu', () => {
  const err = errorResponse(400, [{ field: 'email', message: 'Niepoprawny' }]);
  expect(err.status).toBe(400);
  expect(err.fieldErrors[0].field).toBe('email');
});