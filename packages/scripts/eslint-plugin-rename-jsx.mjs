export default {
    rules: {
        'rename-jsx-import': {
            meta: {
                type: 'problem',
                docs: {
                    description: 'Rename .jsx extensions to .js in import statements',
                    recommended: true,
                },
                fixable: 'code',
                schema: [],
                messages: {
                    rename: 'Import statements should not use the .jsx extension.',
                },
            },
            create(context) {
                return {
                    // Only visit imports that *already* end in “.jsx”
                    'ImportDeclaration[source.value=/\\.jsx$/]'(node) {
                        const source = node.source.value; // guaranteed string
                        const fixed = `${source.slice(0, -4)}.js`;

                        context.report({
                            node: node.source, // narrowest node → faster autofix
                            messageId: 'rename',
                            fix: (fixer) => fixer.replaceText(node.source, `'${fixed}'`),
                        });
                    },
                };
            },
        },
    },
};
