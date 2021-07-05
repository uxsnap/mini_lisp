
const statements = {};
const globalScope = {};

const doperators = {};
for (const op of ['+', '*', '-', '/', '>', '!=', '<', '>=', '<=', '==']) {
  doperators[op] = new Function('a', 'b', `return a${op}b`);
}

const soperators = {};
for (const op of ['!', '-', '+']) {
  soperators[op] = new Function('a', `return ${op}a`);
}

statements.if = (scope, cond, ifbody, elsebody) => {
  return Boolean(cond.val) 
  ? evaluate(ifbody, scope) 
  : (elsebody ? evaluate(elsebody, scope) : undefined);
};


statements.def = (scope, ...args) => {
  const [varName, varVal] = args;
  let neededScope = findScope(varName.val, scope);
  if (!neededScope) neededScope = scope;
  if (args.length > 2) {
    neededScope[varName.val] 
      = args.slice(1).map(item => evaluate(item, neededScope));
  } else {
    neededScope[varName.val] = evaluate(varVal, neededScope);
  }
};

statements.do = (scope, ...args) => {
  let res = null;
  for (let arg of args) {
    res = evaluate(arg, scope);
  }
  return res;
};

statements.print = (scope, ...args) => {
  for (let arg of args) {
    const neededScope = findScope(arg.val, scope);
    if (arg.type === "var") {
      console.log(neededScope[arg.val]);
    }
    else console.log(evaluate(arg, neededScope));
  }
};

statements.while = (scope, cond, body) => {
  let newScope = { '__upperScope': scope };
  while (evaluate(cond, newScope)) {
    evaluate(body, newScope);
  }
};

const parseExpr = (prog) => {
  let match;
  let expr;

  prog = prog.trim();

  if (match = /^[^\s(),#\[\];^&@\d]+(\[*\d+\]+)*/.exec(prog)) {
    if (!statements[match[0]] 
      && !doperators[match[0]] 
      && !soperators[match[0]]) {
      expr = { type: 'var', val: match[0] };
    } else expr = { type: 'operator', val: match[0] };
  } else if (match = /^\d+/.exec(prog)) {
    expr = { type: 'operand', val: +match[0] };
  }

  if (match) prog = prog.slice(match[0].length);

  prog = prog.trim();

  return parseTokens(expr, prog);
};

const parseTokens = (expr, prog) => {
  prog = prog.trim();

  if (expr.type !== 'operator')
    return { expr, prog };

  expr = { type: 'operation', action: expr, args: [] };
  while (prog[0] !== ')') {
    prog = prog.trim();
    let res;
    if (prog[0] === '(')
      res = parse(prog);
    else res = parseExpr(prog);

    expr.args.push(res.expr);
    prog = res.prog.trim();
  }

  return parseTokens(expr, prog.slice(1));
};

const parse = (prog) => {
  prog = prog.trim();
  if (prog[0] !== '(') 
    console.error("Unexpected token: " + prog[0] + ".");

  prog = prog.slice(1);

  return parseExpr(prog);
};

const findScope = (value, scope) => {
  let curScope = scope;
  while (curScope) {
    if (curScope[value] !== undefined) 
      return curScope;
    else curScope = curScope.__upperScope;
  }

  return curScope;
};

const evalVal = (value, scope) => {
  const neededScope = findScope(value, scope);
  return neededScope[value];
};

const evalArray = (stringValue, currentScope) => {
  const arrArgs = stringValue.split('[');

  const neededScope = findScope(arrArgs[0], currentScope);
  if (!neededScope) return neededScope;

  let arrayValue = neededScope[arrArgs[0]][arrArgs[1][0]];
  if (!arrayValue) console.error(
    "No value on index " + arrArgs[1][0] + " in array " + arrArgs[0]
  );
  for (let i = 1; i < arrArgs.length - 1; i++) {
    arrayValue =  arrayValue[i][0];
  }
  return arrayValue;
};

const evaluate = (obj, scope) => {
  if (!obj) return;
  else if (obj.type === "operand") {
    return obj.val;
  }
  else if (obj.type === "var") {
    let found = false;
    if (obj.val.includes('['))
      found = evalArray(obj.val, scope);
    else found = evalVal(obj.val, scope);
    if (found === undefined)
      return console.error(
        "No variable with name '" + obj.val + "' has been found."
      );
    return found;
  }
  else if (obj.type === "operator") {
    // console.log(obj, scope, evaluate(obj.args[0], scope));
    const [a, b] = obj.args.map((item) => evaluate(item, scope));
    const operResult = 
      obj.args.length === 1 
        ? soperators[obj.val](a) 
        : doperators[obj.val](a, b);
    if (operResult === undefined) 
      console.error(`Error while evaluating ${obj.val}`);
    return operResult;
  } else if (obj.type === "operation") {
    if (statements[obj.action.val]) {
      return statements[obj.action.val](scope, ...obj.args);
    }
    return evaluate({ ...obj.action, args: obj.args }, scope);
  }
};

const parsed = parse(`
  (do 
    (def yes 0)
    (def maryusa 20)
    (while (< yes 5) 
      (do 
        (def yes (+ yes 1))
        (def maryusa (- maryusa 1))
      )
    )
    (print maryusa)
  )
`);

evaluate(parsed.expr, globalScope);
