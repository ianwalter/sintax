const hljs = require('highlight.js')
const cheerio = require('cheerio')
const camelCase = require('camelcase')
const chalk = require('chalk')
const stripAnsi = require('strip-ansi')
const merge = require('deepmerge')
const ansiMark = require('ansi-mark')
const stripIndent = require('strip-indent')
const detectIndent = require('detect-indent')

const darkPalette = {
  addition: chalk.green,
  attr: chalk.yellow,
  attribute: chalk.blue,
  attrString: chalk.cyan,
  base: chalk.white,
  builtIn: chalk.blue,
  builtInName: chalk.blue,
  bullet: chalk.magenta,
  class: chalk.green,
  code: chalk.yellow,
  comment: chalk.white.dim,
  deletion: chalk.red,
  doctag: chalk.blue,
  emphasis: chalk.magenta,
  function: chalk.white,
  formula: chalk.green,
  keyword: chalk.red,
  lineNumbers: chalk.grey,
  literal: chalk.magenta,
  link: chalk.blue.underline,
  meta: chalk.cyan,
  name: chalk.cyan,
  number: chalk.green,
  params: chalk.blue,
  quote: chalk.gray,
  regexp: chalk.magenta,
  selectorAttr: chalk.green,
  selectorClass: chalk.yellow,
  selectorId: chalk.blue,
  selectorPseudo: chalk.cyan,
  selectorTag: chalk.magenta,
  string: chalk.yellow,
  strong: chalk.red,
  subst: chalk.cyan,
  symbol: chalk.cyan,
  tag: chalk.blue,
  templateTag: chalk.magenta,
  templateVariable: chalk.green,
  title: chalk.green,
  type: chalk.magenta,
  variable: chalk.red
}

const filter = (node, opts) => {
  let color
  let text
  let childText

  if (node.type === 'text') {
    text = node.data
    return text
  }

  if (node.name === 'span' && node.type === 'tag') {
    color = camelCase(node.attribs.class.split('-')[1])
  }

  if (node.childNodes && node.childNodes.length > 0) {
    childText = node.childNodes.map(childNode => filter(childNode, opts)).join('')

    if (typeof color === 'string') {
      return opts.colors[color](childText)
    }

    return childText
  }

  return ''
}

const padLine = (line, padding) => String().padStart(padding, ' ') + line

const getIndentStr = opts => {
  if (opts.$indent.tabs) {
    return String().padStart(1, '\t')
  }

  // Opts.$indent.spaces === true
  if (opts.tabsToSpaces === 0) {
    return '\u0000'
  }

  return String().padEnd(opts.tabsToSpaces, ' ')
}

const syntaxHlStr = (lang, script, opts, indentStart) => {
  let output = ''

  const indentStr = getIndentStr(opts)

  if (opts.$indent.tabs) {
    script = script.replace(/\t/g, indentStr)
  }

  if (opts.$indent.spaces) {
    script = script.replace(/\t/g, indentStr)
  }

  if (indentStart) {
    script = indentStr + script
  }

  const code = hljs.highlight(lang, script).value
  const lines = code.split('\n')

  lines.forEach((line, lineNumber) => {
    const html = `<code>${line}</code>`
    const $body = cheerio.load(html).root().find('code')[0]
    const text = filter($body, opts)
    output += text
    if (lineNumber !== lines.length - 1) {
      output += '\n'
    }
  })

  return output
}

const syntaxHlJson = (json, opts) => {
  const indentStr = getIndentStr(opts)

  try {
    json = JSON.stringify(json, (key, val) => {
      if (val instanceof Function) {
        return `[FUNCTION]${String(val)}[FUNCTION]`
      }
      return val
    }, indentStr)
  } catch (err) {
    err.message = '🦅  Chromafi: ' + err.message
    throw new Error(err)
  }

  const highlighted = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, match => {
    let colorClass = 'number'

    // eslint-disable-next-line unicorn/prefer-starts-ends-with
    if (/^"/.test(match)) {
      // eslint-disable-next-line unicorn/prefer-starts-ends-with
      if (/:$/.test(match)) {
        if (match.includes('-')) {
          colorClass = 'attrString'
          match = match.replace(/"/g, '\'')
        } else {
          colorClass = 'attr'
          match = match.replace(/"/g, '')
        }
      } else {
        colorClass = 'string'

        if (match.substr(1, 10) === '[FUNCTION]' &&
          match.substr(match.length - 11, 10) === '[FUNCTION]') {
          colorClass = 'function'
        } else {
          match = match.replace(/"/g, '\'')
          match = match.replace(/\\n/g, '\n')
          match = match.replace(/\\t/g, indentStr)
        }
      }
    } else if (/true|false/.test(match)) {
      colorClass = 'literal'
    } else if (/null/.test(match)) {
      colorClass = 'literal'
    }

    return opts.colors[colorClass](match)
  })

  const getFnStrIndent = (fnStr, opts) => {
    fnStr = fnStr.replace(/\t/g, indentStr)
    const indent = detectIndent(fnStr)

    if (opts.$indent.spaces) {
      const indentLevel = indent.amount / opts.tabsToSpaces
      return indentLevel
    }

    if (opts.$indent.tabs) {
      const indentLevel = indent.amount
      return indentLevel
    }
  }

  const lines = highlighted.split('\n').map(line => {
    const fnParts = line.split('[FUNCTION]')
    if (fnParts.length === 3) {
      const plain = stripAnsi(line)

      let outerIndent

      if (opts.$indent.spaces) {
        outerIndent = plain.match(/^[ \\t]*/)[0].length / opts.tabsToSpaces
      }
      if (opts.$indent.tabs) {
        outerIndent = plain.match(/^\t*/)[0].length
      }

      const fnStr = fnParts[1]
        .replace(/"/g, '\'')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')

      const innerIndent = getFnStrIndent(fnStr, opts)
      const indentOffset = Math.abs(outerIndent - (innerIndent - 1))

      const re = new RegExp(`\n(\t){${indentOffset}}`, 'g')
      const reTabbed = fnStr
        .replace(re, '\n')
        .replace(/\\t/g, indentStr)

      const preFn = fnParts[0].substr(0, fnParts[0].length - 1)
      const postFn = fnParts[2].substr(1)
      const jsHighlighted = syntaxHlStr('javascript', reTabbed, opts)

      return preFn + jsHighlighted + postFn
    }

    return line
  }).join('\n')

  return lines
}

const lineNumberPad = (number, opts) => {
  if (!opts.lineNumbers) {
    return ''
  }

  let output = ''

  const offsetLineN = number + (opts.lineNumberStart - 1)

  if (opts.$indent.spaces) {
    const padStr = String().padStart(opts.lineNumberPad, ' ')
    const prePad = opts.lineNumberPad + opts.$maxDigitWidth
    output = String(offsetLineN).padStart(prePad) + padStr
  }

  // Indent using spaces - up to the tabwidth required to contain number str
  if (opts.$indent.tabs) {
    output = String(offsetLineN).padStart(opts.$maxTabSpace, ' ')
  }

  return opts.colors.lineNumbers(output)
}

const cropPadAndNumber = (text, opts) => {
  let output = ''

  const lines = text.split('\n')
  const maxDigitWidth = String(lines.length + (opts.lineNumberStart - 1)).length
  // Tabs needed to contain digits (so we dont break code tab indentation)
  const tabsNeeded = Math.ceil(maxDigitWidth / opts.consoleTabWidth)
  const maxTabSpace = tabsNeeded * opts.consoleTabWidth

  opts.$maxTabSpace = maxTabSpace
  opts.$maxDigitWidth = maxDigitWidth

  lines.forEach((line, i) => {
    const lineNumber = i + 1
    if (lineNumber < opts.firstLine || lineNumber > opts.lastLine) {
      return
    }

    const lineNo = lineNumberPad(lineNumber, opts)

    let lineOutput
    if (opts.tabsToSpaces === false) {
      lineOutput = lineNo + line
    } else if (typeof opts.tabsToSpaces === 'number') {
      lineOutput = lineNo + padLine(line, opts.codePad)
    }

    output += lineOutput + '\n'
  })

  return opts.colors.base(output)
}

const decorate = (ansiStr, opts) => {
  if (opts.highlight) {
    ansiStr = ansiMark(ansiStr, opts.highlight)
  }
  ansiStr = cropPadAndNumber(ansiStr, opts)
  return ansiStr
}

const nameifyArrowFn = (fn, opts) => {
  if (Reflect.has(fn, 'prototype') &&
    Reflect.has(fn.prototype, 'constructor')) {
    return ''
  }

  return `${opts.arrowKeyword} ${fn.name} = `
}

const procOpts = (opts = {}) => {
  let options = {
    lineNumbers: true,
    lang: 'javascript',
    lineNumberPad: 0,
    lineNumberStart: 1,
    start: 1,
    end: Infinity,
    highlight: false,
    stripIndent: true,
    codePad: 1,
    colors: darkPalette,
    tabsToSpaces: 4,
    consoleTabWidth: 8,
    arrowKeyword: 'const'
  }

  options = merge(options, opts)

  options.$indent = {
    spaces: typeof options.tabsToSpaces === 'number',
    tabs: typeof options.tabsToSpaces === 'boolean' &&
      options.tabsToSpaces === false,
    size: typeof options.tabsToSpaces === 'number' ? options.tabsToSpaces : 1
  }

  return options
}

const chromafi = (value, opts) => {
  opts = procOpts(opts)

  if (typeof value === 'function') {
    value = nameifyArrowFn(value, opts) + String(value)
    const indentStart = true
    value = syntaxHlStr('javascript', value, opts, indentStart)
    value = stripIndent(value)
    value = decorate(value, opts)
    return value
  }

  if (typeof value === 'string') {
    value = syntaxHlStr(opts.lang, value, opts)
    value = decorate(value, opts)
    return value
  }

  if (typeof value === 'object') {
    value = syntaxHlJson(value, opts)
    value = decorate(value, opts)
    return value
  }

  throw new Error('🦅  Chromafi: You must pass a function, string or object.')
}

module.exports = chromafi
