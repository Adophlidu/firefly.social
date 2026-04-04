export default {
    rules: {
        'require-newline-after-use-client': {
            meta: {
                type: 'layout',
                docs: {
                    description: 'Require a blank line after "use client" directive',
                    recommended: true,
                },
                fixable: 'code',
                schema: [],
                messages: {
                    missingNewline: 'Expected a blank line after "use client" directive.',
                },
            },
            create(context) {
                const sourceCode = context.getSourceCode();

                return {
                    Program(node) {
                        const firstStatement = node.body[0];
                        if (firstStatement?.type !== 'ExpressionStatement') {
                            return;
                        }

                        const expression = firstStatement.expression;
                        if (expression.type !== 'Literal' || expression.value !== 'use client') {
                            return;
                        }

                        // Get the token after 'use client';
                        const useClientToken = sourceCode.getLastToken(firstStatement);
                        if (!useClientToken) {
                            return;
                        }

                        // Get the next token (should be the first token of the next statement or EOF)
                        const nextToken = sourceCode.getTokenAfter(useClientToken, {
                            includeComments: false,
                        });

                        if (!nextToken) {
                            // End of file, no need for newline
                            return;
                        }

                        // Check if there's at least one blank line between 'use client'; and the next token
                        const linesBetween = nextToken.loc.start.line - useClientToken.loc.end.line;

                        if (linesBetween < 2) {
                            context.report({
                                node: firstStatement,
                                messageId: 'missingNewline',
                                fix: (fixer) => {
                                    // Insert a newline after the semicolon (which will create a blank line)
                                    return fixer.insertTextAfter(useClientToken, '\n');
                                },
                            });
                        }
                    },
                };
            },
        },
    },
};
