export class ParseArrayProp {
  constructor(input) {
    this.input = input;
    this.start = 0;
    this.end = 0;
    this.pos = 0;
  }

  nextChar() {
    return this.input[this.pos];
  }

  nextChars(charsCount = 10) {
    let result = '';
    for (let i = 0; i < charsCount; i++) {
      result = result + this.input[this.pos + i];
    }
    return result;
  }

  consumeChar() {
    const currentChar = this.input[this.pos];
    this.pos++;
    return currentChar;
  }

  isEOF() {
    return this.pos >= this.input.length;
  }

  consumeWhile(predicate) {
    let result = '';
    while (!this.isEOF() && predicate(this.nextChar())) {
      result = result + this.consumeChar();
    }
    return result;
  }

  consumeWhiteSpace() {
    this.consumeWhile((nextChar)=> {
      return nextChar.match(/\s/);
    });
  }

  startWith(startString) {
    let result = '';
    for (let i = 0; i < startString.length; i++) {
      result = result + this.input[this.pos + i];
    }
    return result === startString;
  }

  consumeAtSpecs() {
    this.consumeWhile(()=> {
      return !this.startWith('specs');
    });
  }

  logStartEnd() {
    this.consumeWhile((nextChar)=> {
      return nextChar !== '[';
    });
    this.start = this.pos;

    this.consumeWhile((nextChar)=> {
      return nextChar !== ']';
    });
    this.end = this.pos;
  }

  replaceSpecs(newSpecs) {
    let replaced = '';
    for (let i = 0; i < this.start; i++) {
      replaced = replaced + this.input[i];
    }

    const res = newSpecs.reduce((stringified, newSpec)=> {
      return `${stringified}'${newSpec}',`;
    }, '[').replace(/,$/, '') + ']';
    replaced = replaced + res;

    for (let i = this.end + 1; i < this.input.length; i++) {
      replaced = replaced + this.input[i];
    }
    return replaced;
  }

  parse(replaceSpecs) {
    if (!replaceSpecs) {
      throw new Error('Parse method must have replacable array.');
    }
    this.consumeAtSpecs();
    this.logStartEnd();
    return this.replaceSpecs(replaceSpecs);
  }
}
