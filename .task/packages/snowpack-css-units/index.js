const { ...CSS } = require('@csstools/tokenizer')
const { ...FS } = require('fs/promises')

module.exports = (snowpackConfig, pluginOptions) => ({
	name: 'snowpack-css-units',
	resolve: {
		input: ['.css'],
		output: ['.css'],
	},
	async load(id) {
		let promised = await FS.readFile(id.filePath)
		let code = promised.toString()
		let tokens = CSS.tokenize(code)
		let token

		let cssLead = ''
		let cssData = new Map
		let cssTail = ''

		while (
			(token = tokens()).done === false &&
			(token = token.value)
		) {
			if (token.type === 6 && token.data.toLowerCase() === 'import') {
				do {
					cssLead += token.lead + token.data + token.tail

					if (token.type === 1 && token.data === ';') {
						break
					}
				} while (
					(token = tokens()).done === false &&
					(token = token.value)
				)
			} else if (token.type === 9 && token.tail.startsWith('--')) {
				cssData.set(token.tail, `@property ${token.tail}{syntax:'<length-percentage>';inherits:true}\n`)
				cssTail += `calc(${token.data} * var(${token.tail}))`
			} else if (token.type === 9 && token.tail === 'rx') {
				cssTail += `${token.data / 16}rem`
			} else {
				cssTail += token.lead + token.data + token.tail
			}
		}

		let output = { '.css': `${cssLead}${cssData.size ? '\n' : ''}${[ ...cssData.values() ].join('\n')}${cssTail}` }

		return output
	},
})
