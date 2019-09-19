import test from 'ava'
import chalk from 'chalk'
import chromafi from '.'

// Encode: provides escaped ansi sequence strings
// that can be used as the expected result value
// eslint-disable-next-line no-unused-vars
const encode = result => {
  // eslint-disable-next-line no-console
  console.log(result)
  const json = JSON.stringify(result)
  const output = json.replace(/'/g, '\\\'')
  // eslint-disable-next-line no-console
  console.log(output)
}

test('JavaScript function', t => {
  function add (a, b) {
    return a + b
  }
  const result = chromafi(add)
  t.snapshot(result)
})

test('JavaScript arrow function', t => {
  const add = (a, b) => {
    return a + b
  }
  const result = chromafi(add)
  t.snapshot(result)
})

test('JavaScript object, preserve tabs, w/o lineNumbers', t => {
  const obj = {
    foo: 'bar',
    baz: 1337,
    qux: true,
    zxc: null,
    // eslint-disable-next-line object-shorthand
    'foogle-bork': function (a, b) {
      return b - a
    }
  }
  const result = chromafi(obj, {
    tabsToSpaces: false,
    lineNumbers: false
  })
  t.snapshot(result)
})

test('JavaScript object w/ deep functions', t => {
  const obj = {
    foo: {
      bar: {
        baz: {
          qux: {
            'z-x-c': (x, y) => {
              return y * x
            }
          }
        }
      }
    },
    // eslint-disable-next-line object-shorthand
    'foogle-bork': function (a, b) {
      return b - a
    }
  }
  const result = chromafi(obj, {
    tabsToSpaces: false,
    lineNumbers: false
  })
  t.snapshot(result)
})

test('JavaScript code string', t => {
  const code = `
  const a = 2
  function abc = (d, e, f) { return 'foo' }
  const b = 2
  const c = (a, b) => {
    return b - a
  }

  var str = "Hello, world!"

  console.log(true, null, new Date())

  const jsObj = {
    foo: 'bar',
    baz: 1337,
    qux: true,
    'test-thing': 'cool',
    zxc: null,
    spqr: function (a, b) {
      return b - a
    }
  }
  `
  const result = chromafi(code, {
    colors: {
      lineNumbers: chalk.bgBlue.white
    }
  })
  t.snapshot(result)
})

test('Highlights ARM assembler syntax', t => {
  const asm = `
  .text

  .global connect
  connect:
    mov     r3, #2              ; s->sin_family = AF_INET
    strh    r3, [sp]
    ldr     r3, =server_port    ; s->sin_port = server_port
    ldr     r3, [r3]
    strh    r3, [sp, #2]
    ldr     r3, =server_addr    ; s->sin_addr = server_addr
    ldr     r3, [r3]
    str     r3, [sp, #4]
    mov     r3, #0              ; bzero(&s->sin_zero)
    str     r3, [sp, #8]
    str     r3, [sp, #12]
    mov     r1, sp      ; const struct sockaddr *addr = sp

    ldr     r7, =connect_call
    ldr     r7, [r7]
    swi     #0

    add     sp, sp, #16
    pop     {r0}        ; pop sockfd

    pop     {r7}
    pop     {fp, ip, lr}
    mov     sp, ip
    bx      lr

  .data
  socket_call:   .long 281
  connect_call:  .long 283

  /* all addresses are network byte-order (big-endian) */
  server_addr:            .long 0x0100007f ; localhost
  server_port:            .hword 0x0b1a
  `
  const lang = 'arm'
  const opts = {lang}
  const result = chromafi(asm, opts)
  t.snapshot(result)
})

test('Light background, tabsToSpaces', t => {
  const obj = {
    foo: 'bar',
    baz: 1337,
    qux: true,
    zxc: null,
    // eslint-disable-next-line object-shorthand
    'foogle-bork': function (a, b) {
      return b - a
    }
  }
  const options = {
    lineNumberPad: 1,
    colors: {
      base: chalk.bgWhite.black.bold,
      keyword: chalk.red,
      number: chalk.blue.dim,
      function: chalk.black,
      title: chalk.blue,
      params: chalk.black,
      string: chalk.black,
      builtIn: chalk.blue,
      literal: chalk.blue,
      attr: chalk.black,
      trailingSpace: chalk,
      regexp: chalk.blue,
      lineNumbers: chalk.bgBlue.white
    }
  }
  const result = chromafi(obj, options)
  t.snapshot(result)
})

test('Preserve tabs with background colors and line numbers', t => {
  const obj = {
    foo: 'bar',
    baz: 1337,
    qux: true,
    zxc: null,
    // eslint-disable-next-line object-shorthand
    'foogle-bork': function (a, b) {
      return b - a
    }
  }
  const options = {
    lang: 'javascript',
    lineNumberStart: 1000000000000000,
    tabsToSpaces: false,
    colors: {
      base: chalk.bgWhite.black.bold,
      keyword: chalk.red,
      number: chalk.blue.dim,
      function: chalk.black,
      title: chalk.blue,
      params: chalk.black,
      string: chalk.black,
      builtIn: chalk.blue,
      literal: chalk.blue,
      attr: chalk.black,
      trailingSpace: chalk,
      regexp: chalk.blue,
      lineNumbers: chalk.bgBlue.white
    }
  }
  const result = chromafi(obj, options)
  t.snapshot(result)
})

test('Preserve tabs with background colors w/o line numbers', t => {
  const obj = {
    foo: 'bar',
    baz: 1337,
    qux: true,
    zxc: null,
    // eslint-disable-next-line object-shorthand
    'foogle-bork': function (a, b) {
      return b - a
    }
  }
  const options = {
    lineNumbers: false,
    tabsToSpaces: false,
    colors: {
      base: chalk.bgWhite.black.bold,
      keyword: chalk.red,
      number: chalk.blue.dim,
      function: chalk.black,
      title: chalk.blue,
      params: chalk.black,
      string: chalk.black,
      builtIn: chalk.blue,
      literal: chalk.blue,
      attr: chalk.black,
      trailingSpace: chalk,
      regexp: chalk.blue,
      lineNumbers: chalk.bgBlue.white
    }
  }
  const result = chromafi(obj, options)
  t.snapshot(result)
})

test('TabsToSpaces=2, w/ bgColor', t => {
  const obj = {
    foo: 'bar',
    baz: 1337,
    qux: true,
    zxc: null,
    // eslint-disable-next-line object-shorthand
    'foogle-bork': function (a, b) {
      return b - a
    }
  }
  const options = {
    lineNumbers: true,
    tabsToSpaces: 2,
    lineNumberPad: 1,
    colors: {
      base: chalk.bgWhite.black.bold,
      keyword: chalk.red,
      number: chalk.blue.dim,
      function: chalk.black,
      title: chalk.blue,
      params: chalk.black,
      string: chalk.black,
      builtIn: chalk.blue,
      literal: chalk.blue,
      attr: chalk.black,
      trailingSpace: chalk,
      regexp: chalk.blue,
      lineNumbers: chalk.bgBlue.white
    }
  }
  const result = chromafi(obj, options)
  t.snapshot(result)
})

test('No padding (line or number), tabsToSpaces=2', t => {
  const obj = {foobar: 1337}
  const options = {
    lineNumberPad: 0,
    codePad: 0,
    tabsToSpaces: 2,
    lineNumbers: true,
    colors: {
      base: chalk.bgBlack.white.bold,
      lineNumbers: chalk.bgCyan.black
    }
  }
  const result = chromafi(obj, options)
  t.snapshot(result)
})

test('TabsToSpaces=0 (Zero-width indent) \\u0000', t => {
  // eslint-disable-next-line quotes
  const obj = {foobar: 1337, bax: {qux: {wombat: "BOO!"}}}

  const options = {
    lineNumberPad: 0,
    codePad: 0,
    tabsToSpaces: 0,
    lineNumbers: true,
    colors: {
      base: chalk.bgBlack.white.bold,
      lineNumbers: chalk.bgCyan.black
    }
  }
  const result = chromafi(obj, options)
  t.snapshot(result)
})

test('Highlights HTML string', t => {
  const html = '<body>\n\t<div>\n\t\t<span>Good</span>\n\t\t<span>Bad</span>\n\t</div>\n<body>'
  const result = chromafi(html, {
    lang: 'html'
  })
  t.snapshot(result)
})

test('Line number offset/start', t => {
  const html = '<body>\n\t<div>\n\t\t<span>Good</span>\n\t\t<span>Bad</span>\n\t</div>\n<body>'
  const result = chromafi(html, {
    lang: 'html',
    lineNumberStart: 123
  })
  t.snapshot(result)
})

test('Multiline highlight, replacing color', t => {
  const html = '<body>\n\t<div>\n\t\t<span>Good</span>\n\t\t<span>Bad<span>\n\t<div>\n</body>'

  const result = chromafi(html, {
    lang: 'html',
    lineNumbers: false,
    codePad: 0,
    highlight: {
      start: {line: 4, column: 18},
      end: {line: 5, column: 9},
      color: chalk.bgRed.white.bold,
      resetColor: true
    },
    colors: {
      tag: chalk.yellow
    }
  })
  t.snapshot(result)
})

test('Single line highlight, replacing color', t => {
  const html = `<div>Highlight me!</div>`

  const result = chromafi(html, {
    codePad: 0,
    lang: 'html',
    lineNumbers: false,
    lineNumberStart: 1,
    highlight: {
      start: 6,
      end: 18,
      color: chalk.bgRed.white.bold,
      resetColor: true
    },
    colors: {
      tag: chalk.yellow
    }
  })
  t.is(result, '\u001b[37m\u001b[33m<\u001b[36mdiv\u001b[33m>\u001b[37m\u001b[41m\u001b[37m\u001b[1mHighlight me!\u001b[22m\u001b[37m\u001b[49m\u001b[33m</\u001b[36mdiv\u001b[33m>\u001b[37m\u001b[39m\n\u001b[37m\u001b[39m')
})

test('Circular JSON throws', t => {
  const a = {}
  const b = {}
  a.foo = b
  b.foo = a

  const error = t.throws(() => {
    chromafi(a)
  })

  t.true(error.message.includes('TypeError: 🦅  Chromafi: Converting circular structure to JSON'))
})

test('Render a sub-portion of the lines', t => {
  const html = '<body>\n\t<div>\n\t\t<span>Good</span>\n\t\t<span>Bad</span>\n\t</div>\n<body>'
  const result = chromafi(html, {
    lang: 'html',
    firstLine: 3,
    lastLine: 4
  })
  t.snapshot(result)
})

test('Should throw if type !<fn|string|obj>', t => {
  const iBool = false

  const error = t.throws(() => {
    chromafi(iBool)
  })

  t.is(error.message, '🦅  Chromafi: You must pass a function, string or object.')
})

/* eslint-disable indent, no-unused-vars, object-shorthand */
test('Should re-align indentation at multiple levels', t => {
const lvl0 = opts => {
const obj = {
  foobar: 1337,
  'baz-qux': function (a, b) {
    return 'Wombat!'
  }
}
return chromafi(obj, opts)
}

  const lvl1 = opts => {
  const obj = {
    foobar: 1337,
    'baz-qux': function (a, b) {
      return 'Wombat!'
    }
  }
  return chromafi(obj, opts)
  }

  const lvl2 = opts => {
    return (() => {
      const obj = {
        foobar: 1337,
        'baz-qux': function (a, b) {
          return 'Wombat!'
        }
      }
      return chromafi(obj, opts)
    })()
  }

  const opts = {
    lineNumberPad: 0,
    lineNumbers: 0,
    codePad: 0
  }

  const spaces = Object.assign({}, opts, {tabsToSpaces: 4})
  const tabs = Object.assign({}, opts, {tabsToSpaces: false})

  const spacesOutput = [
    lvl0(spaces),
    lvl1(spaces),
    lvl2(spaces)
  ].join('\n')

  const tabsOutput = [
    lvl0(tabs),
    lvl1(tabs),
    lvl2(tabs)
  ].join('\n')

  t.snapshot(spacesOutput)
  t.snapshot(tabsOutput)
})
/* eslint-enable */

test('Diff', t => {
// Credit: https://www.git-tower.com/learn/git/ebook/en/command-line/advanced-topics/diffs
// eslint-disable-next-line indent
const diff = `diff --git a/about.html b/about.html
index d09ab79..0c20c33 100644
--- a/about.html
+++ b/about.html
@@ -19,7 +19,7 @@
   </div>

   <div id="headerContainer">
-    <h1>About&lt/h1>
+    <h1>About This Project&lt/h1>
   </div>

   <div id="contentContainer">
diff --git a/imprint.html b/imprint.html
index 1932d95..d34d56a 100644
--- a/imprint.html
+++ b/imprint.html
@@ -19,7 +19,7 @@
   </div>

   <div id="headerContainer">
-    <h1>Imprint&lt/h1>
+    <h1>Imprint / Disclaimer&lt/h1>
   </div>

   <div id="contentContainer">`

  const result = chromafi(diff, {lang: 'diff'})
  t.snapshot(result)
})

