function greet(name) {
    return `Hello, ${name}!`
}

describe('greet', () => {
    test('should say hello to Tom.', () => {
        const response = greet('Tom');
        expect(response).toBe('Hello, Tom!');
    });
})